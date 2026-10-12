# 데이터 파일 설명서

세계관 내용은 이 폴더의 JSON 파일만 고치면 화면에 반영됩니다.
저장(Ctrl + S)하면 브라우저가 자동으로 새로 그려요.

## JSON 작성 규칙 (오류가 나는 대부분의 원인)

- 글자는 항상 **큰따옴표**로 감쌉니다. `"GREENHOUSE"` (작은따옴표 X)
- 항목 사이에는 **쉼표**를 넣고, **마지막 항목 뒤에는 쉼표를 넣지 않습니다.**
- 숫자, `true`/`false`는 따옴표 없이 씁니다. `21.4`, `true`
- 줄바꿈은 글자 안에 `\n`을 넣습니다.
- 주석(`//` 설명)은 쓸 수 없습니다. 설명은 이 파일에 적습니다.

---

## facilities.json — 시설 목록

메인 대시보드의 카드 4개와 각 시설 화면의 내용입니다.

| 항목 | 뜻 |
|---|---|
| `id` | 프로그램이 구분하는 이름 (영어 소문자, 다른 시설과 겹치면 안 됨) |
| `name` | 화면에 보이는 이름 |
| `access` | 출입 상태. `"accessible"` = 가능, `"restricted"` = 제한(클릭 안 됨) |
| `description` | 구역 데이터가 없는 시설에서 보여 줄 설명 |

시설마다 아래 중 하나가 있으면 그에 맞는 화면이 나옵니다.

### `units` — 재배 구역 (GREENHOUSE)

| 항목 | 뜻 |
|---|---|
| `code` | 구역 번호 (예: `"B1 - A - 03"`) |
| `crop` | 작물 분류 |
| `temperature` | 온도 (숫자) |
| `humidity` | 습도 % (숫자) |
| `lightOn` | 처음 조명 상태 (`true` 켜짐 / `false` 꺼짐) |
| `plantListId` | 팝업에 보여 줄 식물 목록 이름표. `greenhouse-plants.json`의 이름과 같아야 함 (`leafyGreens`, `rootCrops`, `flowers`, `fruits`) |

### `halls` — 식당 (DINING HALL)

| 항목 | 뜻 |
|---|---|
| `code` | 식당 번호 |
| `capacityRange` | `[최소, 최대]` 들어올 때마다 이 범위에서 현재 인원이 랜덤으로 정해짐 |
| `maxCapacity` | 최대 수용 인원 |
| `powerLoad` | 전력 부하 표시 글자 |
| `temperature` | 온도 (숫자) |
| `menuId` | 처음 보여 줄 메뉴 번호. `dining-menus.json`의 `id`와 같아야 함 |

다이닝홀에는 이것도 있습니다.
- `foodProduce`: 오른쪽 위 상태 글자 (예: `"LIMITED"`)
- `logs`: 다이닝홀 CURRENT LOG 기록 `{ "time": "06:00", "text": "..." }`

### `floors` — 층 (RESIDENTIAL)

| 항목 | 뜻 |
|---|---|
| `code` | 층 번호 (예: `"B3"`) |
| `restricted` | 출입 제한된 구역 목록. 모든 구역이 들어 있으면 층 전체가 RESTRICTED |

레지덴셜에는 이것도 있습니다.
- `sectors`: 모든 층의 구역 이름 (예: `["A", "B", "C"]`)
- `lightOn`: 처음 조명 상태

---

## dashboard.json — 대시보드 공통 값

| 항목 | 뜻 |
|---|---|
| `status.inside` / `status.outside` | 온도. `base`(기준값)에서 ±`range` 안에서 랜덤하게 바뀜 |
| `status.tempUpdateMs` | 온도가 바뀌는 간격 (3000 = 3초) |
| `status.residents` | 주민 수 |
| `status.sectors` | 오른쪽 위 작은 구역 목록 |
| `logs` | 메인 대시보드 CURRENT LOG 기록 |
| `recovery.label` | 하단 진행 바 문구 |
| `recovery.percent` | 진행 바 채움 정도 (0 ~ 100) |

---

## greenhouse-plants.json — 식물 목록

`leafyGreens`, `rootCrops`, `flowers`, `fruits` 네 개의 목록. 이름을 추가하거나 지우면 팝업에 반영됩니다.

## dining-menus.json — 메뉴 목록

메뉴 하나는 `id`(번호), `breakfast`, `lunch`, `dinner`로 이루어집니다. CHANGE MENU를 누르면 이 중에서 랜덤으로 바뀝니다.