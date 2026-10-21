import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getSlide, slideBlock, toggleLit } from '../game/rooms'
import { useT } from '../i18n/strings'
import '../styles/sector-rooms.css'

// 방향키 → 방향 이름
const ARROWS = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
}

// ── 말랑한 움직임 설정 ──
const MERGE_MS = 560   // 합칠 때 출렁이는 시간
const MOVE_MS = 380    // 이동·되돌아갈 때 시간
const EASING = 'cubic-bezier(0.22, 0.9, 0.3, 1)'
const SQUASH = 0.06    // 찌그러지는 정도 (클수록 더 말랑)
const PEEK = 0.4       // 합칠 수 있는 방 쪽으로 파고드는 정도 (칸 비율)
const MERGE_PUSH = 0.15 // 이만큼 이상 파고들고 놓으면 합침 (칸 비율)

// 방에 적힐 숫자 = 종류 (0 → 1, 1 → 2, 2 → 3). 같은 숫자끼리만 합쳐짐
function roomNumber(block) {
  return block.kind + 1
}

// 레지덴셜 SECTOR의 방 배치 장난감 팝업입니다.
// - 누르기: 선택 (테두리와 숫자가 옅은 노랑으로)
// - 끌기: 상하좌우 한 방향으로만 미끄러짐, 다른 방을 뛰어넘을 수 없음
// - 같은 숫자이고 줄이 맞는 방에 밀어 넣으면 합쳐짐
// 받는 값:
// - title: 제목 (예: B4 · SECTOR A)
// - grid: { cols, rows }
// - initialBlocks: 처음 방 목록
// - onChange: 배치가 바뀔 때마다 실행 (저장용)
// - onClose: 팝업이 닫혔을 때
function SectorRoomsDialog({ title, grid, initialBlocks, onChange, onClose }) {
  const t = useT()
  const dialogRef = useRef(null)
  const gridRef = useRef(null)
  const [blocks, setBlocks] = useState(initialBlocks)

  // 끌고 있는 방 정보 (화면 그리기용 state + 이벤트 안에서 최신 값을 읽기 위한 ref)
  const [drag, setDrag] = useState(null)
  const dragRef = useRef(null)

  // 방 ID → 화면의 방 버튼 (움직임을 주기 위해)
  const roomRefs = useRef(new Map())
  // 바뀌기 직전 모양 { id, rect, type: 'merge' | 'move', axis }
  const pendingAnimRef = useRef(null)
  // 배치는 그대로인데 움직임만 줄 때(되돌아가기) 다시 그리게 하는 번호
  const [animTick, setAnimTick] = useState(0)

  // 열기 + 처음 배치를 한 번 저장
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    onChange(initialBlocks)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 바뀐 직후: 직전 모양에서 새 모양으로 말랑하게 이어 주기 ──
  useLayoutEffect(() => {
    const pending = pendingAnimRef.current
    pendingAnimRef.current = null
    if (!pending) return

    const element = roomRefs.current.get(pending.id)
    if (!element) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const next = element.getBoundingClientRect()
    if (next.width === 0 || next.height === 0) return

    const dx = pending.rect.left + pending.rect.width / 2 - (next.left + next.width / 2)
    const dy = pending.rect.top + pending.rect.height / 2 - (next.top + next.height / 2)
    const sx = pending.rect.width / next.width
    const sy = pending.rect.height / next.height
    const from = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
    const isH = pending.axis === 'h'

    if (pending.type === 'merge') {
      const over = isH ? `scale(${1 + SQUASH}, ${1 - SQUASH})` : `scale(${1 - SQUASH}, ${1 + SQUASH})`
      const back = isH
        ? `scale(${1 - SQUASH / 2}, ${1 + SQUASH / 2})`
        : `scale(${1 + SQUASH / 2}, ${1 - SQUASH / 2})`
      element.animate(
        [
          { transform: from, borderRadius: '4px' },
          { transform: over, borderRadius: '12px', offset: 0.45 },
          { transform: back, borderRadius: '8px', offset: 0.72 },
          { transform: 'none', borderRadius: '4px' },
        ],
        { duration: MERGE_MS, easing: EASING },
      )
    } else {
      const settle = isH
        ? `scale(${1 + SQUASH / 2}, ${1 - SQUASH / 2})`
        : `scale(${1 - SQUASH / 2}, ${1 + SQUASH / 2})`
      element.animate(
        [{ transform: from }, { transform: settle, offset: 0.65 }, { transform: 'none' }],
        { duration: MOVE_MS, easing: EASING },
      )
    }
  }, [blocks, animTick])

  function closeDialog() {
    dialogRef.current?.close()
  }

  function handleDialogClick(event) {
    if (event.target === dialogRef.current) closeDialog()
  }

  function commit(next) {
    if (!next) return
    setBlocks(next)
    onChange(next)
  }

  function rectOf(id) {
    return roomRefs.current.get(id)?.getBoundingClientRect() ?? null
  }

  // 미끄러뜨리기 실행 + 말랑한 움직임 예약. 변화가 없으면 false
  function applySlide(id, dir, wantSteps, fromRect) {
    const result = slideBlock(blocks, id, dir, wantSteps, grid.cols, grid.rows)
    if (!result) return false

    const startRect = result.type === 'merge' ? rectOf(result.targetId) : fromRect
    if (startRect) {
      pendingAnimRef.current = { id: result.targetId, rect: startRect, type: result.type, axis: result.axis }
    }
    commit(result.blocks)
    return true
  }

  // 놓을 수 없을 때: 놓은 자리에서 원래 자리로 고무줄처럼
  function bounceBack(id, fromRect, axis) {
    if (!fromRect) return
    pendingAnimRef.current = { id, rect: fromRect, type: 'move', axis }
    setAnimTick((tick) => tick + 1)
  }

  // 격자 한 칸이 화면에서 차지하는 거리 (칸 + 간격)
  function getStep() {
    const element = gridRef.current
    const rect = element.getBoundingClientRect()
    const style = window.getComputedStyle(element)
    const pad = parseFloat(style.paddingLeft) || 0
    const gap = parseFloat(style.columnGap) || 0
    return {
      x: (rect.width - pad * 2 + gap) / grid.cols,
      y: (rect.height - pad * 2 + gap) / grid.rows,
    }
  }

  // 끈 거리 → 방향과, 실제로 따라갈 수 있는 거리
  function measureDrag(id, rawDx, rawDy) {
    const isH = Math.abs(rawDx) >= Math.abs(rawDy)
    const dir = isH ? (rawDx > 0 ? 'right' : 'left') : rawDy > 0 ? 'down' : 'up'
    const distance = isH ? Math.abs(rawDx) : Math.abs(rawDy)
    const step = isH ? getStep().x : getStep().y

    const slide = getSlide(blocks, id, dir, grid.cols, grid.rows)
    const limit = (slide.steps + (slide.canMerge ? PEEK : 0)) * step
    const offset = Math.min(distance, limit)

    return { dir, isH, offset, step, slide }
  }

  // ── 마우스·손가락 ──

  function handlePointerDown(event, block) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)

    const next = { id: block.id, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0, moved: false }
    dragRef.current = next
    setDrag(next)
  }

  function handlePointerMove(event) {
    const current = dragRef.current
    if (!current) return

    const rawDx = event.clientX - current.startX
    const rawDy = event.clientY - current.startY
    const moved = current.moved || Math.hypot(rawDx, rawDy) > 5

    // 한 축으로만, 막히는 곳까지만 따라옴
    const { dir, isH, offset } = measureDrag(current.id, rawDx, rawDy)
    const sign = dir === 'right' || dir === 'down' ? 1 : -1
    const next = {
      ...current,
      moved,
      dx: isH ? offset * sign : 0,
      dy: isH ? 0 : offset * sign,
    }
    dragRef.current = next
    setDrag(next)
  }

  function handlePointerUp(event, block) {
    const droppedRect = event.currentTarget.getBoundingClientRect()

    const current = dragRef.current
    dragRef.current = null
    setDrag(null)
    if (!current) return

    // 거의 안 움직였으면 "누르기" → 선택
    if (!current.moved) {
      commit(toggleLit(blocks, block.id))
      return
    }

    const rawDx = event.clientX - current.startX
    const rawDy = event.clientY - current.startY
    const { dir, isH, offset, step, slide } = measureDrag(block.id, rawDx, rawDy)

    // 합칠 수 있는 방에 충분히 파고들었으면 합치기, 아니면 가까운 칸까지 이동
    let want = Math.round(offset / step)
    if (slide.canMerge && offset > (slide.steps + MERGE_PUSH) * step) {
      want = slide.steps + 1
    }

    if (want <= 0 || !applySlide(block.id, dir, want, droppedRect)) {
      bounceBack(block.id, droppedRect, isH ? 'h' : 'v')
    }
  }

  function handlePointerCancel() {
    dragRef.current = null
    setDrag(null)
  }

  // ── 키보드: Enter/Space = 선택, 방향키 = 한 칸 이동(같은 숫자에 부딪히면 합치기) ──

  function handleKeyDown(event, block) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      commit(toggleLit(blocks, block.id))
      return
    }

    const dir = ARROWS[event.key]
    if (!dir) return
    event.preventDefault()
    applySlide(block.id, dir, 1, rectOf(block.id))
  }

  // ── 방 버튼 하나에 붙일 값 ──
  function getRoomProps(block) {
    const isDragging = Boolean(drag && drag.id === block.id && drag.moved)

    let className = 'room'
    if (block.lit) className += ' is-lit'
    if (isDragging) className += ' is-dragging'

    const style = {
      gridColumn: block.x + 1 + ' / span ' + block.w,
      gridRow: block.y + 1 + ' / span ' + block.h,
    }
    if (isDragging) {
      style.transform = 'translate(' + drag.dx + 'px, ' + drag.dy + 'px)'
    }

    let label = t('rooms.room', { number: roomNumber(block) })
    if (block.lit) label += ', ' + t('rooms.selected')

    return {
      ref: (element) => {
        if (element) roomRefs.current.set(block.id, element)
        else roomRefs.current.delete(block.id)
      },
      className,
      style,
      'aria-label': label,
      'aria-pressed': block.lit,
      onPointerDown: (event) => handlePointerDown(event, block),
      onPointerMove: handlePointerMove,
      onPointerUp: (event) => handlePointerUp(event, block),
      onPointerCancel: handlePointerCancel,
      onKeyDown: (event) => handleKeyDown(event, block),
    }
  }

  const gridStyle = {
    gridTemplateColumns: 'repeat(' + grid.cols + ', 1fr)',
    gridTemplateRows: 'repeat(' + grid.rows + ', 1fr)',
    aspectRatio: grid.cols + ' / ' + grid.rows,
  }

  return (
    <dialog
      ref={dialogRef}
      className="sector-dialog"
      aria-labelledby="sector-dialog-title"
      onClose={onClose}
      onClick={handleDialogClick}
    >
      <div className="sector-inner">
        <h2 id="sector-dialog-title" className="sector-title">
          {title}
        </h2>
        <button type="button" className="term-plants-close" aria-label={t('common.close')} onClick={closeDialog} />

        <div ref={gridRef} className="sector-grid" style={gridStyle} role="group" aria-label={t('rooms.label')}>
          {blocks.map((block) => (
            <button key={block.id} type="button" {...getRoomProps(block)}>
              <span className="room-number" aria-hidden="true">
                {roomNumber(block)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </dialog>
  )
}

export default SectorRoomsDialog