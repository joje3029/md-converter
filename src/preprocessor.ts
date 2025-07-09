import * as readline from 'readline';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';

export type OutputFormat = 'docx' | 'txt';

export interface PreprocessorResult {
    inputPath: string;
    outputFormats: OutputFormat[];
}

export class InputPreprocessor {
    private rl: readline.Interface;

    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    private async question(query: string): Promise<string> {
        return new Promise((resolve) => {
            this.rl.question(query, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    private async validatePath(filePath: string): Promise<string> {
        try {
            if (!filePath) {
                throw new Error('파일 경로를 입력해주세요.');
            }

            // 절대 경로로 변환 (OS에 맞게 자동으로 처리됨)
            const absolutePath = path.resolve(filePath);
            
            // 파일 존재 여부 및 읽기 권한 확인
            await fs.access(absolutePath, fs.constants.R_OK);
            
            return absolutePath;
        } catch (error) {
            throw new Error(`파일을 찾을 수 없거나 접근할 수 없습니다: ${filePath}`);
        }
    }

    private parseFormats(formatInput: string): OutputFormat[] {
        if (!formatInput) {
            throw new Error('출력 형식을 입력해주세요.');
        }

        // 전체 선택
        if (formatInput.toLowerCase() === 'all') {
            return ['docx', 'txt'];
        }

        // 쉼표나 슬래시로 구분된 형식들을 파싱
        const formats = formatInput.toLowerCase().split(/[,\/]/).map(f => f.trim());
        const validFormats = formats.filter(f => f === 'docx' || f === 'txt') as OutputFormat[];

        if (validFormats.length === 0) {
            throw new Error('최소한 하나의 유효한 출력 형식을 선택해야 합니다.');
        }

        return validFormats;
    }

    private async getValidPath(): Promise<string> {
        while (true) {
            try {
                const inputPath = await this.question('변환할 Markdown 파일의 경로를 입력하세요: ');
                return await this.validatePath(inputPath);
            } catch (error) {
                if (error instanceof Error) {
                    console.error('\n오류:', error.message);
                }
            }
        }
    }

    private async getValidFormats(): Promise<OutputFormat[]> {
        while (true) {
            try {
                console.log('\n사용 가능한 출력 형식: docx, txt');
                console.log('여러 형식 선택: 쉼표(,) 또는 슬래시(/)로 구분');
                console.log('모든 형식 선택: all 입력\n');
                
                const formatInput = await this.question('원하는 출력 형식을 입력하세요: ');
                return this.parseFormats(formatInput);
            } catch (error) {
                if (error instanceof Error) {
                    console.error('\n오류:', error.message);
                }
            }
        }
    }

    async process(): Promise<PreprocessorResult> {
        try {
            // 1. 입력 파일 경로 받기 (유효할 때까지 반복)
            const validatedPath = await this.getValidPath();

            // 2. 출력 형식 선택 (유효할 때까지 반복)
            const outputFormats = await this.getValidFormats();

            this.rl.close();

            return {
                inputPath: validatedPath,
                outputFormats
            };
        } catch (error) {
            this.rl.close();
            throw error;
        }
    }
}

// 테스트용 코드
if (require.main === module) {
    const preprocessor = new InputPreprocessor();
    preprocessor.process()
        .then(result => {
            console.log('\n전처리 결과:');
            console.log('입력 파일:', result.inputPath);
            console.log('선택된 형식:', result.outputFormats);
        })
        .catch(error => {
            console.error('\n오류:', error.message);
            process.exit(1);
        });
} 