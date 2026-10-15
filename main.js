/* Beauty Studio By M — animations, héros vidéo piloté par le défilement, galerie, avis.
   GSAP + ScrollTrigger + Lenis sont hébergés dans assets/vendor. La réservation est dans booking.js. */
(() => {
  'use strict';

  const BSM = window.BSM || { groups: [], hours: {}, gallery: [], reviews: [], serviceImages: {} };
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const isMobile = () => innerWidth <= 820;
  const eur = n => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const api = { lenis: null, ready: false };
  window.BSMApi = api;

  /* ------------------------------------------------------------------ contenu généré à partir des données */
  const imgTag = (im, sizes, cls) => {
    const files = im.files.slice().sort((a, b) => a.w - b.w);
    const big = files[files.length - 1];
    return '<img' + (cls ? ' class="' + cls + '"' : '') + ' src="' + files[0].f + '" srcset="' + files.map(f => '' + f.f + ' ' + f.w + 'w').join(', ') + '" sizes="' + sizes + '" width="' + big.w + '" height="' + big.h + '" alt="' + im.alt.replace(/"/g, '&quot;') + '" loading="lazy" decoding="async">';
  };

  /* bandeau défilant */
  (() => {
    const words = ['Pose américaine', 'Gel', 'Nail art', 'Gainage', 'Remplissage', 'Semi-permanent', 'Soins des pieds', 'Épilation', 'Rehaussement de cils', 'Maquillage mariée'];
    const one = words.map(w => '<span>' + w + '</span><i><svg aria-hidden="true"><use href="#i-sparkle"/></svg></i>').join('');
    const row = $('#marquee'); if (row) row.innerHTML = one + one;
  })();

  /* liste « savoir-faire » : prix de départ lus dans les données */
  const itemsOf = (gid, sub) => {
    const g = BSM.groups.find(x => x.id === gid); if (!g) return [];
    return g.subs.filter(s => !sub || s.title === sub).flatMap(s => s.items);
  };
  (() => {
    const rows = [
      ['Poses <em>américaines</em>', 'mains', 'Pose américaine', 'srv-americaine'],
      ['Poses en <em>gel</em>', 'mains', 'Pose complète en gel', 'srv-gel'],
      ['Gainage &amp; <em>semi-permanent</em>', 'mains', 'Semi-permanent et gainage', 'srv-gainage'],
      ['<em>Remplissages</em>', 'mains', 'Remplissage', 'srv-remplissage'],
      ['Nail <em>art</em>', 'nailart', null, 'srv-nailart'],
      ['Beauté des <em>pieds</em>', 'pieds', 'Ongles des pieds', 'srv-pieds'],
      ['Épilation &amp; <em>soins</em>', 'epilation', null, null],
      ['Maquillage <em>mariée</em>', 'mariee', null, null]
    ];
    const list = $('#knowList'); if (!list) return;
    list.innerHTML = rows.map((r, i) => {
      const its = itemsOf(r[1], r[2]).filter(x => !x.addon || r[1] === 'nailart');
      const from = its.length ? Math.min(...its.map(x => x.price)) : 0;
      const im = r[3] && BSM.serviceImages[r[3]];
      const src = im ? '' + im.files[0].f : 'logo-360.webp';
      return '<li class="know__row" data-g="' + r[1] + '" data-sub="' + (r[2] || '') + '" data-img="' + src + '"><a href="#reserver" aria-label="' + r[0].replace(/<[^>]+>/g, '').replace(/&amp;/g, 'et') + ', voir les tarifs et réserver">' +
        '<span class="know__n">' + String(i + 1).padStart(2, '0') + '</span><span class="know__t">' + r[0] + '</span>' +
        '<span class="know__p">dès<b>' + eur(from) + '</b></span><span class="know__go"><svg aria-hidden="true"><use href="#i-arrow"/></svg></span>' +
        '<span class="know__thumb"><img src="' + src + '" alt="" loading="lazy" width="54" height="68"></span></a></li>';
    }).join('');
    list.addEventListener('click', e => {
      const a = e.target.closest('.know__row a'); if (!a) return;
      e.preventDefault();
      const row = a.closest('.know__row');
      if (window.BSMBooking) window.BSMBooking.openGroup(row.dataset.g, row.dataset.sub || null);
    });
    /* image flottante qui suit le curseur */
    const fl = $('#knowFloat'); if (!fl || !fine) return;
    const fi = $('img', fl); let tx = 0, ty = 0, cx = 0, cy = 0, on = false;
    list.addEventListener('pointerover', e => { const r = e.target.closest('.know__row'); if (r) { fi.src = r.dataset.img; fl.classList.add('is-on'); on = true; } });
    list.addEventListener('pointerleave', () => { fl.classList.remove('is-on'); on = false; });
    addEventListener('pointermove', e => { tx = e.clientX + 40; ty = e.clientY; });
    (function loop() { cx += (tx - cx) * .14; cy += (ty - cy) * .14; fl.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0) translate(-50%,-50%) rotate(' + ((tx - cx) * .04) + 'deg)'; requestAnimationFrame(loop); })();
  })();

  /* galerie */
  (() => {
    const track = $('#galTrack'); if (!track) return;
    track.innerHTML = BSM.gallery.map((im, i) => '<figure class="gitem" data-i="' + i + '" data-reveal-g>' + imgTag(im, '(max-width:820px) 80vw, 40vh', '') + '<figcaption>' + im.alt + '</figcaption></figure>').join('');
    $('#galTot').textContent = String(BSM.gallery.length).padStart(2, '0');
  })();

  /* avis */
  (() => {
    const row = $('#revRow'); if (!row) return;
    const card = r => '<figure class="rev"><blockquote>' + r.t + '</blockquote><figcaption><span><b>' + r.n + '</b>' + (r.svc || r.when) + '</span><span class="src">' + r.src + '</span></figcaption></figure>';
    const cards = BSM.reviews.map(card).join('');
    row.innerHTML = cards + cards;
  })();

  /* horaires */
  (() => {
    const box = $('#hours'); if (!box) return;
    const days = [[1, 'Lundi'], [2, 'Mardi'], [3, 'Mercredi'], [4, 'Jeudi'], [5, 'Vendredi'], [6, 'Samedi'], [0, 'Dimanche']];
    const fmt = t => parseInt(t.slice(0, 2), 10) + ' h' + (t.slice(3) === '00' ? '' : ' ' + t.slice(3));
    const today = new Date().getDay();
    box.outerHTML = '<dl class="hours" id="hours">' + days.map(([d, n]) => {
      const h = BSM.hours[d];
      return '<dt' + (d === today ? ' class="is-today"' : '') + '>' + n + '</dt><dd' + (d === today ? ' class="is-today"' : '') + '>' + (h ? h.map(w => fmt(w[0]) + ' – ' + fmt(w[1])).join(' · ') : 'Fermé') + '</dd>';
    }).join('') + '</dl>' + closedNote();
    function closedNote() {
      const now = new Date().toISOString().slice(0, 10), fut = (BSM.closed || []).filter(d => d >= now); if (!fut.length) return '';
      const parts = []; let a = fut[0], b = fut[0];
      const next = d => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + 1); return x.toISOString().slice(0, 10); };
      const f = d => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
      for (const d of fut.slice(1).concat([null])) { if (d && d === next(b)) { b = d; continue; } parts.push(a === b ? f(a) : 'du ' + f(a) + ' au ' + f(b)); a = b = d; }
      return '<p class="hours__note">Fermeture exceptionnelle : ' + parts.join(', ') + '.</p>';
    }
  })();

  const total = BSM.groups.reduce((a, g) => a + g.subs.reduce((b, s) => b + s.items.length, 0), 0);
  const sc = $('#statCount'); if (sc && total) { sc.textContent = total; sc.dataset.count = total; }
  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------ défilement : Lenis + ScrollTrigger */
  const head = $('#head'), hero = $('#accueil');
  function setupScroll() {
    if (!hasGsap) return;
    gsap.registerPlugin(ScrollTrigger);
    if (typeof Lenis !== 'undefined' && !reduce) {
      const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
      api.lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      lenis.stop();
    }
  }
  api.scrollTo = (target, opt = {}) => {
    const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY + (opt.offset || 0);
    if (api.lenis) api.lenis.scrollTo(y, { duration: opt.duration || 1.4, easing: t => 1 - Math.pow(1 - t, 4), immediate: reduce });
    else scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const el = document.getElementById(id.slice(1)); if (!el) return;
    e.preventDefault();
    closeMenu();
    api.scrollTo(el, { offset: id === '#reserver' ? -8 : 0 });
    history.replaceState(null, '', id);
  });

  /* menu mobile */
  const burger = $('#burger'), menu = $('#menu');
  function closeMenu() { document.body.classList.remove('menu-open'); if (burger) { burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Ouvrir le menu'); } if (menu) menu.setAttribute('aria-hidden', 'true'); if (api.lenis && api.ready) api.lenis.start(); }
  if (burger) burger.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu'); menu.setAttribute('aria-hidden', String(!open));
    if (api.lenis) open ? api.lenis.stop() : api.lenis.start();
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ------------------------------------------------------------------ héros : séquence d'images pilotée par le défilement */
  const SEQ = window.BSM_SEQ || { frames: 105, focus: [[0, .54]] };     // généré par outils/fabriquer-sequence.py
  const FRAMES = SEQ.frames;
  const canvas = $('#heroCanvas'), ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  const seq = [];                                           // images chargées, indexées de 0 à FRAMES-1
  let cw = 0, ch = 0, cur = 0, target = 0, heroP = 0, drawnKey = '';
  const frameUrl = i => 'h-' + String(i + 1).padStart(3, '0') + '.webp';
  /* cadrage horizontal d'un plan à l'autre (utile sur écran vertical), interpolé en douceur */
  const focusX = i => {
    const f = SEQ.focus; if (i <= f[0][0]) return f[0][1];
    for (let k = 1; k < f.length; k++) if (i <= f[k][0]) { const a = f[k - 1], b = f[k], t = (i - a[0]) / Math.max(1, b[0] - a[0]); return a[1] + (b[1] - a[1]) * t * t * (3 - 2 * t); }
    return f[f.length - 1][1];
  };
  const FOCUS_Y = .5;

  function sizeCanvas() {
    if (!canvas) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.6);
    cw = Math.round(canvas.clientWidth * dpr); ch = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; drawnKey = ''; }
  }
  function nearest(i) { for (let k = i; k >= 0; k--) if (seq[k]) return k; for (let k = i + 1; k < FRAMES; k++) if (seq[k]) return k; return -1; }
  function paint(idx, alpha, zoom) {
    const im = seq[idx], iw = im.naturalWidth, ih = im.naturalHeight;
    const sc = Math.max(cw / iw, ch / ih) * zoom, w = iw * sc, h = ih * sc;
    const fx = focusX(idx), fy = FOCUS_Y;
    const x = Math.min(0, Math.max(cw - w, cw * .5 - fx * w)), y = Math.min(0, Math.max(ch - h, ch * .5 - fy * h));
    ctx.globalAlpha = alpha; ctx.drawImage(im, x, y, w, h);
  }
  function draw() {                                        // image courante + fondu vers la suivante : défilement fluide
    if (!ctx || !cw) return;
    const i0 = nearest(Math.min(FRAMES - 1, Math.floor(cur))); if (i0 < 0) return;
    const i1 = nearest(Math.min(FRAMES - 1, i0 + 1)), f = Math.round((cur - Math.floor(cur)) * 16) / 16;
    const zoom = 1 + heroP * .24;
    const key = i0 + ':' + i1 + ':' + f + ':' + zoom.toFixed(3) + ':' + cw + 'x' + ch;
    if (key === drawnKey) return; drawnKey = key;
    paint(i0, 1, zoom);
    if (i1 > i0 && f > 0) paint(i1, f, zoom);
    ctx.globalAlpha = 1;
  }
  function loadFrame(i) {
    return new Promise(res => {
      if (seq[i]) return res(seq[i]);
      const im = new Image(); im.decoding = 'async';
      im.onload = () => { seq[i] = im; res(im); }; im.onerror = () => res(null);
      im.src = frameUrl(i);
    });
  }
  async function preloadHero(onProgress) {
    if (!canvas) return;
    const step = isMobile() ? 2 : 1;
    const order = [0]; for (let i = step; i < FRAMES; i += step) order.push(i); if (order[order.length - 1] !== FRAMES - 1) order.push(FRAMES - 1);
    const first = order.slice(0, Math.min(14, order.length)), rest = order.slice(first.length);
    let done = 0;
    await Promise.all(first.map(i => loadFrame(i).then(() => { done++; onProgress && onProgress(done / first.length); })));
    /* le reste se charge en arrière-plan, quatre images à la fois */
    (async () => { for (let k = 0; k < rest.length; k += 4) await Promise.all(rest.slice(k, k + 4).map(loadFrame)); })();
  }

  /* particules dorées (paillettes) au-dessus de la vidéo */
  function glints() {
    const c = $('#glints'); if (!c || reduce) return;
    const g = c.getContext('2d'); let W = 0, H = 0; const P = []; let vis = true, last = 0, vel = 0;
    const size = () => { const d = Math.min(devicePixelRatio || 1, 1.5); W = c.width = Math.round(c.clientWidth * d); H = c.height = Math.round(c.clientHeight * d); };
    size(); addEventListener('resize', size);
    new IntersectionObserver(en => { vis = en[0].isIntersecting; }, { threshold: 0 }).observe(c);
    let lp = 0; if (api.lenis) api.lenis.on('scroll', e => { vel = Math.min(1, Math.abs(e.velocity || 0) / 40); });
    const spawn = () => { P.push({ x: Math.random() * W, y: H * (.35 + Math.random() * .7), r: (.5 + Math.random() * 1.9) * (W / 1400 + .6), vy: .12 + Math.random() * .4, vx: (Math.random() - .5) * .25, a: 0, life: 0, max: 240 + Math.random() * 300, tw: Math.random() * 6 }); };
    (function loop(t) {
      requestAnimationFrame(loop);
      if (!vis) return;
      const dt = Math.min(40, t - last || 16); last = t;
      if (P.length < 60 && Math.random() < .35 + vel * .6) spawn();
      g.clearRect(0, 0, W, H);
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i]; p.life += dt / 16; p.y -= p.vy * (1 + vel * 6) * dt / 16; p.x += p.vx * dt / 16;
        const k = p.life / p.max; if (k >= 1) { P.splice(i, 1); continue; }
        p.a = Math.sin(Math.PI * k) * (.55 + .45 * Math.sin(p.life * .09 + p.tw));
        g.globalAlpha = Math.max(0, p.a);
        g.fillStyle = i % 3 ? '#e8cba9' : '#ffffff';
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fill();
        if (p.r > 1.7) { g.strokeStyle = '#fff'; g.lineWidth = .6; g.beginPath(); g.moveTo(p.x - p.r * 3.4, p.y); g.lineTo(p.x + p.r * 3.4, p.y); g.moveTo(p.x, p.y - p.r * 3.4); g.lineTo(p.x, p.y + p.r * 3.4); g.stroke(); }
      }
      vel *= .94;
    })(0);
  }

  function heroScroll() {
    if (!hero) return;
    sizeCanvas(); addEventListener('resize', () => { sizeCanvas(); ScrollTrigger.refresh(); });
    const scenes = [$('#scene1'), $('#scene2'), $('#scene3')];
    const foot = $('.hero__foot'), bar = $('#heroBar'), vig = $('.hero__vignette');
    hero.classList.add('has-canvas');
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: .45,
        onUpdate: self => { heroP = self.progress; target = heroP * (FRAMES - 1); if (bar) bar.style.transform = 'scaleX(' + heroP + ')'; } }
    });
    /* scène 1 -> 2 -> 3 : durées exprimées en fraction du défilement du héros (total = 1) */
    tl.to(scenes[0], { y: -80, autoAlpha: 0, duration: .13, ease: 'power1.in' }, .08)
      .to(foot, { autoAlpha: 0, duration: .08 }, .05)
      .fromTo(scenes[1], { y: 70, autoAlpha: 0, scale: .96 }, { y: 0, autoAlpha: 1, scale: 1, duration: .12, ease: 'power2.out' }, .27)
      .to(scenes[1], { y: -70, autoAlpha: 0, scale: 1.04, duration: .1, ease: 'power1.in' }, .51)
      .fromTo(scenes[2], { y: 70, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .12, ease: 'power2.out' }, .66)
      .to(vig, { '--vig': 1, duration: .6 }, .3);
    gsap.ticker.add((time, dt) => {
      cur += (target - cur) * (1 - Math.exp(-Math.min(80, dt || 16) / 1000 * 11));
      if (Math.abs(target - cur) < .002) cur = target;
      draw();
    });
    /* retour au premier plan : le dernier plan de la vidéo s'assombrit vers la suite */
    ScrollTrigger.create({ trigger: hero, start: 'bottom bottom', end: 'bottom top', scrub: true, onUpdate: self => { const f = $('.hero__shade'); if (f) f.style.opacity = String(1 + self.progress * .0); } });
  }

  /* entrée du héros après le préchargement */
  function heroIntro() {
    const t1 = $('.hero__t1'), t2 = $('.hero__t2');
    [t1, t2].forEach(el => { if (el && !el.querySelector('.inner')) el.innerHTML = '<span class="inner">' + el.innerHTML + '</span>'; });
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    gsap.set(['.hero__kicker', '.hero__title', '.hero__lead', '.hero__cta', '.hero__foot'], { opacity: 1 });
    tl.from('.hero__kicker', { y: 26, opacity: 0, duration: 1.1 })
      .from('.hero__t1 .inner', { yPercent: 115, duration: 1.4, ease: 'power4.out' }, '<.12')
      .from('.hero__t2 .inner', { yPercent: 115, duration: 1.4, ease: 'power4.out' }, '<.14')
      .from('.hero__lead', { y: 34, opacity: 0, duration: 1.2 }, '<.35')
      .from('.hero__cta > *', { y: 30, opacity: 0, duration: 1, stagger: .1 }, '<.2')
      .from('.hero__foot', { opacity: 0, y: 16, duration: 1 }, '<.2');
  }

  /* ------------------------------------------------------------------ révélations, compteurs, parallaxe */
  function reveals() {
    const io = new IntersectionObserver(en => en.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    $$('[data-reveal]').forEach((el, i) => { el.style.setProperty('--d', (el.dataset.delay || 0) + 's'); io.observe(el); });
    $$('[data-split]').forEach(el => {
      const walk = node => Array.from(node.childNodes).map(n => {
        if (n.nodeType === 3) return n.textContent.split(/(\s+)/).map(w => (/^\s+$/.test(w) || !w) ? w : '<span class="w"><span>' + w + '</span></span>').join('');
        if (n.nodeType === 1) return '<' + n.tagName.toLowerCase() + '>' + walk(n) + '</' + n.tagName.toLowerCase() + '>';
        return '';
      }).join('');
      el.setAttribute('aria-label', el.textContent.trim());
      el.innerHTML = walk(el);
      $$('.w > span', el).forEach((s, i) => s.style.setProperty('--i', i));
      $$('.w', el).forEach(w => w.setAttribute('aria-hidden', 'true'));
      io.observe(el);
    });
    /* texte du manifeste : les mots s'allument avec le défilement */
    const m = $('#manifesto');
    if (m) {
      const html = Array.from(m.childNodes).map(n => {
        if (n.nodeType === 3) return n.textContent.split(/(\s+)/).map(w => (/^\s+$/.test(w) || !w) ? w : '<span class="mw">' + w + '</span>').join('');
        return n.nodeType === 1 ? '<em>' + n.textContent.split(/(\s+)/).map(w => (/^\s+$/.test(w) || !w) ? w : '<span class="mw">' + w + '</span>').join('') + '</em>' : '';
      }).join('');
      m.innerHTML = html;
      const words = $$('.mw', m);
      if (reduce) words.forEach(w => w.classList.add('on'));
      else ScrollTrigger.create({ trigger: m, start: 'top 82%', end: 'bottom 52%', onUpdate: s => { const n = Math.round(s.progress * words.length); words.forEach((w, i) => w.classList.toggle('on', i < n)); } });
    }
    /* compteurs */
    $$('[data-count]').forEach(el => {
      const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), o = { v: 0 };
      const fmt = v => v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      if (reduce) { el.textContent = fmt(to); return; }
      el.textContent = fmt(0);
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: to, duration: 1.8, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(o.v); } }) });
    });
    /* parallaxe douce des images */
    if (!reduce) $$('[data-parallax]').forEach(img => gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
  }

  /* ------------------------------------------------------------------ en-tête, navigation, barre mobile */
  function chrome() {
    let lastY = 0;
    const stick = $('#stickybar'), book = $('#reserver'), foot = $('.foot');
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => {
      const y = self.scroll(); head.classList.toggle('is-solid', y > 40);
      const pastHero = y > hero.offsetHeight;
      head.classList.toggle('is-hidden', pastHero && y > lastY && y > 300 && !document.body.classList.contains('menu-open'));
      lastY = y;
    } });
    const hide = el => { const r = el.getBoundingClientRect(); return r.top < innerHeight * .7 && r.bottom > innerHeight * .2; };
    if (stick) ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => { const y = self.scroll(); const off = hide(book) || hide(foot) || y < innerHeight * .9; stick.classList.toggle('is-on', !off); } });
    const links = $$('.nav a');
    links.forEach(a => { const t = document.querySelector(a.getAttribute('href')); if (t) ScrollTrigger.create({ trigger: t, start: 'top 55%', end: 'bottom 55%', onToggle: s => a.classList.toggle('is-cur', s.isActive) }); });
  }

  /* ------------------------------------------------------------------ galerie : défilement horizontal + visionneuse */
  function gallery() {
    const pin = $('#galPin'), track = $('#galTrack'), vp = $('#galViewport'); if (!pin || !track) return;
    const now = $('#galNow'); const n = BSM.gallery.length;
    const step = dir => vp.scrollBy({ left: dir * Math.max(300, vp.clientWidth * .8), behavior: 'smooth' });
    const pv = $('#galPrev'), nx = $('#galNext'); if (pv) pv.addEventListener('click', () => step(-1)); if (nx) nx.addEventListener('click', () => step(1));
    const mm = gsap.matchMedia();
    mm.add('(min-width: 821px)', () => {                 // pas d'épinglage : la page ne reste jamais bloquée
      const onScroll = () => { const f = track.children[0]; if (!f) return; const w = f.getBoundingClientRect().width + 28; now.textContent = String(Math.min(n, Math.round(vp.scrollLeft / w) + 1)).padStart(2, '0'); };
      vp.addEventListener('scroll', onScroll, { passive: true });
      let down = false, sx = 0, sl = 0, moved = false;
      vp.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = vp.scrollLeft; });
      addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; vp.scrollLeft = sl - dx; });
      addEventListener('pointerup', () => { down = false; });
      vp.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    });
    mm.add('(max-width: 820px)', () => {
      vp.addEventListener('scroll', () => { const f = track.children[0]; if (!f) return; const w = f.getBoundingClientRect().width + 14; now.textContent = String(Math.min(n, Math.round(vp.scrollLeft / w) + 1)).padStart(2, '0'); }, { passive: true });
    });

    /* visionneuse */
    const box = $('#lb'), img = $('#lbImg'), cap = $('#lbCap'); let idx = 0;
    const big = i => { const f = BSM.gallery[i].files.slice().sort((a, b) => b.w - a.w)[0]; return '' + f.f; };
    const show = i => { idx = (i + n) % n; img.src = big(idx); img.alt = BSM.gallery[idx].alt; cap.textContent = BSM.gallery[idx].alt + ' · ' + (idx + 1) + ' / ' + n; };
    const open = i => { show(i); box.hidden = false; document.body.classList.add('lb-open'); if (api.lenis) api.lenis.stop(); $('#lbClose').focus(); };
    const close = () => { box.hidden = true; document.body.classList.remove('lb-open'); if (api.lenis && api.ready) api.lenis.start(); };
    track.addEventListener('click', e => { const f = e.target.closest('.gitem'); if (f) open(+f.dataset.i); });
    $('#lbClose').addEventListener('click', close);
    $('#lbPrev').addEventListener('click', () => show(idx - 1));
    $('#lbNext').addEventListener('click', () => show(idx + 1));
    box.addEventListener('click', e => { if (e.target === box) close(); });
    addEventListener('keydown', e => { if (box.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
    let sx = 0; box.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); });
  }

  /* ------------------------------------------------------------------ curseur, boutons magnétiques, carte */
  function pointerFx() {
    const cur = $('#cursor'); if (!cur || !fine || reduce) return;
    let x = 0, y = 0, tx = 0, ty = 0; cur.classList.add('is-on');
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; });
    (function loop() { x += (tx - x) * .22; y += (ty - y) * .22; cur.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'; requestAnimationFrame(loop); })();
    document.addEventListener('pointerover', e => {
      const t = e.target;
      cur.classList.toggle('is-view', !!t.closest('.gitem'));
      cur.classList.toggle('is-link', !t.closest('.gitem') && !!t.closest('a,button,summary,label,.mrow__add'));
    });
    /* traînée de paillettes */
    const c = document.createElement('canvas'); c.style.cssText = 'position:fixed;inset:0;z-index:119;pointer-events:none;width:100%;height:100%'; document.body.appendChild(c);
    const g = c.getContext('2d'); let W, H; const S = []; let lx = -9, ly = -9;
    const size = () => { W = c.width = innerWidth; H = c.height = innerHeight; }; size(); addEventListener('resize', size);
    addEventListener('pointermove', e => { const d = Math.hypot(e.clientX - lx, e.clientY - ly); if (d > 26 && S.length < 40) { lx = e.clientX; ly = e.clientY; S.push({ x: lx + (Math.random() - .5) * 10, y: ly + (Math.random() - .5) * 10, r: 1 + Math.random() * 2.2, vy: .2 + Math.random() * .5, a: 1 }); } });
    (function loop() { requestAnimationFrame(loop); g.clearRect(0, 0, W, H); for (let i = S.length - 1; i >= 0; i--) { const p = S[i]; p.a -= .022; p.y += p.vy; if (p.a <= 0) { S.splice(i, 1); continue; } g.globalAlpha = p.a * .8; g.fillStyle = i % 2 ? '#e8cba9' : '#fff'; g.beginPath(); g.moveTo(p.x, p.y - p.r * 2.2); g.lineTo(p.x + p.r * .5, p.y - p.r * .5); g.lineTo(p.x + p.r * 2.2, p.y); g.lineTo(p.x + p.r * .5, p.y + p.r * .5); g.lineTo(p.x, p.y + p.r * 2.2); g.lineTo(p.x - p.r * .5, p.y + p.r * .5); g.lineTo(p.x - p.r * 2.2, p.y); g.lineTo(p.x - p.r * .5, p.y - p.r * .5); g.closePath(); g.fill(); } })();
    /* boutons magnétiques */
    $$('[data-magnetic]').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); const mx = (e.clientX - r.left - r.width / 2) * .22, my = (e.clientY - r.top - r.height / 2) * .32; b.style.transform = 'translate(' + mx + 'px,' + my + 'px)'; });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }
  (() => {
    const btn = $('#mapBtn'); if (!btn) return;
    btn.addEventListener('click', () => {
      const lat = 43.8775349, lng = 5.8456456, d = .006;
      const f = document.createElement('iframe');
      f.title = 'Carte : Beauty Studio By M, 7 rue du Grand Pré, Volx'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer';
      f.src = 'https://www.openstreetmap.org/export/embed.html?bbox=' + [lng - d, lat - d * .7, lng + d, lat + d * .7].join('%2C') + '&layer=mapnik&marker=' + lat + '%2C' + lng;
      btn.replaceWith(f);
    });
  })();

  /* ------------------------------------------------------------------ préchargement et démarrage */
  function boot() {
    const loader = $('#loader'), fill = $('#loaderFill'), pct = $('#loaderPct');
    const setP = p => { const v = Math.round(Math.min(1, p) * 100); if (fill) fill.style.transform = 'scaleX(' + Math.min(1, p) + ')'; if (pct) pct.textContent = v; };
    const finish = () => {
      document.documentElement.classList.remove('is-loading');
      loader.classList.add('is-done');
      setTimeout(() => loader.remove(), 1500);
      api.ready = true; if (api.lenis) api.lenis.start();
      if (hasGsap && !reduce) heroIntro();
      else { gsap && gsap.set && gsap.set('.hero__kicker,.hero__title,.hero__lead,.hero__cta,.hero__foot', { opacity: 1 }); }
      document.documentElement.classList.add('is-ready');
      if (hasGsap) setTimeout(() => ScrollTrigger.refresh(), 400);
    };
    if (!hasGsap) { loader.remove(); document.documentElement.classList.remove('is-loading', 'js'); return; }
    setupScroll();
    if (!reduce) heroScroll();
    reveals(); chrome(); gallery(); pointerFx(); glints();
    if (reduce) { $$('.hero__scene--1 > *, .hero__foot').forEach(e => { e.style.opacity = 1; }); }
    let p = 0, shown = 0; const t0 = performance.now();
    const fontsReady = (document.fonts && document.fonts.ready) || Promise.resolve();
    let loaded = false;
    preloadHero(r => { p = r; }).then(() => fontsReady).then(() => { loaded = true; });
    (function tick() {                                  // minuterie (et non rAF) : le chargement ne dépend pas de l'affichage
      const t = performance.now() - t0;
      const goal = loaded ? 1 : Math.min(.9, p * .9);
      shown += (goal - shown) * .2;
      setP(shown);
      if (loaded && shown > .985 && t > 1500) { setP(1); setTimeout(finish, 250); return; }
      if (t > 8000 && !loaded) { loaded = true; }
      setTimeout(tick, 40);
    })();
    draw();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
