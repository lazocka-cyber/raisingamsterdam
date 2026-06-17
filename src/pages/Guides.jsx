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
    emoji: '🎒',
    title: 'Primary school (basisschool)',
    intro:
      'In Amsterdam there’s one shared system, and it starts earlier than you’d expect.',
    points: [
      'Children start basisschool at age 4; school becomes compulsory (leerplicht) at 5.',
      'Amsterdam uses one joint registration system. Around your child’s 3rd birthday the city sends you a registration form and a brochure — that’s your cue to pick a school and apply.',
      'A handful of schools (~10) register separately from the central system, so always check the individual school too.',
      'All schools, dates and how to apply are on the city’s School Finder (schoolwijzer).',
    ],
    links: [
      { label: 'Amsterdam School Finder — schoolwijzer', url: 'https://schoolwijzer.amsterdam.nl/en/' },
      { label: 'Primary school — I amsterdam', url: 'https://www.iamsterdam.com/en/live-work-study/living/education-family/primary-school' },
    ],
  },
  {
    emoji: '📋',
    title: 'Newcomer paperwork (the basics)',
    intro:
      'Just arrived? A couple of steps unlock almost everything else.',
    points: [
      'Register at your gemeente (municipality) within 5 days of arriving — that’s how you get your BSN (citizen service number). If they’re fully booked, booking the appointment in time usually counts. In Amsterdam, book early: waits can be 6–8 weeks.',
      'Bring your passport/ID, proof of your Dutch address, and an employment contract if you have one.',
      'Once you have your BSN, set up a DigiD online — it’s your login for government services, health insurance and the tax/allowance portals.',
    ],
    links: [
      { label: 'BSN & registration — I amsterdam', url: 'https://www.iamsterdam.com/en/live-work-study/moving-to-amsterdam/take-care-of-official-matters/bsn-and-the-personal-records-database' },
      { label: 'Registering with a municipality — Government.nl', url: 'https://www.government.nl/topics/personal-data/citizen-service-number-bsn' },
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
        Finding your way around the Dutch system as an expat parent. Tap a topic to read more.
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
