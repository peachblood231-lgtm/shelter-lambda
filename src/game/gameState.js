// 게임 진행 상태를 "만들고, 저장하고, 불러오는" 함수를 모아 둔 파일입니다.
import START from '../data/game-start.json'

// 브라우저 저장소에 쓸 이름표
const STORAGE_KEY = 'shelter-lambda-save'

// 저장 형식 버전. 나중에 저장 구조를 크게 바꾸면 숫자를 올려서
// 예전 형식의 저장 기록은 버리고 새로 시작하게 합니다.
const SAVE_VERSION = 1

// 처음 시작할 때의 상태를 새로 만듭니다.
// structuredClone: JSON 데이터를 "복사본"으로 만들어서, 게임 중 바뀌어도 원본 JSON은 그대로 둡니다.
export function createInitialState() {
  return {
    version: SAVE_VERSION,
    inventory: structuredClone(START.inventory), // 보유 아이템 { 아이템ID: 수량 }
    systems: structuredClone(START.systems),     // 시스템별 복구도
    installLog: [],                               // 부품 투입 내역
    expeditionLog: [],                            // 탐사 내역
    archiveReadIds: [],                           // 읽은 아카이브 기록 ID
  }
}

// 브라우저에 저장된 상태를 불러옵니다. 없거나 망가졌으면 처음 상태로 시작합니다.
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()

    const saved = JSON.parse(raw)

    // 저장 형식이 다르면(예전 버전) 처음부터
    if (saved.version !== SAVE_VERSION) return createInitialState()

    // 처음 상태 위에 저장된 값을 덮어씌웁니다.
    // (새 항목이 추가돼도, 예전 저장 기록에 없는 항목은 기본값으로 채워짐)
    return { ...createInitialState(), ...saved }
  } catch {
    // 저장소를 쓸 수 없거나(개인정보 보호 모드 등) 기록이 망가진 경우
    return createInitialState()
  }
}

// 지금 상태를 브라우저에 저장합니다.
export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 저장소를 쓸 수 없으면 조용히 넘어갑니다. (게임은 계속 진행 가능, 새로고침하면 사라짐)
  }
}