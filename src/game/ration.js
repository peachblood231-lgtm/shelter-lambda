// 다이닝홀 비상 배급의 시간 계산입니다.
// 저장되는 값: { stock: 마지막 계산 때 쌓여 있던 회분, lastTick: 그 계산 시각 }
// 지금 쌓인 양은 "마지막 계산 이후 흐른 시간"으로 그때그때 계산합니다.
// → 사이트를 닫아 둬도 다시 열면 그동안 쌓인 만큼 보입니다.

const MINUTE = 60 * 1000

// 지금 배급 상태
// 돌려주는 값: { units: 지금 쌓인 회분, isFull, nextInMs: 다음 배급까지 남은 밀리초, ticks: 흐른 간격 수 }
export function getRationStatus(ration, config, nowMs) {
  const interval = config.intervalMinutes * MINUTE
  const elapsed = Math.max(0, nowMs - Date.parse(ration.lastTick))
  const ticks = Math.floor(elapsed / interval)

  const units = Math.min(config.maxUnits, ration.stock + ticks * config.unitsPerInterval)
  const isFull = units >= config.maxUnits
  const nextInMs = isFull ? 0 : interval - (elapsed % interval)

  return { units, isFull, nextInMs, ticks }
}

// 배급 받기: 쌓인 회분을 모두 꺼내고, 다음 계산 기준을 정합니다.
// - 가득 차 있었으면: 지금부터 다시 시작
// - 아니면: 진행 중이던 시간은 이어서 (받는다고 손해 보지 않게)
// 돌려주는 값: { units: 받은 회분, next: 새 저장 값 } / 받을 게 없으면 null
export function collectRation(ration, config, nowMs) {
  const status = getRationStatus(ration, config, nowMs)
  if (status.units < 1) return null

  const interval = config.intervalMinutes * MINUTE
  const lastTick = status.isFull
    ? new Date(nowMs).toISOString()
    : new Date(Date.parse(ration.lastTick) + status.ticks * interval).toISOString()

  return { units: status.units, next: { stock: 0, lastTick } }
}