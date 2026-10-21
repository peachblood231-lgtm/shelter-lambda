// 지금 화면 언어를 기억하고, 바뀌면 화면에 알려 주는 곳입니다.
// - 처음: 저장된 언어 → 없으면 브라우저 언어 (한국어면 ko, 아니면 en)
// - 바꾸면 브라우저에 저장해서 다음에 와도 유지
// - 한글 글꼴(Pretendard, Noto Serif KR)도 여기서 한 번 불러옵니다.
import { useSyncExternalStore } from 'react'

// 저장 이름표 (게임 저장과 따로 관리 → RESET DATA를 해도 언어는 유지)
const STORAGE_KEY = 'shelter-lambda-lang'

// 지원하는 언어 (버튼 순서: KO | EN)
export const LANGUAGES = ['ko', 'en']

// 한글 글꼴 주소
const FONT_LINKS = [
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css',
  'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400&display=swap',
]

// 처음 언어 정하기
function detectLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (LANGUAGES.includes(saved)) return saved
  } catch {
    // 저장소를 못 쓰면 브라우저 언어로
  }
  const browser = (navigator.language || '').toLowerCase()
  return browser.startsWith('ko') ? 'ko' : 'en'
}

// 한글 글꼴을 <head>에 한 번만 추가
function loadFonts() {
  for (const href of FONT_LINKS) {
    if (document.querySelector(`link[href="${href}"]`)) continue
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }
}

// 페이지의 언어 표시 (<html lang="ko">) — 화면 낭독기와 글꼴 선택에 쓰임
function applyLanguage(lang) {
  document.documentElement.lang = lang
}

let current = detectLanguage()
const listeners = new Set()

loadFonts()
applyLanguage(current)

// 지금 언어
export function getLanguage() {
  return current
}

// 언어 바꾸기
export function setLanguage(lang) {
  if (!LANGUAGES.includes(lang) || lang === current) return
  current = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // 저장 못 해도 지금 화면은 바뀜
  }
  applyLanguage(lang)
  listeners.forEach((listener) => listener())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// 화면에서 지금 언어를 쓰는 훅. 언어가 바뀌면 그 화면이 다시 그려짐
export function useLanguage() {
  return useSyncExternalStore(subscribe, getLanguage, getLanguage)
}