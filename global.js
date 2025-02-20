// Set base URL depending on environment
const base = document.getElementById('base')
const isGitHubPages = window.location.hostname.includes('github.io') || window.location.hostname === 'mattborn.com'
base.href = isGitHubPages ? '/alpyne/' : '/'
