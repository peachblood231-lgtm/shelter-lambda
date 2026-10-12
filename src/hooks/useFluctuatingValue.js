import { useEffect, useState } from 'react'

// 기준값(base)에서 ±range 사이의 랜덤한 숫자를 하나 만듭니다.
// 예: base 12.4, range 1.5 → 10.9 ~ 13.9 사이의 숫자
function randomAround(base, range) {
  // Math.random()은 0~1 사이 숫자 → 이를 -1~1 사이로 바꾼 뒤 range를 곱합니다.
  const offset = (Math.random() * 2 - 1) * range
  // 소수점 첫째 자리까지만 남깁니다. (예: 12.3456 → 12.3)
  return Math.round((base + offset) * 10) / 10
}

// "일정 시간마다 랜덤하게 바뀌는 숫자"를 돌려주는 훅입니다.
// - base: 기준값
// - range: 기준값에서 위아래로 얼마나 벗어날 수 있는지
// - intervalMs: 몇 밀리초마다 바꿀지 (1000 = 1초)
function useFluctuatingValue(base, range, intervalMs) {
  // 처음에는 기준값 그대로 보여 줍니다.
  const [value, setValue] = useState(base)

  useEffect(() => {
    // intervalMs마다 새 랜덤 값을 넣는 타이머를 시작합니다.
    const timer = setInterval(() => {
      setValue(randomAround(base, range))
    }, intervalMs)

    // 화면이 사라질 때(예: 메인화면으로 돌아갈 때) 타이머를 꼭 정리합니다.
    // 정리하지 않으면 보이지 않는 곳에서 타이머가 계속 돌아갑니다.
    return () => clearInterval(timer)
  }, [base, range, intervalMs])

  return value
}

export default useFluctuatingValue