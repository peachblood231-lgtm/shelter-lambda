import { useEffect, useRef, useState } from 'react'
import { SAMPLES, sampleWave, matchScore, makeNoise, getSectorStatus } from '../game/signal'
// 신호 화면 전용 스타일
import '../styles/signal.css'

// 오실로스코프 화면 크기 (SVG 좌표)
const SCOPE_W = 640
const SCOPE_H = 200

// 슬라이더 범위
const RANGES = {
  freq: { min: 1, max: 5, step: 0.05 },
  amp: { min: 0.1, max: 1, step: 0.01 },
  phase: { min: 0, max: 360, step: 1 },
}

// 슬라이더 목록 (이름, 표시 형식)
const CONTROLS = [
  { key: 'freq', label: 'FREQUENCY', format: (v) => `${v.toFixed(2)} Hz` },
  { key: 'amp', label: 'AMPLITUDE', format: (v) => v.toFixed(2) },
  { key: 'phase', label: 'PHASE', format: (v) => `${Math.round(v)}°` },
]

// 시작할 때 내 파형 값
const START_WAVE = { freq: 1, amp: 0.5, phase: 0 }

// 무전기가 없을 때 보여 줄 잡음 크기
const STATIC_LEVEL = 0.25

// 상태 글자
const STATUS_LABEL = { linked: 'LINKED', weak: 'WEAK', locked: '···' }

// y값 목록 → SVG 선 경로
function toPath(values) {
  const mid = SCOPE_H / 2
  const scale = mid - 12
  return values
    .map((y, i) => {
      const x = (i / (values.length - 1)) * SCOPE_W
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${(mid - y * scale).toFixed(1)}`
    })
    .join(' ')
}

// 신호 복구 화면의 가운데 내용입니다. (왼쪽 구역 목록 + 오실로스코프)
// 받는 값:
// - sectors: signals.json의 구역 목록
// - holdSeconds: 일치율을 몇 초 유지하면 연결되는지
// - linkedIds: 연결된 구역 ID 목록
// - selectedId: 선택한 구역 ID
// - hasReceiver: 무전기(FIELD RADIO)를 가지고 있는지
// - receiverName: 무전기 아이템 이름 (안내 문구용)
// - onSelect: 구역 선택 (구역 ID)
// - onLink: 연결 성공 (구역 ID)
function SignalView({ sectors, holdSeconds, linkedIds, selectedId, hasReceiver, receiverName, onSelect, onLink }) {
  const sector = sectors.find((candidate) => candidate.id === selectedId)
  const status = getSectorStatus(sectors, linkedIds, selectedId)

  return (
    <div className="sig">
      {/* ── 왼쪽: 구역 목록 ── */}
      <ul className="sig-list">
        {sectors.map((item) => {
          const itemStatus = getSectorStatus(sectors, linkedIds, item.id)
          let className = `sig-sector is-${itemStatus}`
          if (item.id === selectedId) className += ' is-selected'
          return (
            <li key={item.id}>
              <button
                type="button"
                className={className}
                disabled={itemStatus === 'locked'}
                aria-pressed={item.id === selectedId}
                onClick={() => onSelect(item.id)}
              >
                <span>{item.name}</span>
                <span className="sig-sector-status">{STATUS_LABEL[itemStatus]}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* ── 가운데: 오실로스코프 ──
          key가 바뀌면(다른 구역을 고르거나, 무전기를 얻으면) 완전히 새로 만들어져서
          슬라이더·유지 시간·노이즈가 모두 처음 상태로 시작합니다. */}
      <SignalScope
        key={`${selectedId}-${hasReceiver}`}
        sector={sector}
        status={status}
        holdSeconds={holdSeconds}
        hasReceiver={hasReceiver}
        receiverName={receiverName}
        onLink={onLink}
      />
    </div>
  )
}

// 오실로스코프 + 슬라이더 + 일치율 (구역 하나 분량)
function SignalScope({ sector, status, holdSeconds, hasReceiver, receiverName, onLink }) {
  // 무전기가 없으면 아직 연결 안 된 구역은 조작 불가
  const isNoReceiver = !hasReceiver && status !== 'linked'
  const isPlayable = status === 'weak' && hasReceiver
  const holdTarget = holdSeconds * 1000

  const [wave, setWave] = useState(START_WAVE)
  const [noise, setNoise] = useState(() => makeNoise(isNoReceiver ? STATIC_LEVEL : sector.noise))
  const [holdMs, setHoldMs] = useState(0)

  // 이 구역의 연결 신호를 이미 보냈는지 (한 번만 보내기 위한 안전장치)
  const sentRef = useRef(false)

  // 파형과 일치율 계산
  const target = sampleWave(sector.target)
  const player = isPlayable ? sampleWave(wave) : target
  let score = 0
  if (status === 'linked') score = 1
  else if (isPlayable) score = matchScore(player, target)
  const isGood = isPlayable && score >= sector.threshold

  const goodRef = useRef(isGood)
  goodRef.current = isGood

  // 노이즈: 0.12초마다 새로 (연결 전에만). 무전기가 없으면 큰 잡음
  useEffect(() => {
    if (status === 'linked') return undefined
    const level = isNoReceiver ? STATIC_LEVEL : sector.noise
    const timer = setInterval(() => setNoise(makeNoise(level)), 120)
    return () => clearInterval(timer)
  }, [sector.noise, status, isNoReceiver])

  // 유지 시간: 0.1초마다 확인
  useEffect(() => {
    if (!isPlayable) return undefined
    const timer = setInterval(() => {
      setHoldMs((current) => (goodRef.current ? current + 100 : 0))
    }, 100)
    return () => clearInterval(timer)
  }, [isPlayable])

  // 유지 시간을 채우면 연결 (한 번만)
  useEffect(() => {
    if (isPlayable && holdMs >= holdTarget && !sentRef.current) {
      sentRef.current = true
      onLink(sector.id)
    }
  }, [holdMs, holdTarget, isPlayable, onLink, sector.id])

  // 보여 줄 선
  // - 무전기 없음: 잡음만 (가운데 선 근처)
  // - 연결됨: 깨끗한 목표 파형
  // - 그 외: 노이즈로 흔들리는 목표 파형
  let shownTarget = target
  if (isNoReceiver) shownTarget = noise
  else if (status !== 'linked' && noise.length === SAMPLES) shownTarget = target.map((y, i) => y + noise[i])

  // 안내 문구
  let note = `HOLD ${Math.round(sector.threshold * 100)}% FOR ${holdSeconds} SECONDS TO LINK`
  let noteTone = ''
  if (status === 'linked') {
    note = 'LINK ESTABLISHED · TRANSMISSION RECEIVED'
    noteTone = 'is-success'
  } else if (isNoReceiver) {
    note = `NO RECEIVER · REPAIR A RADIO TO GET ${receiverName}`
    noteTone = 'is-warning'
  } else if (isGood) {
    note = 'SIGNAL LOCKING…'
  }

  const holdPercent = status === 'linked' ? 100 : Math.min(100, (holdMs / holdTarget) * 100)

  return (
    <section className="sig-main" aria-labelledby="sig-name">
      <div className="sig-head">
        <div>
          <p className="sig-code">{sector.callsign}</p>
          <h2 id="sig-name" className="sig-name">
            {sector.name}
          </h2>
        </div>
        <dl className={isGood ? 'sig-match is-good' : 'sig-match'}>
          <dt>MATCH</dt>
          <dd>{isNoReceiver ? '--' : `${Math.round(score * 100)}%`}</dd>
        </dl>
      </div>

      <svg className="sig-scope" viewBox={`0 0 ${SCOPE_W} ${SCOPE_H}`} role="img" aria-label="목표 파형과 내 파형">
        {/* 격자 */}
        {[1, 2, 3].map((n) => (
          <line
            key={`h${n}`}
            className="sig-grid-line"
            x1="0"
            x2={SCOPE_W}
            y1={(SCOPE_H / 4) * n}
            y2={(SCOPE_H / 4) * n}
          />
        ))}
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <line
            key={`v${n}`}
            className="sig-grid-line"
            y1="0"
            y2={SCOPE_H}
            x1={(SCOPE_W / 8) * n}
            x2={(SCOPE_W / 8) * n}
          />
        ))}
        {/* 목표 파형 또는 잡음 (주황) */}
        <path className="sig-target" d={toPath(shownTarget)} />
        {/* 내 파형 (흰색) — 조작할 수 있을 때만 */}
        {isPlayable && <path className="sig-player" d={toPath(player)} />}
      </svg>

      {/* 유지 막대 */}
      <div className="sig-hold" aria-hidden="true">
        <div className="sig-hold-fill" style={{ width: `${holdPercent}%` }} />
      </div>

      {/* 슬라이더 3개 (연결된 구역은 목표값으로 고정, 무전기 없으면 잠김) */}
      <div className="sig-controls">
        {CONTROLS.map((control) => {
          const value = status === 'linked' ? sector.target[control.key] : wave[control.key]
          return (
            <label key={control.key} className="sig-control">
              <span>{control.label}</span>
              <input
                type="range"
                min={RANGES[control.key].min}
                max={RANGES[control.key].max}
                step={RANGES[control.key].step}
                value={value}
                disabled={!isPlayable}
                onChange={(event) => setWave({ ...wave, [control.key]: Number(event.target.value) })}
              />
              <output>{control.format(value)}</output>
            </label>
          )
        })}
      </div>

      <p className={`sig-note ${noteTone}`} role="status">
        {note}
      </p>
    </section>
  )
}

// 오른쪽 열: 무전 기록 패널
// 받는 값: sector(선택한 구역), isLinked(연결 여부), itemName(아이템 ID → 이름 함수)
export function SignalTransmission({ sector, isLinked, itemName }) {
  return (
    <section className="sig-tx" aria-labelledby="sig-tx-title">
      <h2 id="sig-tx-title" className="sig-tx-title">
        TRANSMISSION
      </h2>
      <p className="sig-tx-from">{sector.callsign}</p>

      {isLinked ? (
        <>
          <div className="sig-tx-body">
            {sector.transmission.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
          <div className="sig-tx-supply">
            <h3>SUPPLY RECEIVED</h3>
            <ul>
              {sector.rewards.map((reward) => (
                <li key={reward.itemId}>
                  <span>{itemName(reward.itemId)}</span>
                  <span>×{reward.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <p className="sig-tx-empty">NO TRANSMISSION · ESTABLISH LINK</p>
      )}
    </section>
  )
}

export default SignalView