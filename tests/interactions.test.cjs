const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

// Exercise the actual production script with controlled browser timing. This
// covers interaction state; real-browser QA covers layout and native gestures.
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

class Element {
  constructor(id = '', tagName = 'DIV') {
    Object.assign(this, {
      id, tagName, attrs: {}, dataset: {}, listeners: {}, children: [],
      value: '0', textContent: '', hidden: false, offsetHeight: 80,
      rect: {top: 0, bottom: 500, left: 0, right: 500, width: 500, height: 500}
    });
    const classes = new Set();
    this.classList = {
      add: (...names) => names.forEach(name => classes.add(name)),
      remove: (...names) => names.forEach(name => classes.delete(name)),
      contains: name => classes.has(name),
      toggle: (name, enabled = !classes.has(name)) => enabled ? classes.add(name) : classes.delete(name)
    };
    this.style = {setProperty: (key, value) => { this.style[key] = value; }};
  }
  append(...elements) {
    elements.forEach(element => { element.parentElement = this; this.children.push(element); });
  }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  getAttribute(key) { return this.attrs[key] ?? null; }
  removeAttribute(key) { delete this.attrs[key]; }
  addEventListener(type, listener) { (this.listeners[type] ??= []).push(listener); }
  fire(type, overrides = {}) {
    const event = {
      target: this, currentTarget: this, defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; }, ...overrides
    };
    (this.listeners[type] ?? []).forEach(listener => listener(event));
    return event;
  }
  getBoundingClientRect() { return this.rect; }
  querySelector(selector) { return this.selectors?.[selector] ?? null; }
  querySelectorAll(selector) { return this.lists?.[selector] ?? []; }
  contains(node) { return this === node || this.children.some(child => child.contains(node)); }
  closest(selector) {
    const matches = (selector === 'button' && this.tagName === 'BUTTON')
      || (selector === 'button[data-object]' && this.tagName === 'BUTTON' && this.dataset.object)
      || (selector === 'a[href^="#"]' && this.tagName === 'A' && this.attrs.href?.startsWith('#'));
    return matches ? this : this.parentElement?.closest(selector) ?? null;
  }
  focus() { this.focused = true; this.fire('focus'); }
}

function setup({reduced = false, observersEnabled = true, revealEnabled = false, pairedReveals = false,
  paletteEnabled = false, storedPalette = null, storageThrows = false} = {}) {
  const ids = ['year', 'site-nav', 'forecast-progress', 'forecast-readout', 'forecast-clip',
    'forecast-dot', 'vision-demo', 'railway-scene', 'detection-box', 'detection-label',
    'detection-result', 'detection-reset'];
  const all = Object.fromEntries(ids.map(id => [id, new Element(id)]));
  const header = new Element();
  const menu = new Element('', 'BUTTON');
  menu.setAttribute('aria-expanded', 'false');
  header.append(menu, all['site-nav']);
  const paletteChoices = ['blue-peach', 'navy-cream', 'violet'].map((value, index) => {
    const option = new Element('', 'OPTION');
    option.value = value;
    option.dataset.themeColor = ['#D9EAFA', '#FAF0CA', '#e8e8e8'][index];
    return option;
  });
  const themeColor = new Element('', 'META');
  themeColor.setAttribute('content', '#D9EAFA');
  if (paletteEnabled) {
    const select = all['palette-select'] = new Element('palette-select', 'SELECT');
    select.options = paletteChoices;
    select.value = 'blue-peach';
    select.append(...paletteChoices);
    header.append(select);
  }
  const sections = ['home', 'work', 'experience', 'about', 'contact'].map((id, index) => {
    const section = new Element(id);
    section.rect = {top: index * 1000, bottom: (index + 1) * 1000};
    all[id] = section;
    return section;
  });
  const links = sections.map(section => {
    const link = new Element('', 'A');
    link.setAttribute('href', `#${section.id}`);
    return link;
  });
  all['site-nav'].append(...links);
  all['site-nav'].lists = {'a[href^="#"]': links};
  const demos = Object.fromEntries(['forecast', 'rag', 'vr'].map(name => {
    const card = new Element();
    card.dataset.demo = name;
    card.play = new Element('', 'BUTTON');
    card.status = new Element();
    card.selectors = {'[data-play]': card.play, '[data-demo-status]': card.status};
    return [name, card];
  }));
  const objects = ['person', 'sign', 'train', 'rail'];
  const makeButtons = hotspot => Object.fromEntries(objects.map(object => {
    const button = new Element('', 'BUTTON');
    button.dataset.object = object;
    if (hotspot) button.classList.add('object-hotspot');
    return [object, button];
  }));
  const buttons = makeButtons(false);
  const hotspots = makeButtons(true);
  all['vision-demo'].lists = {'[data-object]': [...Object.values(hotspots), ...Object.values(buttons)]};
  all['railway-scene'].append(...Object.values(hotspots));
  const document = new Element();
  document.hidden = false;
  document.documentElement = new Element();
  document.documentElement.setAttribute('data-palette', 'blue-peach');
  document.documentElement.scrollHeight = 5000;
  document.getElementById = id => all[id] ?? null;
  document.querySelector = selector => ({
    '.header': header, '.menu-toggle': menu,
    'meta[name="theme-color"]': themeColor,
    '[data-demo="forecast"]': demos.forecast,
    '[data-demo="rag"]': demos.rag,
    '[data-demo="vr"]': demos.vr
  })[selector] ?? null;
  const reveal = new Element();
  const partner = new Element();
  const pair = new Element();
  pair.classList.add('project-pair');
  pair.append(reveal, partner);
  pair.firstElementChild = reveal;
  if (!pairedReveals) reveal.parentElement = null;
  document.querySelectorAll = selector => selector !== '[data-reveal]' ? []
    : pairedReveals ? [new Element(), reveal, partner] : revealEnabled ? [reveal] : [];
  const queries = new Map();
  const window = new Element();
  const savedPreferences = new Map([['portfolio-palette', storedPalette]]);
  window.localStorage = {
    getItem(key) { if (storageThrows) throw new Error('Storage unavailable'); return savedPreferences.get(key); },
    setItem(key, value) { if (storageThrows) throw new Error('Storage unavailable'); savedPreferences.set(key, value); }
  };
  window.innerHeight = 800;
  window.innerWidth = 1440;
  window.scrollY = 0;
  window.matchMedia = query => {
    if (!queries.has(query)) {
      const media = new Element();
      media.matches = query.includes('reduced-motion') ? reduced : query.includes('hover');
      queries.set(query, media);
    }
    return queries.get(query);
  };
  let now = 0;
  let nextFrame = 0;
  const frames = new Map();
  let nextTimer = 0;
  const timers = new Map();
  const observers = [];
  class IntersectionObserver {
    constructor(callback) { this.callback = callback; this.targets = new Set(); observers.push(this); }
    observe(target) { this.targets.add(target); }
    unobserve(target) { this.targets.delete(target); }
    fire(target, visible) { this.callback([{target, isIntersecting: visible, intersectionRatio: visible ? 1 : 0}]); }
  }
  if (observersEnabled) window.IntersectionObserver = IntersectionObserver;
  const location = {hash: '#home'};
  const historyCalls = [];
  const history = {
    pushState: (...args) => historyCalls.push(['push', ...args]),
    replaceState: (...args) => historyCalls.push(['replace', ...args])
  };
  window.history = history;
  const context = vm.createContext({
    document, window, IntersectionObserver, location, history, Date,
    performance: {now: () => now},
    setTimeout: (callback, delay) => { timers.set(++nextTimer, {callback, due: now + delay}); return nextTimer; },
    clearTimeout: id => timers.delete(id),
    requestAnimationFrame: callback => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id)
  });
  vm.runInContext(source, context, {filename: 'script.js'});
  return {
    all, demos, buttons, hotspots, header, menu, document, window, queries,
    observers, frames, timers, sections, links, location, historyCalls, reveal, partner,
    paletteChoices, themeColor, savedPreferences,
    frame(milliseconds = 16) {
      now += milliseconds;
      [...timers.entries()].forEach(([id, timer]) => {
        if (timer.due <= now && timers.delete(id)) timer.callback();
      });
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach(callback => callback(now));
    }
  };
}

function play(env, name = 'forecast') {
  env.demos[name].play.fire('click');
  env.frame();
}

function imagePoint(scene, x, y) {
  const rect = scene.rect;
  return {clientX: rect.left + x * rect.width, clientY: rect.top + y * rect.height};
}

test('menu closes on Escape, section selection, outside click, and focus leaving the header', () => {
  const env = setup();
  assert.equal(env.header.classList.contains('nav-ready'), true);
  env.menu.fire('click');
  assert.equal(env.menu.getAttribute('aria-expanded'), 'true');
  env.document.fire('keydown', {key: 'Escape'});
  assert.equal(env.menu.getAttribute('aria-expanded'), 'false');
  assert.equal(env.menu.focused, true);
  env.menu.fire('click');
  const click = env.all['site-nav'].fire('click', {target: env.links[1]});
  assert.equal(env.menu.getAttribute('aria-expanded'), 'false');
  assert.equal(click.defaultPrevented, false, 'section anchors keep native navigation');
  env.menu.fire('click');
  env.document.fire('click', {target: env.demos.forecast});
  assert.equal(env.menu.getAttribute('aria-expanded'), 'false');
  env.menu.fire('click');
  env.header.fire('focusout', {relatedTarget: env.demos.forecast.play});
  assert.equal(env.menu.getAttribute('aria-expanded'), 'false');
});

test('scroll highlighting preserves the hash and browser history', () => {
  const env = setup();
  env.window.scrollY = 1000;
  env.sections.forEach((section, index) => { section.rect.top = index * 1000 - 1000; });
  env.window.fire('scroll');
  env.frame();
  assert.equal(env.links[1].getAttribute('aria-current'), 'location');
  assert.equal(env.location.hash, '#home');
  assert.deepEqual(env.historyCalls, []);
  env.location.hash = '#work';
  env.window.fire('hashchange');
  env.frame();
  assert.equal(env.location.hash, '#work');
  assert.deepEqual(env.historyCalls, [], 'the browser owns anchor history');
});

test('forecast starts automatically, scrubbing waits for inactivity, and rapid replay cancels stale frames', () => {
  const env = setup();
  assert.equal(env.demos.forecast.dataset.playing, 'true');
  env.frame();
  env.frame(1200);
  assert.equal(env.all['forecast-progress'].value, '50');
  assert.equal(env.all['forecast-readout'].textContent, 'Horizon 5 / 10');
  assert.equal(env.all['forecast-dot'].getAttribute('cx'), '470');
  assert.equal(env.all['forecast-clip'].getAttribute('width'), '130');
  env.all['forecast-progress'].value = '30';
  env.all['forecast-progress'].fire('input');
  assert.equal(env.all['forecast-readout'].textContent, 'Horizon 3 / 10');
  env.frame(2999);
  assert.equal(env.all['forecast-progress'].value, '30');
  assert.equal(env.demos.forecast.dataset.playing, 'false');
  env.frame(1);
  env.frame(240);
  assert.equal(env.all['forecast-progress'].value, '40');
  play(env);
  env.frame(500);
  play(env);
  assert.equal(env.all['forecast-progress'].value, '0');
  env.frame(2400);
  assert.equal(env.all['forecast-progress'].value, '100');
  env.frame(600);
  env.frame(1020);
  assert.equal(env.all['forecast-progress'].value, '43', 'a completed manual forecast restarts when its cooldown expires');
  assert.equal(env.demos.forecast.dataset.playing, 'true');
});

test('offscreen and background-tab pauses preserve elapsed forecast time', () => {
  const env = setup();
  env.frame();
  env.frame(600);
  const visibility = env.observers.find(observer => observer.targets.has(env.demos.forecast));
  visibility.fire(env.demos.forecast, false);
  env.frame(5000);
  assert.equal(env.all['forecast-progress'].value, '25');
  assert.equal(env.demos.forecast.dataset.playing, 'false');
  visibility.fire(env.demos.forecast, true);
  env.frame();
  env.frame(600);
  assert.equal(env.all['forecast-progress'].value, '50');
  env.document.hidden = true;
  env.document.fire('visibilitychange');
  env.frame(5000);
  assert.equal(env.all['forecast-progress'].value, '50');
  env.document.hidden = false;
  env.document.fire('visibilitychange');
  env.frame();
  env.frame(1200);
  assert.equal(env.all['forecast-progress'].value, '100');
  env.frame(1140);
  assert.equal(env.all['forecast-progress'].value, '10');
});

test('RAG and VR reach their final stages and reduced motion shows immediate results', () => {
  const env = setup();
  play(env, 'rag');
  env.demos.vr.play.fire('click');
  env.frame();
  env.frame(500);
  assert.equal(env.demos.rag.dataset.stage, '1');
  assert.equal(env.demos.vr.dataset.stage, '1');
  env.frame(1900);
  assert.equal(env.demos.rag.dataset.stage, '4');
  assert.equal(env.demos.vr.dataset.stage, '3');
  env.frame(600);
  env.frame(1000);
  assert.equal(env.demos.rag.dataset.stage, '2', 'RAG repeats after inactivity');
  assert.equal(env.demos.vr.dataset.stage, '2', 'VR repeats after inactivity');
  const reduced = setup({reduced: true});
  assert.equal(reduced.all['forecast-progress'].value, '100');
  assert.equal(reduced.demos.rag.dataset.stage, '4');
  assert.equal(reduced.demos.vr.dataset.stage, '3');
  play(reduced);
  assert.equal(reduced.frames.size, 0);
  play(env);
  env.frame(500);
  const preference = env.queries.get('(prefers-reduced-motion: reduce)');
  preference.matches = true;
  preference.fire('change', {matches: true});
  assert.equal(env.all['forecast-progress'].value, '100');
  env.frame();
  assert.equal(env.frames.size, 0);
  preference.matches = false;
  preference.fire('change', {matches: false});
  assert.equal(env.demos.forecast.dataset.playing, 'false', 'the current interaction cooldown survives preference changes');
  env.frame(3000);
  assert.equal(env.demos.forecast.dataset.playing, 'true');
});

test('keyboard preview restores a pinned detection and Reset or Escape clears selections', () => {
  const env = setup();
  env.buttons.person.fire('focus');
  assert.match(env.all['detection-result'].textContent, /Person detected/);
  env.buttons.person.fire('click');
  assert.equal(env.buttons.person.getAttribute('aria-pressed'), 'true');
  assert.equal(env.hotspots.person.getAttribute('aria-pressed'), 'true');
  env.buttons.sign.fire('focus');
  assert.match(env.all['detection-result'].textContent, /Stop sign detected/);
  env.buttons.sign.fire('blur');
  assert.match(env.all['detection-result'].textContent, /Person detected/);
  env.all['detection-reset'].fire('click');
  assert.match(env.all['detection-result'].textContent, /Automatic preview/);
  assert.equal(env.buttons.person.getAttribute('aria-pressed'), 'false');
  env.buttons.sign.fire('click');
  env.document.fire('keydown', {key: 'Escape'});
  assert.equal(env.buttons.sign.getAttribute('aria-pressed'), 'false');
  assert.match(env.all['detection-result'].textContent, /Automatic preview/);
});

test('image inspection handles bbox overlaps, touch selection, and normalized resizing', () => {
  const env = setup();
  const scene = env.all['railway-scene'];
  scene.rect = {left: 100, top: 200, width: 600, height: 400};
  scene.fire('pointermove', {pointerType: 'mouse', ...imagePoint(scene, .16, .535)});
  assert.match(env.all['detection-result'].textContent, /Person detected/);
  scene.fire('click', imagePoint(scene, .16, .535));
  scene.fire('pointermove', {pointerType: 'mouse', ...imagePoint(scene, .39, .30)});
  assert.match(env.all['detection-result'].textContent, /Stop sign detected/, 'the sign wins its overlap with the train');
  scene.fire('pointerleave');
  assert.match(env.all['detection-result'].textContent, /Person detected/);
  scene.rect = {left: 0, top: 0, width: 280, height: 280 * 2 / 3};
  const tap = scene.fire('click', imagePoint(scene, .732, .816));
  assert.equal(tap.defaultPrevented, false);
  assert.equal(env.buttons.rail.getAttribute('aria-pressed'), 'true');
  scene.fire('pointermove', {pointerType: 'touch', ...imagePoint(scene, .39, .30)});
  assert.match(env.all['detection-result'].textContent, /Rail detected/);
  scene.fire('click', {target: env.hotspots.rail, ...imagePoint(scene, .732, .816)});
  assert.equal(env.buttons.rail.getAttribute('aria-pressed'), 'true', 'bubbled button clicks do not toggle twice');
  scene.fire('pointermove', {target: env.hotspots.sign, pointerType: 'mouse', ...imagePoint(scene, .442, .323)});
  assert.match(env.all['detection-result'].textContent, /Stop sign detected/, 'the larger hotspot remains inspectable outside its visual bbox');
  scene.fire('click', imagePoint(scene, .732, .816));
  assert.equal(env.buttons.rail.getAttribute('aria-pressed'), 'false');
  assert.match(env.all['detection-result'].textContent, /Automatic preview/);
});

test('playback visibility fallback works without IntersectionObserver', () => {
  const env = setup({observersEnabled: false});
  play(env);
  env.frame(600);
  env.demos.forecast.rect = {top: 1200, bottom: 1700};
  env.window.fire('scroll');
  env.frame(5000);
  assert.equal(env.all['forecast-progress'].value, '25');
  env.demos.forecast.rect = {top: 0, bottom: 500};
  env.window.fire('scroll');
  env.frame();
  env.frame(1800);
  assert.equal(env.all['forecast-progress'].value, '100');
});

test('all four simulations loop automatically and freeze when outside the viewport', () => {
  const env = setup();
  const cards = [...Object.values(env.demos), env.all['vision-demo']];
  cards.forEach(card => assert.equal(card.dataset.playing, 'true'));
  env.frame();
  env.frame(1500);
  assert.match(env.all['detection-result'].textContent, /Stop sign/);
  env.buttons.person.fire('click');
  env.frame(1500);
  assert.match(env.all['detection-result'].textContent, /Person.*Selected/);
  env.all['detection-reset'].fire('click');
  assert.match(env.all['detection-result'].textContent, /Stop sign.*Automatic/);
  cards.forEach(card => {
    env.observers.find(observer => observer.targets.has(card)).fire(card, false);
    assert.equal(card.dataset.playing, 'false');
  });
  const frozen = env.all['forecast-progress'].value;
  env.frame(20000);
  assert.equal(env.all['forecast-progress'].value, frozen);
  cards.forEach(card => env.observers.find(observer => observer.targets.has(card)).fire(card, true));
  env.frame();
  env.frame(3500);
  env.frame(3500);
  assert.match(env.all['detection-result'].textContent, /Stop sign.*Automatic/, 'railway scan restarts');
  cards.forEach(card => assert.equal(card.dataset.playing, 'true'));
});

test('scroll fades reveal on entry, remain readable, and repeat after leaving the viewport', () => {
  const env = setup({revealEnabled: true});
  function position(top) {
    env.reveal.rect = {top, bottom: top + 500, height: 500};
    env.window.fire('scroll');
    env.frame();
  }
  position(900);
  assert.equal(env.reveal.classList.contains('is-visible'), false);
  position(650);
  assert.equal(env.reveal.classList.contains('is-visible'), true);
  position(-400);
  assert.equal(env.reveal.classList.contains('is-visible'), true, 'content stays visible until entirely offscreen');
  position(-600);
  assert.equal(env.reveal.classList.contains('is-visible'), false);
  position(200);
  assert.equal(env.reveal.classList.contains('is-visible'), true, 'returning to the section triggers a fresh reveal');
  const preference = env.queries.get('(prefers-reduced-motion: reduce)');
  preference.matches = true;
  preference.fire('change', {matches: true});
  position(900);
  assert.equal(env.reveal.classList.contains('is-visible'), true);
});

test('each simulation waits three seconds after the latest touch, pointer, or keyboard activity', () => {
  const env = setup();
  const cards = [...Object.values(env.demos), env.all['vision-demo']];
  env.frame();
  env.frame(500);
  cards.forEach(card => card.fire('pointerdown', {pointerType: 'touch'}));
  cards.forEach(card => assert.equal(card.dataset.playing, 'false'));
  const held = env.all['forecast-progress'].value;
  env.frame(2900);
  assert.equal(env.all['forecast-progress'].value, held);
  cards.forEach(card => card.fire('keydown', {key: 'ArrowRight'}));
  env.frame(2999);
  cards.forEach(card => assert.equal(card.dataset.playing, 'false'));
  assert.equal(env.all['forecast-progress'].value, held);
  env.frame(1);
  cards.forEach(card => assert.equal(card.dataset.playing, 'true'));
  env.frame(240);
  assert.notEqual(env.all['forecast-progress'].value, held);
  env.buttons.train.fire('click');
  assert.match(env.all['detection-result'].textContent, /Train.*Selected/);
  env.frame(2999);
  assert.match(env.all['detection-result'].textContent, /Train.*Selected/);
  env.frame(1);
  assert.equal(env.buttons.train.getAttribute('aria-pressed'), 'false');
  assert.match(env.all['detection-result'].textContent, /Automatic preview/);
});

test('the fade starts inside the viewport and retains visibility near its trigger boundary', () => {
  const env = setup({revealEnabled: true});
  function position(top) {
    env.reveal.rect = {top, bottom: top + 100, height: 100};
    env.window.fire('scroll');
    env.frame();
  }
  position(810);
  position(750);
  assert.equal(env.reveal.classList.contains('is-visible'), false);
  position(690);
  assert.equal(env.reveal.classList.contains('is-visible'), true);
  position(750);
  assert.equal(env.reveal.classList.contains('is-visible'), true, 'a small scroll reversal does not flash the content');
  position(810);
  assert.equal(env.reveal.classList.contains('is-visible'), false);
});

test('paired project previews both reveal when they enter the viewport', () => {
  const env = setup({pairedReveals: true});
  [env.reveal, env.partner].forEach(element => {
    element.rect = {top: 500, bottom: 700, height: 200};
  });
  env.window.fire('scroll');
  env.frame();
  assert.equal(env.reveal.classList.contains('is-visible'), true);
  assert.equal(env.partner.classList.contains('is-visible'), true);
});

test('native palette selector restores a saved choice and each change updates the page and preference', () => {
  const env = setup({paletteEnabled: true, storedPalette: 'violet'});
  const root = env.document.documentElement;
  const select = env.all['palette-select'];
  assert.equal(root.getAttribute('data-palette'), 'violet');
  assert.equal(select.value, 'violet');
  assert.equal(env.themeColor.getAttribute('content'), '#e8e8e8');
  for (const choice of env.paletteChoices) {
    select.value = choice.value;
    select.fire('change');
    assert.equal(root.getAttribute('data-palette'), choice.value);
    assert.equal(select.value, choice.value);
    assert.equal(env.themeColor.getAttribute('content'), choice.dataset.themeColor);
    assert.equal(env.savedPreferences.get('portfolio-palette'), choice.value);
  }
});

test('stale or unavailable storage keeps the blue and peach default and allows native switching', () => {
  for (const options of [{storedPalette: 'obsolete'}, {storageThrows: true}]) {
    const env = setup({paletteEnabled: true, ...options});
    const select = env.all['palette-select'];
    assert.equal(env.document.documentElement.getAttribute('data-palette'), 'blue-peach');
    assert.equal(select.value, 'blue-peach');
    select.value = 'violet';
    select.fire('change');
    assert.equal(env.document.documentElement.getAttribute('data-palette'), 'violet');
    assert.equal(env.themeColor.getAttribute('content'), '#e8e8e8');
  }
});

test('palette input survives focus loss with no related target and closes mobile navigation on focus', () => {
  const env = setup({paletteEnabled: true});
  const select = env.all['palette-select'];
  env.menu.fire('click');
  assert.equal(env.header.classList.contains('menu-open'), true);
  select.focus();
  assert.equal(env.menu.getAttribute('aria-expanded'), 'false');
  assert.equal(env.header.classList.contains('menu-open'), false);
  // Native pickers may transfer focus to a browser/OS surface instead of a DOM node.
  select.fire('focusout', {relatedTarget: null});
  select.value = 'navy-cream';
  select.fire('change');
  assert.equal(env.document.documentElement.getAttribute('data-palette'), 'navy-cream');
  select.value = 'blue-peach';
  select.fire('change');
  assert.equal(env.document.documentElement.getAttribute('data-palette'), 'blue-peach');
});
