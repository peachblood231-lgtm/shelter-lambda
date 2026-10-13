import { useEffect, useRef, useState } from 'react'
import SectorRoomsDialog from './SectorRoomsDialog'
import { createLayout } from '../game/rooms'
import RESIDENTIAL from '../data/residential.json'
import '../styles/sector-rooms.css'

// 잠긴 SECTOR 칸을 눌렀을 때 보여 줄 문구와 표시 시간
const DENIED_MESSAGE = 'INSUFFICIENT APPROACH LEVEL'
const MESSAGE_DURATION_MS = 2000

// 레지덴셜의 층 카드 하나입니다.
// 받는 값:
// - floor: 층 정보 (id, code: 'B3', restricted: 출입 제한된 구역 목록 예: ['B'])
// - sectors: 모든 구역 이름 목록 (예: ['A', 'B', 'C'])
// - repairPercent: 온도 시스템 복구도(%) — SECTOR 해금 기준
// - layouts: 저장된 방 배치
// - onSaveLayout: 방 배치 저장 (키, 방 목록)
function FloorCard({ floor, sectors, repairPercent = 0, layouts = {}, onSaveLayout = () => {} }) {
  const isRestricted = sectors.every((sector) => floor.restricted.includes(sector))

  const [deniedSector, setDeniedSector] = useState(null)
  const [openSector, setOpenSector] = useState(null)

  const timerRef = useRef(null)

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  // 이 SECTOR를 여는 데 필요한 복구도
  function getRequirement(sector) {
    return RESIDENTIAL.unlockPercent[sector] ?? 100
  }

  function handleSectorClick(sector) {
    if (repairPercent >= getRequirement(sector)) {
      setOpenSector(sector)
      return
    }
    setDeniedSector(sector)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDeniedSector(null), MESSAGE_DURATION_MS)
  }

  // 저장 키 (예: 'b5-A-v2'). 규칙이 바뀌면 버전을 올려 새 배치로 시작
  const layoutKey = (sector) => `${floor.id}-${sector}-v${RESIDENTIAL.layoutVersion ?? 1}`

  return (
    <article className="term-floor">
      <h2 className="term-floor-code">{floor.code}</h2>
      <p className={isRestricted ? 'term-floor-status is-restricted' : 'term-floor-status'}>
        {isRestricted ? 'RESTRICTED' : 'OCCUPIED'}
      </p>

      <ul className="term-floor-sectors">
        {sectors.map((sector) => {
          if (floor.restricted.includes(sector)) {
            return (
              <li key={sector} className="term-sector is-restricted">
                SECTOR {sector}
                <span className="sr-only"> (출입 제한)</span>
              </li>
            )
          }

          const isUnlocked = repairPercent >= getRequirement(sector)
          const isDenied = deniedSector === sector

          return (
            <li key={sector}>
              <button
                type="button"
                className={isDenied ? 'term-sector term-sector--button is-denied' : 'term-sector term-sector--button'}
                aria-haspopup={isUnlocked ? 'dialog' : undefined}
                onClick={() => handleSectorClick(sector)}
              >
                {isDenied ? (
                  <>
                    {DENIED_MESSAGE}
                    <span className="sector-req">REQUIRES {getRequirement(sector)}% RECOVERY</span>
                  </>
                ) : (
                  `SECTOR ${sector}${isUnlocked ? ' ↗' : ''}`
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <p className="sr-only" aria-live="polite">
        {deniedSector
          ? `${floor.code} SECTOR ${deniedSector}: ${DENIED_MESSAGE}, REQUIRES ${getRequirement(deniedSector)}% RECOVERY`
          : ''}
      </p>

      {openSector && (
        <SectorRoomsDialog
          key={openSector}
          title={`${floor.code} · SECTOR ${openSector}`}
          grid={RESIDENTIAL.grid}
          initialBlocks={layouts[layoutKey(openSector)] ?? createLayout(RESIDENTIAL.grid)}
          onChange={(blocks) => onSaveLayout(layoutKey(openSector), blocks)}
          onClose={() => setOpenSector(null)}
        />
      )}
    </article>
  )
}

export default FloorCard