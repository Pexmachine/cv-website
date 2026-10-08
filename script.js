// Progressive enhancement: section links and all portfolio content work without JavaScript.
(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const hasObserver = 'IntersectionObserver' in window;
  const clamp = value => Math.min(1, Math.max(0, Number(value) || 0));
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  document.documentElement.classList.add('js');

  function enhancePalette() {
    const select = document.getElementById('palette-select');
    if (!select) return;
    const choices = [...select.options];
    const themeColor = document.querySelector('meta[name="theme-color"]');
    const storageKey = 'portfolio-palette';

    function applyPalette(value) {
      const choice = choices.find(option => option.value === value);
      if (!choice) return false;
      document.documentElement.setAttribute('data-palette', value);
      select.value = value;
      if (themeColor) themeColor.setAttribute('content', choice.dataset.themeColor);
      return true;
    }

    // Always synchronize the selector with the page, even with stale/blocked storage.
    applyPalette(document.documentElement.getAttribute('data-palette'));
    try { applyPalette(window.localStorage.getItem(storageKey)); } catch { /* Storage is optional. */ }
    select.addEventListener('change', () => {
      if (!applyPalette(select.value)) return;
      try { window.localStorage.setItem(storageKey, select.value); } catch { /* Keep switching available. */ }
    });
    select.addEventListener('focus', () => {
      const header = document.querySelector('.header');
      const menu = document.querySelector('.menu-toggle');
      header?.classList.remove('menu-open');
      menu?.setAttribute('aria-expanded', 'false');
      menu?.setAttribute('aria-label', 'Open navigation menu');
    });
  }

  enhancePalette();

  function enhanceNavigation() {
    const header = document.querySelector('.header');
    const menu = document.querySelector('.menu-toggle');
    const nav = document.getElementById('site-nav');
    if (!header || !menu || !nav) return;
    const links = [...nav.querySelectorAll('a[href^="#"]')];
    const sections = links.map(link => document.getElementById(link.getAttribute('href').slice(1))).filter(Boolean);
    const desktop = window.matchMedia('(min-width: 992px)');
    let scrollFrame = 0;

    function closeMenu(restoreFocus = false) {
      menu.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-label', 'Open navigation menu');
      header.classList.remove('menu-open');
      if (restoreFocus) menu.focus();
    }

    function updateNavigation() {
      scrollFrame = 0;
      const readingLine = header.offsetHeight + Math.min(120, window.innerHeight * 0.18);
      let current = sections[0];
      sections.forEach(section => {
        if (section.getBoundingClientRect().top <= readingLine) current = section;
      });
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) current = sections.at(-1);
      links.forEach(link => {
        if (current && link.getAttribute('href') === `#${current.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      header.classList.toggle('is-scrolled', window.scrollY > 20);
    }

    function scheduleNavigation() {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(updateNavigation);
    }

    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      header.classList.toggle('menu-open', open);
    });
    nav.addEventListener('click', event => {
      if (event.target.closest?.('a[href^="#"]')) closeMenu();
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
    desktop.addEventListener('change', event => {
      if (event.matches) closeMenu();
    });
    window.addEventListener('scroll', scheduleNavigation, {passive: true});
    window.addEventListener('resize', scheduleNavigation, {passive: true});
    window.addEventListener('hashchange', scheduleNavigation);
    if (hasObserver) {
      const observer = new IntersectionObserver(scheduleNavigation, {rootMargin: '-15% 0px -70% 0px'});
      sections.forEach(section => observer.observe(section));
    }
    header.classList.add('nav-ready');
    updateNavigation();
  }

  function enhanceReveals() {
    // Keep the hero and portrait fully visible; scrolling reveals the sections
    // below it with a timed fade rather than moving them sideways.
    const reveals = [...document.querySelectorAll('[data-reveal]')].filter(element => !element.closest('.hero'));
    let frame = 0;
    function update() {
      frame = 0;
      const height = window.innerHeight;
      const positions = reveals.map(element => element.getBoundingClientRect());
      reveals.forEach((element, index) => {
        const rect = positions[index];
        if (reducedMotion.matches || (rect.top < height * 0.88 && rect.bottom > 0)) {
          element.classList.add('is-visible');
        } else if (rect.top >= height || rect.bottom <= 0) {
          // Reset only after leaving the screen, ready for a fresh fade-in
          // when the visitor scrolls back. Never fade content out mid-reading.
          element.classList.remove('is-visible');
        }
      });
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    reveals.forEach(element => {
      element.classList.add('reveal-ready');
    });
    window.addEventListener('scroll', schedule, {passive: true});
    window.addEventListener('resize', schedule, {passive: true});
    window.addEventListener('load', schedule);
    document.fonts?.ready.then(schedule);
    // Expanding Experience changes the vertical position of later sections.
    document.addEventListener('toggle', schedule, true);
    reducedMotion.addEventListener('change', schedule);
    update();
  }

  const playbacks = new Map();
  const visibilityObserver = hasObserver ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      playbacks.get(entry.target)?.setVisible(entry.isIntersecting);
    });
  }, {threshold: 0}) : null;

  // Each demo owns one frame at a time. Pausing preserves elapsed time instead of
  // advancing the simulation while the visitor is elsewhere on the page.
  function createPlayback(card, duration, render, onIdle) {
    // Automatic loops should not repeatedly interrupt screen-reader speech.
    card.querySelector('[data-demo-status]')?.setAttribute('aria-live', 'off');
    let frame = 0;
    let elapsed = 0;
    let lastTime = null;
    let interactionUntil = 0;
    let idleTimer = 0;
    let manualPlayback = false;
    const cycleDuration = duration + 900;
    const rect = card.getBoundingClientRect();
    let visible = rect.bottom > 0 && rect.top < window.innerHeight;

    function pause() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      lastTime = null;
      card.dataset.playing = 'false';
    }

    function synchronize() {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = 0;
      if (!visible || document.hidden || reducedMotion.matches) {
        pause();
        return;
      }
      const remaining = interactionUntil - performance.now();
      if (!manualPlayback && remaining > 0) {
        pause();
        idleTimer = setTimeout(() => { idleTimer = 0; synchronize(); }, remaining);
        return;
      }
      if (interactionUntil && remaining <= 0) {
        interactionUntil = 0;
        card.dataset.interacting = 'false';
        onIdle?.();
        if (elapsed >= duration) {
          elapsed = 0;
          render(0);
        }
      }
      if (!frame) {
        card.dataset.playing = 'true';
        frame = requestAnimationFrame(tick);
      }
    }

    function tick(time) {
      frame = 0;
      if (!visible || document.hidden || reducedMotion.matches) {
        pause();
        return;
      }
      if (lastTime !== null) elapsed = manualPlayback
        ? Math.min(duration, elapsed + time - lastTime)
        : (elapsed + time - lastTime) % cycleDuration;
      lastTime = time;
      render(Math.min(1, elapsed / duration));
      if (manualPlayback && elapsed >= duration) manualPlayback = false;
      synchronize();
    }

    function finish() {
      manualPlayback = false;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = 0;
      elapsed = duration;
      pause();
      render(1);
    }

    function interact() {
      interactionUntil = performance.now() + 3000;
      manualPlayback = false;
      card.dataset.interacting = 'true';
      pause();
      synchronize();
    }

    function play(manual = false) {
      if (manual) interact();
      manualPlayback = manual;
      pause();
      elapsed = 0;
      if (reducedMotion.matches) {
        finish();
        return;
      }
      render(0);
      synchronize();
    }

    const playback = {
      synchronize,
      finish,
      play,
      interact,
      setVisible(value) { visible = value; synchronize(); },
      seek(value) {
        interact();
        elapsed = clamp(value) * duration;
        render(elapsed / duration);
        synchronize();
      }
    };
    ['pointerdown', 'pointermove', 'pointerleave', 'keydown', 'focusin', 'focusout', 'input'].forEach(type => {
      card.addEventListener(type, interact, {passive: true});
    });
    // Replay is an explicit one-shot preview; only its automatic repetitions
    // wait for the same three-second inactivity window as other interactions.
    card.querySelector('[data-play]')?.addEventListener('click', () => play(true));
    playbacks.set(card, playback);
    visibilityObserver?.observe(card);
    card.dataset.playing = 'false';
    render(reducedMotion.matches ? 1 : 0);
    synchronize();
    return playback;
  }

  function setStatus(card, message) {
    const status = card.querySelector('[data-demo-status]');
    if (status && status.textContent !== message) status.textContent = message;
  }

  function enhanceForecast() {
    const card = document.querySelector('[data-demo="forecast"]');
    const slider = document.getElementById('forecast-progress');
    const readout = document.getElementById('forecast-readout');
    const clip = document.getElementById('forecast-clip');
    const dot = document.getElementById('forecast-dot');
    if (!card || !slider || !readout || !clip || !dot) return;
    readout.setAttribute('aria-live', 'off');
    const points = [[340, 116], [366, 99], [392, 105], [418, 77], [444, 87], [470, 61], [496, 69], [522, 48], [548, 58], [574, 34], [600, 42]];
    const playback = createPlayback(card, 2400, progress => {
      const position = progress * (points.length - 1);
      const index = Math.min(points.length - 2, Math.floor(position));
      const fraction = position - index;
      const x = points[index][0] + (points[index + 1][0] - points[index][0]) * fraction;
      const y = points[index][1] + (points[index + 1][1] - points[index][1]) * fraction;
      clip.setAttribute('width', String(x - points[0][0]));
      dot.setAttribute('cx', String(x));
      dot.setAttribute('cy', String(y));
      slider.value = String(Math.round(progress * 100));
      const horizon = Math.round(position);
      slider.setAttribute('aria-valuetext', `Forecast horizon ${horizon} of 10`);
      const text = `Horizon ${horizon} / 10`;
      if (readout.textContent !== text) readout.textContent = text;
      setStatus(card, progress === 1 ? 'Forecast complete. The next simulated forecast starts shortly.' : 'Simulated forecast loops while visible. Replay or explore the timeline.');
    });
    slider.addEventListener('input', () => playback.seek(Number(slider.value) / 100));
  }

  function enhanceStepDemo(name, duration, messages) {
    const card = document.querySelector(`[data-demo="${name}"]`);
    if (!card) return;
    createPlayback(card, duration, progress => {
      const stage = progress === 0 ? 0 : Math.min(messages.length - 1, Math.ceil(progress * (messages.length - 1)));
      card.dataset.stage = String(stage);
      card.style.setProperty('--demo-progress', String(progress));
      setStatus(card, messages[stage]);
    });
  }

  // Manually annotated against the complete 1536 × 1024 generated scene.
  // Coordinates are normalized to keep boxes aligned at every display size.
  const DETECTIONS = {
    person: {label: 'Person', confidence: '98.2', x: 0.100, y: 0.244, width: 0.121, height: 0.583},
    sign: {label: 'Stop sign', confidence: '99.3', x: 0.315, y: 0.242, width: 0.104, height: 0.161},
    train: {label: 'Train', confidence: '97.4', x: 0.371, y: 0.150, width: 0.557, height: 0.423},
    rail: {label: 'Rail', confidence: '96.2', x: 0.464, y: 0.633, width: 0.536, height: 0.367}
  };

  function enhanceDetection() {
    const card = document.getElementById('vision-demo');
    const scene = document.getElementById('railway-scene');
    const box = document.getElementById('detection-box');
    const label = document.getElementById('detection-label');
    const result = document.getElementById('detection-result');
    const reset = document.getElementById('detection-reset');
    if (!card || !scene || !box || !label || !result || !reset) return;
    const buttons = [...card.querySelectorAll('[data-object]')];
    const smallestFirst = Object.keys(DETECTIONS).sort((a, b) => {
      const first = DETECTIONS[a];
      const second = DETECTIONS[b];
      return first.width * first.height - second.width * second.height;
    });
    let pinned = null;
    let hovered = null;
    let focused = null;
    let automatic = null;

    function update() {
      const inspected = hovered || focused || pinned;
      const active = inspected || automatic;
      result.setAttribute('aria-live', inspected ? 'polite' : 'off');
      const detection = DETECTIONS[active];
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.object === pinned)));
      box.hidden = !detection;
      if (!detection) {
        result.textContent = 'Hover an object, or select one below to inspect a simulated detection.';
        return;
      }
      box.style.left = `${detection.x * 100}%`;
      box.style.top = `${detection.y * 100}%`;
      box.style.width = `${detection.width * 100}%`;
      box.style.height = `${detection.height * 100}%`;
      label.textContent = `${detection.label} · ${detection.confidence}%`;
      const message = `${detection.label} detected · ${detection.confidence}% simulated confidence.${active === pinned ? ' Selected.' : inspected ? ' Select to pin.' : ' Automatic preview.'}`;
      if (result.textContent !== message) result.textContent = message;
    }

    function clear(userInteraction = true) {
      if (userInteraction) playback.interact();
      pinned = null;
      hovered = null;
      focused = null;
      update();
    }

    function select(object) {
      playback.interact();
      if (pinned === object) clear();
      else { pinned = object; hovered = null; focused = null; update(); }
    }

    function objectAtPoint(event) {
      const rect = scene.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      return smallestFirst.find(object => {
        const detection = DETECTIONS[object];
        return x >= detection.x && x <= detection.x + detection.width
          && y >= detection.y && y <= detection.y + detection.height;
      }) || null;
    }

    // The image itself supports inspection; the separate buttons remain larger
    // touch and keyboard targets. Small objects win overlapping annotations.
    scene.addEventListener('pointermove', event => {
      if (!finePointer.matches || event.pointerType === 'touch') return;
      playback.interact();
      const hotspot = event.target.closest?.('button[data-object]');
      const object = hotspot ? hotspot.dataset.object : objectAtPoint(event);
      if (hovered === object) return;
      hovered = object;
      update();
    });
    scene.addEventListener('pointerleave', () => {
      playback.interact();
      if (hovered === null) return;
      hovered = null;
      update();
    });
    scene.addEventListener('click', event => {
      if (event.target.closest?.('button')) return;
      const object = objectAtPoint(event);
      if (object) select(object);
    });

    buttons.forEach(button => {
      const object = button.dataset.object;
      button.setAttribute('aria-describedby', 'detection-result');
      if (button.classList.contains('object-hotspot')) {
        const detection = DETECTIONS[object];
        button.style.left = `${(detection.x + detection.width / 2) * 100}%`;
        button.style.top = `${(detection.y + detection.height / 2) * 100}%`;
      }
      button.addEventListener('pointerenter', event => {
        if (!finePointer.matches || event.pointerType === 'touch') return;
        playback.interact();
        hovered = object;
        update();
      });
      button.addEventListener('pointerleave', () => {
        playback.interact();
        if (hovered === object) hovered = null;
        update();
      });
      button.addEventListener('focus', () => { playback.interact(); focused = object; update(); });
      button.addEventListener('blur', () => {
        playback.interact();
        if (focused === object) focused = null;
        update();
      });
      button.addEventListener('click', () => select(object));
    });
    reset.addEventListener('click', clear);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') clear();
    });
    update();
    const scanOrder = ['person', 'sign', 'train', 'rail'];
    const playback = createPlayback(card, 5600, progress => {
      const object = scanOrder[Math.min(scanOrder.length - 1, Math.floor(progress * scanOrder.length))];
      if (automatic === object) return;
      automatic = object;
      update();
    }, () => clear(false));
  }

  document.addEventListener('visibilitychange', () => {
    playbacks.forEach(playback => playback.synchronize());
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) playbacks.forEach(playback => playback.finish());
    else playbacks.forEach(playback => playback.play());
  });
  if (!hasObserver) {
    const updateVisibility = () => playbacks.forEach((playback, card) => {
      const rect = card.getBoundingClientRect();
      playback.setVisible(rect.bottom > 0 && rect.top < window.innerHeight);
    });
    window.addEventListener('scroll', updateVisibility, {passive: true});
    window.addEventListener('resize', updateVisibility, {passive: true});
  }

  enhanceNavigation();
  enhanceForecast();
  enhanceStepDemo('rag', 2400, [
    'Simulated workflow loops while visible.',
    '1 / 4 — Read the document context.',
    '2 / 4 — Retrieve the relevant passages.',
    '3 / 4 — Generate an answer from that context.',
    '4 / 4 — Illustrative answer ready. The workflow repeats shortly.'
  ]);
  enhanceStepDemo('vr', 2000, [
    'Simulated gesture loops while visible.',
    '1 / 3 — Recognize a hand gesture.',
    '2 / 3 — Translate the gesture into movement.',
    '3 / 3 — Arrive at the destination. The gesture repeats shortly.'
  ]);
  enhanceDetection();
  enhanceReveals();
})();
