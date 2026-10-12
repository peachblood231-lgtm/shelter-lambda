// 게임 상태를 바꾸는 "명령"을 처리하는 곳입니다.
// 화면에서는 상태를 직접 고치지 않고, 항상 여기로 명령을 보냅니다.
// 예: dispatch({ type: 'archive/markRead', id: 'DH-003' })
//
// 이렇게 한곳에서만 바꾸면, 여러 값을 동시에 바꿔야 할 때도
// 중간에 어긋나는 일 없이 "한 번에" 처리할 수 있습니다.
import { createInitialState } from './gameState'
import ITEMS from '../data/items.json'

export function gameReducer(state, action) {
  switch (action.type) {
    // 아카이브 기록을 읽음으로 표시
    case 'archive/markRead': {
      // 이미 읽은 기록이면 아무것도 바꾸지 않음 (같은 state를 돌려주면 저장도 다시 안 함)
      if (state.archiveReadIds.includes(action.id)) return state
      return { ...state, archiveReadIds: [...state.archiveReadIds, action.id] }
    }

    // 시스템에 부품 1개 투입: 인벤토리 차감 + 복구도 증가 + 투입 내역 기록을 "한 번에" 처리
    // action: { systemId, itemId, time }
    case 'system/installPart': {
      const { systemId, itemId, time } = action

      const item = ITEMS.find((candidate) => candidate.id === itemId)
      const points = item?.repair?.[systemId] // 이 시스템에서의 복구 점수 (없으면 undefined)
      const system = state.systems[systemId]
      const owned = state.inventory[itemId] ?? 0

      // 하나라도 맞지 않으면 아무것도 바꾸지 않음 (상태 불일치 방지)
      if (!item) return state                               // 등록되지 않은 아이템
      if (!points) return state                             // 이 시스템에 쓸 수 없는 아이템
      if (!system) return state                             // 없는 시스템
      if (owned < 1) return state                           // 수량 부족
      if (system.repair >= system.maxRepair) return state   // 이미 복구 완료

      // 복구도는 만점(maxRepair)을 넘지 않음
      const repairAfter = Math.min(system.maxRepair, system.repair + points)

      return {
        ...state,
        // ① 인벤토리에서 1개 빼기
        inventory: { ...state.inventory, [itemId]: owned - 1 },
        // ② 복구도 올리기
        systems: { ...state.systems, [systemId]: { ...system, repair: repairAfter } },
        // ③ 투입 내역 남기기
        installLog: [
          ...state.installLog,
          { time, systemId, itemId, gained: repairAfter - system.repair, repairAfter },
        ],
      }
    }

    // 모든 진행 기록을 처음 상태로 되돌림
    case 'game/reset':
      return createInitialState()

    // 모르는 명령은 무시
    default:
      return state
  }
}