import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog'
import { getRations, planRationUse, hasRequirements, resolveRequirements, canCraft } from '../game/expedition'
import { useT } from '../i18n/strings'
import '../styles/expedition.css'

// 인벤토리 분류 (보여 줄 순서). 이름은 번역 사전의 category.○○
const CATEGORY_IDS = ['repair', 'food', 'gear', 'greenhouse', 'document', 'supply', 'special', 'collectible']

// 탐사 화면의 가운데 내용입니다.
// 받는 값:
// - config: expedition.json 내용
// - inventory: 보유 아이템 { 아이템ID: 수량 }
// - items: items.json 아이템 목록
// - recipes: recipes.json 조합 레시피 목록
// - onLaunch: 탐사 실행 함수 (지역 ID → 결과 보고, 실패 시 null)
// - onCraft: 조합 실행 함수 (레시피 ID)
function ExpeditionView({ config, inventory, items, recipes, onLaunch, onCraft }) {
  const t = useT()

  const [pendingId, setPendingId] = useState(null)
  const [craftPendingId, setCraftPendingId] = useState(null)
  const [report, setReport] = useState(null)
  const [selectedItemId, setSelectedItemId] = useState(null)

  const findItem = (id) => items.find((item) => item.id === id)
  const itemName = (id) => findItem(id)?.name ?? id
  const categoryLabel = (id) => (id ? t(`category.${id}`) : '')
  const recipeAction = (recipe) => t(`craft.${recipe.label}`)

  const rations = getRations(inventory, items)

  // 지역마다 출발 가능 여부와 이유
  function getLocationStatus(location) {
    const plan = planRationUse(inventory, items, location.rationCost)
    if (!hasRequirements(location, inventory)) {
      const firstNeed = location.requires[0]
      return { canGo: false, plan, reason: t('exp.requires', { item: itemName(firstNeed.itemIds[0]) }) }
    }
    if (!plan) return { canGo: false, plan, reason: t('exp.insufficient') }
    return { canGo: true, plan, reason: '' }
  }

  // 카드 아래 비용 글자
  function getCostText(location) {
    const parts = [t('exp.cost', { count: location.rationCost })]
    for (const need of location.requires) {
      parts.push(`${need.itemIds.map(itemName).join(' / ')} ×${need.count}`)
    }
    return parts.join(' · ')
  }

  function handleLaunchConfirm() {
    const result = onLaunch(pendingId)
    if (result) setReport(result)
  }

  function handleCraftConfirm() {
    const recipe = recipes.find((candidate) => candidate.id === craftPendingId)
    onCraft(recipe.id)
    setSelectedItemId(recipe.output.itemId)
  }

  // ── 출발 확인 팝업에 필요한 값 ──
  const pendingLocation = config.locations.find((location) => location.id === pendingId)
  const pendingStatus = pendingLocation ? getLocationStatus(pendingLocation) : null
  const pendingGear = pendingLocation ? resolveRequirements(pendingLocation, inventory) : []
  const pendingRisk = pendingGear.map((gear) => findItem(gear.itemId)?.earlyReturn).find((risk) => risk)

  // ── 선택한 아이템과 그 아이템으로 시작하는 레시피 ──
  const selectedItem = findItem(selectedItemId)
  const selectedRecipe = recipes.find((recipe) => recipe.inputs[0].itemId === selectedItemId)
  const craftPending = recipes.find((recipe) => recipe.id === craftPendingId)

  return (
    <div className="exp">
      {/* ── 왼쪽: 지역 카드 2×2 또는 결과 보고 ── */}
      {report ? (
        <section className="exp-report" aria-labelledby="exp-report-title">
          <p className="exp-report-code">{t('exp.report')}</p>
          <h2 id="exp-report-title" className="exp-report-title">
            {config.locations.find((location) => location.id === report.locationId)?.name}
          </h2>

          {report.earlyReturn && (
            <p className="exp-report-alert" role="status">
              {t('exp.earlyReturn')}
            </p>
          )}

          <div className="exp-report-cols">
            <div>
              <h3>{t('exp.consumed')}</h3>
              <ul>
                {report.gear.map((gear) => (
                  <li key={gear.itemId}>
                    <span>{itemName(gear.itemId)}</span>
                    <span>×{gear.count}</span>
                  </li>
                ))}
                {Object.entries(report.rationsUsed).map(([foodId, count]) => (
                  <li key={foodId}>
                    <span>{itemName(foodId)}</span>
                    <span>×{count}</span>
                  </li>
                ))}
                <li className="exp-report-total">
                  <span>{t('exp.rations')}</span>
                  <span>−{report.rationTotal}</span>
                </li>
              </ul>
            </div>

            <div>
              <h3>{t('exp.recovered')}</h3>
              {report.found.length === 0 ? (
                <p className="exp-report-empty">{t('exp.nothing')}</p>
              ) : (
                <ul>
                  {report.found.map((itemId, index) => (
                    <li key={`${itemId}-${index}`}>
                      <span>{itemName(itemId)}</span>
                      <span className="exp-tag">{categoryLabel(findItem(itemId)?.category)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <button type="button" className="term-back exp-report-back" onClick={() => setReport(null)}>
            {t('exp.back')}
          </button>
        </section>
      ) : (
        <div className="exp-cards">
          {config.locations.map((location) => {
            const status = getLocationStatus(location)
            return (
              <button
                key={location.id}
                type="button"
                className={status.canGo ? 'exp-card' : 'exp-card is-blocked'}
                aria-disabled={status.canGo ? undefined : 'true'}
                onClick={() => {
                  if (status.canGo) setPendingId(location.id)
                }}
              >
                <span className="exp-card-top">
                  <span className="exp-card-name">{location.name}</span>
                  <svg className="exp-card-arrow" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
                    <path d="M3 25L25 3M9 3h16v16" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </span>
                <span className="exp-card-meta">
                  <span>{getCostText(location)}</span>
                  {!status.canGo && <span className="exp-card-warning">{status.reason}</span>}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── 오른쪽: 인벤토리 ── */}
      <aside className="exp-inv" aria-labelledby="exp-inv-title">
        <div className="exp-inv-head">
          <h2 id="exp-inv-title" className="exp-inv-title">
            INVENTORY
          </h2>
          <p className="exp-inv-rations">
            {t('exp.rations')} <strong>{rations}</strong>
          </p>
        </div>

        <div className="exp-inv-list">
          {CATEGORY_IDS.map((categoryId) => {
            const owned = items.filter((item) => item.category === categoryId && (inventory[item.id] ?? 0) > 0)
            if (owned.length === 0) return null
            return (
              <section key={categoryId} className="exp-inv-group">
                <h3>{categoryLabel(categoryId)}</h3>
                <ul>
                  {owned.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={item.id === selectedItemId ? 'exp-inv-item is-selected' : 'exp-inv-item'}
                        aria-pressed={item.id === selectedItemId}
                        onClick={() => setSelectedItemId(item.id)}
                      >
                        <span>{item.name}</span>
                        <span className="exp-inv-qty">{inventory[item.id]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>

        {/* 선택한 아이템 설명 + (있으면) 조합 */}
        <div className="exp-inv-detail" aria-live="polite">
          {selectedItem ? (
            <>
              <p className="exp-inv-detail-name">{selectedItem.name}</p>
              <p>{selectedItem.description}</p>
              {selectedItem.food && (
                <p className="exp-inv-detail-stat">{t('exp.statRation', { count: selectedItem.food })}</p>
              )}
              {selectedItem.repair?.['temperature-control'] && (
                <p className="exp-inv-detail-stat">
                  {t('exp.statRepair', { count: selectedItem.repair['temperature-control'] })}
                </p>
              )}
              {selectedItem.earlyReturn && (
                <p className="exp-inv-detail-stat is-warning">
                  {t('exp.statRisk', { count: Math.round(selectedItem.earlyReturn.chance * 100) })}
                </p>
              )}

              {selectedRecipe && (
                <div className="exp-recipe">
                  <p className="exp-recipe-title">
                    {recipeAction(selectedRecipe)} → {itemName(selectedRecipe.output.itemId)}
                  </p>
                  <ul>
                    {selectedRecipe.inputs.map((input) => {
                      const owned = inventory[input.itemId] ?? 0
                      return (
                        <li key={input.itemId} className={owned < input.count ? 'is-missing' : undefined}>
                          <span>{itemName(input.itemId)}</span>
                          <span>
                            {owned} / {input.count}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                  <button
                    type="button"
                    className="exp-mend-btn"
                    disabled={!canCraft(selectedRecipe, inventory)}
                    onClick={() => setCraftPendingId(selectedRecipe.id)}
                  >
                    {recipeAction(selectedRecipe)}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="exp-inv-detail-muted">{t('exp.selectItem')}</p>
          )}
        </div>
      </aside>

      {/* 출발 확인 팝업 */}
      {pendingLocation && pendingStatus?.canGo && (
        <ConfirmDialog
          title={t('exp.deployTitle', { location: pendingLocation.name })}
          rows={[
            { label: t('exp.rowDestination'), value: pendingLocation.name },
            { label: t('exp.rowRations'), value: `${rations} → ${rations - pendingStatus.plan.total}` },
            ...pendingGear.map((gear) => ({
              label: itemName(gear.itemId),
              value: `${inventory[gear.itemId] ?? 0} → ${(inventory[gear.itemId] ?? 0) - gear.count}`,
            })),
            { label: t('exp.rowSearch'), value: t('exp.searchValue', { count: pendingLocation.rolls }) },
            ...(pendingRisk
              ? [
                  {
                    label: t('exp.rowRisk'),
                    value: t('exp.riskValue', { count: Math.round(pendingRisk.chance * 100) }),
                  },
                ]
              : []),
          ]}
          confirmLabel={t('exp.deploy')}
          onConfirm={handleLaunchConfirm}
          onClose={() => setPendingId(null)}
        />
      )}

      {/* 조합 확인 팝업 */}
      {craftPending && (
        <ConfirmDialog
          title={t('craft.title', {
            action: recipeAction(craftPending),
            item: itemName(craftPending.inputs[0].itemId),
          })}
          rows={[
            ...craftPending.inputs.map((input) => ({
              label: itemName(input.itemId),
              value: `${inventory[input.itemId] ?? 0} → ${(inventory[input.itemId] ?? 0) - input.count}`,
            })),
            {
              label: t('craft.rowResult'),
              value: `${itemName(craftPending.output.itemId)} ×${craftPending.output.count}`,
            },
          ]}
          confirmLabel={recipeAction(craftPending)}
          onConfirm={handleCraftConfirm}
          onClose={() => setCraftPendingId(null)}
        />
      )}
    </div>
  )
}

export default ExpeditionView