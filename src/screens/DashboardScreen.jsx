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
import ControlSystemView from '../components/ControlSystemView'
import useFluctuatingValue from '../hooks/useFluctuatingValue'
import { getArchiveStats } from '../utils/archiveStats'
import { formatClock } from '../utils/format'
import { getStage, getRepairPercent } from '../utils/controlStage'

// ─────────────────────────────────────────────
// 화면에 보여 줄 내용은 JSON 파일에서 불러옵니다.
// 내용을 바꾸려면 src/data 폴더의 JSON 파일을 고치세요.
// (항목 설명: src/data/README.md)
// ─────────────────────────────────────────────
import FACILITIES from '../data/facilities.json'
import DASHBOARD from '../data/dashboard.json'
import ARCHIVE from '../data/archive-records.json'
import ITEMS from '../data/items.json'
import CONTROL from '../data/control-system.json'

// dashboard.json 안의 묶음을 꺼내 둡니다.
const STATUS = DASHBOARD.status // 오른쪽 위 상태 표시
const LOGS = DASHBOARD.logs     // 메인 대시보드 CURRENT LOG 기본 기록

// 시설이 아닌 화면을 열었을 때 openId에 넣을 특별한 값
const CONTROL_ID = 'control'       // 중앙온도제어시스템
const EXPEDITION_ID = 'expedition' // 탐사

// 아이템 ID로 이름 찾기 (없으면 ID 그대로)
function findItemName(itemId) {
  return ITEMS.find((item) => item.id === itemId)?.name ?? itemId
}

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

// 대시보드 화면
// - game: 게임 진행 상태 (App에서 받음, 브라우저에 자동 저장됨)
// - dispatch: 게임 상태를 바꾸는 명령을 보내는 함수
function DashboardScreen({ game, dispatch }) {
  // 지금 열려 있는 화면을 기억합니다.
  // - null: 아무것도 안 연 상태 → 카드 4개
  // - 시설 id (예: 'greenhouse'): 그 시설 화면
  // - 'control': 중앙온도제어시스템 화면
  // - 'expedition': 탐사 화면
  const [openId, setOpenId] = useState(null)

  // 시설 안에서 ARCHIVE를 열었는지
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)

  // ── 온도제어시스템 복구도와 단계 ──
  // (저장 기록에 없을 때를 대비한 기본값)
  const controlSystem = game.systems[CONTROL.id] ?? { repair: 0, maxRepair: 1000 }
  const repairPercent = getRepairPercent(controlSystem)
  const controlStage = getStage(CONTROL.stages, repairPercent)
  const isOperational = controlSystem.repair >= controlSystem.maxRepair

  // ── 온도 ──
  // 실내 온도: 지금 복구 단계의 온도 설정(기준값·흔들림 폭)을 따릅니다.
  //   단계에 설정이 없으면 dashboard.json의 값을 씁니다.
  // 여기서 한 번만 계산해서 오른쪽 위 상태 표시와 제어시스템 화면이 "같은 값"을 쓰게 합니다.
  const insideSetting = controlStage.inside ?? STATUS.inside
  const inside = useFluctuatingValue(insideSetting.base, insideSetting.range, STATUS.tempUpdateMs)
  const outside = useFluctuatingValue(STATUS.outside.base, STATUS.outside.range, STATUS.tempUpdateMs)

  // ── 하단 진행 바 = 복구도 ──
  const recovery = {
    label: isOperational ? CONTROL.operationalLabel : CONTROL.recoveryLabel,
    percent: repairPercent,
  }

  // 모든 화면의 틀(DashboardLayout)에 공통으로 넘겨줄 값
  const layoutBase = {
    status: STATUS,
    temperatures: { inside, outside },
    recovery,
  }

  // ── 메인 CURRENT LOG = 기본 기록 + 부품 투입 내역 ──
  const installLogs = game.installLog.map((entry) => ({
    time: formatClock(entry.time),
    text: `${findItemName(entry.itemId)} INSTALLED +${entry.gained}`,
  }))
  const mainLogs = [...LOGS, ...installLogs]

  // ── 아카이브 읽음 기록 (게임 상태에서 가져옴 → 새로고침해도 유지) ──
  const archiveReadIds = game.archiveReadIds

  function markRecordRead(id) {
    dispatch({ type: 'archive/markRead', id })
  }

  // ── 부품 투입: 명령 하나로 차감 + 증가 + 기록 ──
  function installPart(itemId) {
    dispatch({
      type: 'system/installPart',
      systemId: CONTROL.id,
      itemId,
      time: new Date().toISOString(), // 투입 시각
    })
  }

  // 화면을 바꿀 때는 ARCHIVE 상태도 함께 처음으로 돌립니다.
  function openScreen(id) {
    setOpenId(id)
    setIsArchiveOpen(false)
  }

  // ── 중앙온도제어시스템 화면 (전체 화면이 바뀜) ──
  if (openId === CONTROL_ID) {
    return (
      <DashboardLayout {...layoutBase} title={CONTROL.title} onBack={() => openScreen(null)}>
        <ControlSystemView
          config={CONTROL}
          system={controlSystem}
          inventory={game.inventory}
          items={ITEMS}
          currentTemperature={inside}
          onInstall={installPart}
        />
      </DashboardLayout>
    )
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
          {...layoutBase}
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
      <DashboardLayout {...layoutBase} title={openFacility.name} side={side} onBack={() => openScreen(null)}>
        <FacilityDetail facility={openFacility} />
      </DashboardLayout>
    )
  }

  // ── 그 외(중앙 터미널): 오른쪽에 제어시스템 → 탐사 → 로그 ──
  const sidePanels = (
    <>
      <ControlCard onOpen={() => openScreen(CONTROL_ID)} />
      <ExpeditionCard onOpen={() => openScreen(EXPEDITION_ID)} />
      <LogPanel logs={mainLogs} />
    </>
  )

  // 가운데 영역에 보여 줄 내용
  let content
  if (openId === EXPEDITION_ID) {
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
    <DashboardLayout {...layoutBase} title="CENTRAL TERMINAL" side={sidePanels}>
      {content}
    </DashboardLayout>
  )
}

export default DashboardScreen