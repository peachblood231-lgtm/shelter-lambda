import { formatTemp } from '../utils/format'
import LanguageToggle from './LanguageToggle'
import { useT } from '../i18n/strings'
// 구역 목록 버튼 스타일
import '../styles/signal.css'

// 화면 오른쪽 위 구석의 작은 상태 표시입니다.
// 받는 값:
// - status: 주민 수, 구역 목록
// - inside / outside: 지금 온도 숫자
// - rations: 지금 가진 식량 합계
// - linkedSectors: 신호가 연결된 구역 이름 목록 (예: ['THETA'])
// - onOpenSignal: 구역 목록을 눌렀을 때 실행 (신호 화면 열기)
function StatusPanel({ status, inside, outside, rations, linkedSectors = [], onOpenSignal }) {
  const t = useT()

  return (
    <aside className="term-readout" aria-label={t('readout.label')}>
      <dl className="term-readout-list">
        <div className="term-readout-row">
          <dt>{t('readout.inside')}</dt>
          <dd>{formatTemp(inside)}</dd>
        </div>
        <div className="term-readout-row">
          <dt>{t('readout.outside')}</dt>
          <dd>{formatTemp(outside)}</dd>
        </div>
        <div className="term-readout-row">
          <dt>{t('readout.residents')}</dt>
          <dd>{status.residents}</dd>
        </div>
        <div className="term-readout-row">
          <dt>{t('readout.rations')}</dt>
          <dd>{rations}</dd>
        </div>
      </dl>

      {/* 구역 목록 전체가 버튼: 누르면 신호 복구 화면 (구역 이름은 고유명사라 영어 그대로) */}
      <button type="button" className="term-signal" onClick={onOpenSignal} aria-label={t('readout.signalAria')}>
        {status.sectors.map((sector) => {
          const isLinked = linkedSectors.includes(sector)
          return (
            <span key={sector} className="term-signal-row">
              <span>{sector}</span>
              <span className={isLinked ? 'is-linked' : undefined}>
                {isLinked ? t('readout.linked') : '···'}
              </span>
            </span>
          )
        })}
        <span className="term-signal-cta">{t('readout.signal')}</span>
      </button>

      {/* 언어 전환 */}
      <LanguageToggle className="lang-toggle--readout" />
    </aside>
  )
}

export default StatusPanel