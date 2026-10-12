// 문서 본문을 그리는 컴포넌트입니다.
// JSON의 blocks 배열을 하나씩 보고, 종류(type)에 맞는 모양으로 그립니다.
// 이렇게 하면 공지문, 장부, 보고서가 같은 코드로도 서로 다른 형식으로 보입니다.

// 글자 안의 손상 구간(▓)을 따로 꾸며 줍니다.
// 예: "2432.04.28 ▓▓▓▓ 88 kg" → "2432.04.28 [손상] 88 kg"
function renderText(text) {
  // ▓가 이어진 부분을 기준으로 글자를 나눕니다. (괄호로 감싸면 나눈 기준도 배열에 남음)
  const parts = text.split(/(▓+)/)

  return parts.map((part, index) => {
    if (part.startsWith('▓')) {
      return (
        <span key={index} className="arc-redacted">
          {/* 화면에는 ▓, 화면 낭독기에는 "판독 불가"로 읽힘 */}
          <span aria-hidden="true">{part}</span>
          <span className="sr-only">판독 불가</span>
        </span>
      )
    }
    return part
  })
}

function RecordBody({ blocks }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          // 문서 안의 제목
          case 'heading':
            return (
              <h3 key={index} className="arc-doc-heading">
                {renderText(block.text)}
              </h3>
            )

          // 소제목 (작은 대문자 느낌)
          case 'subheading':
            return (
              <h4 key={index} className="arc-doc-subheading">
                {renderText(block.text)}
              </h4>
            )

          // 문단
          case 'paragraph':
            return <p key={index}>{renderText(block.text)}</p>

          // 목록: ordered가 true면 번호 목록(1. 2. 3.), 아니면 점 목록
          case 'list': {
            const ListTag = block.ordered ? 'ol' : 'ul'
            return (
              <ListTag key={index} className="arc-doc-list">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{renderText(item)}</li>
                ))}
              </ListTag>
            )
          }

          // "항목: 값" 묶음 (보고서·공지의 머리 정보)
          case 'fields':
            return (
              <dl key={index} className="arc-doc-fields">
                {block.items.map((field) => (
                  <div key={field.label}>
                    <dt>{field.label}</dt>
                    <dd>{renderText(field.value)}</dd>
                  </div>
                ))}
              </dl>
            )

          // 표 (장부, 식단표, 개정표)
          case 'table':
            return (
              <div key={index} className="arc-doc-table-wrap">
                <table className="arc-doc-table">
                  <thead>
                    <tr>
                      {block.columns.map((column) => (
                        <th key={column} scope="col">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>{renderText(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )

          // 서명 (오른쪽 정렬)
          case 'signature':
            return (
              <p key={index} className="arc-doc-signature">
                {block.text}
              </p>
            )

          // 모르는 종류는 그리지 않음 (오타가 있어도 화면이 멈추지 않게)
          default:
            return null
        }
      })}
    </>
  )
}

export default RecordBody