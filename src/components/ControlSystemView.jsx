import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog'
import HeatMatrix from './HeatMatrix'
import { formatTemp } from '../utils/format'
import { getStage, getRepairPercent } from '../utils/controlStage'

// 중앙온도제어시스템 화면의 가운데 내용입니다.
// 받는 값:
// - config: control-system.json 내용
// - system: 저장된 복구도 { repair, maxRepair }
// - inventory: 보유 아이템 { 아이템ID: 수량 }
// - items: 이 시스템에 넣을 수 있는 아이템 목록
// - currentTemperature: 지금 평균 온도
// - calibration: 매트릭스 시도권 { charges, progress }
// - hasHint: 매트릭스 힌트를 쓸 수 있는지 (정비 보고서 보유)
// - isMatrixOpen: 매트릭스 퍼즐이 열려 있는지 (닫기는 왼쪽 위 돌아가기 버튼이 담당)
// - onOpenMatrix: 매트릭스 퍼즐을 열 때 실행
// - onInstall: 부품 투입 (아이템 ID)
// - onStartCalibration: 매트릭스 시작 (시도권 사용)
// - onFinishCalibration: 매트릭스 끝 (성공 여부)
function ControlSystemView({
  config,
  system,
  inventory,
  items,
  currentTemperature,
  calibration,
  hasHint,
  isMatrixOpen,
  onOpenMatrix,
  onInstall,
  onStartCalibration,
  onFinishCalibration,
}) {
  // ── 부품 투입 ──
  const [selectedId, setSelectedId] = useState(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [lastInstalled, setLastInstalled] = useState(null)

  // ── 매트릭스 ──
  const [isMatrixConfirmOpen, setIsMatrixConfirmOpen] = useState(false)
  // 퍼즐을 열 때마다 새 문제를 만들기 위한 번호
  const [matrixRun, setMatrixRun] = useState(0)

  // 복구 퍼센트와 단계
  const percent = getRepairPercent(system)
  const stage = getStage(config.stages, percent)
  const isComplete = system.repair >= system.maxRepair

  // 매트릭스 난이도와 시도 가능 여부
  const matrix = config.matrix
  const presses = matrix.scrambleByStage[stage.label] ?? matrix.defaultScramble
  const moveLimit = presses + matrix.extraMoves
  const canCalibrate = calibration.charges > 0 && !isComplete
  const isChargesFull = calibration.charges >= matrix.maxCharges

  // 선택한 아이템 정보
  const selectedItem = items.find((item) => item.id === selectedId)
  const selectedPoints = selectedItem?.repair?.[config.id]
  const selectedOwned = inventory[selectedId] ?? 0

  const canInsert = Boolean(selectedItem && selectedPoints && selectedOwned > 0 && !isComplete)
  const expectedGain = selectedPoints ? Math.min(selectedPoints, system.maxRepair - system.repair) : 0

  // INSERT 위 안내 문구
  let hint = 'SELECT A PART'
  let hintTone = ''
  if (isComplete) {
    hint = config.completeMessage
    hintTone = 'is-success'
  } else if (lastInstalled) {
    hint = `${lastInstalled.name} INSTALLED · +${lastInstalled.gained}`
    hintTone = 'is-success'
  } else if (selectedItem && !selectedPoints) {
    hint = 'NOT COMPATIBLE WITH THIS SYSTEM'
    hintTone = 'is-error'
  } else if (selectedItem && selectedOwned < 1) {
    hint = 'OUT OF STOCK'
    hintTone = 'is-error'
  } else if (selectedItem) {
    hint = `${selectedItem.name} · +${selectedPoints}`
  }

  function handleSelect(id) {
    setSelectedId(id)
    setLastInstalled(null)
  }

  function handleConfirm() {
    onInstall(selectedItem.id)
    setLastInstalled({ name: selectedItem.name, gained: expectedGain })
  }

  // 매트릭스 시작 확인 → 시도권 사용 → 새 문제로 퍼즐 열기
  function handleStartMatrix() {
    onStartCalibration()
    setMatrixRun((run) => run + 1)
    onOpenMatrix()
  }

  return (
    <div className={`ctcs tone-${stage.tone}`}>
      {/* ── 왼쪽: 카드 2×2 또는 매트릭스 퍼즐 ── */}
      {isMatrixOpen ? (
        <HeatMatrix
          key={matrixRun}
          title={matrix.title}
          size={matrix.size}
          presses={presses}
          moveLimit={moveLimit}
          reward={matrix.reward}
          showHint={hasHint}
          onFinish={onFinishCalibration}
        />
      ) : (
        <div className="ctcs-grid">
          {/* 지금 평균 온도 (흰 카드) */}
          <section className="ctcs-card ctcs-card--current">
            <h2 className="ctcs-card-title">
              AVERAGE CURRENT
              <br />
              TEMPERATURE
            </h2>
            <p className="ctcs-card-value">{formatTemp(currentTemperature)}</p>
          </section>

          {/* 상태: 큰 글자 = 단계, 작은 글자 = 원인 */}
          <section className="ctcs-card ctcs-condition" aria-live="polite">
            <h2 className="ctcs-card-title">CONDITION</h2>
            <div className="ctcs-condition-body">
              <p className="ctcs-stage">{stage.label}</p>
              <p className="ctcs-cause">{isComplete ? config.completeCause : config.cause}</p>
            </div>
          </section>

          {/* 목표 온도 */}
          <section className="ctcs-card">
            <h2 className="ctcs-card-title">TARGET TEMPERATURE</h2>
            <p className="ctcs-card-value">{config.targetTemperature} °C</p>
          </section>

          {/* 매트릭스 시작 카드 */}
          <button
            type="button"
            className={canCalibrate ? 'ctcs-matrix-card' : 'ctcs-matrix-card is-blocked'}
            aria-disabled={canCalibrate ? undefined : 'true'}
            onClick={() => {
              if (canCalibrate) setIsMatrixConfirmOpen(true)
            }}
          >
            <span className="ctcs-matrix-top">
              <span className="ctcs-matrix-title">{matrix.title}</span>
              <svg className="ctcs-matrix-arrow" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
                <path d="M3 25L25 3M9 3h16v16" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
            <span className="ctcs-matrix-bottom">
              <span className="ctcs-matrix-meta">
                <span>
                  CHARGES {calibration.charges} / {matrix.maxCharges}
                </span>
                <span>
                  {isChargesFull
                    ? 'CHARGES FULL'
                    : `NEXT CHARGE IN ${matrix.expeditionsPerCharge - calibration.progress} EXPEDITIONS`}
                </span>
                {!canCalibrate && (
                  <span className="ctcs-matrix-warning">{isComplete ? 'SYSTEM OPERATIONAL' : 'NO CHARGES'}</span>
                )}
              </span>
              <span className="ctcs-matrix-project">{config.projectLabel}</span>
            </span>
          </button>
        </div>
      )}

      {/* ── 오른쪽: REPAIR + INVENTORY ── */}
      <aside className="ctcs-side">
        <div className="ctcs-repair">
          <span className="ctcs-repair-label">REPAIR</span>
          <span>
            <span className="ctcs-repair-value">{system.repair}</span>
            <span className="ctcs-repair-max"> / {system.maxRepair}</span>
          </span>
        </div>

        <h2 className="ctcs-inv-title">INVENTORY</h2>
        <div className="ctcs-inv">
          <ul className="ctcs-inv-list">
            {items.map((item) => {
              const points = item.repair?.[config.id]
              const owned = inventory[item.id] ?? 0
              const isSelected = item.id === selectedId

              let className = 'ctcs-inv-item'
              if (isSelected) className += ' is-selected'
              if (!points || owned < 1) className += ' is-unavailable'

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={className}
                    aria-pressed={isSelected}
                    onClick={() => handleSelect(item.id)}
                  >
                    <span>{item.name}</span>
                    <span className="ctcs-inv-points">{points ? `+${points}` : 'N/A'}</span>
                    <span className="ctcs-inv-qty">{owned}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          <p className={`ctcs-hint ${hintTone}`} role="status">
            {hint}
          </p>

          <button
            type="button"
            className="ctcs-insert"
            disabled={!canInsert}
            onClick={() => setIsConfirmOpen(true)}
          >
            INSERT
          </button>
        </div>
      </aside>

      {/* 부품 투입 확인 팝업 */}
      {isConfirmOpen && selectedItem && (
        <ConfirmDialog
          title={`INSERT ${selectedItem.name}?`}
          rows={[
            { label: 'PART', value: `${selectedItem.name} × 1` },
            { label: 'REPAIR', value: `+${expectedGain}` },
            { label: 'RESULT', value: `${system.repair} → ${system.repair + expectedGain} / ${system.maxRepair}` },
            { label: 'STOCK', value: `${selectedOwned} → ${selectedOwned - 1}` },
          ]}
          confirmLabel="CONFIRM INSERT"
          onConfirm={handleConfirm}
          onClose={() => setIsConfirmOpen(false)}
        />
      )}

      {/* 매트릭스 시작 확인 팝업 */}
      {isMatrixConfirmOpen && (
        <ConfirmDialog
          title="START CALIBRATION?"
          rows={[
            { label: 'CHARGES', value: `${calibration.charges} → ${calibration.charges - 1}` },
            { label: 'DIFFICULTY', value: `${presses} DISPLACED SECTORS` },
            { label: 'MOVE LIMIT', value: `${moveLimit}` },
            { label: 'REWARD', value: `REPAIR +${matrix.reward}` },
            ...(hasHint ? [{ label: 'HINT', value: 'MAINTENANCE REPORT' }] : []),
          ]}
          confirmLabel="START"
          onConfirm={handleStartMatrix}
          onClose={() => setIsMatrixConfirmOpen(false)}
        />
      )}
    </div>
  )
}

export default ControlSystemView