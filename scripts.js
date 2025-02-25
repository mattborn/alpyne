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
        { field: 'email', headerName: 'E-mail' },
        { field: 'clients', headerName: 'Clients', valueFormatter: (p) => p.value.join(', ') },
        { field: 'role', headerName: 'Role' },
      ],
      data: data.team,
    },
    {
      id: 'dashboardsGrid',
      columnDefs: [
        { field: 'name', headerName: 'Name' },
        { field: 'type', headerName: 'Type' },
        { field: 'owner', headerName: 'Owner' },
        {
          field: 'createdAt',
          headerName: 'Created At',
          valueFormatter: (p) => new Date(p.value).toLocaleDateString(),
        },
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

// Sequencer
let sequence = null
let currentStep = 0
let sequenceTimer = null
let isPlaying = false

async function initSequence() {
  const response = await fetch('sequence.json')
  sequence = await response.json()
  if (sequence.autoStart) startSequence()
}

function startSequence() {
  if (isPlaying) return
  isPlaying = true
  currentStep = 0
  playNextStep()
  document.getElementById('play-button').classList.add('hidden')
}

function stopSequence() {
  isPlaying = false
  clearTimeout(sequenceTimer)
  document.querySelectorAll('.nav-button').forEach((btn) => btn.classList.remove('hover'))
  document.getElementById('play-button').classList.remove('hidden')
}

function playNextStep() {
  if (!isPlaying || !sequence) return

  const step = sequence.steps[currentStep]
  const target = document.querySelector(step.target)
  if (!target) return

  switch (step.action) {
    case 'hover':
      target.classList.add('hover')
      sequenceTimer = setTimeout(() => {
        target.classList.remove('hover')
        currentStep = (currentStep + 1) % sequence.steps.length
        playNextStep()
      }, step.duration)
      break

    case 'click':
      const originalClick = target.onclick
      target.onclick = (e) => {
        e.stopPropagation()
        originalClick?.(e)
      }
      target.click()
      target.onclick = originalClick
      currentStep = (currentStep + 1) % sequence.steps.length
      sequenceTimer = setTimeout(playNextStep, step.duration)
      break
  }
}

// Add hover style for sequencer
const style = document.createElement('style')
style.textContent = `
  .nav-button.hover {
    background: var(--color-gray-100);
  }
`
document.head.appendChild(style)

// Stop sequence when user interacts with app
document.querySelector('.app').addEventListener('click', stopSequence)

let selectedSource = null

function showOAuthOverlay(source) {
  selectedSource = source
  document.getElementById('oauth-source-name').textContent = source.name
  document.getElementById('oauth-overlay').style.display = 'flex'
}

function hideOAuthOverlay() {
  document.getElementById('oauth-overlay').style.display = 'none'
  selectedSource = null
}

function completeConnection() {
  hideOAuthOverlay()
}

// Initialize connections grid
function initConnectionsGrid(data) {
  const element = document.getElementById('connectionsGrid')
  if (!element) return

  agGrid.createGrid(element, {
    columnDefs: [
      { field: 'name', headerName: 'Integration' },
      { field: 'type', headerName: 'Type' },
      { field: 'client', headerName: 'Client' },
      { field: 'status', headerName: 'Status' },
      {
        field: 'lastSync',
        headerName: 'Last Sync',
        valueFormatter: (p) => (p.value ? new Date(p.value).toLocaleString() : 'Never'),
      },
    ],
    rowData: data.connections.filter((c) => c.showInTable),
    defaultColDef: {
      sortable: true,
      filter: true,
    },
    domLayout: 'autoHeight',
  })
}

// Connection picker setup
const connectionPicker = document.querySelector('.connection-picker')
const connectionButton = connectionPicker.querySelector('.button-small')
const connectionList = connectionPicker.querySelector('.connection-list')

connectionButton.addEventListener('click', (e) => {
  e.preventDefault()
  e.stopPropagation()
  connectionPicker.classList.toggle('active')
})

document.addEventListener('click', () => {
  connectionPicker.classList.remove('active')
})

// Populate connection list from data
fetch('data.json')
  .then((response) => response.json())
  .then((data) => {
    connectionList.innerHTML = data.connections
      .map(
        (source) => `
    <div class="nav-button" data-source='${JSON.stringify(source)}'>${source.name}</div>
  `,
      )
      .join('')

    // Add click handlers after creating the elements
    connectionList.querySelectorAll('.nav-button').forEach((button) => {
      button.addEventListener('click', (e) => {
        const source = JSON.parse(button.dataset.source)
        showOAuthOverlay(source)
        connectionPicker.classList.remove('active')
      })
    })
  })

// Update initApp to initialize connections grid
async function initApp() {
  const response = await fetch('data.json')
  const data = await response.json()

  // Hydrate profile button with user data
  const profileButton = document.querySelector('[data-view="profile"]')
  const avatar = profileButton.querySelector('.avatar')
  const name = profileButton.querySelector('.fill')
  avatar.src = data.user.avatar
  avatar.alt = data.user.name
  name.textContent = data.user.name

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
initApp().then(() => {
  initEmptyViews()
  initSequence()
  initGlobexCharts()
  initFAQ()
})

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

    const viewId = button.dataset.view === 'home' ? `view-client-${selectedClientId}` : `view-${button.dataset.view}`

    // Fetch fresh data for views that need it
    const response = await fetch('data.json')
    const data = await response.json()

    if (viewId === 'view-portfolio') {
      renderClientCards(data.clients)
      initGrids(data)
    } else if (viewId === 'view-connections') {
      initConnectionsGrid(data)
    } else if (viewId === 'view-client-2') {
      initGlobexCharts()
    }

    navButtons.forEach((btn) => {
      if (!btn.closest('.client-picker')) btn.classList.remove('active')
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

// Add play button click handler
document.getElementById('play-button').addEventListener('click', startSequence)

// Initialize ScrollReveal
ScrollReveal().reveal('h1,.lede,.browser,.pain-point,.step,.value-prop', {
  cleanup: true,
  distance: '10%',
  interval: 100,
  origin: 'bottom',
})

// Load and render FAQ section
function initFAQ() {
  const faqScript = document.querySelector('#faq script[type="application/ld+json"]')
  const data = JSON.parse(faqScript.textContent)

  const faqList = document.querySelector('.faq-list')
  faqList.innerHTML = data.mainEntity
    .map(
      ({ name, acceptedAnswer }, index) => `
     <details class="faq-item"${index === 0 ? ' open' : ''}>
       <summary>
         <h3>${name}</h3>
         <i class="fa-regular fa-angle-down"></i>
       </summary>
        <p>${acceptedAnswer.text}</p>
     </details>
    `,
    )
    .join('')
}

// Store chart instances
let charts = {}

function initGlobexCharts() {
  // Destroy existing charts if they exist
  Object.values(charts).forEach((chart) => chart.destroy())

  // Gross Margin Chart
  charts.grossMargin = new Chart(document.getElementById('grossMarginChart'), {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
      datasets: [
        {
          data: [83, 81, 84, 84, 85, 83, 82, 81, 80, 84],
          borderColor: 'rgb(99, 102, 241)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#fff',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 79,
          max: 86,
          ticks: {
            callback: (value) => value + '%',
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  })

  // EBITDA Chart
  charts.ebitda = new Chart(document.getElementById('ebitdaChart'), {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
      datasets: [
        {
          data: [-520000, -525000, -480000, -540000, -420000, -410000, -380000],
          borderColor: 'rgb(168, 85, 247)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#fff',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          ticks: {
            callback: (value) => '$' + Math.abs(value / 1000) + 'k',
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  })
}
