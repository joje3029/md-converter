import { BaseConverter, ConversionOptions } from '../core/converter';
import { MarkdownNode } from '../core/parser';
import * as fs from 'fs/promises';
import * as path from 'path';

export class TxtConverter extends BaseConverter {
    private output: string[] = [];
    private imageCounter: number = 1;

    async convert(markdown: string, options: ConversionOptions): Promise<void> {
        try {
            const parser = new (await import('../core/parser')).MarkdownParser();
            const nodes = parser.parse(markdown);

            this.output = [];
            this.imageCounter = 1;

            for (const node of nodes) {
                const text = await this.convertNode(node);
                if (text) {
                    this.output.push(text);
                }
            }

            // 결과를 파일에 저장
            await fs.writeFile(options.outputPath, this.output.join('\n\n'));
            
            // 이미지 파일들을 결과 파일과 같은 디렉토리에 복사
            await this.copyMermaidImages(options.outputPath);
            
            // 임시 파일 정리
            await this.cleanup();
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`텍스트 변환 실패: ${error.message}`);
            }
            throw new Error('텍스트 변환 중 알 수 없는 오류 발생');
        }
    }

    async convertNode(node: MarkdownNode): Promise<string> {
        switch (node.type) {
            case 'heading':
                const level = parseInt(node.attrs?.level || '1');
                const prefix = '#'.repeat(level);
                return `${prefix} ${node.content}`;

            case 'paragraph':
                return node.content;

            case 'mermaid':
                const imagePath = await this.handleMermaidDiagram(node.content);
                const imageRef = `[다이어그램 ${this.imageCounter++}] - 이미지 파일: ${path.basename(imagePath)}`;
                return `[Mermaid 다이어그램]\n${imageRef}`;

            case 'code':
                return `\`\`\`${node.attrs?.language || ''}\n${node.content}\n\`\`\``;

            case 'table':
                return this.convertTable(node);

            default:
                return node.content || '';
        }
    }

    private convertTable(node: MarkdownNode): string {
        if (!node.children) return '';

        const rows = node.children.map(row => {
            if (!row.children) return '';
            return row.children.map(cell => cell.content || '').join(' | ');
        });

        const separator = '-'.repeat(rows[0].length);
        rows.splice(1, 0, separator);

        return rows.join('\n');
    }

    private async copyMermaidImages(outputPath: string): Promise<void> {
        const outputDir = path.dirname(outputPath);
        const tempDir = this.mermaidHandler['tempDir']; // accessing protected property

        try {
            const files = await fs.readdir(tempDir);
            for (const file of files) {
                if (file.endsWith('.png') || file.endsWith('.svg')) {
                    const sourcePath = path.join(tempDir, file);
                    const targetPath = path.join(outputDir, file);
                    await fs.copyFile(sourcePath, targetPath);
                }
            }
        } catch (error) {
            console.warn('이미지 복사 중 오류 발생:', error);
        }
    }
} 