// 화면에 숫자를 보여 줄 때 쓰는 형식 함수 모음입니다.

// 두 자리로 맞추기 (9 → "09")
function pad(number) {
  return String(number).padStart(2, '0')
}

// 숫자를 "12.4 °C" 형태로 바꿉니다. (항상 소수점 한 자리)
export function formatTemp(value) {
  return `${value.toFixed(1)} °C`
}

// 저장된 시각(예: "2026-10-12T10:14:00.000Z")을 "19:14" 형태로 바꿉니다.
export function formatClock(isoText) {
  const date = new Date(isoText)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// 남은 시간(밀리초)을 "07:12" (분:초) 형태로 바꿉니다.
// 올림(ceil)을 써서 0초가 되기 전까지는 "00:01"로 보이게 합니다.
export function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${pad(minutes)}:${pad(seconds)}`
}