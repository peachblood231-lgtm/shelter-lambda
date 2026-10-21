// 화면 글자 번역 사전입니다.
// 사용법: const t = useT()  →  t('intro.reset')  /  t('log.installed', { item: 'FUSE', points: 5 })
import { useLanguage } from './language'

export const STRINGS = {
  // ── 언어 버튼 ──
  'lang.label': { en: 'Language', ko: '언어' },

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