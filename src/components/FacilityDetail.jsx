import UnitCard from './UnitCard'
import HallCard from './HallCard'
import ResidentialFloors from './ResidentialFloors'
import BinaryRain from './BinaryRain'

// 시설 화면의 가운데 내용입니다. 시설 데이터에 무엇이 있느냐에 따라 다르게 보여 줍니다.
// - units(재배 구역)가 있으면 → 구역 카드 (예: GREENHOUSE)
//   + 조명이 모두 꺼지면 0과 1의 화면
// - halls(식당)가 있으면 → 식당 카드 (예: DINING HALL)
// - floors(층)가 있으면 → 층 카드 가로 스크롤 (예: RESIDENTIAL)
// - 아무것도 없으면 → 출입 상태와 설명
// 받는 값:
// - facility: 시설 정보
// - getUnitProps: (선택) 재배 구역 카드에 넘길 게임 정보를 만드는 함수 (구역 → 추가 값)
function FacilityDetail({ facility, getUnitProps }) {
  if (facility.units) {
    // 구역마다 카드에 넘길 값을 한 번씩만 만들어 둠
    const unitViews = facility.units.map((unit) => ({
      unit,
      props: getUnitProps ? getUnitProps(unit) : {},
    }))

    // 저장된 상태가 있고, 모든 구역의 조명이 꺼져 있는지
    const isAllLightsOff =
      Boolean(getUnitProps) && unitViews.every(({ props }) => props.state && !props.state.lightOn)

    return (
      <>
        <div className="term-units">
          {unitViews.map(({ unit, props }) => (
            <UnitCard key={unit.id} unit={unit} {...props} />
          ))}
        </div>

        {isAllLightsOff && (
          <BinaryRain
            zones={unitViews.map(({ unit, props }) => ({
              id: unit.id,
              code: unit.code,
              isShutdown: props.state.isShutdown,
              onLightOn: props.onToggleLight,
              onRestart: props.onToggleShutdown,
            }))}
          />
        )}
      </>
    )
  }

  if (facility.halls) {
    return (
      <div className="term-halls">
        {facility.halls.map((hall) => (
          <HallCard key={hall.id} hall={hall} />
        ))}
      </div>
    )
  }

  if (facility.floors) {
    return (
      <ResidentialFloors
        floors={facility.floors}
        sectors={facility.sectors}
        lightOn={facility.lightOn}
      />
    )
  }

  return (
    <section className="term-detail" aria-label={`${facility.name} 정보`}>
      <div className="term-detail-top">
        <span className={`term-tag term-tag--${facility.access}`}>
          {facility.access.toUpperCase()}
        </span>
      </div>
      <p className="term-detail-desc">{facility.description}</p>
    </section>
  )
}

export default FacilityDetail