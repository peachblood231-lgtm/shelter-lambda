import { useEffect, useRef, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import FacilityCard from '../components/FacilityCard'
import FacilityDetail from '../components/FacilityDetail'
import ControlCard from '../components/ControlCard'
import ExpeditionCard from '../components/ExpeditionCard'
import LogPanel from '../components/LogPanel'
import FoodStatus from '../components/FoodStatus'
import RationCard from '../components/RationCard'
import ArchiveCard from '../components/ArchiveCard'
import ArchiveView from '../components/ArchiveView'
import ArchiveProgress from '../components/ArchiveProgress'
import ControlSystemView from '../components/ControlSystemView'
import ExpeditionView from '../components/ExpeditionView'
import SignalView, { SignalTransmission } from '../components/SignalView'
import AchievementToast from '../components/AchievementToast'
import useFluctuatingValue from '../hooks/useFluctuatingValue'
import useNow from '../hooks/useNow'
import { getArchiveStats } from '../utils/archiveStats'
import { formatClock } from '../utils/format'
import { getStage, getRepairPercent } from '../utils/controlStage'
import { prepareExpedition, getRations } from '../game/expedition'
import { getRationStatus } from '../game/ration'

// ─────────────────────────────────────────────
// 화면에 보여 줄 내용은 JSON 파일에서 불러옵니다.
// ─────────────────────────────────────────────
import FACILITIES from '../data/facilities.json'
import DASHBOARD from '../data/dashboard.json'
import ARCHIVE from '../data/archive-records.json'
import ITEMS from '../data/items.json'
import CONTROL from '../data/control-system.json'
import EXPEDITION from '../data/expedition.json'
import RECIPES from '../data/recipes.json'
import RATION from '../data/emergency-ration.json'
import SIGNALS from '../data/signals.json'
import ACHIEVEMENTS from '../data/achievements.json'

const STATUS = DASHBOARD.status
const LOGS = DASHBOARD.logs

// 온도제어시스템에 넣을 수 있는 아이템만 (수리 부품)
const CONTROL_ITEMS = ITEMS.filter((item) => item.repair?.[CONTROL.id])

// 배급으로 받는 아이템 (단백질 바)
const RATION_ITEM = ITEMS.find((item) => item.id === RATION.itemId)

const CONTROL_ID = 'control'
const EXPEDITION_ID = 'expedition'
const SIGNAL_ID = 'signal'

function findItemName(itemId) {
  return ITEMS.find((item) => item.id === itemId)?.name ?? itemId
}

function findLocationName(locationId) {
  return EXPEDITION.locations.find((location) => location.id === locationId)?.name ?? locationId
}

function findSectorName(sectorId) {
  return SIGNALS.sectors.find((sector) => sector.id === sectorId)?.name ?? sectorId
}

// 대시보드 화면
// - game: 게임 진행 상태 / dispatch: 상태를 바꾸는 명령을 보내는 함수
function DashboardScreen({ game, dispatch }) {
  const [openId, setOpenId] = useState(null)
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const [isMatrixOpen, setIsMatrixOpen] = useState(false)
  const [signalSectorId, setSignalSectorId] = useState(null)

  // 1초마다 갱신되는 현재 시각 (배급 남은 시간 표시용)
  const now = useNow(1000)

  // ── 업적 안내창 ──
  // 화면을 처음 열 때 이미 받은 업적은 "본 것"으로 처리 (새로고침해도 다시 뜨지 않게)
  const seenAchievementsRef = useRef(game.achievements.map((entry) => entry.id))
  // 보여 줄 안내창 순서 (업적 ID 목록, 맨 앞부터 하나씩)
  const [toastQueue, setToastQueue] = useState([])

  // 받은 업적 목록이 바뀌면, 처음 보는 업적만 안내창 줄에 추가
  useEffect(() => {
    const currentIds = game.achievements.map((entry) => entry.id)
    // 처음부터 다시 시작한 경우 등: 이제 없는 업적은 "본 것"에서도 지움
    const seen = seenAchievementsRef.current.filter((id) => currentIds.includes(id))
    const fresh = currentIds.filter((id) => !seen.includes(id))
    seenAchievementsRef.current = [...seen, ...fresh]
    if (fresh.length > 0) {
      setToastQueue((queue) => [...queue, ...fresh])
    }
  }, [game.achievements])

  const currentToast = ACHIEVEMENTS.find((achievement) => achievement.id === toastQueue[0])

  // ── 온도제어시스템 복구도와 단계 ──
  const controlSystem = game.systems[CONTROL.id] ?? { repair: 0, maxRepair: 1000 }
  const repairPercent = getRepairPercent(controlSystem)
  const controlStage = getStage(CONTROL.stages, repairPercent)
  const isOperational = controlSystem.repair >= controlSystem.maxRepair

  // ── 온도 ──
  const insideSetting = controlStage.inside ?? STATUS.inside
  const inside = useFluctuatingValue(insideSetting.base, insideSetting.range, STATUS.tempUpdateMs)
  const outside = useFluctuatingValue(STATUS.outside.base, STATUS.outside.range, STATUS.tempUpdateMs)

  // ── 식량 ──
  const rations = getRations(game.inventory, ITEMS)
  const rationStatus = getRationStatus(game.ration, RATION, now)
  const unitRation = RATION_ITEM?.food ?? 0

  // ── 신호 ──
  const linkedIds = game.signals.linked
  const linkedSectors = linkedIds.map(findSectorName)
  const nextSector = SIGNALS.sectors.find((sector) => !linkedIds.includes(sector.id))
  const selectedSectorId = signalSectorId ?? (nextSector ?? SIGNALS.sectors.at(-1)).id
  const hasReceiver = (game.inventory[SIGNALS.requiredItemId] ?? 0) > 0

  const recovery = {
    label: isOperational ? CONTROL.operationalLabel : CONTROL.recoveryLabel,
    percent: repairPercent,
  }

  // 화면을 바꿀 때는 ARCHIVE·매트릭스·신호 선택도 함께 처음으로
  function openScreen(id) {
    setOpenId(id)
    setIsArchiveOpen(false)
    setIsMatrixOpen(false)
    setSignalSectorId(null)
  }

  // 모든 화면의 틀에 공통으로 넘겨줄 값
  const layoutBase = {
    status: STATUS,
    temperatures: { inside, outside },
    rations,
    linkedSectors,
    onOpenSignal: () => openScreen(SIGNAL_ID),
    recovery,
  }

  // ── 메인 CURRENT LOG ──
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
    ...game.calibrationLog.map((entry) => ({
      time: entry.time,
      text: entry.success ? `HEAT MATRIX CALIBRATED +${entry.gained}` : 'HEAT MATRIX CALIBRATION FAILED',
    })),
    ...game.rationLog.map((entry) => ({
      time: entry.time,
      text: `EMERGENCY RATION COLLECTED +${entry.units * unitRation}`,
    })),
    ...game.signalLog.map((entry) => ({
      time: entry.time,
      text: `${findSectorName(entry.sectorId)} SIGNAL LINKED`,
    })),
  ]
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((entry) => ({ time: formatClock(entry.time), text: entry.text }))
  const mainLogs = [...LOGS, ...eventLogs]

  const archiveReadIds = game.archiveReadIds

  function markRecordRead(id) {
    dispatch({ type: 'archive/markRead', id })
  }

  function installPart(itemId) {
    dispatch({
      type: 'system/installPart',
      systemId: CONTROL.id,
      itemId,
      time: new Date().toISOString(),
    })
  }

  function startCalibration() {
    dispatch({ type: 'calibration/start' })
  }

  function finishCalibration(success) {
    dispatch({ type: 'calibration/complete', success, time: new Date().toISOString() })
  }

  function collectRation() {
    dispatch({ type: 'ration/collect', time: new Date().toISOString() })
  }

  function linkSignal(sectorId) {
    dispatch({ type: 'signal/link', sectorId, time: new Date().toISOString() })
    setSignalSectorId(sectorId)
  }

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

  function craftItem(recipeId) {
    dispatch({ type: 'craft/make', recipeId })
  }

  // ── 지금 열린 화면 그리기 ──
  function renderScreen() {
    // 신호 복구 화면
    if (openId === SIGNAL_ID) {
      const selectedSector = SIGNALS.sectors.find((sector) => sector.id === selectedSectorId)
      return (
        <DashboardLayout
          {...layoutBase}
          title={SIGNALS.title}
          onBack={() => openScreen(null)}
          side={
            <SignalTransmission
              sector={selectedSector}
              isLinked={linkedIds.includes(selectedSectorId)}
              itemName={findItemName}
            />
          }
        >
          <SignalView
            sectors={SIGNALS.sectors}
            holdSeconds={SIGNALS.holdSeconds}
            linkedIds={linkedIds}
            selectedId={selectedSectorId}
            hasReceiver={hasReceiver}
            receiverName={findItemName(SIGNALS.requiredItemId)}
            onSelect={setSignalSectorId}
            onLink={linkSignal}
          />
        </DashboardLayout>
      )
    }

    // 중앙온도제어시스템 화면
    if (openId === CONTROL_ID) {
      return (
        <DashboardLayout {...layoutBase} title={CONTROL.title} onBack={() => openScreen(null)}>
          <ControlSystemView
            config={CONTROL}
            system={controlSystem}
            inventory={game.inventory}
            items={CONTROL_ITEMS}
            currentTemperature={inside}
            calibration={game.calibration}
            hasHint={(game.inventory[CONTROL.matrix.hintItemId] ?? 0) > 0}
            isMatrixOpen={isMatrixOpen}
            onOpenMatrix={() => setIsMatrixOpen(true)}
            onInstall={installPart}
            onStartCalibration={startCalibration}
            onFinishCalibration={finishCalibration}
          />
        </DashboardLayout>
      )
    }

    // 탐사 화면
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

    // 시설을 열었을 때
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
            <RationCard
              title={RATION.title}
              units={rationStatus.units}
              maxUnits={RATION.maxUnits}
              unitRation={unitRation}
              itemName={RATION_ITEM?.name ?? RATION.itemId}
              isFull={rationStatus.isFull}
              nextInMs={rationStatus.nextInMs}
              onCollect={collectRation}
            />
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

    // 중앙 터미널
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

  return (
    <>
      {renderScreen()}

      {/* 업적 안내창: 어느 화면에서든 오른쪽 아래에 하나씩 */}
      {currentToast && (
        <AchievementToast
          key={currentToast.id}
          achievement={currentToast}
          onClose={() => setToastQueue((queue) => queue.slice(1))}
        />
      )}
    </>
  )
}

export default DashboardScreen