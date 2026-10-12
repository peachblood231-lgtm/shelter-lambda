import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import FacilityCard from '../components/FacilityCard'
import FacilityDetail from '../components/FacilityDetail'
import ControlCard from '../components/ControlCard'
import ExpeditionCard from '../components/ExpeditionCard'
import LogPanel from '../components/LogPanel'
import FoodStatus from '../components/FoodStatus'
import ArchiveCard from '../components/ArchiveCard'
// 그린하우스 식물 목록 (JSON 파일에서 불러오기)
import PLANTS from '../data/greenhouse-plants.json'

// ─────────────────────────────────────────────
// 화면에 보여 줄 내용입니다.
// 글자나 숫자를 바꾸려면 여기만 고치면 됩니다.
// (4단계에서 JSON 파일로 옮길 예정)
// ─────────────────────────────────────────────

// 시설 목록
// - id: 프로그램이 구분하는 이름
// - name: 화면에 보이는 이름
// - access: 출입 상태 ('accessible' = 가능, 'restricted' = 제한)
// - description: 구역이 없는 시설에서 보여 줄 설명 (\n = 줄바꿈)
// - units: (선택) 재배 구역 목록 → 그린하우스 화면
// - halls: (선택) 식당 목록 → 다이닝홀 화면
// - floors: (선택) 층 목록 → 레지덴셜 화면
//   ※ 설명·기록 문구는 샘플입니다. 세계관에 맞게 바꿔 주세요.
const FACILITIES = [
  {
    id: 'greenhouse',
    name: 'GREENHOUSE',
    access: 'accessible',
    description:
      '셸터 식량의 대부분을 생산하는 수경 재배 구역.\n온도 시스템 장애 이후 일부 재배 선반의 가동이 중단되었다.',
    // 재배 구역 목록
    // - code: 구역 번호 / crop: 작물 / temperature: 온도 / humidity: 습도(%)
    // - lightOn: 처음 조명 상태 (true = 켜짐)
    // - plants: 카드를 눌렀을 때 팝업에 보여 줄 식물 목록
    units: [
      {
        id: 'b1-a-03',
        code: 'B1 - A - 03',
        crop: 'LEAFY GREENS',
        temperature: 21.4,
        humidity: 64,
        lightOn: true,
        plants: PLANTS.leafyGreens,
      },
      {
        id: 'b2-a-02',
        code: 'B2 - A - 02',
        crop: 'ROOT CROPS',
        temperature: 23.1,
        humidity: 56,
        lightOn: true,
        plants: PLANTS.rootCrops,
      },
      {
        id: 'b2-a-03',
        code: 'B2 - A - 03',
        crop: 'HONEYCOMB',
        temperature: 20.8,
        humidity: 62,
        lightOn: true,
        plants: PLANTS.flowers,
      },
      {
        id: 'b3-a-01',
        code: 'B3 - A - 01',
        crop: 'FRUITS',
        temperature: 24.2,
        humidity: 70,
        lightOn: true,
        plants: PLANTS.fruits,
      },
    ],
  },
  {
    id: 'dining-hall',
    name: 'DINING HALL',
    access: 'accessible',
    description:
      '주민 전원이 교대로 식사하는 공용 식당.\n하루 세 번의 배식 시간은 셸터에서 가장 붐비는 순간이다.',
    // 식량 생산 상태 (오른쪽 열 맨 위)
    foodProduce: 'LIMITED',
    // 다이닝홀 CURRENT LOG (샘플)
    logs: [
      { time: '06:00', text: 'B1-B-01 BREAKFAST SERVICE STARTED' },
      { time: '06:05', text: 'B2-B-01 BREAKFAST SERVICE STARTED' },
      { time: '06:40', text: 'FOOD PRODUCE LEVEL: LIMITED' },
    ],
    // 식당 목록
    // - code: 식당 번호
    // - capacityRange: [최소, 최대] → 들어올 때마다 이 범위에서 현재 인원이 랜덤으로 정해짐
    // - maxCapacity: 최대 수용 인원
    // - powerLoad: 전력 부하 / temperature: 온도
    // - menuId: 처음 보여 줄 메뉴 번호 (dining-menus.json의 id)
    halls: [
      {
        id: 'b1-b-01',
        code: 'B1 - B - 01',
        capacityRange: [11, 120],
        maxCapacity: 190,
        powerLoad: 'STABLE',
        temperature: 14.7,
        menuId: '047',
      },
      {
        id: 'b2-b-01',
        code: 'B2 - B - 01',
        capacityRange: [11, 120],
        maxCapacity: 240,
        powerLoad: 'STABLE',
        temperature: 12.1,
        menuId: '102',
      },
    ],
  },
  {
    id: 'residential',
    name: 'RESIDENTIAL',
    access: 'accessible',
    description:
      '주민들이 머무는 거주 구역. 각 세대는 번호로만 구분된다.\n야간에는 조도가 자동으로 낮아진다.',
    // 모든 층에 공통으로 있는 구역 이름
    sectors: ['A', 'B', 'C'],
    // 처음 조명 상태 (true = 켜짐)
    lightOn: true,
    // 층 목록 (B3 ~ B14)
    // - restricted: 출입이 제한된 구역 목록. 세 구역이 모두 들어 있으면 층 전체가 RESTRICTED로 표시됨
    floors: [
      { id: 'b3', code: 'B3', restricted: [] },
      { id: 'b4', code: 'B4', restricted: ['B'] },
      { id: 'b5', code: 'B5', restricted: ['A', 'B', 'C'] },
      { id: 'b6', code: 'B6', restricted: ['C'] },
      { id: 'b7', code: 'B7', restricted: [] },
      { id: 'b8', code: 'B8', restricted: ['A'] },
      { id: 'b9', code: 'B9', restricted: ['B', 'C'] },
      { id: 'b10', code: 'B10', restricted: ['A', 'B', 'C'] },
      { id: 'b11', code: 'B11', restricted: ['A', 'B', 'C'] },
      { id: 'b12', code: 'B12', restricted: ['A', 'B', 'C'] },
      { id: 'b13', code: 'B13', restricted: ['C'] },
      { id: 'b14', code: 'B14', restricted: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 'laboratory',
    name: 'LABORATORY',
    access: 'restricted',
    description:
      '출입이 제한된 연구 구역.\n허가된 인원 외에는 출입 기록조차 열람할 수 없다.',
  },
]

// 오른쪽 위 상태 표시 값
const STATUS = {
  // 온도: base(기준 온도)에서 ±range 안에서 랜덤하게 바뀝니다.
  inside: { base: 12.4, range: 1.5 },
  outside: { base: -72.8, range: 3 },
  tempUpdateMs: 3000, // 온도가 바뀌는 간격 (3000 = 3초)

  residents: 487,
  sectors: ['THETA', 'IOTA', 'KAPPA', 'MU', 'NU', 'XI'],
}

// 메인 대시보드 CURRENT LOG 기록 (위에서부터 순서대로 표시)
// ※ 샘플입니다. 나중에 탐사 결과 등이 여기에 쌓이게 됩니다.
const LOGS = [
  { time: '03:12', text: 'TEMPERATURE SYSTEM FAILURE DETECTED' },
  { time: '03:14', text: 'EMERGENCY HEATING ENABLED' },
  { time: '03:20', text: 'RECOVERY PROTOCOL INITIATED' },
]

// 하단 진행 바 (percent: 0~100)
const RECOVERY = {
  label: 'TEMPERATURE SYSTEM RECOVERY IN PROGRESS',
  percent: 45,
}

// 시설이 아닌 화면을 열었을 때 openId에 넣을 특별한 값
const CONTROL_ID = 'control'       // 중앙제어시스템
const EXPEDITION_ID = 'expedition' // 탐사

// 아직 기능이 없는 화면에 보여 줄 안내 상자
// - title: 큰 제목 / message: 안내 문구 / backLabel: 돌아가기 버튼 글자 / onBack: 돌아가기 동작
function renderNotice({ title, message, backLabel, onBack }) {
  return (
    <section className="term-detail">
      <div className="term-detail-top">
        <button type="button" className="term-back" onClick={onBack}>
          ← {backLabel}
        </button>
      </div>
      <h2 className="term-detail-name">{title}</h2>
      <p className="term-detail-desc">{message}</p>
    </section>
  )
}

function DashboardScreen() {
  // 지금 열려 있는 화면을 기억합니다.
  // - null: 아무것도 안 연 상태 → 카드 4개
  // - 시설 id (예: 'greenhouse'): 그 시설 화면
  // - 'control': 중앙제어시스템 화면
  // - 'expedition': 탐사 화면
  const [openId, setOpenId] = useState(null)

  // 시설 안에서 ARCHIVE를 열었는지
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)

  // 화면을 바꿀 때는 ARCHIVE 상태도 함께 처음으로 돌립니다.
  function openScreen(id) {
    setOpenId(id)
    setIsArchiveOpen(false)
  }

  // 열린 시설의 정보를 찾습니다. (없으면 undefined)
  const openFacility = FACILITIES.find((facility) => facility.id === openId)

  // ── 시설을 열었을 때: 제목이 시설 이름으로 바뀜 ──
  if (openFacility) {
    // 오른쪽 열: 식당이 있는 시설(다이닝홀)만 있음. 그 외에는 없음(null) → 가운데가 넓게
    let side = null
    if (openFacility.halls) {
      side = (
        <>
          <FoodStatus state={openFacility.foodProduce} />
          <LogPanel logs={openFacility.logs} />
          <ArchiveCard onOpen={() => setIsArchiveOpen(true)} />
        </>
      )
    }

    // 가운데: ARCHIVE를 열었으면 안내 화면, 아니면 시설 내용
    let main
    if (isArchiveOpen) {
      main = renderNotice({
        title: 'ARCHIVE',
        message: '문서 열람 기능은 5단계에서 구현됩니다.',
        backLabel: openFacility.name,
        onBack: () => setIsArchiveOpen(false),
      })
    } else {
      main = <FacilityDetail facility={openFacility} />
    }

    return (
      <DashboardLayout
        title={openFacility.name}
        status={STATUS}
        recovery={RECOVERY}
        side={side}
        onBack={() => openScreen(null)}
      >
        {main}
      </DashboardLayout>
    )
  }

  // ── 그 외(중앙 터미널): 오른쪽에 제어시스템 → 탐사 → 로그 ──
  const sidePanels = (
    <>
      <ControlCard onOpen={() => openScreen(CONTROL_ID)} />
      <ExpeditionCard onOpen={() => openScreen(EXPEDITION_ID)} />
      <LogPanel logs={LOGS} />
    </>
  )

  // 가운데 영역에 보여 줄 내용
  let content
  if (openId === CONTROL_ID) {
    // 중앙제어시스템 화면 (임시 안내)
    content = renderNotice({
      title: 'CENTRAL TEMPERATURE CONTROL SYSTEM',
      message: '온도 제어 기능은 이후 단계에서 구현됩니다.',
      backLabel: 'CENTRAL TERMINAL',
      onBack: () => openScreen(null),
    })
  } else if (openId === EXPEDITION_ID) {
    // 탐사 화면 (임시 안내)
    content = renderNotice({
      title: 'EXPEDITION',
      message: '탐사 파견 기능은 이후 단계에서 구현됩니다.',
      backLabel: 'CENTRAL TERMINAL',
      onBack: () => openScreen(null),
    })
  } else {
    // 기본: 시설 카드 4개
    content = (
      <div className="term-cards">
        {FACILITIES.map((facility) => (
          <FacilityCard
            key={facility.id}
            name={facility.name}
            access={facility.access}
            onOpen={() => openScreen(facility.id)}
          />
        ))}
      </div>
    )
  }

  return (
    <DashboardLayout
      title="CENTRAL TERMINAL"
      status={STATUS}
      recovery={RECOVERY}
      side={sidePanels}
    >
      {content}
    </DashboardLayout>
  )
}

export default DashboardScreen