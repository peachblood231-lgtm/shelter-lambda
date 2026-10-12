// 화면에 숫자를 보여 줄 때 쓰는 형식 함수 모음입니다.

// 숫자를 "12.4 °C" 형태로 바꿉니다.
// toFixed(1): 항상 소수점 한 자리로 표시 (예: 12 → "12.0")
export function formatTemp(value) {
  return `${value.toFixed(1)} °C`
}

// 저장된 시각(예: "2026-10-12T10:14:00.000Z")을 "19:14" 형태로 바꿉니다.
// padStart(2, '0'): 한 자리 숫자 앞에 0을 붙임 (9 → "09")
export function formatClock(isoText) {
  const date = new Date(isoText)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}