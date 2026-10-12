// 게임 상태를 바꾸는 "명령"을 처리하는 곳입니다.
// 화면에서는 상태를 직접 고치지 않고, 항상 여기로 명령을 보냅니다.
// 이렇게 한곳에서만 바꾸면, 여러 값을 동시에 바꿔야 할 때도 "한 번에" 처리할 수 있습니다.
import { createInitialState } from './gameState'
import { planRationUse, hasRequirements, resolveRequirements, canCraft } from './expedition'
import ITEMS from '../data/items.json'
import EXPEDITION from '../data/expedition.json'
import RECIPES from '../data/recipes.json'

export function gameReducer(state, action) {
  switch (action.type) {
    // 아카이브 기록을 읽음으로 표시
    case 'archive/markRead': {
      if (state.archiveReadIds.includes(action.id)) return state
      return { ...state, archiveReadIds: [...state.archiveReadIds, action.id] }
    }

    // 시스템에 부품 1개 투입: 인벤토리 차감 + 복구도 증가 + 투입 내역 기록
    // action: { systemId, itemId, time }
    case 'system/installPart': {
      const { systemId, itemId, time } = action

      const item = ITEMS.find((candidate) => candidate.id === itemId)
      const points = item?.repair?.[systemId]
      const system = state.systems[systemId]
      const owned = state.inventory[itemId] ?? 0

      if (!item) return state
      if (!points) return state
      if (!system) return state
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

    // 탐사 완료: 장비·식량 차감 + 얻은 아이템 추가 + 기록
    // action: { locationId, foundItemIds(미리 굴린 결과), earlyReturn, time }
    case 'expedition/complete': {
      const { locationId, foundItemIds, earlyReturn, time } = action

      const location = EXPEDITION.locations.find((candidate) => candidate.id === locationId)
      if (!location) return state
      if (!hasRequirements(location, state.inventory)) return state

      const plan = planRationUse(state.inventory, ITEMS, location.rationCost)
      if (!plan) return state

      const inventory = { ...state.inventory }

      // ① 장비 소모 (방한복이 있으면 방한복, 없으면 덧댄 방한복)
      for (const gear of resolveRequirements(location, state.inventory)) {
        inventory[gear.itemId] -= gear.count
      }

      // ② 식량 소모
      for (const [foodId, count] of Object.entries(plan.use)) {
        inventory[foodId] -= count
      }

      // ③ 얻은 아이템 추가 (등록되지 않은 아이템은 무시)
      for (const itemId of foundItemIds) {
        if (!ITEMS.some((item) => item.id === itemId)) continue
        inventory[itemId] = (inventory[itemId] ?? 0) + 1
      }

      return {
        ...state,
        inventory,
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

    // 조합: 재료 차감 + 결과물 추가를 한 번에
    // action: { recipeId }
    case 'craft/make': {
      const recipe = RECIPES.find((candidate) => candidate.id === action.recipeId)
      if (!recipe) return state
      if (!canCraft(recipe, state.inventory)) return state // 재료 부족

      const inventory = { ...state.inventory }
      for (const input of recipe.inputs) {
        inventory[input.itemId] -= input.count
      }
      inventory[recipe.output.itemId] = (inventory[recipe.output.itemId] ?? 0) + recipe.output.count

      return { ...state, inventory }
    }

    // 모든 진행 기록을 처음 상태로 되돌림
    case 'game/reset':
      return createInitialState()

    default:
      return state
  }
}