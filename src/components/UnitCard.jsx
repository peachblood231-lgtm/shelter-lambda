import { useState } from 'react'
import PlantListDialog from './PlantListDialog'
import GreenhousePlantDialog from './GreenhousePlantDialog'
import ConfirmDialog from './ConfirmDialog'
import { formatCountdown } from '../utils/format'
import { useT } from '../i18n/strings'
import PLANTS from '../data/greenhouse-plants.json'
import '../styles/greenhouse.css'

// 재배 구역 카드 하나입니다.
// 받는 값:
// - unit: 구역 데이터 (code, crop, temperature, humidity, lightOn, plantListId)
// - state: 저장된 구역 상태 { lightOn, isShutdown, plot }
// - progress: 작물 진행 상황 (비었으면 null)
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
  const t = useT()
  const { lightOn, isShutdown } = state

  const [isListOpen, setIsListOpen] = useState(false)
  const [isPlantOpen, setIsPlantOpen] = useState(false)
  const [isShutdownConfirmOpen, setIsShutdownConfirmOpen] = useState(false)

  const plants = PLANTS[unit.plantListId] ?? []
  const status = isShutdown ? t('unit.offline') : t('unit.active')

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
    if (isShutdown) {
      return <div className="gh-plot is-offline">{t('plot.offline')}</div>
    }

    if (!progress) {
      return (
        <button type="button" className="gh-plot is-empty" onClick={() => setIsPlantOpen(true)}>
          {t('plot.plant')}
        </button>
      )
    }

    if (progress.isReady) {
      return (
        <button type="button" className="gh-plot is-ready" onClick={onHarvest}>
          {t('plot.harvest')}
        </button>
      )
    }

    return (
      <div className="gh-plot is-growing">
        <p className="gh-plot-name">{itemName(state.plot.seedId)}</p>
        <div
          className="gh-plot-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress.ratio * 100)}
          aria-label={t('plot.progress')}
        >
          <div className="gh-plot-fill" style={{ width: `${progress.ratio * 100}%` }} />
        </div>
        <p className={progress.isGrowing ? 'gh-plot-time' : 'gh-plot-time is-paused'}>
          {progress.isGrowing
            ? t('plot.left', { time: formatCountdown(progress.remainingMs) })
            : t('plot.paused')}
        </p>
      </div>
    )
  }

  return (
    <article className={isShutdown ? 'term-unit is-offline' : 'term-unit'}>
      <div className="term-unit-info">
        <h2 className="term-unit-code">
          {/* 카드 전체 클릭 영역 → 식물 목록 팝업 */}
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
            <dt>{t('unit.temperature')}</dt>
            <dd>{isShutdown ? '--' : `${unit.temperature.toFixed(1)} °C`}</dd>
          </div>
          <div className="term-unit-row">
            <dt>{t('unit.humidity')}</dt>
            <dd>{isShutdown ? '--' : `${unit.humidity}%`}</dd>
          </div>
        </dl>
      </div>

      {/* 재배 칸 */}
      {renderPlot()}

      <div className="term-unit-actions">
        <button
          type="button"
          className={lightOn ? 'term-btn term-btn--light is-on' : 'term-btn term-btn--light'}
          onClick={onToggleLight}
          disabled={isShutdown}
        >
          {lightOn ? t('unit.lightOff') : t('unit.lightOn')}
        </button>
        <button type="button" className="term-btn term-btn--shutdown" onClick={handleShutdown}>
          {isShutdown ? t('unit.restart') : t('unit.shutdown')}
        </button>
      </div>

      {isListOpen && (
        <PlantListDialog title={unit.code} plants={plants} onClose={() => setIsListOpen(false)} />
      )}

      {isPlantOpen && (
        <GreenhousePlantDialog
          title={unit.code}
          seeds={seeds}
          speed={speed}
          onPlant={onPlant}
          onClose={() => setIsPlantOpen(false)}
        />
      )}

      {isShutdownConfirmOpen && (
        <ConfirmDialog
          title={t('unit.shutdownTitle', { code: unit.code })}
          rows={[
            { label: t('unit.rowCrop'), value: itemName(state.plot.seedId) },
            { label: t('unit.rowWarning'), value: t('unit.cropLost') },
          ]}
          confirmLabel={t('unit.shutdown')}
          onConfirm={onToggleShutdown}
          onClose={() => setIsShutdownConfirmOpen(false)}
        />
      )}
    </article>
  )
}

export default UnitCard