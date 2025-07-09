import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import * as os from 'os';

const execAsync = promisify(exec);

export interface MermaidOptions {
    outputFormat?: 'png' | 'svg';
    backgroundColor?: string;
    width?: number;
    height?: number;
}

export class MermaidHandler {
    private tempDir: string;
    private initialized: boolean = false;

    constructor() {
        // 시스템 임시 디렉토리 내에 프로세스별 고유 디렉토리 생성
        const uniqueId = crypto.randomBytes(8).toString('hex');
        this.tempDir = path.join(os.tmpdir(), 'md-converter-' + uniqueId);
    }

    async init(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            await fs.mkdir(this.tempDir, { recursive: true });
            this.initialized = true;
        } catch (error) {
            throw new Error(`임시 디렉토리 생성 실패: ${error}`);
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
            // 에러 발생 시 임시 파일 정리 시도
            try {
                await fs.unlink(inputFile);
                if (await fs.access(outputFile).then(() => true).catch(() => false)) {
                    await fs.unlink(outputFile);
                }
            } catch (cleanupError) {
                console.warn('임시 파일 정리 중 오류:', cleanupError);
            }
            throw new Error(`Mermaid 다이어그램 변환 실패: ${error}`);
        }
    }

    async cleanup(): Promise<void> {
        if (!this.initialized) {
            return;
        }

        try {
            await fs.rm(this.tempDir, { recursive: true, force: true });
            this.initialized = false;
        } catch (error) {
            console.error('임시 파일 정리 중 오류:', error);
            // 에러를 throw하지 않고 로깅만 수행 (cleanup은 best-effort)
        }
    }
} 