# SHELTER LAMBDA — 작업 안내

## 사용자에 대해
- 코딩 초보(복사·붙여넣기 수준). 바꾼 내용은 쉽게 설명할 것.
- 답변은 한국어로.
- 작업 전에는 git commit. 확인이 끝난 뒤 push 여부는 사용자가 정함 (임의로 push하지 않기).

## 프로젝트
- **SHELTER LAMBDA — CENTRAL ARCHIVE**: 얼어붙은 지하 셸터를 터미널 UI로 관리하는 웹 게임.
- React + Vite, 추가 라이브러리 없음.
  - 데이터: `src/data/*.json`
  - 게임 상태: `src/game/` (useReducer + localStorage 자동 저장)
- 명령어: `npm run dev` (개발), `npm run build` (빌드), `npm run lint` (oxlint)

### 배포
- **GitHub Pages**: GitHub Actions로 자동 배포. push하면 바로 배포됨.
  `vite.config.js`의 `base: '/shelter-lambda/'`.
- **itch.io**: 수동 업로드.
  1. `npx vite build --base=./`
  2. `dist` 폴더 **안의 내용물만** ZIP으로 압축 (dist 폴더 자체 X)
  3. itch.io에 업로드
- 주의: Linux 빌드 서버는 파일명 대소문자를 구분함 (예: `src/screens/IntroScreen.jsx`). import 경로의 대소문자를 실제 파일명과 똑같이 맞출 것.

### 디자인 규칙
- 색은 `src/index.css`의 `:root` 변수만 사용.
- 글꼴: 큰 제목 IBM Plex Serif, 본문 Inter.
- 호버: 흰 배경 + 검은 글씨.

## 지금 하는 작업: 한국어/영어 전환 (i18n)

### 구조
- 언어 상태: `src/i18n/language.js`
  - `useLanguage()`, `setLanguage()`
  - localStorage 키 `'shelter-lambda-lang'` (게임 저장과 별도), 처음엔 브라우저 언어
- 번역 사전과 함수: `src/i18n/strings.js`
  - `STRINGS`(사전), `useT()`(화면용 번역 함수), `translate()`, `pick()`, `hasString()`
  - 사용 예: `const t = useT()` → `t('signal.hold', { percent: 80, seconds: 3 })`
- 언어 버튼: `src/components/LanguageToggle.jsx` (인트로 오른쪽 아래, 대시보드 상태 표시 아래)
- 한글 글꼴: `src/styles/i18n.css`에서 `--font-sans`에 Pretendard, `--font-serif`에 Noto Serif KR을 이어 붙임

### 번역 규칙 (B안)
- **영어 그대로**: 화면 큰 제목, 시설·카드 이름(GREENHOUSE 등), 고유명사(SHELTER LAMBDA, THETA, HELIOS, SECTOR A, 구역 코드)
- **번역**: 버튼, 상태 표시, 안내·경고 문구, 로그, 팝업, aria-label
- 화면 문구는 `strings.js`에 키로 추가하고 `t('키')`로 꺼냄.
- 데이터 파일의 글자는 `{ "en": "...", "ko": "..." }` 형태로 바꾸고, 화면에서 `pick(값, lang)`으로 꺼냄.
- 예외: `control-system.json`의 단계 label(INITIALIZING 등)은 다른 기능의 키로도 쓰이므로 **데이터는 그대로** 두고 화면에서만 `t('stage.' + label)`로 번역.
- 번역문 톤: 세계관에 맞게 차갑고 건조한 시설 기록 느낌.
- **무전 기록·업적 문구는 사용자가 직접 확인함** → 바로 반영하지 말고 초안을 먼저 보여 줄 것.

### 진행 상황
- 완료
  - L1: 기반·인트로·중앙 터미널·로그
  - L2-A: 제어시스템·매트릭스·탐사·확인 팝업·업적 안내창
  - L2-B1: 시설 카드·다이닝홀·그린하우스·0과 1 화면
  - L2-B2: SignalView, FloorCard, ResidentialFloors, SectorRoomsDialog
  - L3-A: `items.json`(103개 이름·설명), `dining-menus.json`, `facilities.json`(시설 설명·다이닝홀 로그)
    - 아이템은 DashboardScreen의 `localizeItems(lang)`에서 지금 언어로 바꿔 각 화면에 넘김
    - `recipes.json`(label은 craft.* 키), `greenhouse-crops.json`은 화면 글자가 없어 그대로
  - L3-B: `signals.json`(무전 기록, transmission이 `{ en: [...], ko: [...] }`), `achievements.json` — 사용자 승인 초안 반영
    - 업적 인물 영어 표기: 베네티 후 = Benetti Hu (임시, 사용자 확인 전)
- 남은 것
  - 보류: `greenhouse-plants.json`(식물 이름 318개, 영어 그대로), 재배 구역 작물 분류(LEAFY GREENS 등, 카드 이름으로 보고 영어 유지)
  - L4: `archive-records.json`(아카이브 기록, 가장 긴 글)과 아카이브 화면(ArchiveView, RecordDetail, RecordBody, ArchiveProgress)
  - 마지막: 전체 점검 → GitHub push(사용자 결정) → itch.io용 다시 빌드
