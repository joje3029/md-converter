import * as path from 'path';
import { WordConverter } from './formats/word';
import { TxtConverter } from './formats/txt';

async function main() {
    try {
        const [inputPath, outputFileName] = process.argv.slice(2);
        
        if (!inputPath || !outputFileName) {
            console.error('사용법: node index.js <입력파일>.md <출력파일명>.[docx|txt]');
            process.exit(1);
        }

        // output 폴더에 저장하도록 경로 수정
        const outputPath = path.join(process.cwd(), 'output', outputFileName);
        const ext = path.extname(outputFileName).toLowerCase();

        let converter;
        switch (ext) {
            case '.docx':
                converter = new WordConverter();
                break;
            case '.txt':
                converter = new TxtConverter();
                break;
            default:
                throw new Error('지원하지 않는 출력 형식입니다. (.docx 또는 .txt 사용)');
        }

        const markdown = await converter.readFile(inputPath);
        await converter.convert(markdown, { outputPath });
        
        console.log(`변환 완료: ${outputFileName}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error('변환 실패:', error.message);
        } else {
            console.error('변환 중 알 수 없는 오류 발생');
        }
        process.exit(1);
    }
}

main(); 