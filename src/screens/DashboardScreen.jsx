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
import { getGrowthSpeed, getPlotProgress } from '../game/greenhouse'
import { useLanguage } from '../i18n/language'
import { pick, translate } from '../i18n/strings'

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
import CROPS from '../data/greenhouse-crops.json'

const STATUS = DASHBOARD.status
const LOGS = DASHBOARD.logs

const CONTROL_ITEMS = ITEMS.filter((item) => item.repair?.[CONTROL.id])
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

// 지금 시각 (저장용 글자)
function nowIso() {
  return new Date().toISOString()
}

// 대시보드 화면
// - game: 게임 진행 상태 / dispatch: 상태를 바꾸는 명령을 보내는 함수
function DashboardScreen({ game, dispatch }) {
  const [openId, setOpenId] = useState(null)
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const [isMatrixOpen, setIsMatrixOpen] = useState(false)
  const [signalSectorId, setSignalSectorId] = useState(null)

  // 지금 언어와 번역 함수 (언어가 바뀌면 화면이 다시 그려짐)
  const lang = useLanguage()
  const t = (key, vars) => translate(lang, key, vars)

  // 1초마다 갱신되는 현재 시각 (배급·재배 남은 시간 표시용)
  const now = useNow(1000)

  // ── 업적 안내창 ──
  const seenAchievementsRef = useRef(game.achievements.map((entry) => entry.id))
  const [toastQueue, setToastQueue] = useState([])

  useEffect(() => {
    const currentIds = game.achievements.map((entry) => entry.id)
    const seen = seenAchievementsRef.current.filter((id) => currentIds.includes(id))
    const fresh = currentIds.filter((id) => !seen.includes(id))
    seenAchievementsRef.current = [...seen, ...fresh]
    if (fresh.length > 0) {
      setToastQueue((queue) => [...queue, ...fresh])
    }
  }, [game.achievements])

  const currentToast = ACHIEVEMENTS.find((achievement) => achievement.id === toastQueue[0])

  // ── 온도제어시스템 ──
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

  // ── 온실 ──
  const growthSpeed = getGrowthSpeed(game.systems)
  const greenhouseSeeds = CROPS.crops
    .filter((crop) => (game.inventory[crop.seedId] ?? 0) > 0)
    .map((crop) => ({
      seedId: crop.seedId,
      name: findItemName(crop.seedId),
      owned: game.inventory[crop.seedId],
      minutes: crop.minutes,
      harvest: crop.harvest.map((item) => ({ name: findItemName(item.itemId), count: item.count })),
    }))

  function getUnitProps(unit) {
    const unitState = game.greenhouse[unit.id] ?? { lightOn: unit.lightOn, isShutdown: false, plot: null }
    return {
      state: unitState,
      progress: getPlotProgress(unitState, growthSpeed, now),
      seeds: greenhouseSeeds,
      speed: growthSpeed,
      itemName: findItemName,
      onToggleLight: () => dispatch({ type: 'greenhouse/toggleLight', unitId: unit.id, time: nowIso() }),
      onToggleShutdown: () => dispatch({ type: 'greenhouse/toggleShutdown', unitId: unit.id, time: nowIso() }),
      onPlant: (seedId) => dispatch({ type: 'greenhouse/plant', unitId: unit.id, seedId, time: nowIso() }),
      onHarvest: () => dispatch({ type: 'greenhouse/harvest', unitId: unit.id, time: nowIso() }),
    }
  }

  // ── 레지덴셜 ──
  const residentialProps = {
    repairPercent,
    layouts: game.sectorRooms ?? {},
    onSaveLayout: (key, blocks) => dispatch({ type: 'sector/saveLayout', key, blocks }),
  }

  // ── 다이닝홀 로그: 비상 배급 기록 ──
  const rationDistributionLogs = game.rationLog.map((entry) => ({
    time: formatClock(entry.time),
    text: t('log.rationDistributed', {
      item: RATION_ITEM?.name ?? RATION.itemId,
      count: entry.units,
      amount: entry.units * unitRation,
    }),
  }))

  // ── 하단 진행 바 ──
  const recovery = {
    label: isOperational ? t('recovery.operational') : t('recovery.inProgress'),
    percent: repairPercent,
  }

  function openScreen(id) {
    setOpenId(id)
    setIsArchiveOpen(false)
    setIsMatrixOpen(false)
    setSignalSectorId(null)
  }

  const layoutBase = {
    status: STATUS,
    temperatures: { inside, outside },
    rations,
    linkedSectors,
    onOpenSignal: () => openScreen(SIGNAL_ID),
    recovery,
  }

  // ── 메인 CURRENT LOG ──
  const baseLogs = LOGS.map((log) => ({ time: log.time, text: pick(log.text, lang) }))

  const eventLogs = [
    ...game.installLog.map((entry) => ({
      time: entry.time,
      text: t('log.installed', { item: findItemName(entry.itemId), points: entry.gained }),
    })),
    ...game.expeditionLog.map((entry) => ({
      time: entry.time,
      text: t(entry.earlyReturn ? 'log.expeditionEarly' : 'log.expedition', {
        location: findLocationName(entry.locationId),
        count: entry.found.length,
      }),
    })),
    ...game.calibrationLog.map((entry) => ({
      time: entry.time,
      text: entry.success ? t('log.calibrated', { points: entry.gained }) : t('log.calibrationFailed'),
    })),
    ...game.rationLog.map((entry) => ({
      time: entry.time,
      text: t('log.rationCollected', { amount: entry.units * unitRation }),
    })),
    ...game.signalLog.map((entry) => ({
      time: entry.time,
      text: t('log.signalLinked', { sector: findSectorName(entry.sectorId) }),
    })),
    ...game.harvestLog.map((entry) => ({
      time: entry.time,
      text: t('log.harvest', {
        items: entry.harvest.map((item) => `${findItemName(item.itemId)} ×${item.count}`).join(', '),
      }),
    })),
  ]
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((entry) => ({ time: formatClock(entry.time), text: entry.text }))
  const mainLogs = [...baseLogs, ...eventLogs]

  const archiveReadIds = game.archiveReadIds

  function markRecordRead(id) {
    dispatch({ type: 'archive/markRead', id })
  }

  function installPart(itemId) {
    dispatch({ type: 'system/installPart', systemId: CONTROL.id, itemId, time: nowIso() })
  }

  function startCalibration() {
    dispatch({ type: 'calibration/start' })
  }

  function finishCalibration(success) {
    dispatch({ type: 'calibration/complete', success, time: nowIso() })
  }

  function collectRation() {
    dispatch({ type: 'ration/collect', time: nowIso() })
  }

  function linkSignal(sectorId) {
    dispatch({ type: 'signal/link', sectorId, time: nowIso() })
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
      time: nowIso(),
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
    dispatch({ type: 'craft/make', recipeId, time: nowIso() })
  }

  // ── 지금 열린 화면 그리기 ──
  function renderScreen() {
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
            <LogPanel logs={[...(openFacility.logs ?? []), ...rationDistributionLogs]} />
            <ArchiveCard onOpen={() => setIsArchiveOpen(true)} />
          </>
        )
      }

      return (
        <DashboardLayout {...layoutBase} title={openFacility.name} side={side} onBack={() => openScreen(null)}>
          <FacilityDetail
            facility={openFacility}
            getUnitProps={getUnitProps}
            residentialProps={residentialProps}
          />
        </DashboardLayout>
      )
    }

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