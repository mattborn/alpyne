// Set base URL depending on environment
const base = document.getElementById('base')
const isGitHubPages = window.location.hostname.includes('github.io') || window.location.hostname === 'mattborn.com'
base.href = isGitHubPages ? '/alpyne/' : '/'

const g = document.getElementById.bind(document)
const q = document.querySelectorAll.bind(document)

// Smooth scroll to demo section when clicking demo buttons
q('.button').forEach((el) =>
  el.addEventListener('click', (e) => {
    window.scrollTo({
      behavior: 'smooth',
      top: g('preview').getBoundingClientRect().top + window.scrollY,
    })
  }),
)

// View switching
const navButtons = document.querySelectorAll('.nav-button')
const views = document.querySelectorAll('.view')

navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const viewId = `view-${button.dataset.view}`

    // Update active states
    navButtons.forEach((btn) => btn.classList.remove('active'))
    button.classList.add('active')

    // Switch views
    views.forEach((view) => {
      view.classList.remove('active')
      if (view.id === viewId) {
        view.classList.add('active')
      }
    })
  })
})
