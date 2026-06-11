/* ============================================================
   VOLTA — main.js
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     TOPNAV ↔ HEADER TOGGLE on scroll
  ---------------------------------------------------------- */
  (function () {
    var topnav = document.getElementById('topnav');
    var header = document.querySelector('.header');
    var THRESHOLD = 72;

    function applyNavState() {
      var scrolled = window.scrollY > THRESHOLD;
      if (topnav) topnav.classList.toggle('is-hidden', scrolled);
      if (header)  header.classList.toggle('is-scrolled', scrolled);
    }

    applyNavState(); // run once on load
    window.addEventListener('scroll', applyNavState, { passive: true });

    /* mark active topnav links */
    if (topnav) {
      var current = window.location.pathname.split('/').pop() || 'index.html';
      topnav.querySelectorAll('.topnav__link').forEach(function (link) {
        var href = link.getAttribute('href') || '';
        if (href === current || (current === '' && href === 'index.html')) {
          link.classList.add('is-active');
        }
      });
      topnav.querySelectorAll('.topnav__sublink').forEach(function (link) {
        var href = link.getAttribute('href') || '';
        if (href === current) {
          link.classList.add('is-active');
          var parentLink = link.closest('.topnav__item--has-sub');
          if (parentLink) parentLink.querySelector('.topnav__link').classList.add('is-active');
        }
      });
    }
  })();

  /* ----------------------------------------------------------
     PARALLAX BLOBS — scroll shifts bg-blobs container
     (position:fixed + translateY creates depth illusion)
  ---------------------------------------------------------- */
  (function () {
    const blobs = document.querySelector('.bg-blobs');
    if (!blobs) return;
    let lastY = 0, rafId = null;
    function applyParallax() {
      /* scroll down → blobs drift left; scroll up → drift right */
      blobs.style.transform = 'translateX(' + (-lastY * 0.12).toFixed(1) + 'px)';
      rafId = null;
    }
    window.addEventListener('scroll', function () {
      lastY = window.scrollY;
      if (!rafId) rafId = requestAnimationFrame(applyParallax);
    }, { passive: true });
  })();

  /* ----------------------------------------------------------
     ANIMATED GRAIN CANVAS
  ---------------------------------------------------------- */
  const canvas = document.createElement('canvas');
  canvas.id = 'grain';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let grainTick = 0;

  function resizeGrain() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function drawGrain() {
    const w = canvas.width;
    const h = canvas.height;
    const img = ctx.createImageData(w, h);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      data[i]     = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  resizeGrain();
  drawGrain();
  window.addEventListener('resize', resizeGrain);

  let lastGrainTime = 0;
  function grainLoop(ts) {
    if (ts - lastGrainTime > 55) {
      drawGrain();
      lastGrainTime = ts;
    }
    requestAnimationFrame(grainLoop);
  }
  requestAnimationFrame(grainLoop);


  /* ----------------------------------------------------------
     CUSTOM CURSOR
  ---------------------------------------------------------- */
  const cursorEl  = document.getElementById('cursor');
  const cursorDot = cursorEl?.querySelector('.cursor-dot');
  const cursorRng = cursorEl?.querySelector('.cursor-ring');

  let mX = window.innerWidth / 2;
  let mY = window.innerHeight / 2;
  let dX = mX, dY = mY;
  let rX = mX, rY = mY;

  document.addEventListener('mousemove', e => {
    mX = e.clientX;
    mY = e.clientY;
  });

  function cursorLoop() {
    dX += (mX - dX) * 0.9;
    dY += (mY - dY) * 0.9;
    rX += (mX - rX) * 0.13;
    rY += (mY - rY) * 0.13;

    if (cursorDot) {
      cursorDot.style.left = dX + 'px';
      cursorDot.style.top  = dY + 'px';
    }
    if (cursorRng) {
      cursorRng.style.left = rX + 'px';
      cursorRng.style.top  = rY + 'px';
    }
    requestAnimationFrame(cursorLoop);
  }
  cursorLoop();

  const hoverTargets = 'a, button, .team-card, .pillar, .tag, .value-row, label, input, textarea, .social-btn';
  document.querySelectorAll(hoverTargets).forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });


  /* ----------------------------------------------------------
     SIDEBAR NAVIGATION
  ---------------------------------------------------------- */
  const menuBtn       = document.getElementById('menuBtn');
  const sidebar       = document.getElementById('sidebar');
  const overlay       = document.getElementById('sidebarOverlay');
  const closeBtn      = document.getElementById('sidebarClose');

  function openSidebar() {
    sidebar?.classList.add('is-open');
    overlay?.classList.add('is-visible');
    menuBtn?.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar?.classList.remove('is-open');
    overlay?.classList.remove('is-visible');
    menuBtn?.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  menuBtn?.addEventListener('click', openSidebar);
  closeBtn?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSidebar();
  });


  /* ----------------------------------------------------------
     ACTIVE SIDEBAR LINK + SUBMENU TOGGLE
  ---------------------------------------------------------- */
  (function setActiveLink() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.sidebar__link').forEach(link => {
      const href = link.getAttribute('href') || '';
      const match = href === current || (current === '' && href === 'index.html');
      if (match) link.classList.add('is-active');
    });
    document.querySelectorAll('.sidebar__sublink').forEach(link => {
      const href = link.getAttribute('href') || '';
      if (href === current) {
        link.classList.add('is-active');
        const item = link.closest('.sidebar__item--has-sub');
        if (item) item.classList.add('is-sub-open');
      }
    });
  })();

  (function initSubMenus() {
    document.querySelectorAll('.sidebar__link--toggle').forEach(btn => {
      btn.addEventListener('click', function () {
        const item = btn.closest('.sidebar__item--has-sub');
        const isOpen = item.classList.toggle('is-sub-open');
        btn.setAttribute('aria-expanded', isOpen);
      });
    });
  })();


  /* ----------------------------------------------------------
     SCROLL REVEAL — IntersectionObserver
  ---------------------------------------------------------- */
  const revealItems = document.querySelectorAll('.reveal, .reveal-line');

  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  revealItems.forEach(el => revealObs.observe(el));


  /* ----------------------------------------------------------
     NUMBER COUNTERS
  ---------------------------------------------------------- */
  const counters = document.querySelectorAll('[data-count]');

  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        counterObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  counters.forEach(el => counterObs.observe(el));

  function animateCount(el) {
    const target   = parseInt(el.dataset.count, 10);
    const duration = 1800;
    const start    = performance.now();

    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
      el.textContent = Math.round(e * target);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }


  /* ----------------------------------------------------------
     MAGNETIC BUTTONS
  ---------------------------------------------------------- */
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width  / 2) * 0.28;
      const y = (e.clientY - r.top  - r.height / 2) * 0.28;
      btn.style.transform = `translate(${x}px, ${y}px) scale(1.04)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });


  /* ----------------------------------------------------------
     PAGE TRANSITION (fade-out on navigate)
  ---------------------------------------------------------- */
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (!href.startsWith('#') && !href.startsWith('http') &&
        !href.startsWith('mailto') && !href.startsWith('tel')) {
      link.addEventListener('click', e => {
        e.preventDefault();
        const target = href;
        document.body.style.transition = 'opacity .25s ease';
        document.body.style.opacity    = '0';
        setTimeout(() => { window.location.href = target; }, 260);
      });
    }
  });


  /* ----------------------------------------------------------
     FLOATING BUBBLES — spawn, float upward, pop on mouseenter
  ---------------------------------------------------------- */
  (function () {
    var active = 0;
    var MAX    = 20;

    /* startFrac 0–1: how far into the animation the bubble begins.
       > 0 uses a negative delay so the bubble appears mid-air,
       preventing the "floor" effect where all bubbles emerge
       from the same bottom line. */
    function createBubble(startFrac) {
      if (active >= MAX) return;
      active++;

      var b      = document.createElement('div');
      b.className = 'bubble';

      var size   = 12 + Math.random() * 46;         // 12 – 58 px
      var startX = 4  + Math.random() * 92;         // 4 – 96 vw
      var dur    = 7  + Math.random() * 11;         // 7 – 18 s
      var drift  = (Math.random() - 0.5) * 260;    // ±130 px horizontal drift
      var frac   = (startFrac !== undefined) ? startFrac : 0;
      var delay  = frac > 0 ? 'animation-delay:-' + (frac * dur).toFixed(1) + 's;' : '';

      b.style.cssText =
        'width:'              + size   + 'px;' +
        'height:'             + size   + 'px;' +
        'left:'               + startX + 'vw;' +
        'bottom:-'            + (size + 6) + 'px;' +
        '--drift:'            + drift.toFixed(1) + 'px;' +
        'animation-duration:' + dur.toFixed(1) + 's;' +
        delay;

      /* pop on hover */
      b.addEventListener('mouseenter', function () {
        b.style.animation = 'bubble-pop 0.35s ease-out forwards';
        b.addEventListener('animationend', function () {
          b.remove(); active--;
        }, { once: true });
      }, { once: true });

      /* auto-remove when float ends */
      b.addEventListener('animationend', function (e) {
        if (e.animationName === 'bubble-float') { b.remove(); active--; }
      });

      document.body.appendChild(b);
    }

    /* initial burst — scattered across screen heights via negative delay */
    for (var i = 0; i < 9; i++) {
      (function (delay, frac) {
        setTimeout(function () { createBubble(frac); }, delay);
      })(i * 220, Math.random() * 0.58);
    }

    /* continuous spawn from the bottom */
    (function spawn() {
      createBubble(0);
      setTimeout(spawn, 600 + Math.random() * 900);
    })();
  })();

  /* ----------------------------------------------------------
     CONTACT FORM — simple intercept
  ---------------------------------------------------------- */
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');

  form?.addEventListener('submit', e => {
    e.preventDefault();
    form.style.transition = 'opacity .3s';
    form.style.opacity    = '0';
    setTimeout(() => {
      form.style.display = 'none';
      if (success) success.classList.add('is-visible');
    }, 320);
  });

})();
