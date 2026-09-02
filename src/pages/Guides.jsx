import { useState } from 'react'

const PURPLE = '#a78bfa'

// Friendly, plain-English orientation for expat parents. NOT official advice —
// rules change, so every section links out to the official source.
const SECTIONS = [
  {
    emoji: '🩺',
    title: "Your child's health",
    intro:
      'Healthcare for kids in the Netherlands is well organised — and for children it’s largely free.',
    points: [
      'Children under 18 are insured for free: they’re covered under a parent’s health insurance (zorgverzekering) with no premium and no own-risk. Register a newborn with an insurer within 4 months.',
      'The huisarts (GP) is your first stop for anything medical and the gateway to specialists — you need one before you can see most other doctors.',
      'To register, pick a practice near home (most only take you if you live within ~15 minutes) and sign up with your BSN, Dutch insurance and ID. Some have waiting lists, so do it as soon as you have an address — several Amsterdam practices are English- and expat-friendly.',
      'The consultatiebureau (JGZ) gives free check-ups, growth and development monitoring and vaccinations for children 0–4. Once you’re registered in the city, they invite you automatically.',
      'Dentist (tandarts): free basic dental care for under-18s — check-ups, fillings, fluoride. Braces are not covered, so arrange supplementary insurance well in advance (ideally ~2 years ahead).',
      'Worried about your child’s wellbeing? Youth mental-health support (Jeugd-GGZ) is free.',
      'Want more than the basics — like an osteopath or an anthroposophic GP? See the next section on supplementary insurance.',
    ],
    links: [
      { label: 'Health insurance — I amsterdam', url: 'https://www.iamsterdam.com/en/live-work-study/living/healthcare-insurance/health-insurance-in-the-netherlands' },
      { label: "Children's healthcare — Expatica", url: 'https://www.expatica.com/nl/healthcare/healthcare-services/childrens-healthcare-netherlands-154951/' },
    ],
  },
  {
    emoji: '🤱',
    title: 'New baby? Midwife & kraamzorg',
    intro:
      'One of the most-loved parts of the Dutch system — and it comes to your home.',
    points: [
      'A verloskundige (midwife) guides you through a healthy pregnancy and the birth. Midwife care and maternity hours carry no own-risk (eigen risico), so there’s nothing to pay from your excess.',
      'Kraamzorg is postnatal home care: in the first days after the birth a maternity nurse comes to your house to help with the baby, feeding and your recovery, run basic checks, and lend a hand around the home.',
      'It’s covered by basic insurance — roughly 24–80 hours spread over the first 8–10 days (about 49 hours is typical for a straightforward birth).',
      'In 2026 you pay a small own contribution of €5.70 per hour at home (nothing if it’s in hospital) — so an average ~49 hours works out around €275.',
    ],
    links: [
      { label: 'Kraamzorg costs — ACCESS NL', url: 'https://access-nl.org/healthcare-netherlands/having-a-baby/kraamzorg-postnatal-care/how-much-will-the-kraamzorg-cost-me/' },
      { label: 'Kraamzorg — Zorginstituut Nederland', url: 'https://www.zorginstituutnederland.nl/verzekerde-zorg/k/kraamzorg-zvw' },
    ],
  },
  {
    emoji: '🌿',
    title: 'Complementary care & extra insurance (a Dutch perk)',
    intro:
      'One thing expat parents love here: with an aanvullende (supplementary) policy, many therapies that are rarely reimbursed elsewhere in Europe are partly covered for your child.',
    points: [
      'These extras aren’t in the basic package — you add a separate aanvullende (supplementary) policy on top of your child’s free basic cover. The upside: supplementary reimbursements have no own-risk (eigen risico). When choosing a policy, check it also covers children under 18.',
      'Osteopath (osteopaat): popular for babies and young children, and reimbursed by almost every supplementary policy — often around €200–€1,000 per year (varies by policy). The osteopath must be registered with the NRO or NOF.',
      'Acupuncture & Chinese medicine: covered by many supplementary policies. The practitioner must belong to a recognised association such as the NVA or Zhong.',
      'Anthroposophic medicine: fully-qualified doctors who add a holistic layer (body, soul and spirit, and strengthening the body’s own healing) on top of regular medicine. There are around 135 anthroposophic GPs and specialists in the Netherlands — you can find one for your child via the NVAA. Consults and anthroposophic medicines are reimbursed when the doctor or therapist is affiliated with the NVAA and the medicine is officially registered.',
      'Homeopathy: also reimbursable through supplementary insurance, as long as the practitioner is a member of a recognised professional association.',
      'Golden rule: reimbursement only works if the practitioner has the right “stamp” — membership of a recognised professional association (usually with an AGB-code / RBCZ registration). Always check this and your policy’s yearly maximum before you book.',
    ],
    links: [
      { label: 'Alternative therapies — Zorgwijzer', url: 'https://www.zorgwijzer.nl/vergoeding/alternatieve-geneeswijzen' },
      { label: 'Osteopathy reimbursement — Zorgwijzer', url: 'https://www.zorgwijzer.nl/vergoeding/osteopathie' },
      { label: 'Chinese medicine — Zorgwijzer', url: 'https://www.zorgwijzer.nl/vergoeding/chinese-geneeswijzen' },
      { label: 'Anthroposophic medicine — Zorgwijzer', url: 'https://www.zorgwijzer.nl/vergoeding/antroposofische-geneeskunde' },
      { label: 'Find an anthroposophic doctor — NVAA', url: 'https://nvaa.nl/info-patienten/antroposofische-geneeskunde-en-artsen/' },
    ],
  },
  {
    emoji: '🚑',
    title: 'Child & baby first aid (kinder-EHBO)',
    intro:
      'A short, friendly course that teaches you what to do in the first minutes of a choke, fall or burn — and a smart thing to ask any babysitter about.',
    points: [
      'On average more than 100 children a day in the Netherlands end up in A&E after an accident — most of them in and around the home. Knowing how to react in those first minutes (choking, a hard fall, a burn, a febrile seizure) really does change everything.',
      'What it’s like: usually a few hours of online theory at home, plus one practical afternoon where you actually practise — CPR on a baby dummy, the choking grip, the recovery position. You leave with a recognised certificate (the Oranje Kruis “Eerste Hulp aan Kinderen” certificate is valid for 2 years, then topped up with a short refresher). Honestly one of the most useful — and surprisingly fun — afternoons you’ll spend as a parent.',
      '💰 Good to know: because it’s a certified course, it’s often reimbursed through your aanvullende (supplementary) health insurance. It varies per insurer and package, so check your own policy first — but for many families the course effectively pays for itself.',
      '🧑‍🍼 Choosing a babysitter? Ask whether she has a child first-aid certificate — it’s a real green flag. And if she doesn’t, suggest she takes the course: it’s affordable, often reimbursed, and makes her more bookable. A lovely win-win for both sides.',
      'In and around Amsterdam several providers run the course in English (great for expat families) — see the links below. Het Oranje Kruis and the Rode Kruis are the two national standards, so look for a course that certifies through one of them.',
    ],
    links: [
      { label: 'Kinder-EHBO in English — Geboortecentrum Amsterdam', url: 'https://geboortecentrum.nl/en/course-centre/kinder-ehbo/' },
      { label: 'Baby & child first aid — Midwives 101', url: 'https://verloskundigen101.nl/en/cursus/eerste-hulp-baby-en-kind/' },
      { label: 'First aid workshop — Femme Amsterdam', url: 'https://www.femme-amsterdam.nl/' },
      { label: 'Eerste Hulp aan Kinderen — Het Oranje Kruis', url: 'https://www.hetoranjekruis.nl/diplomas/certificaat-eerste-hulp-aan-kinderen/' },
      { label: 'EHBO voor kinderen — Rode Kruis', url: 'https://www.rodekruis.nl/ehbo/ehbo-cursus-kinderen/' },
    ],
  },
  {
    emoji: '🧸',
    title: 'Childcare & daycare',
    intro:
      'The Dutch childcare world decoded — KDV, peuteropvang and VVE — plus how to pick a place that feels right.',
    subsections: [
      {
        title: '🍼 KDV — full-day daycare (0–4)',
        points: [
          'A kinderdagverblijf (KDV) is full-day care for children from about 6 weeks up to 4 years, made for working or studying parents.',
          'Open on weekdays, usually around 7:30–18:30; you can book whole or half days.',
          'Children are in age-based groups (separate baby and toddler groups) with trained pedagogical staff who follow each child’s own rhythm of sleeping, eating and playing — focusing on feeling safe, developing and learning to be with other children.',
        ],
      },
      {
        title: '🎨 Peuteropvang / peuterspeelzaal (2–4)',
        points: [
          'Peuteropvang (the former peuterspeelzaal) is for toddlers 2–4, in half-day parts (a morning or an afternoon) rather than full days.',
          'It runs a playful, structured programme (like Piramide or Uk & Puk) that gently prepares children for primary school.',
          'A lovely lighter option if you don’t need full-day care but want your toddler to play, socialise and get school-ready.',
          'In Amsterdam it is called the voorschool: every 2 to 4 year old may go 16 hours a week, you register from age 1, and the 2026 costs depend on your income. Our full guide has the table and the comparison with KDV.',
        ],
        links: [
          { label: 'Peuterspeelzaal & voorschool in Amsterdam — our guide', url: '/guides/peuterspeelzaal-voorschool-amsterdam.html' },
        ],
      },
      {
        title: '📚 VVE — a little extra early education',
        points: [
          'VVE (voor- en vroegschoolse educatie) is extra early-learning support — mainly around language — for children who could use a boost, continuing into the first years of primary school.',
          'The consultatiebureau decides whether your child gets a VVE indication (indicatie): a first look around 11 months, confirmed around 14 months, looking at things like the language spoken at home.',
          'In Amsterdam a child with a VVE indication gets 16 hours a week of voorschool, and around 300 centres run a VVE programme. The voorschool is open to all Amsterdam toddlers but especially helps those at risk of a language gap — a real plus for many expat families.',
        ],
        links: [
          { label: 'Voorschool & VVE — Gemeente Amsterdam', url: 'https://www.amsterdam.nl/sociaaldomein/onderwijs-leerplicht/vroegschoolse/' },
        ],
      },
      {
        title: '💶 Costs & allowance',
        points: [
          'Working or studying? You get kinderopvangtoeslag from the tax office for KDV, BSO and registered childminders — in 2026 up to ~96% for lower incomes, on up to 230 hours per child per month. The provider must be in the national register (LRK).',
          'Not working? No toeslag, but the gemeente helps — in Amsterdam up to 16 hours a week of subsidised peuteropvang.',
        ],
        links: [
          { label: 'Apply for toeslagen — Belastingdienst', url: 'https://www.belastingdienst.nl/wps/wcm/connect/nl/toeslagen/toeslagen' },
        ],
      },
      {
        title: '💛 How to choose a good one',
        points: [
          'Read the free GGD inspection report — every registered location has one in the national register (LRK). In plain language it tells you whether the place meets the rules.',
          'Then trust your eyes on a visit: are the children relaxed and happy? Are the carers warm, down on the floor and really with the kids?',
          'Ask what matters for little ones: do the same faces come back each day (a stable stamgroep)? how often do staff change? how does settling-in (wennen) work? how many children per carer? how much time outdoors?',
          '⏳ Register early — around 70% of daycares have waiting lists, and many parents sign up during pregnancy.',
        ],
        links: [
          { label: 'Check a daycare — Landelijk Register Kinderopvang', url: 'https://www.landelijkregisterkinderopvang.nl/pp/' },
        ],
      },
    ],
  },
  {
    emoji: '🎨',
    title: 'Peuterspeelzaal & voorschool (2–4)',
    intro:
      'The Amsterdam preschool for toddlers — a few mornings a week of play, Dutch words and friends before school starts. Open to every 2 to 4 year old in the city.',
    points: [
      'Three names, one thing: peuterspeelzaal (the old name), peuteropvang (the national name since 2018) and voorschool (what Amsterdam calls it). Almost 300 childcare centres in Amsterdam run a voorschool programme.',
      'Register from your child’s first birthday, directly with the voorschool of your choice — not with the city. Addresses are in the official Amsterdam School Finder (Schoolwijzer), where locations are tagged “Preschool”. Popular ones have waiting lists.',
      'The standard is 16 hours a week over at least 3 days, 40 weeks a year (school weeks). Fewer hours by agreement, more hours for a fee.',
      'What you pay in 2026 depends on your income. Working parents claim kinderopvangtoeslag, exactly as for daycare. Parents without that allowance get a municipal contribution instead: from €24 a month for lower incomes up to €380 for the highest. With a Stadspas it is never more than €24.',
      'Cheaper than a KDV? Usually yes — you buy far fewer hours and non-working parents get help that daycare does not offer. The hourly rate itself is the same (€11.23). It is not a replacement for full-day care; combining the two is normal, and many daycares are voorschool at the same time.',
      'Our full guide has the 2026 cost table, the honest comparison with KDV, and what to look at on a visit — written by a preschool teacher who works in one.',
    ],
    links: [
      { label: 'Peuterspeelzaal & voorschool in Amsterdam — full guide with the 2026 table', url: '/guides/peuterspeelzaal-voorschool-amsterdam.html' },
      { label: 'Register your child for the voorschool — Gemeente Amsterdam', url: 'https://www.amsterdam.nl/onderwijs/kinderopvang-voorschool/voorschool/kind-aanmelden-voorschool/' },
      { label: 'Calculate your own contribution 2026 — Gemeente Amsterdam', url: 'https://www.amsterdam.nl/onderwijs-jeugd/voorschool/rekensom/' },
      { label: 'Nurseries & preschools — Amsterdam School Finder (English)', url: 'https://schoolwijzer.amsterdam.nl/en/opvang/nursery/' },
    ],
  },
  {
    emoji: '🎒',
    title: 'Primary school (basisschool)',
    intro:
      'Choosing a school in Amsterdam, made simpler — how it works, the different styles, and an honest tip on what really matters.',
    subsections: [
      {
        title: '🗓️ How it works (Amsterdam)',
        points: [
          'Children start basisschool at age 4; school becomes compulsory (leerplicht) at 5.',
          'Amsterdam uses one joint registration system. Around your child’s 3rd birthday the city sends you a registration form and a brochure — that’s your cue to pick a school and apply.',
          'A handful of schools (~10) register separately from the central system, so always check the individual school too.',
        ],
        links: [
          { label: 'Amsterdam School Finder — schoolwijzer', url: 'https://schoolwijzer.amsterdam.nl/en/' },
          { label: 'Primary school — I amsterdam', url: 'https://www.iamsterdam.com/en/live-work-study/living/education-family/primary-school' },
        ],
      },
      {
        title: '🧭 Public or faith-based? (openbaar vs bijzonder)',
        points: [
          'Openbaar (public) schools welcome every child and aren’t based on a religion or worldview.',
          'Bijzonder schools teach from a particular conviction or vision — religious (Catholic, Protestant, Islamic, Jewish…) or a special idea about education. “Oecumenical” boards like AMOS (29 schools across Amsterdam) are Christian in roots but open to all beliefs.',
          'A lovely Dutch quirk: both public and bijzonder schools are fully funded by the government — there’s no tuition, just a small voluntary contribution (vrijwillige ouderbijdrage). “Special” here doesn’t mean paying.',
        ],
        links: [
          { label: 'Openbaar vs bijzonder — OCO', url: 'https://www.onderwijsconsument.nl/wat-is-openbaar-onderwijs-en-bijzonder-onderwijs/' },
          { label: 'AMOS schools — amosonderwijs.nl', url: 'https://amosonderwijs.nl/scholen/' },
        ],
      },
      {
        title: '🎨 Teaching styles (onderwijsconcepten)',
        points: [
          'Many schools follow a “regular” (klassikaal) programme; others follow a renewing concept built around the individual child, independence and working together. The best-known ones:',
          'Montessori — “help me to do it myself”: children follow their natural curiosity and learn by choosing their own work with special materials, at their own pace.',
          'Dalton — independence and cooperation: children work through day- or week-tasks and learn to plan their own time.',
          'Jenaplan — learning to live together: a strong focus on social skills, often in mixed-age groups.',
          'Vrijeschool (Steiner/Waldorf) — head, heart and hands: the rhythm of the year, lots of art, music, movement and storytelling (an anthroposophic approach).',
          'Reggio Emilia — the “competent child” who discovers through long, curious projects; the space and materials are part of the learning.',
          'Freinet — children bring their own topics in a democratic classroom, with lots of expression, stories and crafts.',
        ],
        links: [
          { label: 'School styles explained — Ouders.nl', url: 'https://www.ouders.nl/artikelen/welke-basisschoolvorm-kies-ik-voor-mijn-kind' },
        ],
      },
      {
        title: '💛 How to choose (the honest tip)',
        points: [
          'Closeness to home matters more than you’d expect. With the Dutch weather you’ll bike and walk in the rain a lot — a school around the corner makes every single day easier. ☔🚲',
          'Friendships live in the neighbourhood, too: after school, kids pop over to each other’s houses to play, so a local school usually means local friends and easy playdates.',
          'Go to an open day (open dag), trust the feeling in the building, and don’t overthink the “perfect method” — a warm, nearby school your child loves usually beats a famous one across town.',
          'Apply early, around your child’s 3rd birthday — popular schools fill up.',
        ],
      },
      {
        title: '✨ A little help from RaisingAmsterdam',
        points: [
          'Settling in with little ones is a journey — that’s exactly why this community exists. Browse babysitters, local services and community tips made for expat parents in Amsterdam.',
          'Want more on raising children far from home? Follow RaisingWorldKids on YouTube for ideas, stories and parenting abroad.',
        ],
        links: [
          { label: 'Browse RaisingAmsterdam', url: '/listings' },
          { label: 'RaisingWorldKids on YouTube', url: 'https://www.youtube.com/@raisingworldkids' },
        ],
      },
    ],
  },
  {
    emoji: '📋',
    title: 'Getting set up: paperwork & waiting lists',
    intro:
      'The little admin jobs around a child — and the very Dutch art of signing up early.',
    subsections: [
      {
        title: '🍼 Registering your baby',
        points: [
          'Register the birth at the municipality where your baby was born within 3 days (the birth day itself doesn’t count, and a weekend or holiday gives you an extra working day). Your baby is then added to the records and gets a BSN by post.',
          'Register your baby with a health insurer within 4 months — children are insured for free, but they still need their own sign-up.',
        ],
        links: [
          { label: 'Birth registration — Rijksoverheid', url: 'https://www.rijksoverheid.nl/onderwerpen/aangifte-geboorte-en-naamskeuze-kind/vraag-en-antwoord/aangifte-geboorte' },
        ],
      },
      {
        title: '🪪 Your own basics (newcomers)',
        points: [
          'Just arrived? Register at your gemeente within 5 days to get your BSN. In Amsterdam, book the appointment early — waits can be 6–8 weeks.',
          'Bring your passport/ID, proof of your Dutch address, and an employment contract if you have one. Then set up a DigiD online — your login for insurance, school, toeslag and more.',
        ],
        links: [
          { label: 'BSN & registration — I amsterdam', url: 'https://www.iamsterdam.com/en/live-work-study/moving-to-amsterdam/take-care-of-official-matters/bsn-and-the-personal-records-database' },
        ],
      },
      {
        title: '⏳ Register early — the waiting-list game',
        points: [
          'Midwife (verloskundige): book your first appointment as soon as your test is positive — usually around weeks 8–10.',
          'Kraamzorg: sign up early because of waiting lists — ideally within the first 12 weeks, and in big cities like Amsterdam before week 8.',
          'Daycare (KDV): around 70% have waiting lists, so many parents register during pregnancy.',
          'Primary school: in Amsterdam you apply around your child’s 3rd birthday — popular schools fill up.',
          'Swimming lessons: spots fill up too, so put your child on the list in good time (more on that below).',
        ],
      },
    ],
  },
  {
    emoji: '🏊',
    title: 'Swimming & the zwemdiploma (very Dutch!)',
    intro:
      'In a country full of canals, learning to swim is a rite of passage — and it works differently here.',
    points: [
      'When to start: baby and toddler swimming with a parent (ouder-en-kindzwemmen) is offered at most Amsterdam pools from a few months old. Lessons for diploma A are advised from 4.5 to 5 years — three is too early, and a 4-year-old has just started school.',
      'Most Dutch children earn the Zwem-ABC: three national diplomas from the Nationale Raad Zwemveiligheid — A (aanleren / learning), B (beter maken / improving) and C (compleet maken / complete). After C, your child meets the national swimming-safety norm.',
      'The famous twist: at the exam (afzwemmen) children swim in their clothes and shoes! Diploma A is in summer clothing; higher diplomas add long sleeves and trousers. It sounds funny, but it prepares children for a real, unexpected fall into cold water — very relevant in a city of canals. 🤿',
      'Diplomas open doors at the pool: without one, a child needs armbands and an adult (often just one no-diploma child per grown-up). You usually need at least diploma A to swim on your own, B for pools with slides and waves (attractiebad), and C is the recommended minimum for the sea, a lake or holidays.',
      'It’s a journey — on average 18–28 months for all three — and lessons can have waiting lists, so sign up in good time. School swimming is no longer standard, so most families arrange lessons themselves.',
    ],
    links: [
      { label: 'Zwem-ABC & zwemdiploma in Amsterdam — full guide', url: '/guides/swimming-and-zwemdiploma.html' },
      { label: 'Zwem-ABC — Nationale Raad Zwemveiligheid', url: 'https://www.nrz-nl.nl/licentie-nationale-zwemdiplomas/zwem-abc-en-andere-nationale-zwemdiplomas/' },
    ],
  },
]

function PointList({ points }) {
  return (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {points.map((point, i) => (
        <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span
            style={{
              flexShrink: 0,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: PURPLE,
              marginTop: 7,
            }}
            aria-hidden="true"
          />
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14.5, lineHeight: 1.55 }}>
            {point}
          </span>
        </li>
      ))}
    </ul>
  )
}

function GuideLink({ label, url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.16)',
        borderRadius: 9,
        padding: '7px 14px',
        color: 'white',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {label} <span aria-hidden="true">↗</span>
    </a>
  )
}

// Expandable card: shows just the emoji + title + one-line intro, and opens to
// reveal the full details when the parent taps it.
function GuideSection({ section, open, onToggle }) {
  return (
    <div style={{ background: '#1a1a2e', borderRadius: 16 }} className="text-left overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-3 p-5 sm:p-6 text-left"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span style={{ fontSize: 26, lineHeight: 1 }} aria-hidden="true">
          {section.emoji}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-white font-bold text-lg">{section.title}</span>
          <span className="block text-white/55 text-sm mt-0.5">{section.intro}</span>
        </span>
        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            color: 'rgba(255,255,255,0.5)',
            fontSize: 18,
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.18s ease',
          }}
        >
          ▸
        </span>
      </button>

      {open && (
        <div className="px-5 sm:px-6 pb-6" style={{ paddingLeft: 'calc(1.25rem + 26px + 0.75rem)' }}>
          {section.subsections ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {section.subsections.map((sub) => (
                <div
                  key={sub.title}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}
                >
                  <p className="text-white font-semibold" style={{ marginBottom: 10 }}>
                    {sub.title}
                  </p>
                  <PointList points={sub.points} />
                  {sub.links && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {sub.links.map((l) => (
                        <GuideLink key={l.url} label={l.label} url={l.url} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
              <PointList points={section.points} />
              <div className="mt-5 flex flex-wrap gap-2">
                {section.links.map((l) => (
                  <GuideLink key={l.url} label={l.label} url={l.url} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function Guides() {
  // Accordion: only one card open at a time keeps the page calm and scannable.
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold text-white">Guides</h1>
      <p className="mt-2 text-white/60">
        Finding your way around the Dutch system as an expat parent — health, having a baby,
        first aid, childcare, school, swimming and the paperwork that gets you started. Tap a
        topic to read more.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {SECTIONS.map((section, i) => (
          <GuideSection
            key={section.title}
            section={section}
            open={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </div>

      {/* Proper disclaimer at the end. */}
      <div
        style={{
          marginTop: 28,
          padding: '16px 18px',
          borderRadius: 14,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        <strong className="text-white/80">A quick note 💛</strong>
        <br />
        These guides are a friendly starting point put together to help expat parents find
        their way — they are <strong>not official or medical advice</strong>. Dutch rules,
        amounts and procedures change, and every family's situation is different. Always
        confirm the details with the official sources linked above, your own insurer, your
        municipality (gemeente) or a qualified professional before you act. RaisingAmsterdam
        can't accept responsibility for decisions made based on this information.
      </div>
    </section>
  )
}
