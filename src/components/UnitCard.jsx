import { useState } from 'react'
import PlantListDialog from './PlantListDialog'
import GreenhousePlantDialog from './GreenhousePlantDialog'
import ConfirmDialog from './ConfirmDialog'
import { formatCountdown } from '../utils/format'
// 식물 목록 (JSON 파일에서 불러오기)
import PLANTS from '../data/greenhouse-plants.json'
// 재배 칸·심기 팝업 스타일
import '../styles/greenhouse.css'

// 재배 구역 카드 하나입니다.
// 받는 값:
// - unit: 구역 데이터 (code, crop, temperature, humidity, lightOn, plantListId)
// - state: 저장된 구역 상태 { lightOn, isShutdown, plot }
// - progress: 작물 진행 상황 (greenhouse.js의 getPlotProgress 결과, 비었으면 null)
// - seeds: 심을 수 있는 자원 목록
// - speed: 성장 속도
// - itemName: 아이템 ID → 이름
// - onToggleLight / onToggleShutdown / onPlant(seedId) / onHarvest: 명령 보내기
function UnitCard({
  unit,
  state = { lightOn: unit.lightOn, isShutdown: false, plot: null },
  progress = null,
  seeds = [],
  speed = 1,
  itemName = (id) => id,
  onToggleLight = () => {},
  onToggleShutdown = () => {},
  onPlant = () => {},
  onHarvest = () => {},
}) {
  const { lightOn, isShutdown } = state

  // 팝업들이 열려 있는지
  const [isListOpen, setIsListOpen] = useState(false)          // 식물 목록
  const [isPlantOpen, setIsPlantOpen] = useState(false)        // 심기
  const [isShutdownConfirmOpen, setIsShutdownConfirmOpen] = useState(false) // 작물 있을 때 정지 확인

  // 이 구역의 식물 목록 (이름표로 찾기, 못 찾으면 빈 목록)
  const plants = PLANTS[unit.plantListId] ?? []

  const status = isShutdown ? 'OFFLINE' : 'ACTIVE'

  // SHUTDOWN: 작물이 자라고 있으면 먼저 확인
  function handleShutdown() {
    if (!isShutdown && state.plot) {
      setIsShutdownConfirmOpen(true)
    } else {
      onToggleShutdown()
    }
  }

  // 재배 칸 (상태에 따라 모양이 바뀜)
  function renderPlot() {
    // 정지 중
    if (isShutdown) {
      return <div className="gh-plot is-offline">ZONE OFFLINE</div>
    }

    // 비어 있음 → 심기
    if (!progress) {
      return (
        <button type="button" className="gh-plot is-empty" onClick={() => setIsPlantOpen(true)}>
          + PLANT
        </button>
      )
    }

    // 다 자람 → 수확
    if (progress.isReady) {
      return (
        <button type="button" className="gh-plot is-ready" onClick={onHarvest}>
          READY · HARVEST ↗
        </button>
      )
    }

    // 자라는 중
    return (
      <div className="gh-plot is-growing">
        <p className="gh-plot-name">{itemName(state.plot.seedId)}</p>
        <div
          className="gh-plot-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress.ratio * 100)}
          aria-label="성장 진행도"
        >
          <div className="gh-plot-fill" style={{ width: `${progress.ratio * 100}%` }} />
        </div>
        <p className={progress.isGrowing ? 'gh-plot-time' : 'gh-plot-time is-paused'}>
          {progress.isGrowing ? `${formatCountdown(progress.remainingMs)} LEFT` : 'PAUSED · LIGHT OFF'}
        </p>
      </div>
    )
  }

  return (
    <article className={isShutdown ? 'term-unit is-offline' : 'term-unit'}>
      {/* 구역 정보 */}
      <div className="term-unit-info">
        <h2 className="term-unit-code">
          {/* 카드를 누르면 목록 팝업이 열리는 버튼.
              CSS로 이 버튼의 클릭 영역을 카드 전체로 넓혔습니다. (재배 칸·아래 버튼들은 제외) */}
          <button
            type="button"
            className="term-unit-open"
            onClick={() => setIsListOpen(true)}
            aria-haspopup="dialog"
          >
            {unit.code}
          </button>
        </h2>
        <p className="term-unit-sub">
          {unit.crop} / {status}
        </p>

        <dl className="term-unit-readings">
          <div className="term-unit-row">
            <dt>TEMPERATURE</dt>
            <dd>{isShutdown ? '--' : `${unit.temperature.toFixed(1)} °C`}</dd>
          </div>
          <div className="term-unit-row">
            <dt>HUMIDITY</dt>
            <dd>{isShutdown ? '--' : `${unit.humidity}%`}</dd>
          </div>
        </dl>
      </div>

      {/* 재배 칸 */}
      {renderPlot()}

      {/* 버튼 (카드 클릭 영역보다 위에 있어서 눌러도 팝업이 열리지 않음) */}
      <div className="term-unit-actions">
        <button
          type="button"
          className={lightOn ? 'term-btn term-btn--light is-on' : 'term-btn term-btn--light'}
          onClick={onToggleLight}
          disabled={isShutdown}
        >
          {lightOn ? 'LIGHT OFF' : 'LIGHT ON'}
        </button>
        <button type="button" className="term-btn term-btn--shutdown" onClick={handleShutdown}>
          {isShutdown ? 'RESTART' : 'SHUTDOWN'}
        </button>
      </div>

      {/* 식물 목록 팝업 */}
      {isListOpen && (
        <PlantListDialog title={unit.code} plants={plants} onClose={() => setIsListOpen(false)} />
      )}

      {/* 심기 팝업 */}
      {isPlantOpen && (
        <GreenhousePlantDialog
          title={unit.code}
          seeds={seeds}
          speed={speed}
          onPlant={onPlant}
          onClose={() => setIsPlantOpen(false)}
        />
      )}

      {/* 작물이 있을 때 SHUTDOWN 확인 */}
      {isShutdownConfirmOpen && (
        <ConfirmDialog
          title={`SHUTDOWN ${unit.code}?`}
          rows={[
            { label: 'CROP', value: itemName(state.plot.seedId) },
            { label: 'WARNING', value: 'CROP WILL BE LOST' },
          ]}
          confirmLabel="SHUTDOWN"
          onConfirm={onToggleShutdown}
          onClose={() => setIsShutdownConfirmOpen(false)}
        />
      )}
    </article>
  )
}

export default UnitCard