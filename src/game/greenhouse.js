// 온실 재배 계산입니다.
// 구역마다 저장되는 값: { lightOn, isShutdown, plot }
// plot(심은 작물): { seedId, progressMs: 지금까지 자란 양, updatedAt: 그 계산 시각 } / 비었으면 null
// 조명이 켜져 있고 정지 상태가 아닐 때만 시간이 흐른 만큼 자랍니다.
import CROPS from '../data/greenhouse-crops.json'
import CONTROL from '../data/control-system.json'
import { getStage, getRepairPercent } from '../utils/controlStage'

const MINUTE = 60 * 1000

// 씨앗 ID로 작물 정보 찾기
export function findCrop(seedId) {
  return CROPS.crops.find((crop) => crop.seedId === seedId)
}

// 온도 복구 단계에 따른 성장 속도 (1 = 기본)
export function getGrowthSpeed(systems) {
  const system = systems[CONTROL.id]
  if (!system) return 1
  const stage = getStage(CONTROL.stages, getRepairPercent(system))
  return CROPS.speedByStage[stage.label] ?? 1
}

// 지금 자라고 있는지 (작물 있음 + 조명 켜짐 + 정지 아님)
export function isGrowing(unit) {
  return Boolean(unit.plot) && unit.lightOn && !unit.isShutdown
}

// 작물 진행 상황
// 돌려주는 값: { crop, ratio(0~1), remainingMs(실제 남은 시간), isReady, isGrowing } / 작물이 없으면 null
export function getPlotProgress(unit, speed, nowMs) {
  if (!unit.plot) return null

  const crop = findCrop(unit.plot.seedId)
  const totalMs = (crop?.minutes ?? 1) * MINUTE
  const growing = isGrowing(unit)
  const running = growing ? Math.max(0, nowMs - Date.parse(unit.plot.updatedAt)) * speed : 0
  const progressMs = Math.min(totalMs, unit.plot.progressMs + running)

  return {
    crop,
    progressMs,
    ratio: progressMs / totalMs,
    remainingMs: Math.max(0, (totalMs - progressMs) / speed),
    isReady: progressMs >= totalMs,
    isGrowing: growing,
  }
}

// 조명을 바꾸기 직전에 "지금까지 자란 양"을 확정해 둡니다.
// (꺼진 동안은 멈추고, 다시 켜면 그 시점부터 이어서 자라게)
export function settleUnit(unit, speed, nowMs) {
  if (!unit.plot) return unit
  const progress = getPlotProgress(unit, speed, nowMs)
  return {
    ...unit,
    plot: { ...unit.plot, progressMs: progress.progressMs, updatedAt: new Date(nowMs).toISOString() },
  }
}