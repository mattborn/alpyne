// Set base URL depending on environment
const base = document.getElementById('base')
const isGitHubPages = window.location.hostname.includes('github.io') || window.location.hostname === 'mattborn.com'
base.href = isGitHubPages ? '/alpyne/' : '/'

const g = document.getElementById.bind(document)
const q = document.querySelectorAll.bind(document)

// View switching
const navButtons = document.querySelectorAll('.nav-button')
const views = document.querySelectorAll('.view')

// View management
function showView(viewId) {
  views.forEach((view) => view.classList.remove('active'))
  const view = document.getElementById(viewId)
  if (view) view.classList.add('active')
}

// Client picker setup
const clientPicker = document.querySelector('.client-picker')
const clientSelect = clientPicker.querySelector('.nav-button')
const clientList = document.createElement('div')
clientList.className = 'client-list'

// Initialize with first client
let selectedClientId = '1'
let selectedClientName = 'Acme Corp'
clientSelect.querySelector('.fill').textContent = selectedClientName

// Format currency
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)
}

// Render client cards
function renderClientCards(clients) {
  const container = document.querySelector('.client-cards')
  container.innerHTML = ''

  clients.forEach((client) => {
    const card = document.createElement('div')
    card.className = 'client-card'
    // Add cursor pointer and click handler
    card.style.cursor = 'pointer'
    card.addEventListener('click', () => {
      // Update client picker state
      selectedClientId = client.id
      selectedClientName = client.name
      clientSelect.querySelector('.fill').textContent = client.name

      // Update nav active states
      navButtons.forEach((btn) => {
        if (!btn.closest('.client-picker')) {
          btn.classList.remove('active')
          if (btn.dataset.view === 'home') {
            btn.classList.add('active')
          }
        }
      })

      // Show client view
      showView(`view-client-${client.id}`)
    })

    card.innerHTML = `
      <div class="client-card-header">
        <h3>${client.name}</h3>
        ${
          client.connectionStatus === 'error'
            ? `<i class="fa-light fa-triangle-exclamation error-icon" title="${client.connectionMessage}"></i>`
            : ''
        }
      </div>
      <div class="client-metrics">
        <div class="metric">
          <div>Cash Balance</div>
          <div class="metric-value">${formatCurrency(client.metrics.cashBalance)}</div>
        </div>
      </div>
    `
    container.appendChild(card)
  })
}

// Initialize AG Grid tables
function initGrids(data) {
  if (typeof agGrid === 'undefined') {
    console.error('AG Grid not loaded')
    return
  }

  // Clear existing grids first
  document.querySelectorAll('.ag-theme-alpine').forEach((el) => {
    el.innerHTML = ''
  })

  const gridOptions = {
    theme: 'legacy',
    defaultColDef: {
      sortable: true,
      filter: true,
    },
    domLayout: 'autoHeight',
  }

  // Initialize all grids
  const grids = [
    {
      id: 'teamGrid',
      columnDefs: [
        { field: 'name', headerName: 'Name' },
        { field: 'role', headerName: 'Role' },
        { field: 'clients', headerName: 'Clients', valueFormatter: (p) => p.value.join(', ') },
        { field: 'lastActive', headerName: 'Last Active' },
      ],
      data: data.team,
    },
    {
      id: 'sourcesGrid',
      columnDefs: [
        { field: 'name', headerName: 'Name' },
        { field: 'type', headerName: 'Type' },
        { field: 'clients', headerName: 'Clients', valueFormatter: (p) => p.value.join(', ') },
        { field: 'status', headerName: 'Status' },
      ],
      data: data.sources,
    },
    {
      id: 'dashboardsGrid',
      columnDefs: [
        { field: 'name', headerName: 'Name' },
        { field: 'type', headerName: 'Type' },
        { field: 'clients', headerName: 'Clients', valueFormatter: (p) => p.value.join(', ') },
        { field: 'lastUpdated', headerName: 'Last Updated' },
      ],
      data: data.dashboards,
    },
  ]

  grids.forEach(({ id, columnDefs, data: rowData }) => {
    const element = document.getElementById(id)
    if (element) {
      agGrid.createGrid(element, {
        ...gridOptions,
        columnDefs,
        rowData,
      })
    }
  })
}

// At the top of the file, after our base URL setup
console.log('AG Grid available?', typeof agGrid !== 'undefined', agGrid)

// Initialize app
async function initApp() {
  const response = await fetch('data.json')
  const data = await response.json()

  // Initialize portfolio view (default view)
  document.querySelector('[data-view="portfolio"]').classList.add('active')
  showView('view-portfolio')
  renderClientCards(data.clients)
  initGrids(data)

  // Initialize client picker
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

      // Update nav active states
      navButtons.forEach((btn) => {
        if (!btn.closest('.client-picker')) {
          btn.classList.remove('active')
          if (btn.dataset.view === 'home') {
            btn.classList.add('active')
          }
        }
      })

      // Show client view
      showView(`view-client-${client.id}`)
    })
    clientList.appendChild(button)
  })

  clientPicker.appendChild(clientList)
}

// Start the app
initApp().then(initEmptyViews)

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
  button.addEventListener('click', async () => {
    if (button.closest('.client-picker')) return

    const viewId =
      button.dataset.view === 'home'
        ? `view-client-${selectedClientId}` // Show current client's home view
        : `view-${button.dataset.view}`

    if (viewId === 'view-portfolio') {
      // Refresh portfolio data without reinitializing client picker
      const response = await fetch('data.json')
      const data = await response.json()
      renderClientCards(data.clients)
      initGrids(data)
    }

    navButtons.forEach((btn) => {
      if (!btn.closest('.client-picker')) {
        btn.classList.remove('active')
      }
    })
    button.classList.add('active')
    showView(viewId)
  })
})

// Create empty state views
async function initEmptyViews() {
  const response = await fetch('data.json')
  const { emptyViews } = await response.json()

  // Initialize all empty views including user profile and client dashboards
  Object.entries(emptyViews).forEach(([viewId, { title, description }]) => {
    const view = document.getElementById(viewId)
    if (view) {
      view.innerHTML = `
        <div class="view-header">
          <h2>${title}</h2>
          <p>${description}</p>
        </div>
        <div class="empty-state">
          <p>Book a full Alpyne demo to learn more about ${title}.</p>
          <a href="https://calendly.com/bryan-alpyne/30min" class="button" target="_blank">Get a demo</a>
        </div>
      `
    }
  })
}
