import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog'
import { formatTemp } from '../utils/format'
import { getStage, getRepairPercent } from '../utils/controlStage'

// 중앙온도제어시스템 화면의 가운데 내용입니다.
// 받는 값:
// - config: control-system.json 내용
// - system: 저장된 복구도 { repair, maxRepair }
// - inventory: 보유 아이템 { 아이템ID: 수량 }
// - items: items.json 아이템 목록
// - currentTemperature: 지금 평균 온도 (오른쪽 위 INSIDE와 같은 값)
// - onInstall: 부품을 투입할 때 실행할 함수 (아이템 ID를 넘김)
function ControlSystemView({ config, system, inventory, items, currentTemperature, onInstall }) {
  // 목록에서 선택한 아이템 ID
  const [selectedId, setSelectedId] = useState(null)
  // 확인 팝업이 열려 있는지
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  // 방금 투입한 결과 (안내 문구용)
  const [lastInstalled, setLastInstalled] = useState(null)

  // 복구 퍼센트와 단계
  const percent = getRepairPercent(system)
  const stage = getStage(config.stages, percent)
  const isComplete = system.repair >= system.maxRepair

  // 선택한 아이템 정보
  const selectedItem = items.find((item) => item.id === selectedId)
  const selectedPoints = selectedItem?.repair?.[config.id] // 이 시스템 복구 점수
  const selectedOwned = inventory[selectedId] ?? 0

  // INSERT를 누를 수 있는지: 선택함 + 이 시스템에 등록됨 + 수량 있음 + 아직 미완료
  const canInsert = Boolean(selectedItem && selectedPoints && selectedOwned > 0 && !isComplete)

  // 실제로 오를 점수 (만점을 넘지 않게)
  const expectedGain = selectedPoints ? Math.min(selectedPoints, system.maxRepair - system.repair) : 0

  // INSERT 위 안내 문구와 색
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

  // 목록에서 아이템 선택
  function handleSelect(id) {
    setSelectedId(id)
    setLastInstalled(null) // 이전 투입 결과 문구는 지움
  }

  // 확인 팝업에서 CONFIRM
  function handleConfirm() {
    onInstall(selectedItem.id)
    setLastInstalled({ name: selectedItem.name, gained: expectedGain })
  }

  return (
    // tone-xxx: 단계 색 (CONDITION 테두리, REPAIR 숫자에 사용)
    <div className={`ctcs tone-${stage.tone}`}>
      {/* ── 왼쪽·가운데: 카드 2×2 ── */}
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

        {/* 오른쪽 아래 표기 */}
        <p className="ctcs-project">{config.projectLabel}</p>
      </div>

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

              // 클래스 조립: 선택됨 / 쓸 수 없음(미등록 또는 수량 0)
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

          {/* 안내 문구 (role="status": 화면 낭독기가 읽어 줌) */}
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

      {/* 확인 팝업 */}
      {isConfirmOpen && selectedItem && (
        <ConfirmDialog
          title={`INSERT ${selectedItem.name}?`}
          rows={[
            { label: 'PART', value: `${selectedItem.name} × 1` },
            { label: 'REPAIR', value: `+${expectedGain}` },
            {
              label: 'RESULT',
              value: `${system.repair} → ${system.repair + expectedGain} / ${system.maxRepair}`,
            },
            { label: 'STOCK', value: `${selectedOwned} → ${selectedOwned - 1}` },
          ]}
          confirmLabel="CONFIRM INSERT"
          onConfirm={handleConfirm}
          onClose={() => setIsConfirmOpen(false)}
        />
      )}
    </div>
  )
}

export default ControlSystemView