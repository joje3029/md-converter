import MarkdownIt from 'markdown-it';

export interface MarkdownNode {
    type: string;
    content: string;
    children?: MarkdownNode[];
    attrs?: Record<string, string>;
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

    /**
     * 마크다운 문자열을 파싱하여 AST를 생성합니다.
     */
    parse(markdown: string): MarkdownNode[] {
        const tokens = this.md.parse(markdown, {});
        return this.tokensToAST(tokens);
    }

    /**
     * Mermaid 다이어그램을 추출합니다.
     */
    extractMermaidDiagrams(markdown: string): string[] {
        const diagrams: string[] = [];
        const regex = /```mermaid\n([\s\S]*?)\n```/g;
        let match;

        while ((match = regex.exec(markdown)) !== null) {
            diagrams.push(match[1].trim());
        }

        return diagrams;
    }

    /**
     * markdown-it 토큰을 AST로 변환합니다.
     */
    private tokensToAST(tokens: any[]): MarkdownNode[] {
        const ast: MarkdownNode[] = [];
        let current: MarkdownNode | null = null;

        for (const token of tokens) {
            switch (token.type) {
                case 'heading_open':
                    current = {
                        type: 'heading',
                        content: '',
                        attrs: { level: token.tag.slice(1) }
                    };
                    break;

                case 'paragraph_open':
                    current = {
                        type: 'paragraph',
                        content: ''
                    };
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
                        current.content = token.content;
                    }
                    break;

                case 'heading_close':
                case 'paragraph_close':
                    if (current) {
                        ast.push(current);
                        current = null;
                    }
                    break;

                // 추가적인 토큰 타입들은 필요에 따라 구현
            }
        }

        return ast;
    }
} 