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

  function enhanceProjectJump() {
    const link = document.querySelector('.hero-orb');
    const project = document.getElementById('forecast-project');
    if (!link || !project) return;
    link.addEventListener('click', event => {
      if (event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
      const availableHeight = window.innerHeight - headerHeight;
      const target = project.offsetHeight <= availableHeight - 32
        ? project : project.querySelector('.project-visual') || project;
      // Layout offsets exclude the scroll-reveal transform, so the landing stays exact.
      let documentTop = 0;
      for (let node = target; node; node = node.offsetParent) documentTop += node.offsetTop;
      const inset = target.offsetHeight <= availableHeight - 32
        ? headerHeight + (availableHeight - target.offsetHeight) / 2
        : headerHeight + 16;
      if (window.location.hash !== link.hash) window.history.pushState(null, '', link.hash);
      window.scrollTo({
        top: Math.max(0, documentTop - inset),
        behavior: reducedMotion.matches ? 'instant' : 'smooth'
      });
    });
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
  function createPlayback(card, duration, render, {loop = true, autoStart = true, hold = 2500} = {}) {
    card.querySelector('[data-demo-status]')?.setAttribute('aria-live', loop ? 'off' : 'polite');
    let frame = 0;
    let elapsed = 0;
    let lastTime = null;
    let interactionUntil = 0;
    let idleTimer = 0;
    let held = false;
    let active = autoStart;
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
      if (!active || !visible || document.hidden || reducedMotion.matches || held) {
        pause();
        return;
      }
      const remaining = interactionUntil - performance.now();
      if (remaining > 0) {
        pause();
        idleTimer = setTimeout(synchronize, remaining);
        return;
      }
      if (interactionUntil) {
        interactionUntil = 0;
        card.dataset.interacting = 'false';
        if (elapsed >= duration) elapsed = 0;
      }
      if (!frame) {
        card.dataset.playing = 'true';
        frame = requestAnimationFrame(tick);
      }
    }

    function tick(time) {
      frame = 0;
      if (!active || !visible || document.hidden || reducedMotion.matches || held) {
        pause();
        return;
      }
      if (lastTime !== null) elapsed = loop
        ? (elapsed + time - lastTime) % (duration + hold)
        : Math.min(duration, elapsed + time - lastTime);
      lastTime = time;
      render(Math.min(1, elapsed / duration));
      if (!loop && elapsed >= duration) active = false;
      synchronize();
    }

    function finish() {
      if (!active) return;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = 0;
      elapsed = duration;
      if (!loop) active = false;
      pause();
      render(1);
    }

    function interact() {
      interactionUntil = performance.now() + 3000;
      card.dataset.interacting = 'true';
      pause();
      synchronize();
    }

    function play() {
      pause();
      elapsed = 0;
      interactionUntil = 0;
      card.dataset.interacting = 'false';
      active = true;
      if (reducedMotion.matches) finish();
      else { render(0); synchronize(); }
    }

    const playback = {
      synchronize, finish, play, interact,
      setVisible(value) { visible = value; synchronize(); },
      holdInteraction(value) { held = value; interact(); },
      seek(value) {
        elapsed = clamp(value) * duration;
        render(elapsed / duration);
        interact();
      },
      motionChanged() {
        if (reducedMotion.matches) finish();
        else if (loop) play();
      }
    };
    playbacks.set(card, playback);
    visibilityObserver?.observe(card);
    card.dataset.playing = 'false';
    render(autoStart && reducedMotion.matches ? 1 : 0);
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
    const threshold = document.getElementById('forecast-threshold');
    const alert = document.getElementById('forecast-alert');
    const alertTitle = document.getElementById('forecast-alert-title');
    const recommendation = document.getElementById('forecast-recommendation');
    const thresholdY = Number(threshold?.getAttribute('y1') ?? 72);
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
      const anomaly = y <= thresholdY;
      card.dataset.anomaly = String(anomaly);
      slider.setAttribute('aria-valuetext', `Forecast horizon ${horizon} of 10. ${anomaly ? 'Anomaly detected: upper limit reached.' : 'Within normal range.'}`);
      if (alert && alertTitle && recommendation) {
        alert.dataset.state = anomaly ? 'anomaly' : 'normal';
        alertTitle.textContent = anomaly ? 'Anomaly detected' : 'Within normal range';
        recommendation.textContent = anomaly
          ? 'Simulated recommendation: Lower the temperature to return to a normal state.'
          : 'No anomaly detected. The forecast is below the upper limit of 85.';
      }
      const text = `Horizon ${horizon} / 10`;
      if (readout.textContent !== text) readout.textContent = text;
    });
    slider.addEventListener('input', () => playback.seek(Number(slider.value) / 100));
    let dragging = false;
    slider.addEventListener('pointerdown', () => { dragging = true; playback.holdInteraction(true); });
    // Release may happen outside the slider after dragging or touch scrolling.
    const release = () => {
      if (!dragging) return;
      dragging = false;
      playback.holdInteraction(false);
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
    slider.addEventListener('keydown', event => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) playback.interact();
    });
  }

  function enhanceRag() {
    const card = document.querySelector('[data-demo="rag"]');
    const form = card?.querySelector('[data-rag-form]');
    const results = card?.querySelector('[data-rag-results]');
    const placeholder = card?.querySelector('[data-rag-placeholder]');
    if (!card || !form || !results || !placeholder) return;
    const steps = [...card.querySelectorAll('[data-rag-step]')];
    let submitted = false;
    const messages = [
      'Ready. Send the report to start the simulated search.',
      '1 / 4 — The human-written report is received by the system.',
      '2 / 4 — Analysing the report and encoding its meaning as a numeric vector.',
      '3 / 4 — Comparing that vector with previous reports in the vector database.',
      '4 / 4 — Ranking the reports with the highest vector similarity.'
    ];
    const playback = createPlayback(card, 4400, progress => {
      const complete = submitted && progress === 1;
      const stage = !submitted ? 0 : progress < .2 ? 1 : progress < .45 ? 2 : progress < .8 ? 3 : 4;
      card.dataset.stage = String(stage);
      steps.forEach((step, index) => {
        step.classList.toggle('is-active', !complete && index + 1 === stage);
        step.classList.toggle('is-complete', complete || index + 1 < stage);
      });
      results.hidden = !complete;
      placeholder.hidden = complete;
      placeholder.textContent = submitted ? 'Searching the report history…' : 'Matching reports will appear here.';
      setStatus(card, complete ? 'Search complete. Three potential recurrences returned. Send the report again to repeat.' : messages[stage]);
    }, {loop: false, autoStart: false});
    form.addEventListener('submit', event => {
      event.preventDefault();
      submitted = true;
      // One playback owns the whole request. Sending again replaces an in-flight search.
      playback.play();
    });
  }

  function enhanceVr() {
    const card = document.querySelector('[data-demo="vr"]');
    const tree = document.getElementById('vr-tree');
    const leftHand = document.getElementById('vr-left-hand');
    const rightHand = document.getElementById('vr-right-hand');
    const distance = document.getElementById('vr-distance');
    if (!card || !tree || !leftHand || !rightHand || !distance) return;
    distance.setAttribute('aria-live', 'off');
    const markers = [...card.querySelectorAll('[data-vr-marker]')];
    createPlayback(card, 5100, progress => {
      const time = progress * 5100;
      const movement = clamp((time - 1100) / 4000);
      const walking = time >= 1100 && time < 5100 && !reducedMotion.matches;
      // Arm swings are opposite in phase, like natural walking. Ease into and out of motion.
      const envelope = Math.min(1, movement * 12, (1 - movement) * 12);
      const swing = walking ? Math.sin((time - 1100) / 900 * Math.PI * 2) * envelope : 0;
      leftHand.setAttribute('transform', `translate(0 ${-swing * 26}) translate(120 300) scale(${1 + swing * .12}) rotate(${swing * 9}) translate(-120 -300)`);
      rightHand.setAttribute('transform', `translate(0 ${swing * 26}) translate(520 300) scale(${1 - swing * .12}) rotate(${-swing * 9}) translate(-520 -300)`);
      const scale = 1 / (1 - movement * .6);
      tree.setAttribute('transform', `translate(${390 + movement * 62} ${149 + movement * 86}) scale(${scale})`);
      // Project lane markings from the vanishing point toward the viewer.
      markers.forEach((marker, index) => {
        const depth = (index / markers.length + movement * .72) % 1;
        const far = Math.max(0, depth - .07);
        const y = 122 + 218 * depth * depth;
        const top = 122 + 218 * far * far;
        const width = 1 + depth * 5;
        const topWidth = 1 + far * 5;
        marker.setAttribute('d', `M${320 - topWidth} ${top}H${320 + topWidth}L${320 + width} ${y}H${320 - width}Z`);
      });
      distance.textContent = `${(movement * 6).toFixed(1)} m forward`;
      card.dataset.stage = walking ? 'walking' : movement === 1 ? 'arrived' : 'rest';
      setStatus(card, walking ? 'Alternate arm swings move you forward. Watch the tree get closer.'
        : movement === 1 ? 'Arms at rest. Forward travel pauses before the next walking cycle.'
          : 'Arms at rest. The walking motion starts shortly.');
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

    function update() {
      const inspected = hovered || focused || pinned;
      const active = inspected;
      result.setAttribute('aria-live', 'polite');
      const detection = DETECTIONS[active];
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.object === pinned)));
      box.hidden = !detection;
      if (!detection) {
        result.textContent = 'Hover or tap a + marker, or choose an object below, to inspect a simulated detection.';
        return;
      }
      box.style.left = `${detection.x * 100}%`;
      box.style.top = `${detection.y * 100}%`;
      box.style.width = `${detection.width * 100}%`;
      box.style.height = `${detection.height * 100}%`;
      label.textContent = `${detection.label} · ${detection.confidence}%`;
      const message = `${detection.label} detected · ${detection.confidence}% simulated confidence.${active === pinned ? ' Selected.' : ' Select to pin.'}`;
      if (result.textContent !== message) result.textContent = message;
    }

    function clear() {
      pinned = null;
      hovered = null;
      focused = null;
      update();
    }

    function select(object) {
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
      const hotspot = event.target.closest?.('button[data-object]');
      const object = hotspot ? hotspot.dataset.object : objectAtPoint(event);
      if (hovered === object) return;
      hovered = object;
      update();
    });
    scene.addEventListener('pointerleave', () => {
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
        hovered = object;
        update();
      });
      button.addEventListener('pointerleave', () => {
        if (hovered === object) hovered = null;
        update();
      });
      button.addEventListener('focus', () => { focused = object; update(); });
      button.addEventListener('blur', () => {
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
  }

  document.addEventListener('visibilitychange', () => {
    playbacks.forEach(playback => playback.synchronize());
  });
  reducedMotion.addEventListener('change', () => {
    playbacks.forEach(playback => playback.motionChanged());
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
  enhanceProjectJump();
  enhanceForecast();
  enhanceRag();
  enhanceVr();
  enhanceDetection();
  enhanceReveals();
})();
