const g = document.getElementById.bind(document)
const q = document.querySelectorAll.bind(document)

// Smooth scroll to demo section when clicking demo buttons
q('.button').forEach(el =>
  el.addEventListener('click', e => {
    window.scrollTo({
      behavior: 'smooth',
      top: g('preview').getBoundingClientRect().top + window.scrollY,
    })
  }),
)
