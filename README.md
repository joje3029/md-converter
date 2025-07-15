# Markdown 변환기

마크다운 문서를 Word(.docx)와 텍스트(.txt) 형식으로 변환하는 도구입니다.

## 주요 기능

- Markdown → Word (.docx) 변환
- Markdown → TXT (.txt) 변환
- Mermaid 다이어그램 지원
- 마크다운 서식 유지 (제목, 링크, 표 등)
- 대화형 입력 지원 (파일 경로와 출력 형식 선택)

## 설치 방법

```bash
# 저장소 클론
git clone <repository-url>
cd md-converter

# 의존성 설치
npm install
```

## 사용 방법

```bash
# TypeScript 컴파일
npm run build

# 변환 실행 (대화형 모드)
node dist/index.js
```

### 대화형 입력 과정

1. **마크다운 파일 경로 입력**
   - 절대 경로 또는 상대 경로 입력 가능
   - 예: `./examples/test.md` 또는 `C:/documents/example.md`
   - 파일이 존재하지 않으면 다시 입력을 요청합니다
   - 입력된 파일이 `.md` 확장자가 아니면 다시 입력을 요청합니다

2. **출력 형식 선택**
   - 다음 중 하나를 입력:
     - `docx`: Word 문서로만 변환
     - `txt`: 텍스트 파일로만 변환
     - `all`: 두 형식 모두 변환
   - 잘못된 입력시 다시 선택을 요청합니다

### 출력 파일 생성

변환된 파일은 입력 파일과 동일한 디렉토리에 저장됩니다.
예를 들어, `example.md`를 변환하면:
- Word 형식: `example.docx`
- 텍스트 형식: `example.txt`

### 주의사항
- 이미 같은 이름의 출력 파일이 있다면 자동으로 덮어씁니다
- Mermaid 다이어그램이 포함된 경우 변환에 시간이 더 걸릴 수 있습니다
- 변환 중 오류 발생 시 구체적인 오류 메시지가 표시됩니다

## 개발 환경

- Node.js
- TypeScript
- markdown-it: 마크다운 파싱
- docx: Word 문서 생성
- @mermaid-js/mermaid-cli: 다이어그램 변환

## 프로젝트 구조

```
md-converter/
├── src/
│   ├── core/           # 핵심 기능
│   │   ├── converter.ts    # 변환 기본 클래스 및 인터페이스
│   │   ├── mermaid.ts     # 다이어그램 처리
│   │   └── parser.ts      # 마크다운 파싱
│   ├── formats/        # 출력 형식별 변환기
│   │   ├── txt.ts        # 텍스트 변환
│   │   └── word.ts       # Word 문서 변환
│   └── index.ts       # 진입점
├── examples/          # 예제 파일
└── dist/             # 컴파일된 JavaScript 파일
```

## 구조 설계 결정

### 타입 정의 위치
현재 각 TypeScript 파일에서 관련 타입들을 해당 파일 내에서 정의하고 있습니다. 이는 의도적인 결정으로:

1. **프로젝트 규모**: 현재 프로젝트는 개인 도구로 사용되며, 각 모듈의 타입이 비교적 단순합니다.
2. **응집도**: 각 타입이 해당 모듈의 구현과 밀접하게 연관되어 있어, 같은 파일에서 관리하는 것이 더 효율적입니다.
3. **유지보수성**: 타입과 구현이 함께 있어 코드 이해와 수정이 더 쉽습니다.

향후 프로젝트가 확장되어 타입의 재사용이 늘어나거나 복잡도가 증가하면, 별도의 types/ 디렉토리로 분리할 수 있습니다.

## 라이선스

MIT 