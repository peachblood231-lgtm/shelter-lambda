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
import ExpeditionView from '../components/ExpeditionView'
import useFluctuatingValue from '../hooks/useFluctuatingValue'
import { getArchiveStats } from '../utils/archiveStats'
import { formatClock } from '../utils/format'
import { getStage, getRepairPercent } from '../utils/controlStage'
import { prepareExpedition } from '../game/expedition'

// ─────────────────────────────────────────────
// 화면에 보여 줄 내용은 JSON 파일에서 불러옵니다.
// 내용을 바꾸려면 src/data 폴더의 JSON 파일을 고치세요.
// ─────────────────────────────────────────────
import FACILITIES from '../data/facilities.json'
import DASHBOARD from '../data/dashboard.json'
import ARCHIVE from '../data/archive-records.json'
import ITEMS from '../data/items.json'
import CONTROL from '../data/control-system.json'
import EXPEDITION from '../data/expedition.json'
import RECIPES from '../data/recipes.json'

const STATUS = DASHBOARD.status // 오른쪽 위 상태 표시
const LOGS = DASHBOARD.logs     // 메인 대시보드 CURRENT LOG 기본 기록

// 온도제어시스템에 넣을 수 있는 아이템만 (수리 부품)
const CONTROL_ITEMS = ITEMS.filter((item) => item.repair?.[CONTROL.id])

// 시설이 아닌 화면을 열었을 때 openId에 넣을 특별한 값
const CONTROL_ID = 'control'       // 중앙온도제어시스템
const EXPEDITION_ID = 'expedition' // 탐사

function findItemName(itemId) {
  return ITEMS.find((item) => item.id === itemId)?.name ?? itemId
}

function findLocationName(locationId) {
  return EXPEDITION.locations.find((location) => location.id === locationId)?.name ?? locationId
}

// 대시보드 화면
// - game: 게임 진행 상태 (App에서 받음, 브라우저에 자동 저장됨)
// - dispatch: 게임 상태를 바꾸는 명령을 보내는 함수
function DashboardScreen({ game, dispatch }) {
  // 지금 열려 있는 화면 (null / 시설 id / 'control' / 'expedition')
  const [openId, setOpenId] = useState(null)

  // 시설 안에서 ARCHIVE를 열었는지
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)

  // ── 온도제어시스템 복구도와 단계 ──
  const controlSystem = game.systems[CONTROL.id] ?? { repair: 0, maxRepair: 1000 }
  const repairPercent = getRepairPercent(controlSystem)
  const controlStage = getStage(CONTROL.stages, repairPercent)
  const isOperational = controlSystem.repair >= controlSystem.maxRepair

  // ── 온도 (실내 온도는 복구 단계를 따름) ──
  const insideSetting = controlStage.inside ?? STATUS.inside
  const inside = useFluctuatingValue(insideSetting.base, insideSetting.range, STATUS.tempUpdateMs)
  const outside = useFluctuatingValue(STATUS.outside.base, STATUS.outside.range, STATUS.tempUpdateMs)

  // ── 하단 진행 바 = 복구도 ──
  const recovery = {
    label: isOperational ? CONTROL.operationalLabel : CONTROL.recoveryLabel,
    percent: repairPercent,
  }

  const layoutBase = {
    status: STATUS,
    temperatures: { inside, outside },
    recovery,
  }

  // ── 메인 CURRENT LOG = 기본 기록 + (부품 투입 + 탐사) 기록을 시간순으로 ──
  const eventLogs = [
    ...game.installLog.map((entry) => ({
      time: entry.time,
      text: `${findItemName(entry.itemId)} INSTALLED +${entry.gained}`,
    })),
    ...game.expeditionLog.map((entry) => ({
      time: entry.time,
      text: `${findLocationName(entry.locationId)} EXPEDITION ${
        entry.earlyReturn ? 'RETURNED EARLY' : 'RETURNED'
      } · ${entry.found.length} ITEMS`,
    })),
  ]
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((entry) => ({ time: formatClock(entry.time), text: entry.text }))
  const mainLogs = [...LOGS, ...eventLogs]

  // ── 아카이브 읽음 기록 ──
  const archiveReadIds = game.archiveReadIds

  function markRecordRead(id) {
    dispatch({ type: 'archive/markRead', id })
  }

  // ── 부품 투입 ──
  function installPart(itemId) {
    dispatch({
      type: 'system/installPart',
      systemId: CONTROL.id,
      itemId,
      time: new Date().toISOString(),
    })
  }

  // ── 탐사 보내기 ──
  // 주사위·조기 귀환 판정은 여기서 미리 하고, 명령으로 차감 + 획득을 한 번에 처리합니다.
  // 돌려주는 값: 화면에 보여 줄 결과 보고 (출발할 수 없으면 null)
  function launchExpedition(locationId) {
    const location = EXPEDITION.locations.find((candidate) => candidate.id === locationId)
    if (!location) return null

    const prepared = prepareExpedition(location, EXPEDITION.lootTable, game.inventory, ITEMS)
    if (!prepared) return null

    dispatch({
      type: 'expedition/complete',
      locationId,
      foundItemIds: prepared.found,
      earlyReturn: prepared.earlyReturn,
      time: new Date().toISOString(),
    })

    return {
      locationId,
      found: prepared.found,
      gear: prepared.gear,
      rationsUsed: prepared.plan.use,
      rationTotal: prepared.plan.total,
      earlyReturn: prepared.earlyReturn,
    }
  }

  // ── 조합 (예: 찢어진 방한복 수선) ──
  function craftItem(recipeId) {
    dispatch({ type: 'craft/make', recipeId })
  }

  function openScreen(id) {
    setOpenId(id)
    setIsArchiveOpen(false)
  }

  // ── 중앙온도제어시스템 화면 ──
  if (openId === CONTROL_ID) {
    return (
      <DashboardLayout {...layoutBase} title={CONTROL.title} onBack={() => openScreen(null)}>
        <ControlSystemView
          config={CONTROL}
          system={controlSystem}
          inventory={game.inventory}
          items={CONTROL_ITEMS}
          currentTemperature={inside}
          onInstall={installPart}
        />
      </DashboardLayout>
    )
  }

  // ── 탐사 화면 ──
  if (openId === EXPEDITION_ID) {
    return (
      <DashboardLayout {...layoutBase} title={EXPEDITION.title} onBack={() => openScreen(null)}>
        <ExpeditionView
          config={EXPEDITION}
          inventory={game.inventory}
          items={ITEMS}
          recipes={RECIPES}
          onLaunch={launchExpedition}
          onCraft={craftItem}
        />
      </DashboardLayout>
    )
  }

  const openFacility = FACILITIES.find((facility) => facility.id === openId)

  // ── 시설을 열었을 때 ──
  if (openFacility) {
    if (isArchiveOpen) {
      const records = ARCHIVE.records.filter((record) => record.facility === openFacility.id)
      const archiveInfo = ARCHIVE.archives[openFacility.id] ?? {}
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

  // ── 중앙 터미널 ──
  const sidePanels = (
    <>
      <ControlCard onOpen={() => openScreen(CONTROL_ID)} />
      <ExpeditionCard onOpen={() => openScreen(EXPEDITION_ID)} />
      <LogPanel logs={mainLogs} />
    </>
  )

  return (
    <DashboardLayout {...layoutBase} title="CENTRAL TERMINAL" side={sidePanels}>
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
    </DashboardLayout>
  )
}

export default DashboardScreen