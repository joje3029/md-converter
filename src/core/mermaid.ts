import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

export interface MermaidOptions {
    outputFormat?: 'png' | 'svg';
    backgroundColor?: string;
    width?: number;
    height?: number;
}

export class MermaidHandler {
    private tempDir: string;

    constructor() {
        this.tempDir = path.join(process.cwd(), 'temp');
    }

    async init(): Promise<void> {
        try {
            await fs.access(this.tempDir);
        } catch {
            await fs.mkdir(this.tempDir);
        }
    }

    async convertToImage(mermaidCode: string): Promise<string> {
        await this.init();

        const id = crypto.randomUUID();
        const inputFile = path.join(this.tempDir, `${id}.mmd`);
        const outputFile = path.join(this.tempDir, `${id}.png`);

        try {
            await fs.writeFile(inputFile, mermaidCode);

            const command = `npx --yes @mermaid-js/mermaid-cli -i "${inputFile}" -o "${outputFile}" -b #ffffff -w 800`;
            await execAsync(command);

            return outputFile;
        } catch (error) {
            throw new Error(`Mermaid 다이어그램 변환 실패: ${error}`);
        }
    }

    async cleanup(): Promise<void> {
        try {
            const files = await fs.readdir(this.tempDir);
            await Promise.all(
                files.map(file => fs.unlink(path.join(this.tempDir, file)))
            );
            await fs.rmdir(this.tempDir);
        } catch (error) {
            console.error('임시 파일 정리 중 오류:', error);
        }
    }
} 