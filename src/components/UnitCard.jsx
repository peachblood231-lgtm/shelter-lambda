import { useState } from 'react'
import PlantListDialog from './PlantListDialog'
// 식물 목록 (JSON 파일에서 불러오기)
import PLANTS from '../data/greenhouse-plants.json'

// 재배 구역 카드 하나입니다. 조명·SHUTDOWN·목록 팝업 상태를 카드마다 따로 기억합니다.
// 받는 값: unit (code, crop, temperature, humidity, lightOn, plantListId)
function UnitCard({ unit }) {
  // 조명이 켜져 있는지 (처음 값은 데이터의 lightOn)
  const [lightOn, setLightOn] = useState(unit.lightOn)
  // 구역이 정지(SHUTDOWN)되었는지
  const [isShutdown, setIsShutdown] = useState(false)
  // 식물 목록 팝업이 열려 있는지
  const [isListOpen, setIsListOpen] = useState(false)

  // 이 구역의 식물 목록: 이름표(plantListId)로 찾아옵니다.
  // 이름표가 틀려서 못 찾으면 빈 목록([])을 씁니다.
  const plants = PLANTS[unit.plantListId] ?? []

  // 화면에 보여 줄 상태 글자
  const status = isShutdown ? 'OFFLINE' : 'ACTIVE'

  // 조명 버튼: 켜져 있으면 끄고, 꺼져 있으면 켭니다.
  function handleLight() {
    setLightOn(!lightOn)
  }

  // SHUTDOWN 버튼: 정지시키면 조명도 함께 끕니다. 다시 누르면(RESTART) 복구.
  function handleShutdown() {
    if (isShutdown) {
      setIsShutdown(false)
    } else {
      setIsShutdown(true)
      setLightOn(false)
    }
  }

  return (
    <article className={isShutdown ? 'term-unit is-offline' : 'term-unit'}>
      {/* 구역 정보 */}
      <div className="term-unit-info">
        <h2 className="term-unit-code">
          {/* 카드를 누르면 목록 팝업이 열리는 버튼.
              CSS로 이 버튼의 클릭 영역을 카드 전체로 넓혔습니다. (아래 버튼들은 제외) */}
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
            {/* 정지 상태면 측정값 대신 -- 표시 */}
            <dd>{isShutdown ? '--' : `${unit.temperature.toFixed(1)} °C`}</dd>
          </div>
          <div className="term-unit-row">
            <dt>HUMIDITY</dt>
            <dd>{isShutdown ? '--' : `${unit.humidity}%`}</dd>
          </div>
        </dl>
      </div>

      {/* 버튼 (카드 클릭 영역보다 위에 있어서 눌러도 팝업이 열리지 않음) */}
      <div className="term-unit-actions">
        <button
          type="button"
          // 켜져 있으면 is-on 클래스를 붙여 파란 버튼으로 표시
          className={lightOn ? 'term-btn term-btn--light is-on' : 'term-btn term-btn--light'}
          onClick={handleLight}
          disabled={isShutdown} // 정지 상태에서는 조명 조작 불가
        >
          {lightOn ? 'LIGHT OFF' : 'LIGHT ON'}
        </button>
        <button type="button" className="term-btn term-btn--shutdown" onClick={handleShutdown}>
          {isShutdown ? 'RESTART' : 'SHUTDOWN'}
        </button>
      </div>

      {/* 식물 목록 팝업 (열려 있을 때만 화면에 나타남) */}
      {isListOpen && (
        <PlantListDialog
          title={unit.code}
          plants={plants}
          onClose={() => setIsListOpen(false)}
        />
      )}
    </article>
  )
}

export default UnitCard