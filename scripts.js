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

// View management
function showView(viewId) {
  // Hide all views first
  views.forEach((view) => view.classList.remove('active'))

  // Show requested view
  const view = document.getElementById(viewId)
  if (view) view.classList.add('active')
}

// Update client picker functionality
const clientPicker = document.querySelector('.client-picker')
const clientSelect = clientPicker.querySelector('.nav-button')
const clientList = document.createElement('div')
clientList.className = 'client-list'

// Initialize with first client
let selectedClientId = '1'
let selectedClientName = 'Acme Corp'
clientSelect.querySelector('.fill').textContent = selectedClientName

async function initApp() {
  const response = await fetch('data.json')
  const data = await response.json()

  // Populate client list
  data.clients.forEach((client) => {
    const button = document.createElement('button')
    button.className = 'nav-button'
    button.innerHTML = `
      <i class="fa-light fa-building"></i>
      <span class="fill">${client.name}</span>
    `
    button.addEventListener('click', (e) => {
      e.stopPropagation()
      selectedClientId = client.id
      selectedClientName = client.name
      clientSelect.querySelector('.fill').textContent = client.name
      clientPicker.classList.remove('active')

      // Show client view and activate home nav
      showView(`view-client-${client.id}`)

      // Update nav active states
      navButtons.forEach((btn) => {
        if (!btn.closest('.client-picker')) {
          btn.classList.remove('active')
          if (btn.dataset.view === 'home') {
            btn.classList.add('active')
          }
        }
      })
    })
    clientList.appendChild(button)
  })

  clientPicker.appendChild(clientList)

  // Show portfolio view by default
  document.querySelector('[data-view="portfolio"]').classList.add('active')
  showView('view-portfolio')
}

// Initialize app
initApp()

// Toggle client picker - prevent view switching
clientSelect.addEventListener('click', (e) => {
  e.preventDefault()
  e.stopPropagation()
  clientPicker.classList.toggle('active')
})

// Close client picker when clicking outside
document.addEventListener('click', () => {
  clientPicker.classList.remove('active')
})

// View switching - exclude client picker from changing views
navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (button.closest('.client-picker')) return

    const viewId = `view-${button.dataset.view}`

    // Update active states
    navButtons.forEach((btn) => {
      if (!btn.closest('.client-picker')) {
        btn.classList.remove('active')
      }
    })
    button.classList.add('active')

    // Switch to new view
    showView(viewId)
  })
})
