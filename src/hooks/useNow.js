import { useEffect, useState } from 'react'

// 현재 시각(밀리초)을 일정 간격마다 새로 알려 주는 훅입니다.
// 남은 시간(카운트다운)을 매초 다시 그릴 때 씁니다.
// - intervalMs: 갱신 간격 (기본 1000 = 1초)
function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    // 화면을 떠나면 타이머 정리
    return () => clearInterval(timer)
  }, [intervalMs])

  return now
}

export default useNow