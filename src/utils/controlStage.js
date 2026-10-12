// 복구 퍼센트에 맞는 단계를 찾습니다.
// 대시보드(실내 온도 계산)와 제어시스템 화면(CONDITION 표시)에서 같이 씁니다.
//
// 예: 45% → min이 45 이하인 단계 중 마지막 = INITIALIZING(min 25)
export function getStage(stages, percent) {
  let current = stages[0]
  for (const stage of stages) {
    if (percent >= stage.min) current = stage
  }
  return current
}

// 복구도 점수를 퍼센트(0~100, 소수점 버림)로 바꿉니다.
export function getRepairPercent(system) {
  return Math.floor((system.repair / system.maxRepair) * 100)
}