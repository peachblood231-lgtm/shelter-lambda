// 게임 상태를 바꾸는 "명령"을 처리하는 곳입니다.
// 화면에서는 상태를 직접 고치지 않고, 항상 여기로 명령을 보냅니다.
import { createInitialState } from './gameState'
import { planRationUse, hasRequirements, resolveRequirements, canCraft } from './expedition'
import { collectRation } from './ration'
import { getSectorStatus } from './signal'
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
// event 예: { type: 'expedition', locationId: 'outside' }
// 이미 받은 업적은 다시 받지 않습니다.
function unlockAchievements(achievements, event, time) {
  const unlockedIds = achievements.map((entry) => entry.id)

  const fresh = ACHIEVEMENTS.filter((achievement) => {
    if (unlockedIds.includes(achievement.id)) return false
    const { trigger } = achievement
    if (trigger.type !== event.type) return false
    if (trigger.locationId && trigger.locationId !== event.locationId) return false
    return true
  })

  if (fresh.length === 0) return achievements
  return [...achievements, ...fresh.map((achievement) => ({ id: achievement.id, time }))]
}

export function gameReducer(state, action) {
  switch (action.type) {
    // 아카이브 기록을 읽음으로 표시
    case 'archive/markRead': {
      if (state.archiveReadIds.includes(action.id)) return state
      return { ...state, archiveReadIds: [...state.archiveReadIds, action.id] }
    }

    // 시스템에 부품 1개 투입
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

    // 탐사 완료: 차감 + 획득 + 기록 + 시도권 충전 + 업적 확인
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

    // 조합
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

    // 매트릭스 시작: 시도권 1개 사용
    case 'calibration/start': {
      const system = state.systems[CONTROL.id]
      if (state.calibration.charges < 1) return state
      if (system && system.repair >= system.maxRepair) return state
      return { ...state, calibration: { ...state.calibration, charges: state.calibration.charges - 1 } }
    }

    // 매트릭스 끝
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

    // 비상 배급 받기
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

    // 신호 연결: 연결 기록 + 보급품 추가
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

    // 모든 진행 기록을 처음 상태로 되돌림
    case 'game/reset':
      return createInitialState()

    default:
      return state
  }
}