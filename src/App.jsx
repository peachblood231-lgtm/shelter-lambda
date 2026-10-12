import { useState } from 'react'
import IntroScreen from './screens/IntroScreen'
import DashboardScreen from './screens/DashboardScreen'
import useGame from './game/useGame'

// App은 "지금 어떤 화면을 보여 줄지"와 "게임 진행 상태"를 관리하는 최상위 컴포넌트입니다.
function App() {
  // screen에는 'intro'(메인화면) 또는 'dashboard'(대시보드)가 들어갑니다.
  // 처음 사이트를 열면 'intro'부터 시작합니다.
  const [screen, setScreen] = useState('intro')

  // 게임 진행 상태 (인벤토리, 복구도, 읽은 기록 등). 브라우저에 자동 저장됩니다.
  // game: 지금 상태 / dispatch: 상태를 바꾸는 명령을 보내는 함수
  const [game, dispatch] = useGame()

  // 메인화면일 때: Enter 버튼을 누르면 screen을 'dashboard'로 바꿉니다.
  if (screen === 'intro') {
    return (
      <IntroScreen
        onEnter={() => setScreen('dashboard')}
        onReset={() => dispatch({ type: 'game/reset' })}
      />
    )
  }

  // 대시보드일 때: 게임 상태와 명령 함수를 함께 넘겨줍니다.
  return <DashboardScreen game={game} dispatch={dispatch} />
}

export default App