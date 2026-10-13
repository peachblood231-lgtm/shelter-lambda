import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
// 0과 1 화면 전용 스타일
import '../styles/binary-rain.css'

// ── 조절할 수 있는 값 ──
const CELL = 18            // 칸 크기(px)
const CLEAR_CELLS = 1.6    // 커서가 지나간 곳에서 이 칸 수 안쪽은 빈칸
const DOT_CELLS = 2.8      // 이 칸 수 안쪽은 점(·)
const DOT_CHANCE = 0.7     // 가장자리 칸이 점이 될 확률 (1보다 작으면 가장자리가 들쭉날쭉)
const REGROW_MIN = 600     // 빈칸이 다시 점이 되기까지 최소 시간(ms)
const REGROW_MAX = 1400    // 최대 시간(ms)
const DOT_TO_DIGIT_MIN = 150 // 점이 숫자가 되기까지 최소 시간(ms)
const DOT_TO_DIGIT_MAX = 450 // 최대 시간(ms)
const FILL_MS = 2500       // 처음에 아래에서 위로 다 차오르는 시간
const FLICKER = 0.002      // 숫자가 저절로 0↔1로 바뀌는 확률 (프레임마다)

// 칸 상태
const EMPTY = 0
const DOT = 1
const DIGIT = 2

// 색 (index.css의 --color-accessible: #55f06b)
const DIGIT_COLOR = 'rgba(85, 240, 107, 0.85)'
const DOT_COLOR = 'rgba(85, 240, 107, 0.45)'

// min ~ max 사이 아무 숫자
function between(min, max) {
  return min + Math.random() * (max - min)
}

// 온실 조명이 모두 꺼졌을 때 화면을 채우는 0과 1입니다.
// 모든 변화는 격자 칸 단위로 일어납니다: 숫자 → 점(·) → 빈칸 → 점 → 새 숫자
// 받는 값:
// - zones: 구역 목록 [{ id, code, isShutdown, onLightOn, onRestart }]
function BinaryRain({ zones }) {
  const canvasRef = useRef(null)
  const firstButtonRef = useRef(null)

  // 열리면 첫 번째 버튼에 초점 (키보드 사용자용)
  useEffect(() => {
    firstButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    let width = 0
    let height = 0
    let cols = 0
    let rows = 0
    let state = new Uint8Array(0)     // 칸마다 상태 (빈칸 / 점 / 숫자)
    let bits = new Uint8Array(0)      // 칸마다 0 또는 1
    let nextAt = new Float64Array(0)  // 칸마다 다음 단계로 자랄 수 있는 시각

    // 지난 프레임 이후 커서가 지나간 지점들 (칸 좌표)
    let pending = []
    let lastPoint = null

    // 화면 크기에 맞춰 칸을 새로 만들기 (처음엔 모두 빈칸, 아래 줄부터 차례로 자람)
    function resize() {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      cols = Math.ceil(width / CELL)
      rows = Math.ceil(height / CELL)
      const count = cols * rows
      const now = performance.now()

      state = new Uint8Array(count)
      bits = new Uint8Array(count)
      nextAt = new Float64Array(count)

      for (let i = 0; i < count; i += 1) {
        const fromBottom = rows - 1 - Math.floor(i / cols) // 맨 아랫줄이 0
        bits[i] = Math.random() < 0.5 ? 0 : 1
        nextAt[i] = reduceMotion ? now : now + (fromBottom / rows) * FILL_MS + Math.random() * 400
      }
    }

    // 커서가 움직이면 지나간 길을 칸 단위로 기록 (빨리 움직여도 끊기지 않게 사이를 채움)
    function handleMove(event) {
      const source = event.touches ? event.touches[0] : event
      const point = { x: source.clientX / CELL, y: source.clientY / CELL }

      if (lastPoint) {
        const distance = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y)
        const steps = Math.max(1, Math.ceil(distance))
        for (let s = 1; s <= steps; s += 1) {
          pending.push({
            x: lastPoint.x + ((point.x - lastPoint.x) * s) / steps,
            y: lastPoint.y + ((point.y - lastPoint.y) * s) / steps,
          })
        }
      } else {
        pending.push(point)
      }

      if (pending.length > 300) pending = pending.slice(-300)
      lastPoint = point
    }

    function handleLeave() {
      lastPoint = null
    }

    // 지나간 길 주변 칸: 가운데는 빈칸, 가장자리는 점
    function applyTrail(now) {
      for (const point of pending) {
        const colStart = Math.max(0, Math.floor(point.x - DOT_CELLS))
        const colEnd = Math.min(cols - 1, Math.ceil(point.x + DOT_CELLS))
        const rowStart = Math.max(0, Math.floor(point.y - DOT_CELLS))
        const rowEnd = Math.min(rows - 1, Math.ceil(point.y + DOT_CELLS))

        for (let r = rowStart; r <= rowEnd; r += 1) {
          for (let c = colStart; c <= colEnd; c += 1) {
            const i = r * cols + c
            // 칸 중심과 지나간 지점 사이 거리 (칸 수)
            const distance = Math.hypot(c + 0.5 - point.x, r + 0.5 - point.y)

            if (distance <= CLEAR_CELLS) {
              state[i] = EMPTY
              nextAt[i] = now + between(REGROW_MIN, REGROW_MAX)
            } else if (distance <= DOT_CELLS && state[i] === DIGIT && Math.random() < DOT_CHANCE) {
              state[i] = DOT
              nextAt[i] = Math.max(nextAt[i], now + between(REGROW_MIN / 2, REGROW_MAX / 2))
            }
          }
        }
      }
      pending = []
    }

    function draw() {
      const now = performance.now()
      applyTrail(now)

      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, width, height)

      ctx.font = `${CELL - 4}px ui-monospace, "SFMono-Regular", Consolas, monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      for (let i = 0; i < state.length; i += 1) {
        // 때가 되면 한 단계씩 자람: 빈칸 → 점 → 새 숫자
        if (state[i] !== DIGIT && now >= nextAt[i]) {
          if (state[i] === EMPTY) {
            state[i] = DOT
            nextAt[i] = now + between(DOT_TO_DIGIT_MIN, DOT_TO_DIGIT_MAX)
          } else {
            state[i] = DIGIT
            bits[i] = Math.random() < 0.5 ? 0 : 1
          }
        }

        // 가끔 저절로 바뀜
        if (state[i] === DIGIT && !reduceMotion && Math.random() < FLICKER) {
          bits[i] = 1 - bits[i]
        }

        if (state[i] === EMPTY) continue

        const x = (i % cols) * CELL + CELL / 2
        const y = Math.floor(i / cols) * CELL + CELL / 2

        if (state[i] === DOT) {
          ctx.fillStyle = DOT_COLOR
          ctx.fillText('·', x, y)
        } else {
          ctx.fillStyle = DIGIT_COLOR
          ctx.fillText(bits[i] ? '1' : '0', x, y)
        }
      }
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('touchmove', handleMove, { passive: true })
    document.addEventListener('mouseleave', handleLeave)

    let frameId = 0
    const loop = () => {
      draw()
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)

    // 사라질 때 정리
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchmove', handleMove)
      document.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  // body에 직접 그리기
  return createPortal(
    <div className="brain" role="dialog" aria-modal="true" aria-label="온실 조명이 모두 꺼졌습니다">
      <canvas ref={canvasRef} className="brain-canvas" aria-hidden="true" />

      {/* 아래쪽: 조명 켜기 버튼 (하나라도 켜면 이 화면이 끝남) */}
      <div className="brain-panel">
        <p className="brain-label">ALL GREENHOUSE LIGHTS OFF</p>
        <div className="brain-zones">
          {zones.map((zone, index) => (
            <button
              key={zone.id}
              ref={index === 0 ? firstButtonRef : undefined}
              type="button"
              className="brain-zone"
              onClick={zone.isShutdown ? zone.onRestart : zone.onLightOn}
            >
              {zone.code} · {zone.isShutdown ? 'RESTART' : 'LIGHT ON'}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default BinaryRain