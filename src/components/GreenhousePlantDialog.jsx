import { useEffect, useRef, useState } from 'react'
import { formatCountdown } from '../utils/format'
import { useT } from '../i18n/strings'

// 온실 "심기" 팝업입니다.
// 받는 값:
// - title: 구역 이름 (예: B1 - A - 03)
// - seeds: 심을 수 있는 자원 목록 [{ seedId, name, owned, minutes, harvest: [{ name, count }] }]
// - speed: 지금 성장 속도 (시간 표시에 반영)
// - onPlant: 심기 (씨앗 ID)
// - onClose: 팝업이 닫혔을 때
function GreenhousePlantDialog({ title, seeds, speed, onPlant, onClose }) {
  const t = useT()
  const dialogRef = useRef(null)
  const [selectedId, setSelectedId] = useState(seeds[0]?.seedId ?? null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  function closeDialog() {
    dialogRef.current?.close()
  }

  function handlePlant() {
    if (!selectedId) return
    onPlant(selectedId)
    closeDialog()
  }

  function handleClick(event) {
    if (event.target === dialogRef.current) closeDialog()
  }

  return (
    <dialog
      ref={dialogRef}
      className="term-confirm gh-plant-dialog"
      aria-labelledby="gh-plant-title"
      onClose={onClose}
      onClick={handleClick}
    >
      <div className="term-confirm-inner">
        <h2 id="gh-plant-title" className="term-confirm-title">
          {t('plant.title', { code: title })}
        </h2>
        <button type="button" className="term-plants-close" aria-label={t('common.close')} onClick={closeDialog} />

        {seeds.length === 0 ? (
          <p className="gh-plant-empty">{t('plant.empty')}</p>
        ) : (
          <ul className="gh-plant-list">
            {seeds.map((seed) => {
              const isSelected = seed.seedId === selectedId
              return (
                <li key={seed.seedId}>
                  <button
                    type="button"
                    className={isSelected ? 'gh-plant-option is-selected' : 'gh-plant-option'}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedId(seed.seedId)}
                  >
                    <span className="gh-plant-name">
                      {seed.name} <span className="gh-plant-owned">×{seed.owned}</span>
                    </span>
                    <span className="gh-plant-meta">
                      {formatCountdown((seed.minutes * 60 * 1000) / speed)} →{' '}
                      {seed.harvest.map((item) => `${item.name} ×${item.count}`).join(', ')}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="term-confirm-actions">
          <button type="button" className="term-confirm-btn" onClick={closeDialog}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="term-confirm-btn term-confirm-btn--primary"
            disabled={!selectedId}
            onClick={handlePlant}
          >
            {t('plant.confirm')}
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default GreenhousePlantDialog