import UnitCard from './UnitCard'
import HallCard from './HallCard'
import ResidentialFloors from './ResidentialFloors'
import BinaryRain from './BinaryRain'
import { useLanguage } from '../i18n/language'
import { useT, pick } from '../i18n/strings'

// 시설 화면의 가운데 내용입니다.
// 받는 값:
// - facility: 시설 정보
// - getUnitProps: (선택) 재배 구역 카드에 넘길 게임 정보를 만드는 함수
// - residentialProps: (선택) 레지덴셜에 넘길 값 { repairPercent, layouts, onSaveLayout }
function FacilityDetail({ facility, getUnitProps, residentialProps = {} }) {
  const t = useT()
  const lang = useLanguage()

  if (facility.units) {
    const unitViews = facility.units.map((unit) => ({
      unit,
      props: getUnitProps ? getUnitProps(unit) : {},
    }))

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
        {...residentialProps}
      />
    )
  }

  return (
    <section className="term-detail" aria-label={t('facility.info', { name: facility.name })}>
      <div className="term-detail-top">
        <span className={`term-tag term-tag--${facility.access}`}>
          {t(`facility.${facility.access}`)}
        </span>
      </div>
      <p className="term-detail-desc">{pick(facility.description, lang)}</p>
    </section>
  )
}

export default FacilityDetail