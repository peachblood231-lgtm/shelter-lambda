import UnitCard from './UnitCard'
import HallCard from './HallCard'
import ResidentialFloors from './ResidentialFloors'

// 시설 화면의 가운데 내용입니다. 시설 데이터에 무엇이 있느냐에 따라 다르게 보여 줍니다.
// - units(재배 구역)가 있으면 → 구역 카드 (예: GREENHOUSE)
// - halls(식당)가 있으면 → 식당 카드 (예: DINING HALL)
// - floors(층)가 있으면 → 층 카드 가로 스크롤 (예: RESIDENTIAL)
// - 아무것도 없으면 → 출입 상태와 설명 (다른 시설 디자인이 나오면 바꿀 예정)
// 받는 값: facility (시설 정보)
function FacilityDetail({ facility }) {
  if (facility.units) {
    return (
      <div className="term-units">
        {facility.units.map((unit) => (
          <UnitCard key={unit.id} unit={unit} />
        ))}
      </div>
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
        {/* 'accessible' → 'ACCESSIBLE'처럼 대문자로 바꿔 표시 */}
        <span className={`term-tag term-tag--${facility.access}`}>
          {facility.access.toUpperCase()}
        </span>
      </div>
      <p className="term-detail-desc">{facility.description}</p>
    </section>
  )
}

export default FacilityDetail