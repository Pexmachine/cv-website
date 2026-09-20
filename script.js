// With JavaScript disabled, the portfolio remains a readable, linked page.
document.getElementById('year').textContent = new Date().getFullYear();
const slides = [...document.querySelectorAll('main > section')];
const links = [...document.querySelectorAll('#slide-nav a')];
const next = document.querySelector('.next-slide');
const menu = document.querySelector('.menu-toggle');
const header = document.querySelector('.header');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const names = ['Home', 'Work', 'Experience', 'About', 'Contact'];
let active = -1;
let hintTimer;
let runningAnimations = [];
function closeMenu(restoreFocus = false) {
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Open navigation menu');
  header.classList.remove('menu-open');
  if (restoreFocus) menu.focus();
}
function showSlide(index, focus = true) {
  if (index < 0 || index === active) { closeMenu(); return; }
  runningAnimations.forEach(animation => animation.cancel());
  runningAnimations = [];
  const previous = active;
  const outgoing = slides[previous];
  slides.forEach((slide, i) => {
    slide.hidden = i !== index && i !== previous;
    slide.inert = i !== index;
    slide.classList.toggle('is-active', i === index);
  });
  active = index;
  const incoming = slides[index];
  incoming.scrollTop = 0;
  links.forEach((link, i) => {
    if (i === index) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.querySelector('.nav-counter').textContent = `0${index + 1} / 05`;
  document.querySelector('.slide-announcement').textContent = `${names[index]}, slide ${index + 1} of 5`;
  closeMenu();
  (index === 0 ? document.querySelector('.hero-copy') : document.body).append(next);
  next.classList.toggle('home-next', index === 0);
  clearTimeout(hintTimer);
  next.classList.remove('is-ready');
  next.hidden = index === slides.length - 1;
  if (!next.hidden) {
    next.querySelector('.next-label').textContent = `Next: ${names[index + 1]}`;
    next.setAttribute('aria-label', `Next slide: ${names[index + 1]}`);
    hintTimer = setTimeout(() => next.classList.add('is-ready'), index === 0 ? 3200 : 900);
  }
  if (focus) {
    const heading = incoming.querySelector('h1, h2');
    heading.setAttribute('tabindex', '-1');
    heading.focus({preventScroll: true});
  }
  if (previous >= 0 && !reducedMotion.matches) {
    const direction = index > previous ? 1 : -1;
    const options = {duration: 520, easing: 'cubic-bezier(.22,.68,0,1)', fill: 'both'};
    const exit = outgoing.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:`translateY(${-direction * 28}px)`}], options);
    const enter = incoming.animate([{opacity:0,transform:`translateY(${direction * 36}px)`},{opacity:1,transform:'translateY(0)'}], options);
    runningAnimations = [exit, enter];
    Promise.all(runningAnimations.map(a => a.finished)).then(() => {
      if (active === index) { outgoing.hidden = true; exit.cancel(); enter.cancel(); }
    }).catch(() => {});
  } else if (outgoing) outgoing.hidden = true;
}
function fromHash() {
  const index = slides.findIndex(slide => `#${slide.id}` === location.hash);
  return index < 0 ? 0 : index;
}
function navigate(index) {
  if (index < 0 || index >= slides.length) return;
  if (index === active) { closeMenu(menu.getAttribute('aria-expanded') === 'true'); return; }
  history.pushState(null, '', `#${slides[index].id}`);
  showSlide(index);
}
document.body.classList.add('deck');
slides.forEach(slide => { slide.hidden = true; });
showSlide(fromHash(), false);
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const href = link.getAttribute('href');
  const index = slides.findIndex(slide => `#${slide.id}` === href);
  if (index >= 0) { event.preventDefault(); navigate(index); }
});
next.addEventListener('click', () => navigate(active + 1));
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  header.classList.toggle('menu-open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && header.classList.contains('menu-open')) closeMenu(true);
});
document.addEventListener('click', event => {
  if (!header.contains(event.target)) closeMenu();
});
header.addEventListener('focusout', event => {
  if (!header.contains(event.relatedTarget)) closeMenu();
});
window.addEventListener('popstate', () => showSlide(fromHash()));
window.addEventListener('hashchange', () => showSlide(fromHash()));
