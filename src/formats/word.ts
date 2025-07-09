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
    Packer
} from 'docx';
import { BaseConverter, ConversionOptions } from '../core/converter';
import { MarkdownNode } from '../core/parser';
import * as fs from 'fs/promises';

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
                }]
            });

            const buffer = await Packer.toBuffer(this.document);
            await fs.writeFile(options.outputPath, buffer);
            
            // 임시 파일 정리
            await this.cleanup();
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Word 변환 실패: ${error.message}`);
            }
            throw new Error('Word 변환 중 알 수 없는 오류 발생');
        }
    }

    async convertNode(node: MarkdownNode): Promise<Paragraph | Table | undefined> {
        switch (node.type) {
            case 'heading':
                return new Paragraph({
                    text: node.content,
                    heading: this.getHeadingLevel(node.attrs?.level)
                });

            case 'paragraph':
                return new Paragraph({
                    children: [new TextRun(node.content)]
                });

            case 'mermaid':
                const imagePath = await this.handleMermaidDiagram(node.content);
                return new Paragraph({
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
                    children: [
                        new TextRun({
                            text: node.content,
                            font: 'Courier New'
                        })
                    ]
                });

            case 'table':
                return this.convertTable(node);

            default:
                return new Paragraph({
                    children: [new TextRun(node.content || '')]
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
                    children: [new Paragraph({
                        children: [new TextRun(cell.content || '')]
                    })]
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