// Vykreslí text a promění webové adresy (https://…, www.…) v klikatelné
// odkazy. Bezpečně — žádné HTML z uživatelského vstupu, jen React elementy.
// Přívětivé k poskytovatelům: kdo si do popisku dá svůj web, má ho klikací.

const URL_REGEX = /((?:https?:\/\/|www\.)[^\s<>"']+)/gi

function toHref(url) {
  return url.startsWith('http') ? url : `https://${url}`
}

export default function LinkifiedText({ text, className, style }) {
  if (!text) return null
  const parts = text.split(URL_REGEX)
  return (
    <p className={className} style={style}>
      {parts.map((part, i) => {
        if (!part) return null
        // Liché indexy jsou zachycené URL (díky capture skupině ve splitu)
        if (i % 2 === 1) {
          // Interpunkci na konci (tečka, čárka…) nechat mimo odkaz
          const match = part.match(/^(.*?)([.,;:!?)]*)$/)
          const url = match ? match[1] : part
          const trailing = match ? match[2] : ''
          return (
            <span key={i}>
              <a
                href={toHref(url)}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="underline"
                style={{ color: '#60d0ff', wordBreak: 'break-all' }}
              >
                {url}
              </a>
              {trailing}
            </span>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </p>
  )
}
