import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const DIST = new URL('../dist/', import.meta.url)
const SITE = 'https://raisingamsterdam.com'

const sharedLinks = [
  ['Home', '/'],
  ['Babysitters and family services', '/listings'],
  ['Parent meetups', '/meetups'],
  ['Expat parent guides', '/guides'],
  ['Urgent childcare SOS', '/sos'],
  ['Join RaisingAmsterdam', '/register'],
]

const pages = [
  {
    path: 'listings',
    title: 'Babysitters in Amsterdam & local family services | RaisingAmsterdam',
    description: 'Find babysitters, nannies, parent communities and trusted local family services for expat families in Amsterdam.',
    heading: 'Babysitters and family services in Amsterdam',
    copy: 'Browse community listings from babysitters, nannies, local family services and parent groups in Amsterdam. Filter by language and the ages of the children you need help with.',
  },
  {
    path: 'meetups',
    title: 'Parent meetups in Amsterdam | RaisingAmsterdam',
    description: 'Meet other international and expat parents at friendly, local family meetups in Amsterdam.',
    heading: 'Meet expat parents in Amsterdam',
    copy: 'Discover local meetups where international parents and their children can connect, share experiences and feel at home in Amsterdam.',
  },
  {
    path: 'guides',
    title: 'Guides for expat parents in Amsterdam | RaisingAmsterdam',
    description: 'Plain-English guides to Dutch childcare, healthcare, schools, kraamzorg, first aid, paperwork and swimming for expat parents.',
    heading: 'Guides for expat parents in the Netherlands',
    copy: 'Understand the Dutch system with practical, plain-English information for international families living in Amsterdam.',
    links: [
      ['Childcare and daycare in the Netherlands', '/guides/childcare-and-daycare.html'],
      ["Children's healthcare in the Netherlands", '/guides/childrens-healthcare.html'],
      ['Midwife and kraamzorg', '/guides/birth-and-kraamzorg.html'],
      ['Primary school in Amsterdam', '/guides/primary-school-amsterdam.html'],
      ['Registration and waiting lists', '/guides/registration-and-waiting-lists.html'],
      ['Child and baby first aid', '/guides/child-first-aid.html'],
      ['Peuterspeelzaal and voorschool', '/guides/peuterspeelzaal-voorschool-amsterdam.html'],
      ['Swimming and the zwemdiploma', '/guides/swimming-and-zwemdiploma.html'],
    ],
  },
  {
    path: 'sos',
    title: 'Urgent childcare help in Amsterdam | RaisingAmsterdam SOS',
    description: 'Ask the RaisingAmsterdam parent community for urgent, last-minute childcare help in Amsterdam.',
    heading: 'Urgent childcare help in Amsterdam',
    copy: 'The SOS board connects local parents who need last-minute childcare with available community members in Amsterdam.',
  },
  {
    path: 'membership',
    title: 'RaisingAmsterdam membership for expat parents',
    description: 'See how RaisingAmsterdam membership unlocks direct contact with babysitters, services and other parents in Amsterdam.',
    heading: 'RaisingAmsterdam membership',
    copy: 'Join the community for free, browse local listings and meetups, and choose when you want to unlock direct contact.',
  },
  {
    path: 'register',
    title: 'Join RaisingAmsterdam & post a babysitter listing',
    description: 'Join the Amsterdam expat parent community or watch the 2-minute tutorial showing babysitters how to create and publish a listing.',
    heading: 'Join RaisingAmsterdam',
    copy: 'Create a free account to browse, post a listing and meet other expat parents. Babysitters can watch the two-minute tutorial to see the complete listing process.',
    links: [['Watch the babysitter listing tutorial on YouTube', 'https://www.youtube.com/watch?v=GcOP2vPfZio']],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: 'Babysitting Jobs in Amsterdam | Be First in Line When Parents Arrive',
      description: 'A two-minute tutorial showing babysitters how to create an account and publish a listing on RaisingAmsterdam.',
      thumbnailUrl: ['https://img.youtube.com/vi/GcOP2vPfZio/maxresdefault.jpg'],
      uploadDate: '2026-08-28T12:28:56-07:00',
      duration: 'PT2M18S',
      embedUrl: 'https://www.youtube-nocookie.com/embed/GcOP2vPfZio',
      contentUrl: 'https://www.youtube.com/watch?v=GcOP2vPfZio',
      publisher: {
        '@type': 'Organization',
        name: 'RaisingAmsterdam',
        url: SITE,
        logo: { '@type': 'ImageObject', url: `${SITE}/icons/apple-touch-icon.png` },
      },
    },
  },
]

const noIndexRoutes = ['delete-account', 'dashboard', 'my-listings', 'post-listing', 'meetups/new', 'sos/new']

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

function replaceHead(html, page, robots = 'index, follow, max-snippet:-1, max-image-preview:large') {
  const canonical = `${SITE}/${page.path}`
  const jsonLd = page.jsonLd
    ? `\n    <script type="application/ld+json">${JSON.stringify(page.jsonLd)}</script>`
    : ''
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escapeHtml(page.description)}" />`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta name="robots"[^>]*>/, `<meta name="robots" content="${robots}" />`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${escapeHtml(page.title)}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${escapeHtml(page.description)}" />`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`)
    .replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`)
    .replace('</head>', `${jsonLd}\n  </head>`)
}

function renderFallback(page) {
  const links = [...(page.links || []), ...sharedLinks]
    .map(([label, href]) => `<li><a href="${href}">${escapeHtml(label)}</a></li>`)
    .join('')
  return `<main><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.copy)}</p><nav aria-label="RaisingAmsterdam pages"><ul>${links}</ul></nav></main>`
}

function setRoot(html, content) {
  return html.replace('<div id="root"></div>', `<div id="root">${content}</div>`)
}

async function writeRoute(path, html) {
  const directory = join(DIST.pathname, path)
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, 'index.html'), html)
}

const template = await readFile(new URL('index.html', DIST), 'utf8')

for (const page of pages) {
  await writeRoute(page.path, setRoot(replaceHead(template, page), renderFallback(page)))
}

const noIndexPage = {
  path: 'app',
  title: 'RaisingAmsterdam',
  description: 'RaisingAmsterdam account area.',
  heading: 'RaisingAmsterdam',
  copy: 'This page is part of the RaisingAmsterdam account area.',
}
const noIndexHtml = setRoot(replaceHead(template, noIndexPage, 'noindex, follow'), renderFallback(noIndexPage))
await writeFile(new URL('app-shell.html', DIST), noIndexHtml)
for (const route of noIndexRoutes) await writeRoute(route, noIndexHtml)

const notFoundPage = {
  path: '404',
  title: 'Page not found | RaisingAmsterdam',
  description: 'The requested RaisingAmsterdam page could not be found.',
  heading: 'Page not found',
  copy: 'The page you requested does not exist. Use the links below to continue.',
}
const notFoundHtml = setRoot(replaceHead(template, notFoundPage, 'noindex, follow'), renderFallback(notFoundPage))
await writeFile(new URL('404.html', DIST), notFoundHtml)

console.log(`Generated ${pages.length} public SEO pages, ${noIndexRoutes.length} noindex app routes and 404.html.`)
