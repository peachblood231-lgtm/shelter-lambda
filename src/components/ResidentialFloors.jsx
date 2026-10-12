import { useEffect, useRef, useState } from 'react'
import FloorCard from './FloorCard'

// 레지덴셜 화면의 가운데 내용입니다.
// 위: 층 카드들을 가로로 스크롤 / 아래: 넓은 조명 버튼
// 받는 값:
// - floors: 층 목록
// - sectors: 구역 이름 목록 (예: ['A', 'B', 'C'])
// - lightOn: 처음 조명 상태
function ResidentialFloors({ floors, sectors, lightOn: initialLightOn }) {
  // 조명이 켜져 있는지
  const [lightOn, setLightOn] = useState(initialLightOn)

  // 가로 스크롤 영역을 가리키는 손잡이(ref)
  const scrollRef = useRef(null)

  // 레지덴셜 화면 어디서든 마우스 휠을 굴리면 층 카드가 좌우로 이동하게 합니다.
  useEffect(() => {
    function handleWheel(event) {
      const scroller = scrollRef.current
      if (!scroller) return

      // 팝업 등이 열려 있거나, 페이지 자체가 세로로 길어서(좁은 화면) 세로 스크롤이 필요하면 원래대로 둠
      const pageScrollsVertically =
        document.documentElement.scrollHeight > window.innerHeight + 1
      if (pageScrollsVertically) return

      // 트랙패드 좌우 스와이프처럼 가로 움직임이 더 크면 브라우저 기본 동작에 맡김
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return

      // 휠 한 칸의 이동량: 브라우저에 따라 "줄" 단위로 오는 경우가 있어 픽셀로 바꿔 줌
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY

      // 세로 휠 움직임만큼 가로로 이동
      scroller.scrollLeft += delta
      event.preventDefault()
    }

    // window(화면 전체)에 휠 감지를 붙입니다.
    // passive: false → preventDefault()를 쓸 수 있게 하는 설정
    window.addEventListener('wheel', handleWheel, { passive: false })

    // 레지덴셜 화면을 나가면 감지를 떼어 냅니다. (다른 화면에는 영향 없음)
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])

  return (
    <div className="term-floors">
      {/* 가로 스크롤 영역 (Tab으로 선택 후 ← → 키로도 이동 가능) */}
      <div
        ref={scrollRef}
        className="term-floors-scroll"
        tabIndex={0}
        role="region"
        aria-label="층별 거주 현황 (좌우로 스크롤)"
      >
        {floors.map((floor) => (
          <FloorCard key={floor.id} floor={floor} sectors={sectors} />
        ))}
      </div>

      {/* 넓은 조명 버튼: 켜져 있으면 LIGHT OFF(파란색), 꺼져 있으면 LIGHT ON(테두리만) */}
      <button
        type="button"
        className={
          lightOn
            ? 'term-btn term-btn--light term-btn--wide is-on'
            : 'term-btn term-btn--light term-btn--wide'
        }
        onClick={() => setLightOn(!lightOn)}
      >
        {lightOn ? 'LIGHT OFF' : 'LIGHT ON'}
      </button>
    </div>
  )
}

export default ResidentialFloors