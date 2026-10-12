// 탐사·조합 계산 함수 모음입니다.
// 화면과 명령 처리(gameReducer) 양쪽에서 같은 규칙을 쓰기 위해 한곳에 모았습니다.

// 1 ~ sides 사이의 정수 하나 (예: rollDie(100) → 1~100)
function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1
}

// 배열에서 하나를 무작위로 고르기
function pickOne(list) {
  return list[Math.floor(Math.random() * list.length)]
}

// ── 식량 ──

// 지금 가진 식량의 배급량 합계 (예: 건빵 2개 × 6 + 단백질 바 2개 × 5 = 22)
export function getRations(inventory, items) {
  return items.reduce((sum, item) => sum + (item.food ?? 0) * (inventory[item.id] ?? 0), 0)
}

// 출발에 필요한 식량을 어떤 아이템으로 낼지 정합니다. (배급량이 낮은 식량부터)
// 돌려주는 값: { use: { 아이템ID: 개수 }, total: 실제로 쓴 배급량 } / 부족하면 null
export function planRationUse(inventory, items, cost) {
  if (cost <= 0) return { use: {}, total: 0 }

  const foods = items.filter((item) => item.food).sort((a, b) => a.food - b.food)
  const use = {}
  let total = 0

  for (const food of foods) {
    let owned = inventory[food.id] ?? 0
    while (owned > 0 && total < cost) {
      use[food.id] = (use[food.id] ?? 0) + 1
      owned -= 1
      total += food.food
    }
    if (total >= cost) break
  }

  return total >= cost ? { use, total } : null
}

// ── 출발에 필요한 장비 (예: 방한복) ──

// 조건 하나에 대해 가진 것 중 무엇을 쓸지 고릅니다. 목록 앞에 적힌 것이 우선.
// 예: ["cold-weather-suit", "patched-cold-weather-suit"] → 멀쩡한 방한복이 있으면 그것부터
export function pickRequirementItem(need, inventory) {
  return need.itemIds.find((id) => (inventory[id] ?? 0) >= need.count) ?? null
}

// 모든 조건을 채울 수 있는지
export function hasRequirements(location, inventory) {
  return location.requires.every((need) => pickRequirementItem(need, inventory) !== null)
}

// 실제로 소모할 장비 목록 [{ itemId, count }]
export function resolveRequirements(location, inventory) {
  return location.requires.map((need) => ({
    itemId: pickRequirementItem(need, inventory),
    count: need.count,
  }))
}

// ── 주사위 ──

// 탐사 결과(얻은 아이템 ID 목록)를 굴립니다.
// - 지역 전용 표(location.lootTable)가 있으면 그 표, 없으면 공용 표(defaultTable)
// - 주사위 크기는 표의 마지막 번호
// - "한 번만 얻는(unique)" 아이템을 이미 가지고 있으면 다시 굴림 (최대 10번)
// - 마지막에 보너스를 확률대로 따로 굴림
export function rollExpedition(location, defaultTable, inventory, items) {
  const table = location.lootTable ?? defaultTable
  const sides = Math.max(...table.map((row) => row.to))
  const found = []

  const isOwned = (id) => (inventory[id] ?? 0) > 0 || found.includes(id)
  const isUnique = (id) => Boolean(items.find((item) => item.id === id)?.unique)

  for (let i = 0; i < location.rolls; i += 1) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const roll = rollDie(sides)
      const entry = table.find((row) => roll >= row.from && roll <= row.to)
      if (!entry) continue

      const candidates = entry.itemIds.filter((id) => !(isUnique(id) && isOwned(id)))
      if (candidates.length === 0) continue

      found.push(pickOne(candidates))
      break
    }
  }

  for (const bonus of location.bonus) {
    if (Math.random() < bonus.chance) {
      found.push(bonus.itemId)
    }
  }

  return found
}

// ── 탐사 준비 (출발 확인 → 조기 귀환 판정 → 주사위) ──
// 돌려주는 값: { found, gear, plan, earlyReturn } / 출발할 수 없으면 null
export function prepareExpedition(location, defaultTable, inventory, items) {
  if (!hasRequirements(location, inventory)) return null

  const plan = planRationUse(inventory, items, location.rationCost)
  if (!plan) return null

  const gear = resolveRequirements(location, inventory)

  // 위험한 장비(예: 덧댄 방한복)를 쓰면 확률적으로 일찍 돌아옴
  // → 주사위 횟수가 줄고 보너스도 없음
  let rolls = location.rolls
  let earlyReturn = false
  for (const used of gear) {
    const risk = items.find((item) => item.id === used.itemId)?.earlyReturn
    if (risk && Math.random() < risk.chance) {
      earlyReturn = true
      rolls = Math.min(rolls, risk.rolls)
    }
  }

  const found = rollExpedition(
    { ...location, rolls, bonus: earlyReturn ? [] : location.bonus },
    defaultTable,
    inventory,
    items,
  )

  return { found, gear, plan, earlyReturn }
}

// ── 조합 ──

// 레시피의 재료를 모두 가지고 있는지
export function canCraft(recipe, inventory) {
  return recipe.inputs.every((input) => (inventory[input.itemId] ?? 0) >= input.count)
}