import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import FloorCard from './FloorCard'
import { useT } from '../i18n/strings'
import '../styles/residential-dark.css'

// 조명이 꺼졌을 때 화면 전체를 덮는 어둠입니다. (보이기만 하고 클릭은 막지 않음)
function DarkOverlay() {
  return createPortal(<div className="res-dark" aria-hidden="true" />, document.body)
}

// 레지덴셜 화면의 가운데 내용입니다.
// 받는 값:
// - floors: 층 목록
// - sectors: 구역 이름 목록 (예: ['A', 'B', 'C'])
// - lightOn: 처음 조명 상태
// - repairPercent: 온도 시스템 복구도(%) — SECTOR 해금 기준
// - layouts: 저장된 방 배치
// - onSaveLayout: 방 배치 저장
function ResidentialFloors({ floors, sectors, lightOn: initialLightOn, repairPercent, layouts, onSaveLayout }) {
  const t = useT()
  const [lightOn, setLightOn] = useState(initialLightOn)
  const scrollRef = useRef(null)

  // 레지덴셜 화면 어디서든 마우스 휠을 굴리면 층 카드가 좌우로 이동하게 합니다.
  useEffect(() => {
    function handleWheel(event) {
      const scroller = scrollRef.current
      if (!scroller) return

      // 팝업(방 배치 등)이 열려 있으면 원래대로 둠
      if (document.querySelector('dialog[open]')) return

      // 페이지 자체가 세로로 길어서(좁은 화면) 세로 스크롤이 필요하면 원래대로 둠
      const pageScrollsVertically =
        document.documentElement.scrollHeight > window.innerHeight + 1
      if (pageScrollsVertically) return

      // 가로 움직임이 더 크면 브라우저 기본 동작에 맡김
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return

      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY
      scroller.scrollLeft += delta
      event.preventDefault()
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])

  // 조명이 꺼져 있을 때 Esc 키로도 켤 수 있게 (팝업이 열려 있을 땐 팝업 닫기가 먼저)
  useEffect(() => {
    if (lightOn) return undefined

    function handleKey(event) {
      if (event.key === 'Escape' && !document.querySelector('dialog[open]')) setLightOn(true)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightOn])

  let lightClassName = 'term-btn term-btn--light term-btn--wide'
  if (lightOn) lightClassName += ' is-on'
  else lightClassName += ' res-light-raised'

  return (
    <div className="term-floors">
      <div
        ref={scrollRef}
        className="term-floors-scroll"
        tabIndex={0}
        role="region"
        aria-label={t('floor.scroll')}
      >
        {floors.map((floor) => (
          <FloorCard
            key={floor.id}
            floor={floor}
            sectors={sectors}
            repairPercent={repairPercent}
            layouts={layouts}
            onSaveLayout={onSaveLayout}
          />
        ))}
      </div>

      <button type="button" className={lightClassName} onClick={() => setLightOn(!lightOn)}>
        {lightOn ? t('unit.lightOff') : t('unit.lightOn')}
      </button>

      {!lightOn && <DarkOverlay />}
    </div>
  )
}

export default ResidentialFloors