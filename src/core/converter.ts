import { MarkdownNode } from './parser';
import { MermaidHandler, MermaidOptions } from './mermaid';

export interface ConversionOptions {
    outputPath: string;
    mermaidOptions?: MermaidOptions;
}

export interface IConverter {
    convert(markdown: string, options: ConversionOptions): Promise<void>;
    convertNode(node: MarkdownNode): Promise<any>;
}

export abstract class BaseConverter implements IConverter {
    protected mermaidHandler: MermaidHandler;

    constructor() {
        this.mermaidHandler = new MermaidHandler();
    }

    abstract convert(markdown: string, options: ConversionOptions): Promise<void>;
    abstract convertNode(node: MarkdownNode): Promise<any>;

    protected async handleMermaidDiagram(
        content: string,
        options?: MermaidOptions
    ): Promise<string> {
        try {
            return await this.mermaidHandler.generateImage(content, options);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Mermaid 다이어그램 처리 실패: ${error.message}`);
            }
            throw new Error('Mermaid 다이어그램 처리 중 알 수 없는 오류 발생');
        }
    }

    protected async cleanup(): Promise<void> {
        await this.mermaidHandler.cleanup();
    }
} 