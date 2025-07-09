import * as path from 'path';
import { WordConverter } from './formats/word';
import { TxtConverter } from './formats/txt';
import { InputPreprocessor, OutputFormat } from './preprocessor';

async function main() {
    try {
        // 사용자 입력 받기
        const preprocessor = new InputPreprocessor();
        const { inputPath, outputFormats } = await preprocessor.process();

        // 입력 파일의 기본 이름 추출 (확장자 제외)
        const baseName = path.basename(inputPath, path.extname(inputPath));

        // 각 선택된 형식에 대해 변환 수행
        for (const format of outputFormats) {
            try {
                // 출력 파일 경로 설정
                const outputFileName = `${baseName}.${format}`;
                const outputPath = path.join(process.cwd(), 'output', outputFileName);

                // 변환기 선택 및 변환 수행
                let converter;
                switch (format) {
                    case 'docx':
                        converter = new WordConverter();
                        break;
                    case 'txt':
                        converter = new TxtConverter();
                        break;
                    default:
                        throw new Error(`지원하지 않는 출력 형식입니다: ${format}`);
                }

                const markdown = await converter.readFile(inputPath);
                await converter.convert(markdown, { outputPath });
                
                console.log(`변환 완료: ${outputFileName}`);
            } catch (error) {
                // 한 형식의 변환 실패가 다른 형식의 변환을 중단시키지 않도록 처리
                if (error instanceof Error) {
                    console.error(`${format} 변환 실패:`, error.message);
                } else {
                    console.error(`${format} 변환 중 알 수 없는 오류 발생`);
                }
            }
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error('오류:', error.message);
        } else {
            console.error('알 수 없는 오류가 발생했습니다.');
        }
        process.exit(1);
    }
}

main(); 