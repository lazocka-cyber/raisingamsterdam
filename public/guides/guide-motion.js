/* RaisingAmsterdam guides: gentle motion (29. 10. 2026).
   Motion.dev is self-hosted as /guides/motion.js (window.Motion).
   Content is always readable without JS: only blocks below the first screen
   are hidden, and only once Motion is here to bring them back in. */
(function () {
  var M = window.Motion
  if (!M || !M.animate || !M.inView) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  var spring = { type: 'spring', stiffness: 170, damping: 24 }

  // Reading progress bar along the top
  var bar = document.createElement('div')
  bar.className = 'read-progress'
  document.body.appendChild(bar)
  if (M.scroll) M.scroll(M.animate(bar, { scaleX: [0, 1] }, { ease: 'linear' }))

  // Sections slide up softly as they come into view; their points follow one by one
  var fold = window.innerHeight * 0.9
  var blocks = document.querySelectorAll('main > section.block, main > .note, main > .cta, #more-guides')
  blocks.forEach(function (el) {
    if (el.getBoundingClientRect().top < fold) return
    el.style.opacity = '0'
    M.inView(el, function () {
      M.animate(el, { opacity: [0, 1], y: [28, 0] }, spring)
      var items = el.querySelectorAll(':scope > ul > li, .card, tbody tr')
      if (items.length) {
        M.animate(items, { opacity: [0, 1], x: [-10, 0] },
          { duration: 0.35, delay: M.stagger(0.045, { startDelay: 0.12 }) })
      }
    }, { margin: '0px 0px -10% 0px' })
  })

  // Guide cards lift with a little spring under the finger or mouse
  if (M.hover) {
    M.hover('.card', function (el) {
      M.animate(el, { y: -4, scale: 1.015 }, spring)
      return function () { M.animate(el, { y: 0, scale: 1 }, spring) }
    })
  }

  // Never leave anything hidden when printing
  window.addEventListener('beforeprint', function () {
    blocks.forEach(function (el) { el.style.opacity = '1' })
  })
})()
