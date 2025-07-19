import {
    Document,
    Paragraph,
    TextRun,
    HeadingLevel,
    ImageRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
    SectionType,
    Packer,
    BorderStyle,
    convertInchesToTwip,
    LevelFormat,
    IStylesOptions,
    NumberProperties,
    IParagraphOptions
} from 'docx';
import { BaseConverter, ConversionOptions } from '../core/converter';
import { MarkdownNode } from '../core/parser';
import * as fs from 'fs/promises';

// 기본 스타일 설정
const DEFAULT_STYLE = {
    font: "나눔고딕",
    color: "000000",  // black
    size: 24,         // 12pt (24 half-points)
};

// 번호 매기기 설정
const LIST_NUMBERING = {
    config: {
        reference: "markdown-list",
        levels: [
            {
                level: 0,
                format: LevelFormat.BULLET,
                text: "•",
                alignment: AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: convertInchesToTwip(0.5) }
                    }
                }
            },
            {
                level: 1,
                format: LevelFormat.BULLET,
                text: "○",
                alignment: AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: convertInchesToTwip(1.0) }
                    }
                }
            },
            {
                level: 2,
                format: LevelFormat.BULLET,
                text: "■",
                alignment: AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: { left: convertInchesToTwip(1.5) }
                    }
                }
            }
        ]
    }
};

export class WordConverter extends BaseConverter {
    private document!: Document;

    async convert(markdown: string, options: ConversionOptions): Promise<void> {
        try {
            const parser = new (await import('../core/parser')).MarkdownParser();
            const nodes = parser.parse(markdown);

            const documentElements = await Promise.all(
                nodes.map(node => this.convertNode(node))
            );

            this.document = new Document({
                sections: [{
                    properties: {
                        type: SectionType.CONTINUOUS
                    },
                    children: documentElements.filter((el): el is Paragraph | Table => el !== undefined)
                }],
                styles: {
                    paragraphStyles: [
                        {
                            id: "normal",
                            name: "Normal",
                            run: {
                                font: DEFAULT_STYLE.font,
                                color: DEFAULT_STYLE.color,
                                size: DEFAULT_STYLE.size,
                            }
                        }
                    ]
                },
                numbering: {
                    config: [LIST_NUMBERING.config]
                }
            });

            const buffer = await Packer.toBuffer(this.document);
            await fs.writeFile(options.outputPath, buffer);
            
            await this.cleanup();
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Word 변환 실패: ${error.message}`);
            }
            throw new Error('Word 변환 중 알 수 없는 오류 발생');
        }
    }

    async convertNode(node: MarkdownNode): Promise<Paragraph | Table | undefined> {
        const baseParaProps: Partial<IParagraphOptions> = {
            style: "normal",
            spacing: { after: 200, line: 360 },  // 줄 간격 및 단락 간격 설정
        };

        switch (node.type) {
            case 'heading':
                return new Paragraph({
                    ...baseParaProps,
                    text: node.content,
                    heading: this.getHeadingLevel(node.attrs?.level),
                    spacing: { 
                        before: 400, 
                        after: node.attrs?.level === '1' ? 600 : 200  // h1인 경우 더 큰 간격
                    }
                });

            case 'paragraph':
                // 굵은 글씨 처리
                const parts = node.content.split(/(\*\*.*?\*\*)/g);
                const runs = parts.map(part => {
                    const isBold = part.startsWith('**') && part.endsWith('**');
                    return new TextRun({
                        text: isBold ? part.slice(2, -2) : part,
                        bold: isBold,
                        font: DEFAULT_STYLE.font,
                        color: DEFAULT_STYLE.color,
                        size: DEFAULT_STYLE.size
                    });
                });

                return new Paragraph({
                    ...baseParaProps,
                    children: runs
                });

            case 'list_item':
                const level = (node.attrs?.listLevel || 1) - 1;
                return new Paragraph({
                    ...baseParaProps,
                    text: node.content,
                    numbering: {
                        reference: "markdown-list",
                        level: level
                    },
                    spacing: { after: 120 }  // 리스트 항목 간격 조정
                });

            case 'mermaid':
                const imagePath = await this.handleMermaidDiagram(node.content);
                return new Paragraph({
                    ...baseParaProps,
                    children: [
                        new ImageRun({
                            data: await fs.readFile(imagePath),
                            transformation: {
                                width: 500,
                                height: 300
                            }
                        })
                    ]
                });

            case 'code':
                return new Paragraph({
                    ...baseParaProps,
                    children: [
                        new TextRun({
                            text: node.content,
                            font: "Courier New",
                            color: DEFAULT_STYLE.color,
                            size: DEFAULT_STYLE.size
                        })
                    ]
                });

            case 'table':
                return this.convertTable(node);

            default:
                return new Paragraph({
                    ...baseParaProps,
                    children: [
                        new TextRun({
                            text: node.content || '',
                            font: DEFAULT_STYLE.font,
                            color: DEFAULT_STYLE.color,
                            size: DEFAULT_STYLE.size
                        })
                    ]
                });
        }
    }

    private getHeadingLevel(level?: string): typeof HeadingLevel[keyof typeof HeadingLevel] {
        switch (level) {
            case '1': return HeadingLevel.HEADING_1;
            case '2': return HeadingLevel.HEADING_2;
            case '3': return HeadingLevel.HEADING_3;
            case '4': return HeadingLevel.HEADING_4;
            case '5': return HeadingLevel.HEADING_5;
            case '6': return HeadingLevel.HEADING_6;
            default: return HeadingLevel.HEADING_1;
        }
    }

    private convertTable(node: MarkdownNode): Table {
        if (!node.children) return new Table({rows: []});

        const rows = node.children.map(row => {
            if (!row.children) return new TableRow({children: []});

            const cells = row.children.map(cell => {
                return new TableCell({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: cell.content || '',
                                    font: DEFAULT_STYLE.font,
                                    color: DEFAULT_STYLE.color,
                                    size: DEFAULT_STYLE.size
                                })
                            ],
                            style: "normal"
                        })
                    ]
                });
            });

            return new TableRow({children: cells});
        });

        return new Table({
            width: {
                size: 100,
                type: WidthType.PERCENTAGE
            },
            rows
        });
    }
} 