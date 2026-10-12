import { useState } from 'react'
import IntroScreen from './screens/introscreen'
import DashboardScreen from './screens/DashboardScreen'

// App은 "지금 어떤 화면을 보여 줄지"만 결정하는 최상위 컴포넌트입니다.
function App() {
  // screen에는 'intro'(메인화면) 또는 'dashboard'(대시보드)가 들어갑니다.
  // 처음 사이트를 열면 'intro'부터 시작합니다.
  const [screen, setScreen] = useState('intro')

  // 메인화면일 때: Enter 버튼을 누르면 screen을 'dashboard'로 바꿉니다.
  if (screen === 'intro') {
    return <IntroScreen onEnter={() => setScreen('dashboard')} />
  }

  // 대시보드일 때: 돌아가기 버튼을 누르면 다시 'intro'로 바꿉니다.
  return <DashboardScreen onBack={() => setScreen('intro')} />
}

export default App