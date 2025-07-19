import { BaseConverter, ConversionOptions } from '../core/converter';
import { MarkdownNode } from '../core/parser';
import * as fs from 'fs/promises';

export class TxtConverter extends BaseConverter {
    private readonly INDENT_SIZE = 2;  // 기본 들여쓰기 크기
    private readonly LIST_MARKERS = {
        bullet: '•',      // 기본 글머리 기호
        bullet1: '○',    // 2단계 글머리 기호
        bullet2: '■',    // 3단계 글머리 기호
        ordered: (num: number) => `${num}.` // 번호 매기기
    };

    async convert(markdown: string, options: ConversionOptions): Promise<void> {
        try {
            const parser = new (await import('../core/parser')).MarkdownParser();
            const nodes = parser.parse(markdown);
            
            let content = '';
            let lastNodeType = '';

            for (const node of nodes) {
                // 노드 타입이 바뀔 때 추가 줄바꿈
                if (lastNodeType && lastNodeType !== node.type) {
                    content += '\n';
                }

                content += await this.convertNode(node);
                lastNodeType = node.type;
            }

            await fs.writeFile(options.outputPath, content, 'utf-8');
            await this.cleanup();
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`TXT 변환 실패: ${error.message}`);
            }
            throw new Error('TXT 변환 중 알 수 없는 오류 발생');
        }
    }

    async convertNode(node: MarkdownNode): Promise<string> {
        let content = '';
        const indent = (node.attrs?.indent || 0) * this.INDENT_SIZE;
        const indentStr = ' '.repeat(indent);

        switch (node.type) {
            case 'heading':
                const level = parseInt(node.attrs?.level || '1');
                // 굵은 텍스트 처리
                content = `${indentStr}${this.processBoldText(node.content)}\n`;
                // h1 제목의 경우 추가 줄바꿈
                if (level === 1) {
                    content += '\n';
                }
                break;

            case 'paragraph':
                content = `${indentStr}${this.processBoldText(node.content)}\n\n`;
                break;

            case 'list_item':
                const listLevel = node.attrs?.listLevel || 1;
                const listType = node.attrs?.listType || 'bullet';
                const marker = this.getListMarker(listType, listLevel);
                content = `${indentStr}${marker} ${this.processBoldText(node.content)}\n`;
                break;

            case 'code':
                // 코드 블록은 구분선과 함께 표시
                const codeLines = node.content.split('\n');
                const separator = '='.repeat(60);  // 구분선
                const language = node.attrs?.language ? `[${node.attrs.language}]` : '';
                content = `\n${indentStr}${separator}\n`;
                content += `${indentStr}${language}\n`;
                content += codeLines.map(line => `${indentStr}    ${line}`).join('\n') + '\n';
                content += `${indentStr}${separator}\n\n`;
                break;

            case 'mermaid':
                const imagePath = await this.handleMermaidDiagram(node.content);
                content = `${indentStr}[Mermaid Diagram: ${imagePath}]\n\n`;
                break;

            default:
                if (node.content) {
                    content = `${indentStr}${this.processBoldText(node.content)}\n`;
                }
                break;
        }

        return content;
    }

    private getListMarker(type: string, level: number): string {
        if (type === 'ordered') {
            return this.LIST_MARKERS.ordered(level);
        }

        // 글머리 기호는 레벨에 따라 다르게 표시
        switch (level) {
            case 1:
                return this.LIST_MARKERS.bullet;
            case 2:
                return this.LIST_MARKERS.bullet1;
            case 3:
                return this.LIST_MARKERS.bullet2;
            default:
                return this.LIST_MARKERS.bullet;
        }
    }

    private processBoldText(text: string): string {
        // **text** 형식의 굵은 텍스트를 [text] 형식으로 변환
        return text.replace(/\*\*(.*?)\*\*/g, '[$1]');
    }
} 