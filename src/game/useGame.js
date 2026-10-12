import { useEffect, useReducer } from 'react'
import { gameReducer } from './gameReducer'
import { loadState, saveState } from './gameState'

// 게임 상태를 쓰는 훅입니다.
// - 처음 한 번: 브라우저에 저장된 상태를 불러옴
// - 상태가 바뀔 때마다: 브라우저에 자동 저장
// 돌려주는 값: [state(지금 상태), dispatch(명령 보내는 함수)]
function useGame() {
  // useReducer: 상태와 "명령 처리 함수(gameReducer)"를 연결합니다.
  // 세 번째 값 loadState: 처음 상태를 저장 기록에서 불러오는 함수
  const [state, dispatch] = useReducer(gameReducer, undefined, loadState)

  // 상태가 바뀔 때마다 저장
  useEffect(() => {
    saveState(state)
  }, [state])

  return [state, dispatch]
}

export default useGame