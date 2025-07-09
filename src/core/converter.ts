import { MarkdownNode } from './parser';
import { MermaidHandler, MermaidOptions } from './mermaid';
import * as fs from 'fs/promises';

export interface ConversionOptions {
    outputPath: string;
    mermaidOptions?: {
        outputFormat?: string;
        backgroundColor?: string;
        width?: number;
        height?: number;
    };
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

    async readFile(filePath: string): Promise<string> {
        try {
            return await fs.readFile(filePath, 'utf-8');
        } catch (error) {
            throw new Error(`파일 읽기 실패: ${error}`);
        }
    }

    protected async handleMermaidDiagram(
        content: string,
        options?: MermaidOptions
    ): Promise<string> {
        try {
            return await this.mermaidHandler.convertToImage(content);
        } catch (error) {
            throw new Error(`Mermaid 다이어그램 처리 실패: ${error}`);
        }
    }

    protected async cleanup(): Promise<void> {
        await this.mermaidHandler.cleanup();
    }
} 