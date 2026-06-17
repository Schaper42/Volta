/* ============================================================
   VOLTA — main.js
   Modern Web Designer Portfolio
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     UTILITY HELPERS
  ---------------------------------------------------------- */
  function qs(selector, ctx) {
    return (ctx || document).querySelector(selector);
  }
  function qsa(selector, ctx) {
    return (ctx || document).querySelectorAll(selector);
  }
  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }
  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, wait);
    };
  }

  /* ----------------------------------------------------------
     1. CUSTOM CURSOR
  ---------------------------------------------------------- */
  (function initCursor() {
    var dot  = qs('.cursor-dot');
    var ring = qs('.cursor-ring');

    if (!dot || !ring) return;

    var mX = window.innerWidth  / 2;
    var mY = window.innerHeight / 2;
    var rX = mX;
    var rY = mY;

    /* Track raw mouse position instantly */
    document.addEventListener('mousemove', function (e) {
      mX = e.clientX;
      mY = e.clientY;

      /* Dot follows cursor with no lag */
      dot.style.transform = 'translate(' + mX + 'px, ' + mY + 'px) translate(-50%, -50%)';
    });

    /* Ring follows with lerp lag */
    (function ringLoop() {
      rX = lerp(rX, mX, 0.13);
      rY = lerp(rY, mY, 0.13);
      ring.style.transform = 'translate(' + rX + 'px, ' + rY + 'px) translate(-50%, -50%)';
      requestAnimationFrame(ringLoop);
    })();

    /* Hover state — ring scales up */
    var hoverSel = 'a, button, [data-hover], input, textarea, select, label, .work-card, .filter-btn';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(hoverSel)) {
        document.body.classList.add('cursor--hover');
      }
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(hoverSel)) {
        document.body.classList.remove('cursor--hover');
      }
    });

    /* Click state */
    document.addEventListener('mousedown', function () {
      document.body.classList.add('cursor--click');
    });
    document.addEventListener('mouseup', function () {
      document.body.classList.remove('cursor--click');
    });

    /* Hide cursor when leaving window */
    document.addEventListener('mouseleave', function () {
      document.body.classList.add('cursor--hidden');
    });
    document.addEventListener('mouseenter', function () {
      document.body.classList.remove('cursor--hidden');
    });
  })();


  /* ----------------------------------------------------------
     2. HERO TEXT MORPHING
  ---------------------------------------------------------- */
  (function initHeroMorph() {
    var phrases = qsa('.hero__phrase');
    if (!phrases.length) return;

    var wrap = qs('.hero__headline-wrap');
    var current = 0;

    /* Find the initially-active phrase */
    phrases.forEach(function (p, i) {
      if (p.classList.contains('hero__phrase--active')) current = i;
    });

    /* Ensure first phrase has is-active too */
    phrases[current].classList.add('is-active');

    /* Reserve enough height for the tallest phrase so none of them
       ever overlaps the content below, regardless of viewport width
       or how the font wraps. */
    function syncHeadlineHeight() {
      if (!wrap) return;
      var tallest = 0;
      phrases.forEach(function (p) {
        tallest = Math.max(tallest, p.scrollHeight);
      });
      if (tallest > 0) wrap.style.minHeight = tallest + 'px';
    }

    syncHeadlineHeight();
    window.addEventListener('resize', debounce(syncHeadlineHeight, 150));
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(syncHeadlineHeight);
    }

    setInterval(function () {
      phrases[current].classList.remove('is-active');
      phrases[current].classList.remove('hero__phrase--active');
      current = (current + 1) % phrases.length;
      phrases[current].classList.add('is-active');
    }, 3200);
  })();


  /* ----------------------------------------------------------
     3. NAVIGATION BEHAVIOR
  ---------------------------------------------------------- */
  (function initNav() {
    var nav       = qs('.nav');
    var hamburger = qs('#navBurger, .nav__burger');

    /* ---- Scroll class ---- */
    function onNavScroll() {
      if (!nav) return;
      nav.classList.toggle('is-scrolled', window.scrollY > 80);
    }
    window.addEventListener('scroll', onNavScroll, { passive: true });
    onNavScroll();

    /* ---- Smooth scroll for anchor links ---- */
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute('href').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      /* Close mobile nav if open */
      if (nav) nav.classList.remove('nav--open');
      document.body.style.overflow = '';
    });

    /* ---- Active link via IntersectionObserver ---- */
    var navLinks = qsa('.nav__link[href^="#"], .nav a[href^="#"]');
    if (navLinks.length) {
      var sectionObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = '#' + entry.target.id;
          navLinks.forEach(function (link) {
            var isMatch = link.getAttribute('href') === id;
            link.classList.toggle('is-active', isMatch);
          });
        });
      }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

      navLinks.forEach(function (link) {
        var id = (link.getAttribute('href') || '').slice(1);
        var section = id ? document.getElementById(id) : null;
        if (section) sectionObs.observe(section);
      });
    }

    /* ---- Hamburger toggle ---- */
    if (hamburger && nav) {
      hamburger.addEventListener('click', function () {
        var isOpen = nav.classList.toggle('nav--open');
        hamburger.setAttribute('aria-expanded', String(isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });
    }

    /* Close mobile nav on Escape */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav && nav.classList.contains('nav--open')) {
        nav.classList.remove('nav--open');
        if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  })();


  /* ----------------------------------------------------------
     4. SCROLL ANIMATIONS — IntersectionObserver
  ---------------------------------------------------------- */
  (function initScrollAnimations() {
    var animItems = qsa('[data-animate]');
    if (!animItems.length) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.15 });

    animItems.forEach(function (el) {
      /* Stagger children if requested */
      if (el.hasAttribute('data-animate-stagger')) {
        var children = el.children;
        var delay    = parseFloat(el.getAttribute('data-animate-stagger')) || 0.1;
        Array.prototype.forEach.call(children, function (child, i) {
          child.style.transitionDelay = (i * delay) + 's';
        });
      }
      obs.observe(el);
    });

    /* Also handle legacy .reveal / .reveal-line classes */
    var revealItems = qsa('.reveal, .reveal-line');
    var revealObs   = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        revealObs.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    revealItems.forEach(function (el) { revealObs.observe(el); });
  })();


  /* ----------------------------------------------------------
     5. PORTFOLIO FILTER TABS
  ---------------------------------------------------------- */
  (function initFilter() {
    var filterBtns = qsa('[data-filter]');
    var workCards  = qsa('[data-category]');

    if (!filterBtns.length || !workCards.length) return;

    /* Set initial state */
    filterBtns.forEach(function (btn) {
      if (btn.getAttribute('data-filter') === 'all') {
        btn.classList.add('is-active');
      }
    });

    function showCards(filter) {
      workCards.forEach(function (card) {
        var cat    = card.getAttribute('data-category') || '';
        var show   = filter === 'all' || cat === filter ||
                     cat.split(' ').indexOf(filter) !== -1;

        if (show) {
          card.style.opacity        = '0';
          card.style.pointerEvents  = '';
          card.style.display        = '';   /* reset display before transition */
          /* Trigger reflow then fade in */
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              card.style.opacity = '1';
            });
          });
        } else {
          card.style.opacity       = '0';
          card.style.pointerEvents = 'none';
          /* After fade-out remove from flow */
          card.addEventListener('transitionend', function handler() {
            if (card.style.opacity === '0') {
              card.style.display = 'none';
            }
            card.removeEventListener('transitionend', handler);
          });
        }
      });
    }

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        showCards(btn.getAttribute('data-filter') || 'all');
      });
    });

    /* Ensure cards have a CSS transition for opacity */
    workCards.forEach(function (card) {
      if (!card.style.transition) {
        card.style.transition = 'opacity 0.35s ease';
      }
    });
  })();


  /* ----------------------------------------------------------
     6. ANIMATED GRAIN CANVAS
  ---------------------------------------------------------- */
  (function initGrain() {
    var canvas = document.createElement('canvas');
    canvas.id  = 'grain';
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var w, h;
    var frameCount   = 0;
    var SKIP_FRAMES  = 2; /* draw every Nth frame */

    function resize() {
      w = canvas.width  = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function drawGrain() {
      /* Use ImageData for fast pixel manipulation */
      var img  = ctx.createImageData(w, h);
      var data = img.data;
      for (var i = 0; i < data.length; i += 4) {
        var v      = (Math.random() * 255) | 0;
        data[i]     = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }

    function grainLoop() {
      frameCount++;
      if (frameCount % SKIP_FRAMES === 0) {
        drawGrain();
      }
      requestAnimationFrame(grainLoop);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(grainLoop);
  })();


  /* ----------------------------------------------------------
     7. PARALLAX BLOBS
  ---------------------------------------------------------- */
  (function initParallax() {
    var blobs = qs('.bg-blobs');
    if (!blobs) return;

    var lastY  = 0;
    var rafId  = null;

    function applyParallax() {
      blobs.style.transform = 'translateY(' + (lastY * 0.05).toFixed(2) + 'px)';
      rafId = null;
    }

    window.addEventListener('scroll', function () {
      lastY = window.scrollY;
      if (!rafId) rafId = requestAnimationFrame(applyParallax);
    }, { passive: true });
  })();


  /* ----------------------------------------------------------
     8. STATS COUNTER ANIMATION
  ---------------------------------------------------------- */
  (function initCounters() {
    var counters = qsa('[data-count]');
    if (!counters.length) return;

    function animateCounter(el) {
      /* Read target from data-count or parse DOM text */
      var raw    = el.getAttribute('data-count') || el.textContent || '0';
      var target = parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0;
      /* Preserve suffix (e.g. "+", "k") if present in DOM */
      var suffix = (el.textContent || '').replace(/[0-9]/g, '').trim();
      var start  = performance.now();
      var DURATION = 1500;

      (function tick(now) {
        var elapsed  = now - start;
        var progress = clamp(elapsed / DURATION, 0, 1);
        var eased    = easeOutExpo(progress);
        var value    = Math.round(eased * target);
        el.textContent = value + (suffix || '');
        if (progress < 1) requestAnimationFrame(tick);
      })(start);
    }

    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        countObs.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { countObs.observe(el); });
  })();


  /* ----------------------------------------------------------
     9. FLOAT CARDS SUBTLE MOUSE PARALLAX
  ---------------------------------------------------------- */
  (function initFloatCards() {
    /* Float cards have CSS animation + fixed rotation via --rot custom property.
       We apply subtle mouse parallax using margin offset (not transform) to avoid
       conflicting with the CSS animation's transform. */
    var cards = qsa('.float-card');
    if (!cards.length) return;

    var mults   = [0.018, 0.030, 0.042, 0.024, 0.036, 0.015];
    var centerX = window.innerWidth  / 2;
    var centerY = window.innerHeight / 2;

    var targets  = cards.length > 0 ? Array.from(cards).map(function () { return { x:0, y:0 }; }) : [];
    var currents = cards.length > 0 ? Array.from(cards).map(function () { return { x:0, y:0 }; }) : [];

    document.addEventListener('mousemove', function (e) {
      var dx = e.clientX - centerX;
      var dy = e.clientY - centerY;
      cards.forEach(function (_, i) {
        var m = mults[i % mults.length];
        targets[i].x = -dx * m;
        targets[i].y = -dy * m;
      });
    });

    (function cardLoop() {
      cards.forEach(function (card, i) {
        currents[i].x = lerp(currents[i].x, targets[i].x, 0.06);
        currents[i].y = lerp(currents[i].y, targets[i].y, 0.06);
        /* Use margin-left / margin-top so it doesn't override the CSS animation transform */
        card.style.marginLeft = currents[i].x.toFixed(2) + 'px';
        card.style.marginTop  = currents[i].y.toFixed(2) + 'px';
      });
      requestAnimationFrame(cardLoop);
    })();

    window.addEventListener('resize', function () {
      centerX = window.innerWidth / 2;
      centerY = window.innerHeight / 2;
    });
  })();


  /* ----------------------------------------------------------
     10. CTA EMAIL FORM
  ---------------------------------------------------------- */
  (function initForms() {
    /* Handle multiple forms: main contact form + any CTA / newsletter forms */
    var forms = qsa('form[data-cta], form#ctaForm, form#contactForm, form.cta-form, form.cta-section__form');

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    }

    function shakeEl(el) {
      el.classList.remove('shake'); /* reset in case it's already shaking */
      void el.offsetWidth;          /* reflow */
      el.classList.add('shake');
      el.addEventListener('animationend', function () {
        el.classList.remove('shake');
      }, { once: true });
    }

    function showSuccess(form) {
      var successEl = form.querySelector('.form-success') ||
                      document.getElementById('formSuccess') ||
                      (function () {
                        var div = document.createElement('p');
                        div.className = 'form-success';
                        div.textContent = "Thanks! I'll be in touch.";
                        return div;
                      })();

      form.style.transition = 'opacity 0.3s ease';
      form.style.opacity    = '0';

      setTimeout(function () {
        form.style.display = 'none';
        /* Insert success message if not already in DOM */
        if (!form.parentNode.contains(successEl)) {
          form.parentNode.insertBefore(successEl, form.nextSibling);
        }
        successEl.style.display = '';
        successEl.classList.add('is-visible');
      }, 320);
    }

    forms.forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var emailInput = form.querySelector('input[type="email"], input[name="email"]');

        if (emailInput && !isValidEmail(emailInput.value)) {
          emailInput.style.borderColor = 'var(--color-error, #ff4d4d)';
          shakeEl(emailInput);
          emailInput.addEventListener('input', function () {
            emailInput.style.borderColor = '';
          }, { once: true });
          return;
        }

        showSuccess(form);
      });
    });

    /* Also wire up the legacy #contactForm if present and not already a CTA form */
    var legacyForm    = document.getElementById('contactForm');
    var legacySuccess = document.getElementById('formSuccess');
    if (legacyForm && !legacyForm.matches('[data-cta], .cta-form, #ctaForm')) {
      legacyForm.addEventListener('submit', function (e) {
        e.preventDefault();
        legacyForm.style.transition = 'opacity .3s';
        legacyForm.style.opacity    = '0';
        setTimeout(function () {
          legacyForm.style.display = 'none';
          if (legacySuccess) legacySuccess.classList.add('is-visible');
        }, 320);
      });
    }
  })();


  /* ----------------------------------------------------------
     11. MARQUEE PAUSE ON HOVER
     (CSS handles it via animation-play-state, but we ensure
      the JS class toggle works if CSS isn't sufficient)
  ---------------------------------------------------------- */
  (function initMarquee() {
    var tracks = qsa('.marquee-inner, .marquee__inner, .marquee-track');
    tracks.forEach(function (track) {
      track.addEventListener('mouseenter', function () {
        track.style.animationPlayState = 'paused';
      });
      track.addEventListener('mouseleave', function () {
        track.style.animationPlayState = 'running';
      });
    });
  })();


  /* ----------------------------------------------------------
     SIDEBAR / MOBILE NAV (legacy support)
  ---------------------------------------------------------- */
  (function initSidebar() {
    var menuBtn  = document.getElementById('menuBtn');
    var sidebar  = document.getElementById('sidebar');
    var overlay  = document.getElementById('sidebarOverlay');
    var closeBtn = document.getElementById('sidebarClose');

    if (!sidebar) return;

    function openSidebar() {
      sidebar.classList.add('is-open');
      if (overlay) overlay.classList.add('is-visible');
      if (menuBtn) menuBtn.classList.add('is-active');
      document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
      sidebar.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-visible');
      if (menuBtn) menuBtn.classList.remove('is-active');
      document.body.style.overflow = '';
    }

    if (menuBtn) menuBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSidebar();
    });

    /* Active link state */
    var current = window.location.pathname.split('/').pop() || 'index.html';
    qsa('.sidebar__link').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      if (href === current || (current === '' && href === 'index.html')) {
        link.classList.add('is-active');
      }
    });
    qsa('.sidebar__sublink').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      if (href === current) {
        link.classList.add('is-active');
        var item = link.closest('.sidebar__item--has-sub');
        if (item) item.classList.add('is-sub-open');
      }
    });

    /* Submenu toggles */
    qsa('.sidebar__link--toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item   = btn.closest('.sidebar__item--has-sub');
        var isOpen = item.classList.toggle('is-sub-open');
        btn.setAttribute('aria-expanded', String(isOpen));
      });
    });
  })();


  /* ----------------------------------------------------------
     MAGNETIC BUTTONS
  ---------------------------------------------------------- */
  (function initMagneticBtns() {
    qsa('.btn-primary, [data-magnetic]').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width  / 2) * 0.28;
        var y = (e.clientY - r.top  - r.height / 2) * 0.28;
        btn.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(1.04)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  })();


  /* ----------------------------------------------------------
     PAGE TRANSITION — fade-out on internal navigation
  ---------------------------------------------------------- */
  (function initPageTransitions() {
    qsa('a[href]').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      /* Skip anchors, external links, mail/tel */
      if (href.startsWith('#') || href.startsWith('http') ||
          href.startsWith('//') || href.startsWith('mailto') ||
          href.startsWith('tel')) {
        return;
      }
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var dest = href;
        document.body.style.transition = 'opacity .25s ease';
        document.body.style.opacity    = '0';
        setTimeout(function () { window.location.href = dest; }, 260);
      });
    });
  })();


  /* ----------------------------------------------------------
     FLOATING BUBBLES (decorative background element)
  ---------------------------------------------------------- */
  (function initBubbles() {
    /* Only spawn bubbles if the page uses them (check for existing ones or a flag) */
    if (!document.querySelector('.bubbles-layer, [data-bubbles]') &&
        !document.body.classList.contains('has-bubbles')) {
      return;
    }

    var active = 0;
    var MAX    = 20;

    function createBubble(startFrac) {
      if (active >= MAX) return;
      active++;

      var b       = document.createElement('div');
      b.className = 'bubble';

      var size   = 12 + Math.random() * 46;
      var startX = 4  + Math.random() * 92;
      var dur    = 7  + Math.random() * 11;
      var drift  = (Math.random() - 0.5) * 260;
      var frac   = startFrac !== undefined ? startFrac : 0;
      var delay  = frac > 0 ? '-' + (frac * dur).toFixed(1) + 's' : '0s';

      b.style.cssText =
        'width:'               + size   + 'px;' +
        'height:'              + size   + 'px;' +
        'left:'                + startX + 'vw;' +
        'bottom:-'             + (size + 6) + 'px;' +
        '--drift:'             + drift.toFixed(1) + 'px;' +
        'animation-duration:'  + dur.toFixed(1) + 's;' +
        'animation-delay:'     + delay + ';';

      b.addEventListener('mouseenter', function () {
        b.style.animation = 'bubble-pop 0.35s ease-out forwards';
        b.addEventListener('animationend', function () {
          b.remove(); active--;
        }, { once: true });
      }, { once: true });

      b.addEventListener('animationend', function (e) {
        if (e.animationName === 'bubble-float') { b.remove(); active--; }
      });

      document.body.appendChild(b);
    }

    /* Initial burst with spread across screen */
    for (var i = 0; i < 9; i++) {
      (function (delay, frac) {
        setTimeout(function () { createBubble(frac); }, delay);
      })(i * 220, Math.random() * 0.58);
    }

    /* Continuous spawn */
    (function spawn() {
      createBubble(0);
      setTimeout(spawn, 600 + Math.random() * 900);
    })();
  })();


  /* ----------------------------------------------------------
     SHAKE KEYFRAME INJECTION
     (Ensures the CSS shake animation exists for form errors)
  ---------------------------------------------------------- */
  (function injectShakeKeyframes() {
    if (document.getElementById('volta-shake-style')) return;
    var style = document.createElement('style');
    style.id  = 'volta-shake-style';
    style.textContent = [
      '@keyframes shake {',
      '  0%, 100% { transform: translateX(0); }',
      '  20%       { transform: translateX(-6px); }',
      '  40%       { transform: translateX(6px); }',
      '  60%       { transform: translateX(-4px); }',
      '  80%       { transform: translateX(4px); }',
      '}',
      '.shake { animation: shake 0.4s ease; }'
    ].join('\n');
    document.head.appendChild(style);
  })();

})();
