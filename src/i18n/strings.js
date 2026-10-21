// 화면 글자 번역 사전입니다.
// 사용법: const t = useT()  →  t('intro.reset')  /  t('log.installed', { item: 'FUSE', points: 5 })
import { useLanguage } from './language'

export const STRINGS = {
  // ── 공용 ──
  'lang.label': { en: 'Language', ko: '언어' },
  'common.cancel': { en: 'CANCEL', ko: '취소' },
  'common.close': { en: 'Close', ko: '닫기' },

  // ── 인트로 ──
  'intro.enter': { en: 'Enter the SHELTER', ko: '셸터로 들어가기' },
  'intro.emblemAlt': { en: 'Shelter Lambda facility blueprint', ko: 'Shelter Lambda 시설 도면' },
  'intro.reset': { en: 'RESET DATA', ko: '데이터 초기화' },
  'intro.resetDone': { en: 'SAVE DATA CLEARED', ko: '초기화 완료' },
  'intro.resetConfirm': {
    en: 'Erase all saved progress (records read, inventory, repair) and start over?',
    ko: '저장된 진행 기록(읽은 문서, 인벤토리, 복구도)을 모두 지우고 처음 상태로 되돌릴까요?',
  },

  // ── 오른쪽 위 상태 표시 ──
  'readout.label': { en: 'Shelter status', ko: '시설 상태' },
  'readout.inside': { en: 'INSIDE', ko: '실내' },
  'readout.outside': { en: 'OUTSIDE', ko: '외부' },
  'readout.residents': { en: 'CURRENT RESIDENTS', ko: '거주 인원' },
  'readout.rations': { en: 'RATIONS', ko: '식량' },
  'readout.linked': { en: 'LINKED', ko: '연결됨' },
  'readout.noSignal': { en: 'No signal', ko: '신호 없음' },
  'readout.signal': { en: 'SIGNAL ↗', ko: '신호 복구 ↗' },
  'readout.signalAria': { en: 'Open signal recovery', ko: '신호 복구 화면 열기' },

  // ── 하단 진행 바 ──
  'recovery.inProgress': { en: 'TEMPERATURE SYSTEM RECOVERY IN PROGRESS', ko: '온도 시스템 복구 진행 중' },
  'recovery.operational': { en: 'TEMPERATURE SYSTEM OPERATIONAL', ko: '온도 시스템 정상 가동' },

  // ── 로그 ──
  'log.installed': { en: '{item} INSTALLED +{points}', ko: '{item} 투입 +{points}' },
  'log.expedition': {
    en: '{location} EXPEDITION RETURNED · {count} ITEMS',
    ko: '{location} 탐사 귀환 · 아이템 {count}개',
  },
  'log.expeditionEarly': {
    en: '{location} EXPEDITION RETURNED EARLY · {count} ITEMS',
    ko: '{location} 탐사 조기 귀환 · 아이템 {count}개',
  },
  'log.calibrated': { en: 'HEAT MATRIX CALIBRATED +{points}', ko: '열 분배 매트릭스 조율 +{points}' },
  'log.calibrationFailed': { en: 'HEAT MATRIX CALIBRATION FAILED', ko: '열 분배 매트릭스 조율 실패' },
  'log.rationCollected': { en: 'EMERGENCY RATION COLLECTED +{amount}', ko: '비상 배급 수령 +{amount}' },
  'log.rationDistributed': {
    en: 'EMERGENCY RATION DISTRIBUTED · {item} ×{count} (+{amount})',
    ko: '비상 배급 지급 · {item} ×{count} (+{amount})',
  },
  'log.signalLinked': { en: '{sector} SIGNAL LINKED', ko: '{sector} 신호 연결' },
  'log.harvest': { en: 'GREENHOUSE HARVEST · {items}', ko: '온실 수확 · {items}' },

  // ── 업적 안내창 ──
  'achievement.unlocked': { en: 'ACHIEVEMENT UNLOCKED', ko: '업적 달성' },
  'achievement.close': { en: 'Close achievement notice', ko: '업적 안내 닫기' },

  // ── 중앙온도제어시스템 ──
  'stage.OFFLINE': { en: 'OFFLINE', ko: '오프라인' },
  'stage.INITIALIZING': { en: 'INITIALIZING', ko: '초기화 중' },
  'stage.PARTIAL RECOVERY': { en: 'PARTIAL RECOVERY', ko: '부분 복구' },
  'stage.STABILIZING': { en: 'STABILIZING', ko: '안정화 중' },
  'stage.OPERATIONAL': { en: 'OPERATIONAL', ko: '정상 가동' },
  'control.cause': { en: 'FACILITY AGING', ko: '시설 노후화' },
  'control.completeCause': { en: 'ALL SUBSYSTEMS NOMINAL', ko: '모든 하위 시스템 정상' },
  'control.repair': { en: 'REPAIR', ko: '복구도' },
  'control.selectPart': { en: 'SELECT A PART', ko: '부품을 선택하세요' },
  'control.installed': { en: '{item} INSTALLED · +{points}', ko: '{item} 투입 완료 · +{points}' },
  'control.notCompatible': { en: 'NOT COMPATIBLE WITH THIS SYSTEM', ko: '이 시스템에 쓸 수 없는 부품' },
  'control.outOfStock': { en: 'OUT OF STOCK', ko: '재고 없음' },
  'control.complete': { en: 'SYSTEM RECOVERY COMPLETE', ko: '시스템 복구 완료' },
  'control.insert': { en: 'INSERT', ko: '투입' },
  'control.insertTitle': { en: 'INSERT {item}?', ko: '{item} 투입?' },
  'control.rowPart': { en: 'PART', ko: '부품' },
  'control.rowRepair': { en: 'REPAIR', ko: '복구' },
  'control.rowResult': { en: 'RESULT', ko: '결과' },
  'control.rowStock': { en: 'STOCK', ko: '재고' },
  'control.confirmInsert': { en: 'CONFIRM INSERT', ko: '투입' },

  // ── 열 분배 매트릭스 ──
  'matrix.charges': { en: 'CHARGES {count} / {max}', ko: '시도권 {count} / {max}' },
  'matrix.chargesFull': { en: 'CHARGES FULL', ko: '시도권 가득 참' },
  'matrix.nextCharge': { en: 'NEXT CHARGE IN {count} EXPEDITIONS', ko: '탐사 {count}회 후 충전' },
  'matrix.operational': { en: 'SYSTEM OPERATIONAL', ko: '시스템 정상 가동' },
  'matrix.noCharges': { en: 'NO CHARGES', ko: '시도권 없음' },
  'matrix.startTitle': { en: 'START CALIBRATION?', ko: '조율을 시작할까요?' },
  'matrix.rowCharges': { en: 'CHARGES', ko: '시도권' },
  'matrix.rowDifficulty': { en: 'DIFFICULTY', ko: '난이도' },
  'matrix.difficultyValue': { en: '{count} DISPLACED SECTORS', ko: '어긋난 구역 {count}곳' },
  'matrix.rowMoveLimit': { en: 'MOVE LIMIT', ko: '이동 제한' },
  'matrix.rowReward': { en: 'REWARD', ko: '보상' },
  'matrix.rewardValue': { en: 'REPAIR +{points}', ko: '복구 +{points}' },
  'matrix.rowHint': { en: 'HINT', ko: '힌트' },
  'matrix.hintValue': { en: 'MAINTENANCE REPORT', ko: '정비 보고서' },
  'matrix.start': { en: 'START', ko: '시작' },
  'matrix.code': { en: 'CALIBRATION', ko: '조율' },
  'matrix.moves': { en: 'MOVES', ko: '이동' },
  'matrix.warmCount': { en: 'WARM', ko: '난방' },
  'matrix.warm': { en: 'WARM', ko: '난방' },
  'matrix.cold': { en: 'COLD', ko: '냉기' },
  'matrix.gridLabel': { en: 'Heat distribution sectors', ko: '열 분배 구역' },
  'matrix.rule': {
    en: 'Pressing a sector also flips the sectors above, below, left and right of it. Make every sector WARM within the move limit.',
    ko: '누른 구역과 위·아래·왼쪽·오른쪽 구역의 상태가 함께 바뀝니다. 이동 제한 안에 모든 구역을 난방 상태로 만드세요.',
  },
  'matrix.hint': {
    en: 'MAINTENANCE REPORT: START AT THE MARKED SECTOR',
    ko: '정비 보고서: 표시된 구역부터 시작하세요',
  },
  'matrix.success': { en: 'CALIBRATION COMPLETE · REPAIR +{points}', ko: '조율 완료 · 복구 +{points}' },
  'matrix.fail': { en: 'CALIBRATION FAILED · MOVE LIMIT EXCEEDED', ko: '조율 실패 · 이동 제한 초과' },

  // ── 탐사 ──
  'category.repair': { en: 'REPAIR PARTS', ko: '수리 부품' },
  'category.food': { en: 'RATIONS', ko: '식량' },
  'category.gear': { en: 'GEAR', ko: '장비' },
  'category.greenhouse': { en: 'GREENHOUSE', ko: '온실 자원' },
  'category.document': { en: 'DOCUMENTS', ko: '문서' },
  'category.supply': { en: 'SUPPLIES', ko: '보급품' },
  'category.special': { en: 'SPECIAL', ko: '특수' },
  'category.collectible': { en: 'COLLECTIBLES', ko: '수집품' },
  'exp.rations': { en: 'RATIONS', ko: '식량' },
  'exp.cost': { en: 'RATIONS −{count}', ko: '식량 −{count}' },
  'exp.requires': { en: 'REQUIRES {item}', ko: '{item} 필요' },
  'exp.insufficient': { en: 'INSUFFICIENT RATIONS', ko: '식량 부족' },
  'exp.report': { en: 'EXPEDITION REPORT', ko: '탐사 보고' },
  'exp.earlyReturn': {
    en: 'EARLY RETURN — SUIT FAILURE. SEARCH CUT SHORT.',
    ko: '조기 귀환 — 방한복 손상으로 수색이 중단되었습니다.',
  },
  'exp.consumed': { en: 'CONSUMED', ko: '소모' },
  'exp.recovered': { en: 'RECOVERED', ko: '획득' },
  'exp.nothing': { en: 'NOTHING RECOVERED', ko: '획득한 물품 없음' },
  'exp.back': { en: '← SELECT DESTINATION', ko: '← 목적지 선택' },
  'exp.selectItem': { en: 'SELECT AN ITEM', ko: '아이템을 선택하세요' },
  'exp.statRation': { en: 'RATION +{count}', ko: '식량 +{count}' },
  'exp.statRepair': { en: 'REPAIR +{count}', ko: '복구 +{count}' },
  'exp.statRisk': { en: 'EARLY RETURN RISK {count}%', ko: '조기 귀환 위험 {count}%' },
  'exp.deployTitle': { en: 'DEPLOY TO {location}?', ko: '{location} 탐사를 보낼까요?' },
  'exp.rowDestination': { en: 'DESTINATION', ko: '목적지' },
  'exp.rowRations': { en: 'RATIONS', ko: '식량' },
  'exp.rowSearch': { en: 'SEARCH', ko: '수색' },
  'exp.searchValue': { en: '{count} ROLLS', ko: '{count}회' },
  'exp.rowRisk': { en: 'RISK', ko: '위험' },
  'exp.riskValue': { en: 'EARLY RETURN {count}%', ko: '조기 귀환 {count}%' },
  'exp.deploy': { en: 'DEPLOY', ko: '출발' },

  // ── 조합 ──
  'craft.MEND': { en: 'MEND', ko: '수선' },
  'craft.REPAIR': { en: 'REPAIR', ko: '수리' },
  'craft.OPEN': { en: 'OPEN', ko: '열기' },
  'craft.title': { en: '{action} {item}?', ko: '{item} — {action}?' },
  'craft.rowResult': { en: 'RESULT', ko: '결과' },
}

// 글자 속 {이름} 자리를 값으로 채우기
export function format(text, vars = {}) {
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match))
}

// 번역 하나 꺼내기 (그 언어가 없으면 영어, 사전에 없으면 키 그대로)
export function translate(lang, key, vars) {
  const entry = STRINGS[key]
  const text = entry ? (entry[lang] ?? entry.en) : key
  return format(text, vars)
}

// 데이터 파일 속 글자 고르기
// - "글자" 그대로면 그대로
// - { "en": "...", "ko": "..." }면 지금 언어 것
export function pick(value, lang) {
  if (value && typeof value === 'object') return value[lang] ?? value.en ?? ''
  return value ?? ''
}

// 화면에서 쓰는 번역 함수
export function useT() {
  const lang = useLanguage()
  return (key, vars) => translate(lang, key, vars)
}