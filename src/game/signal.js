// 신호 복구 게임 계산입니다.
// 파형: y = 진폭 × sin(2π × 주파수 × x + 위상), x는 0~1

// 화면에 그릴 점의 개수
export const SAMPLES = 160

// 파형의 점들(y값 목록)을 만듭니다.
export function sampleWave({ freq, amp, phase }, samples = SAMPLES) {
  const radians = (phase * Math.PI) / 180
  return Array.from({ length: samples }, (_, i) => {
    const x = i / (samples - 1)
    return amp * Math.sin(2 * Math.PI * freq * x + radians)
  })
}

// 두 파형이 얼마나 겹치는지 0~1로 계산합니다.
// 완전히 같으면 1, 전혀 관계없거나 반대 모양이면 0
export function matchScore(a, b) {
  let diff = 0
  let norm = 0
  for (let i = 0; i < a.length; i += 1) {
    diff += (a[i] - b[i]) ** 2
    norm += a[i] ** 2 + b[i] ** 2
  }
  if (norm === 0) return 0
  return Math.min(1, Math.max(0, 1 - diff / norm))
}

// 목표 파형을 흔들 노이즈 (보이는 모양만 흔들고, 점수 계산에는 쓰지 않음)
export function makeNoise(level, samples = SAMPLES) {
  return Array.from({ length: samples }, () => (Math.random() * 2 - 1) * level)
}

// 구역 상태: 'linked'(연결됨) / 'weak'(지금 시도 가능) / 'locked'(앞 구역을 먼저 연결해야 함)
export function getSectorStatus(sectors, linkedIds, sectorId) {
  if (linkedIds.includes(sectorId)) return 'linked'
  const index = sectors.findIndex((sector) => sector.id === sectorId)
  const previousAllLinked = sectors.slice(0, index).every((sector) => linkedIds.includes(sector.id))
  return previousAllLinked ? 'weak' : 'locked'
}