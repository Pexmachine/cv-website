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

function setup({reduced = false, observersEnabled = true, revealEnabled = false, pairedReveals = false} = {}) {
  const ids = ['year', 'site-nav', 'forecast-progress', 'forecast-readout', 'forecast-clip',
    'forecast-dot', 'forecast-threshold', 'forecast-alert', 'forecast-alert-title', 'forecast-recommendation', 'vision-demo', 'railway-scene', 'detection-box', 'detection-label',
    'detection-result', 'detection-reset', 'vr-tree', 'vr-left-hand', 'vr-right-hand', 'vr-distance'];
  const all = Object.fromEntries(ids.map(id => [id, new Element(id)]));
  all['forecast-threshold'].setAttribute('y1', '72');
  const header = new Element();
  const menu = new Element('', 'BUTTON');
  menu.setAttribute('aria-expanded', 'false');
  header.append(menu, all['site-nav']);
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
    card.selectors = {'[data-demo-status]': card.status};
    if (name === 'rag') {
      card.form = new Element('', 'FORM');
      card.results = new Element();
      card.placeholder = new Element();
      card.steps = [1, 2, 3, 4].map(() => new Element());
      Object.assign(card.selectors, {'[data-rag-form]': card.form, '[data-rag-results]': card.results, '[data-rag-placeholder]': card.placeholder});
      card.lists = {'[data-rag-step]': card.steps};
    }
    if (name === 'vr') card.lists = {'[data-vr-marker]': [1, 2, 3, 4, 5, 6].map(() => new Element())};
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
  const heroLink = new Element('', 'A');
  heroLink.hash = '#forecast-project';
  const project = all['forecast-project'] = new Element('forecast-project');
  project.offsetTop = 1500;
  project.offsetHeight = 500;
  demos.forecast.offsetTop = 0;
  demos.forecast.offsetHeight = 400;
  demos.forecast.offsetParent = project;
  project.selectors = {'.project-visual': demos.forecast};
  const document = new Element();
  document.hidden = false;
  document.documentElement = new Element();
  document.documentElement.setAttribute('data-palette', 'blue-peach');
  document.documentElement.scrollHeight = 5000;
  document.getElementById = id => all[id] ?? null;
  document.querySelector = selector => ({
    '.header': header, '.menu-toggle': menu, '.hero-orb': heroLink,
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
  window.location = location;
  const scrollCalls = [];
  window.scrollTo = options => scrollCalls.push(options);
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
    all, demos, buttons, hotspots, header, menu, document, window, queries, heroLink, project, scrollCalls,
    observers, frames, timers, sections, links, location, historyCalls, reveal, partner,
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

test('forecast only pauses for timeline input and resumes three seconds after activity', () => {
  const env = setup();
  const slider = env.all['forecast-progress'];
  assert.equal(env.demos.forecast.dataset.playing, 'true');
  env.frame(); env.frame(1200);
  assert.equal(slider.value, '50');
  assert.equal(env.all['forecast-dot'].getAttribute('cx'), '470');
  env.demos.forecast.fire('pointermove');
  env.demos.forecast.fire('pointerdown');
  env.demos.forecast.fire('focusin');
  env.window.fire('pointerup');
  env.frame(240);
  assert.equal(slider.value, '60', 'hovering or clicking the illustration does not pause it');
  slider.value = '30'; slider.fire('input');
  assert.equal(env.all['forecast-readout'].textContent, 'Horizon 3 / 10');
  env.frame(2999);
  assert.equal(slider.value, '30');
  assert.equal(env.demos.forecast.dataset.playing, 'false');
  env.frame(1); env.frame(240);
  assert.equal(slider.value, '40');
  slider.fire('pointerdown');
  env.frame(5000);
  assert.equal(env.demos.forecast.dataset.playing, 'false', 'holding the timeline keeps it paused');
  slider.value = '100'; slider.fire('input');
  env.window.fire('pointerup');
  env.frame(2999);
  assert.equal(slider.value, '100');
  env.frame(1); env.frame(240);
  assert.equal(slider.value, '10', 'a completed timeline restarts after the cooldown');
});

test('forecast threshold alerts track crossing, reverse scrubbing, loop reset, and reduced motion', () => {
  const env = setup(); const slider = env.all['forecast-progress'];
  assert.equal(env.all['forecast-alert'].dataset.state, 'normal');
  slider.value = '45'; slider.fire('input');
  assert.equal(env.demos.forecast.dataset.anomaly, 'false');
  slider.value = '46'; slider.fire('input');
  assert.equal(env.all['forecast-alert'].dataset.state, 'anomaly');
  assert.equal(env.all['forecast-alert-title'].textContent, 'Anomaly detected');
  assert.match(env.all['forecast-recommendation'].textContent, /Lower the temperature/);
  assert.match(slider.getAttribute('aria-valuetext'), /Anomaly detected/);
  slider.value = '45'; slider.fire('input');
  assert.equal(env.all['forecast-alert'].dataset.state, 'normal');
  assert.match(env.all['forecast-recommendation'].textContent, /No anomaly detected/);
  const looping = setup();
  looping.frame(); looping.frame(1104);
  assert.equal(looping.demos.forecast.dataset.anomaly, 'true');
  looping.frame(1196); looping.frame(2599);
  assert.equal(looping.demos.forecast.dataset.anomaly, 'true');
  looping.frame(1);
  assert.equal(looping.demos.forecast.dataset.anomaly, 'false');
  assert.equal(setup({reduced: true}).demos.forecast.dataset.anomaly, 'true');
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
  env.frame(2499);
  assert.equal(env.all['forecast-progress'].value, '100', 'the completed forecast holds for 2.5 seconds');
  env.frame(241);
  assert.equal(env.all['forecast-progress'].value, '10');
});

test('RAG waits for Send, progresses through vector search, and retains results without looping', () => {
  const env = setup(); const rag = env.demos.rag;
  assert.equal(rag.dataset.playing, 'false');
  assert.equal(rag.dataset.stage, '0');
  env.frame(9000);
  assert.equal(rag.dataset.stage, '0');
  const submit = rag.form.fire('submit');
  assert.equal(submit.defaultPrevented, true);
  assert.equal(rag.dataset.stage, '1');
  env.frame(); env.frame(1000);
  assert.equal(rag.dataset.stage, '2');
  env.frame(1600);
  assert.equal(rag.dataset.stage, '3');
  env.frame(1800);
  assert.equal(rag.dataset.stage, '4');
  assert.equal(rag.results.hidden, false);
  assert.equal(rag.placeholder.hidden, true);
  assert.equal(rag.dataset.playing, 'false');
  env.frame(20000);
  assert.equal(rag.results.hidden, false);
  rag.form.fire('submit');
  env.frame(); env.frame(1700);
  rag.form.fire('submit');
  assert.equal(rag.dataset.stage, '1', 'a second Send replaces the in-flight search');
  assert.equal(rag.results.hidden, true);
  env.frame(); env.frame(4400);
  assert.equal(rag.results.hidden, false);
});

test('an in-flight RAG search pauses offscreen and completes when the visitor returns', () => {
  const env = setup(); const rag = env.demos.rag;
  rag.form.fire('submit'); env.frame(); env.frame(1100);
  const visibility = env.observers.find(observer => observer.targets.has(rag));
  visibility.fire(rag, false); env.frame(10000);
  assert.equal(rag.dataset.stage, '2');
  assert.equal(rag.results.hidden, true);
  visibility.fire(rag, true); env.frame(); env.frame(3300);
  assert.equal(rag.results.hidden, false);
});

test('VR rests, swings both arms in opposite phases, approaches the tree, then restarts', () => {
  const env = setup(); const vr = env.demos.vr;
  assert.equal(vr.dataset.stage, 'rest');
  env.frame(); env.frame(1000);
  assert.equal(vr.dataset.stage, 'rest');
  env.frame(325);
  assert.equal(vr.dataset.stage, 'walking');
  const leftTransform = env.all['vr-left-hand'].getAttribute('transform');
  const rightTransform = env.all['vr-right-hand'].getAttribute('transform');
  const leftSwing = Number(leftTransform.match(/^translate\(0 ([\d.-]+)\)/)[1]);
  const rightSwing = Number(rightTransform.match(/^translate\(0 ([\d.-]+)\)/)[1]);
  assert.ok(leftSwing < 0 && rightSwing > 0);
  assert.equal(leftSwing, -rightSwing);
  assert.ok(Number(leftTransform.match(/scale\(([\d.]+)\)/)[1]) > 1);
  assert.ok(Number(rightTransform.match(/scale\(([\d.]+)\)/)[1]) < 1);
  env.frame(3775);
  assert.equal(vr.dataset.stage, 'arrived');
  assert.equal(env.all['vr-distance'].textContent, '6.0 m forward');
  assert.match(env.all['vr-tree'].getAttribute('transform'), /scale\(2.5\)/);
  env.frame(2499);
  assert.equal(vr.dataset.stage, 'arrived', 'arrival holds for 2.5 seconds before replay');
  env.frame(1);
  assert.equal(vr.dataset.stage, 'rest');
  assert.equal(env.all['vr-distance'].textContent, '0.0 m forward');
});

test('reduced motion keeps RAG user-triggered and immediately completes a sent report', () => {
  const env = setup({reduced: true});
  assert.equal(env.all['forecast-progress'].value, '100');
  assert.equal(env.demos.rag.dataset.stage, '0');
  env.demos.rag.form.fire('submit');
  assert.equal(env.demos.rag.results.hidden, false);
  assert.equal(env.demos.vr.dataset.stage, 'arrived');
  assert.equal(env.frames.size, 0);
  const preference = env.queries.get('(prefers-reduced-motion: reduce)');
  preference.matches = false; preference.fire('change', {matches: false});
  assert.equal(env.demos.forecast.dataset.playing, 'true');
  assert.equal(env.demos.rag.dataset.playing, 'false', 'a motion preference change does not resend the report');
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
  assert.match(env.all['detection-result'].textContent, /Hover or tap/);
  assert.equal(env.buttons.person.getAttribute('aria-pressed'), 'false');
  env.buttons.sign.fire('click');
  env.document.fire('keydown', {key: 'Escape'});
  assert.equal(env.buttons.sign.getAttribute('aria-pressed'), 'false');
  assert.match(env.all['detection-result'].textContent, /Hover or tap/);
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
  assert.match(env.all['detection-result'].textContent, /Hover or tap/);
});

test('playback visibility fallback works without IntersectionObserver', () => {
  const env = setup({observersEnabled: false});
  env.frame();
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

test('only forecasting and VR loop automatically; railway detection stays user-controlled', () => {
  const env = setup();
  assert.equal(env.demos.forecast.dataset.playing, 'true');
  assert.equal(env.demos.vr.dataset.playing, 'true');
  assert.equal(env.demos.rag.dataset.playing, 'false');
  assert.equal(env.all['detection-box'].hidden, true);
  assert.equal(env.observers.some(observer => observer.targets.has(env.all['vision-demo'])), false);
  env.buttons.person.fire('click'); env.frame(20000);
  assert.equal(env.buttons.person.getAttribute('aria-pressed'), 'true', 'inspection persists until explicitly cleared');
  assert.match(env.all['detection-result'].textContent, /Person.*Selected/);
  env.all['detection-reset'].fire('click');
  assert.equal(env.all['detection-box'].hidden, true);
  assert.match(env.all['detection-result'].textContent, /Hover or tap/);
  for (const card of [env.demos.forecast, env.demos.vr]) {
    const visibility = env.observers.find(observer => observer.targets.has(card));
    visibility.fire(card, false);
    assert.equal(card.dataset.playing, 'false');
    visibility.fire(card, true);
    assert.equal(card.dataset.playing, 'true');
  }
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

test('keyboard timeline adjustment pauses forecasting but touching VR never stops its loop', () => {
  const env = setup(); env.frame(); env.frame(500);
  env.all['forecast-progress'].fire('keydown', {key: 'ArrowRight'});
  env.demos.vr.fire('pointerdown', {pointerType: 'touch'});
  env.demos.vr.fire('pointermove', {pointerType: 'touch'});
  assert.equal(env.demos.forecast.dataset.playing, 'false');
  assert.equal(env.demos.vr.dataset.playing, 'true');
  env.frame(2999);
  assert.equal(env.demos.forecast.dataset.playing, 'false');
  env.frame(1);
  assert.equal(env.demos.forecast.dataset.playing, 'true');
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


test('hero arrow centres the first example and preserves modified-link clicks', () => {
  const env = setup();
  assert.equal(env.heroLink.fire('click', {ctrlKey: true}).defaultPrevented, false);
  assert.equal(env.scrollCalls.length, 0);
  assert.equal(env.heroLink.fire('click').defaultPrevented, true);
  assert.equal(env.scrollCalls[0].top, 1310);
  assert.equal(env.scrollCalls[0].behavior, 'smooth');
  assert.equal(env.historyCalls[0][3], '#forecast-project');
  env.project.offsetHeight = 1000;
  env.heroLink.fire('click');
  assert.equal(env.scrollCalls[1].top, 1260, 'centre the preview when the full row is too tall');
  env.demos.forecast.offsetHeight = 900;
  env.heroLink.fire('click');
  assert.equal(env.scrollCalls[2].top, 1404, 'oversized previews start below the header');
  const reduced = setup({reduced: true});
  reduced.heroLink.fire('click');
  assert.equal(reduced.scrollCalls[0].behavior, 'instant');
});
