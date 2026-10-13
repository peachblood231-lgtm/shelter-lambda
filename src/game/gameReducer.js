// 게임 상태를 바꾸는 "명령"을 처리하는 곳입니다.
// 화면에서는 상태를 직접 고치지 않고, 항상 여기로 명령을 보냅니다.
import { createInitialState } from './gameState'
import { planRationUse, hasRequirements, resolveRequirements, canCraft } from './expedition'
import { collectRation } from './ration'
import { getSectorStatus } from './signal'
import { findCrop, getGrowthSpeed, getPlotProgress, settleUnit } from './greenhouse'
import ITEMS from '../data/items.json'
import EXPEDITION from '../data/expedition.json'
import RECIPES from '../data/recipes.json'
import CONTROL from '../data/control-system.json'
import RATION from '../data/emergency-ration.json'
import SIGNALS from '../data/signals.json'
import ACHIEVEMENTS from '../data/achievements.json'

// 탐사 1회가 끝날 때 매트릭스 시도권 충전 진행도를 올립니다.
function advanceCalibration(calibration) {
  const { expeditionsPerCharge, maxCharges } = CONTROL.matrix
  const progress = calibration.progress + 1

  if (progress >= expeditionsPerCharge) {
    return { charges: Math.min(maxCharges, calibration.charges + 1), progress: 0 }
  }
  return { ...calibration, progress }
}

// 어떤 일이 일어났을 때(event) 조건이 맞는 업적을 새로 받습니다.
function unlockAchievements(achievements, event, time) {
  const unlockedIds = achievements.map((entry) => entry.id)

  const fresh = ACHIEVEMENTS.filter(
    (achievement) =>
      !unlockedIds.includes(achievement.id) &&
      Object.entries(achievement.trigger).every(([key, value]) => event[key] === value),
  )

  if (fresh.length === 0) return achievements
  return [...achievements, ...fresh.map((achievement) => ({ id: achievement.id, time }))]
}

// 온실 구역 하나를 바꾼 새 상태
function withUnit(state, unitId, unit) {
  return { ...state, greenhouse: { ...state.greenhouse, [unitId]: unit } }
}

// 온실 구역을 바꾼 뒤, 모든 구역의 조명이 꺼졌으면 업적 확인
function withUnitAndCheckDark(state, unitId, unit, time) {
  const next = withUnit(state, unitId, unit)
  const units = Object.values(next.greenhouse)
  const isAllDark = units.length > 0 && units.every((item) => !item.lightOn)

  if (!isAllDark) return next
  return {
    ...next,
    achievements: unlockAchievements(next.achievements, { type: 'greenhouse-dark' }, time ?? null),
  }
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'archive/markRead': {
      if (state.archiveReadIds.includes(action.id)) return state
      return { ...state, archiveReadIds: [...state.archiveReadIds, action.id] }
    }

    case 'system/installPart': {
      const { systemId, itemId, time } = action

      const item = ITEMS.find((candidate) => candidate.id === itemId)
      const points = item?.repair?.[systemId]
      const system = state.systems[systemId]
      const owned = state.inventory[itemId] ?? 0

      if (!item || !points || !system) return state
      if (owned < 1) return state
      if (system.repair >= system.maxRepair) return state

      const repairAfter = Math.min(system.maxRepair, system.repair + points)

      return {
        ...state,
        inventory: { ...state.inventory, [itemId]: owned - 1 },
        systems: { ...state.systems, [systemId]: { ...system, repair: repairAfter } },
        installLog: [
          ...state.installLog,
          { time, systemId, itemId, gained: repairAfter - system.repair, repairAfter },
        ],
      }
    }

    case 'expedition/complete': {
      const { locationId, foundItemIds, earlyReturn, time } = action

      const location = EXPEDITION.locations.find((candidate) => candidate.id === locationId)
      if (!location) return state
      if (!hasRequirements(location, state.inventory)) return state

      const plan = planRationUse(state.inventory, ITEMS, location.rationCost)
      if (!plan) return state

      const inventory = { ...state.inventory }

      for (const gear of resolveRequirements(location, state.inventory)) {
        inventory[gear.itemId] -= gear.count
      }
      for (const [foodId, count] of Object.entries(plan.use)) {
        inventory[foodId] -= count
      }
      for (const itemId of foundItemIds) {
        if (!ITEMS.some((item) => item.id === itemId)) continue
        inventory[itemId] = (inventory[itemId] ?? 0) + 1
      }

      return {
        ...state,
        inventory,
        calibration: advanceCalibration(state.calibration),
        achievements: unlockAchievements(state.achievements, { type: 'expedition', locationId }, time),
        expeditionLog: [
          ...state.expeditionLog,
          {
            time,
            locationId,
            found: foundItemIds,
            rationsUsed: plan.use,
            rationTotal: plan.total,
            earlyReturn: Boolean(earlyReturn),
          },
        ],
      }
    }

    case 'craft/make': {
      const recipe = RECIPES.find((candidate) => candidate.id === action.recipeId)
      if (!recipe) return state
      if (!canCraft(recipe, state.inventory)) return state

      const inventory = { ...state.inventory }
      for (const input of recipe.inputs) {
        inventory[input.itemId] -= input.count
      }
      inventory[recipe.output.itemId] = (inventory[recipe.output.itemId] ?? 0) + recipe.output.count

      return { ...state, inventory }
    }

    case 'calibration/start': {
      const system = state.systems[CONTROL.id]
      if (state.calibration.charges < 1) return state
      if (system && system.repair >= system.maxRepair) return state
      return { ...state, calibration: { ...state.calibration, charges: state.calibration.charges - 1 } }
    }

    case 'calibration/complete': {
      const { success, time } = action
      const system = state.systems[CONTROL.id]
      if (!system) return state

      const repairAfter = success
        ? Math.min(system.maxRepair, system.repair + CONTROL.matrix.reward)
        : system.repair

      return {
        ...state,
        systems: { ...state.systems, [CONTROL.id]: { ...system, repair: repairAfter } },
        calibrationLog: [
          ...state.calibrationLog,
          { time, success: Boolean(success), gained: repairAfter - system.repair },
        ],
      }
    }

    case 'ration/collect': {
      const result = collectRation(state.ration, RATION, Date.parse(action.time))
      if (!result) return state

      const owned = state.inventory[RATION.itemId] ?? 0
      return {
        ...state,
        inventory: { ...state.inventory, [RATION.itemId]: owned + result.units },
        ration: result.next,
        rationLog: [...state.rationLog, { time: action.time, units: result.units }],
      }
    }

    case 'signal/link': {
      const { sectorId, time } = action
      const sector = SIGNALS.sectors.find((candidate) => candidate.id === sectorId)
      if (!sector) return state

      const status = getSectorStatus(SIGNALS.sectors, state.signals.linked, sectorId)
      if (status !== 'weak') return state

      const inventory = { ...state.inventory }
      for (const reward of sector.rewards) {
        if (!ITEMS.some((item) => item.id === reward.itemId)) continue
        inventory[reward.itemId] = (inventory[reward.itemId] ?? 0) + reward.count
      }

      return {
        ...state,
        inventory,
        signals: { ...state.signals, linked: [...state.signals.linked, sectorId] },
        signalLog: [...state.signalLog, { time, sectorId }],
      }
    }

    // ── 온실 ──

    case 'greenhouse/toggleLight': {
      const { unitId, time } = action
      const unit = state.greenhouse[unitId]
      if (!unit || unit.isShutdown) return state

      const settled = settleUnit(unit, getGrowthSpeed(state.systems), Date.parse(time))
      return withUnitAndCheckDark(state, unitId, { ...settled, lightOn: !unit.lightOn }, time)
    }

    case 'greenhouse/toggleShutdown': {
      const unit = state.greenhouse[action.unitId]
      if (!unit) return state

      if (unit.isShutdown) {
        return withUnit(state, action.unitId, { ...unit, isShutdown: false })
      }
      return withUnitAndCheckDark(
        state,
        action.unitId,
        { ...unit, isShutdown: true, lightOn: false, plot: null },
        action.time,
      )
    }

    case 'greenhouse/plant': {
      const { unitId, seedId, time } = action
      const unit = state.greenhouse[unitId]
      const owned = state.inventory[seedId] ?? 0

      if (!unit || unit.isShutdown || unit.plot) return state
      if (!findCrop(seedId) || owned < 1) return state

      return {
        ...withUnit(state, unitId, { ...unit, plot: { seedId, progressMs: 0, updatedAt: time } }),
        inventory: { ...state.inventory, [seedId]: owned - 1 },
      }
    }

    case 'greenhouse/harvest': {
      const { unitId, time } = action
      const unit = state.greenhouse[unitId]
      if (!unit?.plot) return state

      const progress = getPlotProgress(unit, getGrowthSpeed(state.systems), Date.parse(time))
      if (!progress.isReady || !progress.crop) return state

      const inventory = { ...state.inventory }
      for (const item of progress.crop.harvest) {
        inventory[item.itemId] = (inventory[item.itemId] ?? 0) + item.count
      }

      const seedId = unit.plot.seedId
      return {
        ...withUnit(state, unitId, { ...unit, plot: null }),
        inventory,
        harvestLog: [...state.harvestLog, { time, unitId, seedId, harvest: progress.crop.harvest }],
        achievements: unlockAchievements(state.achievements, { type: 'harvest', seedId }, time),
      }
    }

    // ── 레지덴셜 ──

    // SECTOR 방 배치 저장. 방이 3개 이하로 모이면 업적
    // action: { key, blocks, time? }
    case 'sector/saveLayout': {
      if (!action.key || !Array.isArray(action.blocks)) return state
      const next = { ...state, sectorRooms: { ...state.sectorRooms, [action.key]: action.blocks } }

      if (action.blocks.length > 0 && action.blocks.length <= 3) {
        return {
          ...next,
          achievements: unlockAchievements(next.achievements, { type: 'sector-consolidated' }, action.time ?? null),
        }
      }
      return next
    }

    case 'game/reset':
      return createInitialState()

    default:
      return state
  }
}