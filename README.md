# Markdown 변환기

마크다운 문서를 Word(.docx)와 텍스트(.txt) 형식으로 변환하는 도구입니다.

## 주요 기능

- Markdown → Word (.docx) 변환
- Markdown → TXT (.txt) 변환
- Mermaid 다이어그램 지원
- 마크다운 서식 유지 (제목, 링크, 표 등)

## 설치 방법

```bash
# 의존성 설치
npm install
```

## 사용 방법

```bash
# TypeScript 컴파일
npm run build

# 변환 실행 (결과물은 output 폴더에 저장됨)
node dist/index.js <입력파일>.md <출력파일명>.[docx|txt]

# 예시
node dist/index.js example.md result.docx  # output/result.docx로 저장됨
node dist/index.js example.md result.txt   # output/result.txt로 저장됨
```

## 개발 환경

- Node.js
- TypeScript
- markdown-it: 마크다운 파싱
- docx: Word 문서 생성
- @mermaid-js/mermaid-cli: 다이어그램 변환

## 프로젝트 구조

```
md-converter/
├── src/           # 소스 코드
├── examples/      # 예제 파일
├── output/        # 변환된 결과물 저장
└── temp/          # 임시 파일 (자동 정리됨)
``` 