import MarkdownIt from 'markdown-it';

export interface MarkdownNode {
    type: string;
    content: string;
    children?: MarkdownNode[];
    attrs?: {
        level?: string;
        listType?: 'bullet' | 'ordered';
        listLevel?: number;
        indent?: number;
        language?: string;  // 코드 블록의 언어 속성 추가
    };
}

export class MarkdownParser {
    private md: MarkdownIt;

    constructor() {
        this.md = new MarkdownIt({
            html: true,
            linkify: true,
            typographer: true
        });
    }

    parse(markdown: string): MarkdownNode[] {
        const tokens = this.md.parse(markdown, {});
        return this.tokensToAST(tokens);
    }

    private tokensToAST(tokens: any[]): MarkdownNode[] {
        const ast: MarkdownNode[] = [];
        let current: MarkdownNode | null = null;
        let listLevel = 0;
        let isInList = false;

        for (const token of tokens) {
            switch (token.type) {
                case 'heading_open':
                    current = {
                        type: 'heading',
                        content: '',
                        attrs: { 
                            level: token.tag.slice(1),
                        }
                    };
                    break;

                case 'ordered_list_open':
                    isInList = true;
                    listLevel++;
                    break;

                case 'bullet_list_open':
                    isInList = true;
                    listLevel++;
                    break;

                case 'list_item_open':
                    current = {
                        type: 'list_item',
                        content: '',
                        attrs: {
                            listType: token.markup === '-' || token.markup === '*' ? 'bullet' : 'ordered',
                            listLevel: listLevel,
                            indent: (listLevel - 1) * 2
                        }
                    };
                    break;

                case 'paragraph_open':
                    if (!isInList) {
                        current = {
                            type: 'paragraph',
                            content: '',
                            attrs: {
                                indent: 0
                            }
                        };
                    }
                    break;

                case 'fence':
                    if (token.info === 'mermaid') {
                        ast.push({
                            type: 'mermaid',
                            content: token.content
                        });
                    } else {
                        ast.push({
                            type: 'code',
                            content: token.content,
                            attrs: { language: token.info }
                        });
                    }
                    break;

                case 'inline':
                    if (current) {
                        // 줄바꿈을 보존하기 위해 content에서 \n을 <br>로 변환
                        current.content = token.content.replace(/\n\s*\n/g, '\n\n');
                    }
                    break;

                case 'list_item_close':
                    if (current) {
                        ast.push(current);
                        current = null;
                    }
                    break;

                case 'bullet_list_close':
                case 'ordered_list_close':
                    isInList = false;
                    listLevel--;
                    break;

                case 'heading_close':
                case 'paragraph_close':
                    if (current && !isInList) {
                        ast.push(current);
                        current = null;
                    }
                    break;
            }
        }

        return ast;
    }

    extractMermaidDiagrams(markdown: string): string[] {
        const diagrams: string[] = [];
        const regex = /```mermaid\n([\s\S]*?)\n```/g;
        let match;

        while ((match = regex.exec(markdown)) !== null) {
            diagrams.push(match[1].trim());
        }

        return diagrams;
    }
} 