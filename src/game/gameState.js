// 게임 진행 상태를 "만들고, 저장하고, 불러오는" 함수를 모아 둔 파일입니다.
import START from '../data/game-start.json'
import FACILITIES from '../data/facilities.json'

const STORAGE_KEY = 'shelter-lambda-save'
const SAVE_VERSION = 1

// 온실 재배 구역의 처음 상태 { 구역ID: { lightOn, isShutdown, plot } }
function createGreenhouseState() {
  const units = FACILITIES.flatMap((facility) => facility.units ?? [])
  return Object.fromEntries(
    units.map((unit) => [unit.id, { lightOn: Boolean(unit.lightOn), isShutdown: false, plot: null }]),
  )
}

// 처음 시작할 때의 상태를 새로 만듭니다.
export function createInitialState() {
  return {
    version: SAVE_VERSION,
    inventory: structuredClone(START.inventory),     // 보유 아이템 { 아이템ID: 수량 }
    systems: structuredClone(START.systems),         // 시스템별 복구도
    calibration: structuredClone(START.calibration), // 열 분배 매트릭스 시도권
    ration: {                                         // 다이닝홀 비상 배급
      stock: START.ration.stock,
      lastTick: new Date().toISOString(),
    },
    greenhouse: createGreenhouseState(),              // 온실 구역별 조명·정지·작물
    sectorRooms: {},                                  // 레지덴셜 SECTOR별 방 배치 { 'B5-A': [방...] }
    signals: { linked: [] },                          // 신호가 연결된 구역 ID 목록
    achievements: [],                                 // 받은 업적 [{ id, time }]
    installLog: [],                                   // 부품 투입 내역
    expeditionLog: [],                                // 탐사 내역
    calibrationLog: [],                               // 매트릭스 퍼즐 내역
    rationLog: [],                                    // 배급 받은 내역
    signalLog: [],                                    // 신호 연결 내역
    harvestLog: [],                                   // 온실 수확 내역
    archiveReadIds: [],                               // 읽은 아카이브 기록 ID
  }
}

// 브라우저에 저장된 상태를 불러옵니다. 없거나 망가졌으면 처음 상태로 시작합니다.
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()

    const saved = JSON.parse(raw)
    if (saved.version !== SAVE_VERSION) return createInitialState()

    // 예전 저장 기록에 없는 항목은 기본값으로 채워짐
    return { ...createInitialState(), ...saved }
  } catch {
    return createInitialState()
  }
}

// 지금 상태를 브라우저에 저장합니다.
export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 저장소를 쓸 수 없으면 조용히 넘어갑니다.
  }
}