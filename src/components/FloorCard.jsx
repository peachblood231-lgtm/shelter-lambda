import { useEffect, useRef, useState } from 'react'

// SECTOR 칸을 눌렀을 때 보여 줄 문구와 표시 시간
const DENIED_MESSAGE = 'INSUFFICIENT APPROACH LEVEL'
const MESSAGE_DURATION_MS = 2000 // 2000 = 2초 동안 표시

// 레지덴셜의 층 카드 하나입니다.
// 받는 값:
// - floor: 층 정보 (code: 'B3', restricted: 출입 제한된 구역 목록 예: ['B'])
// - sectors: 모든 구역 이름 목록 (예: ['A', 'B', 'C'])
function FloorCard({ floor, sectors }) {
  // 모든 구역이 제한되어 있으면 층 전체가 RESTRICTED
  // every: 배열의 "모든" 항목이 조건을 만족하면 true
  const isRestricted = sectors.every((sector) => floor.restricted.includes(sector))

  // 지금 경고 문구를 보여 주고 있는 구역 (없으면 null)
  const [deniedSector, setDeniedSector] = useState(null)

  // 2초 뒤 문구를 지우는 타이머를 기억해 두는 곳
  const timerRef = useRef(null)

  // 카드가 화면에서 사라질 때 남아 있는 타이머를 정리
  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  // SECTOR 칸을 눌렀을 때: 문구를 보여 주고, 2초 뒤 원래대로
  function handleSectorClick(sector) {
    setDeniedSector(sector)
    clearTimeout(timerRef.current) // 이전 타이머가 있으면 취소 (연속으로 눌렀을 때)
    timerRef.current = setTimeout(() => setDeniedSector(null), MESSAGE_DURATION_MS)
  }

  return (
    <article className="term-floor">
      <h2 className="term-floor-code">{floor.code}</h2>
      <p className={isRestricted ? 'term-floor-status is-restricted' : 'term-floor-status'}>
        {isRestricted ? 'RESTRICTED' : 'OCCUPIED'}
      </p>

      {/* 구역 목록 */}
      <ul className="term-floor-sectors">
        {sectors.map((sector) => {
          const isSectorRestricted = floor.restricted.includes(sector)

          // 제한된 구역(빨간 칸): 누를 수 없는 표시만
          if (isSectorRestricted) {
            return (
              <li key={sector} className="term-sector is-restricted">
                SECTOR {sector}
                {/* 색을 볼 수 없는 사용자(화면 낭독기)를 위한 설명. 화면에는 안 보임 */}
                <span className="sr-only"> (출입 제한)</span>
              </li>
            )
          }

          // 제한되지 않은 구역: 누르면 경고 문구 표시
          const isDenied = deniedSector === sector
          return (
            <li key={sector}>
              <button
                type="button"
                className={isDenied ? 'term-sector term-sector--button is-denied' : 'term-sector term-sector--button'}
                onClick={() => handleSectorClick(sector)}
              >
                {isDenied ? DENIED_MESSAGE : `SECTOR ${sector}`}
              </button>
            </li>
          )
        })}
      </ul>

      {/* 화면 낭독기가 경고 문구를 읽어 주도록 하는 숨은 영역 */}
      <p className="sr-only" aria-live="polite">
        {deniedSector ? `${floor.code} SECTOR ${deniedSector}: ${DENIED_MESSAGE}` : ''}
      </p>
    </article>
  )
}

export default FloorCard