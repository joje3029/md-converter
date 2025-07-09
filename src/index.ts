import { WordConverter } from './formats/word';
import { TxtConverter } from './formats/txt';
import { ConversionOptions } from './core/converter';
import * as fs from 'fs/promises';
import * as path from 'path';

export type SupportedFormat = 'docx' | 'txt';

export async function convert(
    inputPath: string,
    outputPath: string,
    format: SupportedFormat
): Promise<void> {
    try {
        // 입력 파일 읽기
        const markdown = await fs.readFile(inputPath, 'utf-8');

        // 변환 옵션 설정
        const options: ConversionOptions = {
            outputPath,
            mermaidOptions: {
                outputFormat: 'png',
                backgroundColor: '#ffffff',
                width: 800
            }
        };

        // 포맷에 따른 변환기 선택
        let converter;
        switch (format) {
            case 'docx':
                converter = new WordConverter();
                break;
            case 'txt':
                converter = new TxtConverter();
                break;
            default:
                throw new Error(`지원하지 않는 포맷: ${format}`);
        }

        // 변환 실행
        await converter.convert(markdown, options);
        
        console.log(`변환 완료: ${outputPath}`);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`변환 실패: ${error.message}`);
        }
        throw new Error('변환 중 알 수 없는 오류 발생');
    }
}

// CLI 인터페이스
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('사용법: node index.js <입력파일> <출력파일>');
        process.exit(1);
    }

    const [input, output] = args;
    const format = path.extname(output).slice(1) as SupportedFormat;

    convert(input, output, format)
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error.message);
            process.exit(1);
        });
} 