import { useState } from 'react'
// 메뉴 목록 (JSON 파일에서 불러오기)
import MENUS from '../data/dining-menus.json'

// 메뉴 번호(id)로 메뉴를 찾습니다. 없으면 첫 번째 메뉴를 씁니다.
function findMenu(id) {
  return MENUS.find((menu) => menu.id === id) ?? MENUS[0]
}

// 지금 메뉴를 뺀 나머지 중에서 하나를 랜덤으로 고릅니다.
function pickAnotherMenu(currentId) {
  const others = MENUS.filter((menu) => menu.id !== currentId)
  const randomIndex = Math.floor(Math.random() * others.length)
  return others[randomIndex]
}

// min 이상 max 이하의 정수를 랜덤으로 하나 뽑습니다.
// 예: randomInt(11, 120) → 11, 12, ..., 120 중 하나
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 식당 카드 하나입니다. 지금 메뉴와 인원 수를 카드마다 따로 기억합니다.
// 받는 값: hall (code, capacityRange, maxCapacity, powerLoad, temperature, menuId)
function HallCard({ hall }) {
  // 지금 보여 주는 메뉴 (처음 값은 데이터의 menuId에 해당하는 메뉴)
  const [menu, setMenu] = useState(() => findMenu(hall.menuId))

  // 현재 인원 수: 카드가 처음 만들어질 때(= 다이닝홀에 들어올 때) 한 번만 랜덤으로 정합니다.
  // useState(() => ...) 처럼 함수로 넘기면 처음 한 번만 실행되고,
  // 다이닝홀 안에 있는 동안에는 같은 숫자가 유지됩니다.
  const [capacity] = useState(() => {
    const [min, max] = hall.capacityRange
    return randomInt(min, max)
  })

  // CHANGE MENU 버튼: 다른 메뉴로 바꿉니다.
  function handleChangeMenu() {
    setMenu(pickAnotherMenu(menu.id))
  }

  // 아침·점심·저녁을 같은 모양으로 그리기 위해 배열로 정리
  const meals = [
    { label: 'Breakfast', text: menu.breakfast },
    { label: 'Lunch', text: menu.lunch },
    { label: 'Dinner', text: menu.dinner },
  ]

  return (
    <article className="term-hall">
      <h2 className="term-hall-code">{hall.code}</h2>

      {/* 오늘의 메뉴 상자 */}
      <section className="term-menu" aria-label={`${hall.code} 오늘의 메뉴`}>
        <div className="term-menu-head">
          <h3 className="term-menu-title">TODAY&apos;S MENU</h3>
          <span className="term-menu-no">{menu.id}</span>
        </div>

        {/* key가 바뀌면 목록을 새로 그려서, 메뉴가 바뀔 때 살짝 나타나는 효과가 다시 실행됨 */}
        <dl key={menu.id} className="term-menu-list">
          {meals.map((meal) => (
            <div key={meal.label} className="term-menu-row">
              <dt className="term-menu-tag">{meal.label}</dt>
              <dd>{meal.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 식당 상태 */}
      <dl className="term-hall-stats">
        <div className="term-hall-row">
          <dt>CAPACITY</dt>
          <dd>
            {capacity} /{hall.maxCapacity}
          </dd>
        </div>
        <div className="term-hall-row">
          <dt>POWER LOAD</dt>
          <dd>{hall.powerLoad}</dd>
        </div>
        <div className="term-hall-row">
          <dt>TEMPERATURE</dt>
          <dd>{hall.temperature.toFixed(1)} °C</dd>
        </div>
      </dl>

      {/* 경고 문구 + 메뉴 변경 버튼 */}
      <div className="term-hall-actions">
        <p className="term-hall-warning">Do not press indiscriminately.</p>
        <button type="button" className="term-btn term-btn--menu" onClick={handleChangeMenu}>
          CHANGE MENU
        </button>
      </div>
    </article>
  )
}

export default HallCard