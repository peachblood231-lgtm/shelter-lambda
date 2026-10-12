import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import FacilityCard from '../components/FacilityCard'
import FacilityDetail from '../components/FacilityDetail'
import ControlCard from '../components/ControlCard'
import ExpeditionCard from '../components/ExpeditionCard'
import LogPanel from '../components/LogPanel'
import FoodStatus from '../components/FoodStatus'
import ArchiveCard from '../components/ArchiveCard'
import ArchiveView from '../components/ArchiveView'
import ArchiveProgress from '../components/ArchiveProgress'
import { getArchiveStats } from '../utils/archiveStats'

// ─────────────────────────────────────────────
// 화면에 보여 줄 내용은 JSON 파일에서 불러옵니다.
// 내용을 바꾸려면 src/data 폴더의 JSON 파일을 고치세요.
// (항목 설명: src/data/README.md)
// ─────────────────────────────────────────────
import FACILITIES from '../data/facilities.json'
import DASHBOARD from '../data/dashboard.json'
import ARCHIVE from '../data/archive-records.json'

// dashboard.json 안의 세 묶음을 각각 꺼내 둡니다.
const STATUS = DASHBOARD.status     // 오른쪽 위 상태 표시
const LOGS = DASHBOARD.logs         // 메인 대시보드 CURRENT LOG
const RECOVERY = DASHBOARD.recovery // 하단 진행 바

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

  // 지금까지 읽은 아카이브 기록 ID 목록
  // (여기에 두면 아카이브를 나갔다 들어와도 기억됨. 5-3단계에서 새로고침해도 유지되게 바꿀 예정)
  const [archiveReadIds, setArchiveReadIds] = useState([])

  // 기록을 읽었을 때: 목록에 없으면 추가
  function markRecordRead(id) {
    setArchiveReadIds((previous) => (previous.includes(id) ? previous : [...previous, id]))
  }

  // 화면을 바꿀 때는 ARCHIVE 상태도 함께 처음으로 돌립니다.
  function openScreen(id) {
    setOpenId(id)
    setIsArchiveOpen(false)
  }

  // 열린 시설의 정보를 찾습니다. (없으면 undefined)
  const openFacility = FACILITIES.find((facility) => facility.id === openId)

  // ── 시설을 열었을 때 ──
  if (openFacility) {
    // ▶ 아카이브를 열었으면: 아카이브 전용 화면
    if (isArchiveOpen) {
      // 이 시설의 기록만 골라냅니다.
      const records = ARCHIVE.records.filter((record) => record.facility === openFacility.id)
      // 이 시설 아카이브의 부제·접근 레벨 (없으면 빈 값)
      const archiveInfo = ARCHIVE.archives[openFacility.id] ?? {}
      // 개수 계산 (전체, 손상, 잠김 등) — 읽은 기록에 따라 잠김 개수가 바뀜
      const stats = getArchiveStats(records, archiveReadIds)

      return (
        <DashboardLayout
          code={`S - LAMBDA - 032 / ${openFacility.name}`}
          title={`${openFacility.name} ARCHIVE`}
          headerAside={
            <div className="arc-header-meta">
              <p className="arc-subtitle">{archiveInfo.subtitle}</p>
              <p className="arc-summary">
                ACCESS LEVEL {archiveInfo.accessLevel} · {stats.total} RECORDS · {stats.locked} LOCKED ·{' '}
                {stats.corrupted} CORRUPTED
              </p>
            </div>
          }
          status={STATUS}
          recovery={RECOVERY}
          side={<ArchiveProgress stats={stats} />}
          onBack={() => setIsArchiveOpen(false)}
          backLabel={openFacility.name}
        >
          <ArchiveView
            records={records}
            external={ARCHIVE.external}
            readIds={archiveReadIds}
            onRead={markRecordRead}
          />
        </DashboardLayout>
      )
    }

    // ▶ 시설 기본 화면
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

    return (
      <DashboardLayout
        title={openFacility.name}
        status={STATUS}
        recovery={RECOVERY}
        side={side}
        onBack={() => openScreen(null)}
      >
        <FacilityDetail facility={openFacility} />
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