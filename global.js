// Set base URL depending on environment
const base = document.getElementById('base')
const isGitHubPages = window.location.hostname.includes('github.io') || window.location.hostname === 'mattborn.com'
base.href = isGitHubPages ? '/alpyne/' : '/'

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.nav-menu-toggle').addEventListener('click', () => {
    document.body.classList.add('menu-open')
  })

  document.querySelector('.close-button').addEventListener('click', () => {
    document.body.classList.remove('menu-open')
  })
})
