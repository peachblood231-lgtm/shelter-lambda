import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '../i18n/strings'
import '../styles/binary-rain.css'

// ── 조절할 수 있는 값 ──
const CELL = 18
const CLEAR_CELLS = 1.6
const DOT_CELLS = 2.8
const DOT_CHANCE = 0.7
const REGROW_MIN = 600
const REGROW_MAX = 1400
const DOT_TO_DIGIT_MIN = 150
const DOT_TO_DIGIT_MAX = 450
const FILL_MS = 2500
const FLICKER = 0.002

// 칸 상태
const EMPTY = 0
const DOT = 1
const DIGIT = 2

const DIGIT_COLOR = 'rgba(85, 240, 107, 0.85)'
const DOT_COLOR = 'rgba(85, 240, 107, 0.45)'

function between(min, max) {
  return min + Math.random() * (max - min)
}

// 온실 조명이 모두 꺼졌을 때 화면을 채우는 0과 1입니다.
// 모든 변화는 격자 칸 단위로: 숫자 → 점(·) → 빈칸 → 점 → 새 숫자
// 받는 값:
// - zones: 구역 목록 [{ id, code, isShutdown, onLightOn, onRestart }]
function BinaryRain({ zones }) {
  const t = useT()
  const canvasRef = useRef(null)
  const firstButtonRef = useRef(null)

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
    let state = new Uint8Array(0)
    let bits = new Uint8Array(0)
    let nextAt = new Float64Array(0)

    let pending = []
    let lastPoint = null

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
        const fromBottom = rows - 1 - Math.floor(i / cols)
        bits[i] = Math.random() < 0.5 ? 0 : 1
        nextAt[i] = reduceMotion ? now : now + (fromBottom / rows) * FILL_MS + Math.random() * 400
      }
    }

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

    function applyTrail(now) {
      for (const point of pending) {
        const colStart = Math.max(0, Math.floor(point.x - DOT_CELLS))
        const colEnd = Math.min(cols - 1, Math.ceil(point.x + DOT_CELLS))
        const rowStart = Math.max(0, Math.floor(point.y - DOT_CELLS))
        const rowEnd = Math.min(rows - 1, Math.ceil(point.y + DOT_CELLS))

        for (let r = rowStart; r <= rowEnd; r += 1) {
          for (let c = colStart; c <= colEnd; c += 1) {
            const i = r * cols + c
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
        if (state[i] !== DIGIT && now >= nextAt[i]) {
          if (state[i] === EMPTY) {
            state[i] = DOT
            nextAt[i] = now + between(DOT_TO_DIGIT_MIN, DOT_TO_DIGIT_MAX)
          } else {
            state[i] = DIGIT
            bits[i] = Math.random() < 0.5 ? 0 : 1
          }
        }

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

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchmove', handleMove)
      document.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  return createPortal(
    <div className="brain" role="dialog" aria-modal="true" aria-label={t('dark.aria')}>
      <canvas ref={canvasRef} className="brain-canvas" aria-hidden="true" />

      {/* 아래쪽: 조명 켜기 버튼 (하나라도 켜면 이 화면이 끝남) */}
      <div className="brain-panel">
        <p className="brain-label">{t('dark.label')}</p>
        <div className="brain-zones">
          {zones.map((zone, index) => (
            <button
              key={zone.id}
              ref={index === 0 ? firstButtonRef : undefined}
              type="button"
              className="brain-zone"
              onClick={zone.isShutdown ? zone.onRestart : zone.onLightOn}
            >
              {zone.code} · {zone.isShutdown ? t('dark.restart') : t('dark.lightOn')}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default BinaryRain