/* ================================================================
   MAIN.JS  –  MileNails Uñas & Estética
   ================================================================ */
'use strict';

const WA_CONTACTS = {
  melanny: { name: 'Melanny', phone: '34660698806', formatted: '+34 660 698 806' },
  sofia: { name: 'Sofía', phone: '34698959656', formatted: '+34 698 95 96 56' },
  sandra: { name: 'Sandra', phone: '34610365493', formatted: '+34 610 36 54 93' }
};

function getContactByService(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (['manicura', 'permanente', 'gel', 'acrilico', 'pedicura', 'unas', 'unas-pedicura'].includes(normalized)) {
    return WA_CONTACTS.melanny;
  }

  if (['pestanas', 'cejas', 'pestanas-cejas'].includes(normalized)) {
    return WA_CONTACTS.sofia;
  }

  if (['masajes', 'masaje', 'masaje-relajante', 'masaje-terapeutico'].includes(normalized)) {
    return WA_CONTACTS.sandra;
  }

  return WA_CONTACTS.melanny;
}

function getContactByServiceAndLabel(value, label) {
  const fromValue = getContactByService(value);
  if (value && String(value).trim()) return fromValue;

  const normalizedLabel = String(label || '').trim().toLowerCase();
  if (normalizedLabel.includes('pesta') || normalizedLabel.includes('ceja')) return WA_CONTACTS.sofia;
  if (normalizedLabel.includes('masaj')) return WA_CONTACTS.sandra;
  if (normalizedLabel.includes('uñ') || normalizedLabel.includes('un') || normalizedLabel.includes('pedi')) return WA_CONTACTS.melanny;

  return WA_CONTACTS.melanny;
}

/* ---- Image loading optimization ---- */
(function optimizeImageLoading() {
  const heroImg = document.querySelector('.hero-img-wrapper img');

  document.querySelectorAll('img').forEach(img => {
    if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');

    // Keep above-the-fold image eager; lazy-load the rest.
    if (img !== heroImg && !img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
  });

  if (heroImg) {
    heroImg.setAttribute('fetchpriority', 'high');
  }
})();

/* ---- Navbar: scroll style ---- */
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

/* ---- Hamburger / mobile nav ---- */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

if (hamburger && navLinks) {
  let menuScrollY = 0;

  const lockBodyScroll = () => {
    menuScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.classList.add('menu-open');
    document.body.style.top = '-' + menuScrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  };

  const unlockBodyScroll = () => {
    const topValue = document.body.style.top;
    document.body.classList.remove('menu-open');
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';

    if (topValue) {
      const stored = Math.abs(parseInt(topValue, 10)) || menuScrollY || 0;
      window.scrollTo(0, stored);
    }
  };

  const openMenu = () => {
    hamburger.classList.add('open');
    navLinks.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    lockBodyScroll();
  };

  const closeMenu = () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    unlockBodyScroll();
  };

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.contains('open');
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  document.addEventListener('click', e => {
    if (navbar && !navbar.contains(e.target) && navLinks.classList.contains('open')) {
      closeMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navLinks.classList.contains('open')) {
      closeMenu();
    }
  });
}

/* ---- Active nav link ---- */
(function () {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = (link.getAttribute('href') || '').split('/').pop();
    link.classList.toggle('active', href === path);
  });
})();

/* ---- Scroll reveal (IntersectionObserver) ---- */
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealEls.length) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => io.observe(el));
}

/* ---- Gallery filter (galeria page) ---- */
const filterBtns  = document.querySelectorAll('.filter-btn');
const galleryFull = document.getElementById('galleryFull');

if (filterBtns.length && galleryFull) {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      galleryFull.querySelectorAll('.g-item').forEach(item => {
        const cats = (item.dataset.cat || '').split(/\s+/).filter(Boolean);
        const show = cat === 'all' || cats.includes(cat);
        item.style.display = show ? '' : 'none';
      });
    });
  });
}

/* ---- Home gallery carousel (index page) ---- */
(function initHomeGalleryCarousel() {
  const carousel = document.getElementById('homeGalleryCarousel');
  if (!carousel) return;

  const track = carousel.querySelector('.gallery-track');
  const prevBtn = carousel.querySelector('.gallery-btn-prev');
  const nextBtn = carousel.querySelector('.gallery-btn-next');
  if (!track || !prevBtn || !nextBtn) return;

  const realSlides = Array.from(track.querySelectorAll('.gallery-item'));
  if (realSlides.length < 2) return;

  let currentIndex = 0;
  let clonesPerSide = 0;
  let stepPx = 0;
  let timerId = null;
  let isTransitioning = false;

  const visibleSlides = () => {
    if (window.innerWidth <= 480) return 1;
    if (window.innerWidth <= 768) return 2;
    return 3;
  };

  const getGapPx = () => {
    const styles = window.getComputedStyle(track);
    return parseFloat(styles.columnGap || styles.gap || '16') || 16;
  };

  const setTransform = (withTransition = true) => {
    track.style.transition = withTransition ? 'transform .62s cubic-bezier(.22,.61,.36,1)' : 'none';
    track.style.transform = 'translate3d(' + (-currentIndex * stepPx) + 'px,0,0)';
  };

  const clearClones = () => {
    track.querySelectorAll('.gallery-item.is-clone').forEach(clone => clone.remove());
  };

  const createClones = () => {
    const head = realSlides.slice(0, clonesPerSide);
    const tail = realSlides.slice(realSlides.length - clonesPerSide);

    tail.forEach(slide => {
      const clone = slide.cloneNode(true);
      clone.classList.add('is-clone');
      track.insertBefore(clone, track.firstChild);
    });

    head.forEach(slide => {
      const clone = slide.cloneNode(true);
      clone.classList.add('is-clone');
      track.appendChild(clone);
    });
  };

  const setup = () => {
    clearClones();
    clonesPerSide = visibleSlides();
    createClones();

    const firstSlide = track.querySelector('.gallery-item');
    if (!firstSlide) return;

    stepPx = firstSlide.getBoundingClientRect().width + getGapPx();
    currentIndex = clonesPerSide;
    setTransform(false);
  };

  const normalizeIfNeeded = () => {
    const realCount = realSlides.length;
    const minIndex = clonesPerSide;
    const maxIndex = clonesPerSide + realCount - 1;

    if (currentIndex > maxIndex) {
      currentIndex -= realCount;
      setTransform(false);
    } else if (currentIndex < minIndex) {
      currentIndex += realCount;
      setTransform(false);
    }
  };

  const go = direction => {
    if (isTransitioning) return;
    isTransitioning = true;
    currentIndex += direction;
    setTransform(true);
  };

  const startAuto = () => {
    stopAuto();
    timerId = window.setInterval(() => go(1), 1850);
  };

  const stopAuto = () => {
    if (!timerId) return;
    window.clearInterval(timerId);
    timerId = null;
  };

  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));

  track.addEventListener('transitionend', () => {
    isTransitioning = false;
    normalizeIfNeeded();
  });

  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);
  carousel.addEventListener('focusin', stopAuto);
  carousel.addEventListener('focusout', startAuto);

  window.addEventListener('resize', () => {
    setup();
  }, { passive: true });

  setup();
  startAuto();
})();

/* ---- Testimonials carousel (index page) ---- */
(function initTestimonialsCarousel() {
  const carousel = document.getElementById('testimonialsCarousel');
  if (!carousel) return;

  const track = carousel.querySelector('.testimonials-track');
  const prevBtn = carousel.querySelector('.testi-btn-prev');
  const nextBtn = carousel.querySelector('.testi-btn-next');
  const dotsWrap = document.getElementById('testimonialsDots');
  if (!track || !prevBtn || !nextBtn) return;

  const slides = Array.from(track.querySelectorAll('.testimonial-card'));
  if (slides.length < 2) return;

  if (!dotsWrap) return;
  dotsWrap.innerHTML = '';
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'testi-dot' + (i === 0 ? ' active' : '');
    dot.type = 'button';
    dot.dataset.slide = String(i);
    dot.setAttribute('aria-label', 'Ir a reseña ' + (i + 1));
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.querySelectorAll('.testi-dot'));

  let currentIndex = 0;
  let timerId = null;

  const update = () => {
    track.style.transform = 'translate3d(' + (-currentIndex * 100) + '%,0,0)';
    dots.forEach((dot, i) => {
      const active = i === currentIndex;
      dot.classList.toggle('active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  };

  const goTo = nextIndex => {
    currentIndex = (nextIndex + slides.length) % slides.length;
    update();
  };

  const startAuto = () => {
    stopAuto();
    timerId = window.setInterval(() => goTo(currentIndex + 1), 4500);
  };

  const stopAuto = () => {
    if (!timerId) return;
    window.clearInterval(timerId);
    timerId = null;
  };

  prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
  nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = Number(dot.dataset.slide);
      if (!Number.isNaN(idx)) goTo(idx);
    });
  });

  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);
  carousel.addEventListener('focusin', stopAuto);
  carousel.addEventListener('focusout', startAuto);

  update();
  startAuto();
})();

/* ---- Lightbox ---- */
(function initLightbox() {
  const items = document.querySelectorAll('.gallery-item img, .g-item img');
  if (!items.length) return;

  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    display: 'none', position: 'fixed', inset: '0', zIndex: '2000',
    background: 'rgba(0,0,0,.92)', alignItems: 'center',
    justifyContent: 'center', cursor: 'zoom-out'
  });
  const img = document.createElement('img');
  Object.assign(img.style, {
    maxWidth: '90vw', maxHeight: '90vh',
    borderRadius: '12px', boxShadow: '0 0 60px rgba(0,0,0,.5)'
  });
  overlay.appendChild(img);
  document.body.appendChild(overlay);

  function open(src, alt) {
    img.src = src; img.alt = alt;
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  function close() {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  items.forEach(i => {
    i.style.cursor = 'zoom-in';
    i.addEventListener('click', () => open(i.src, i.alt));
  });
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

/* ---- Booking date (Mon-Sat only) ---- */
(function initBookingDate() {
  const fechaInput = document.getElementById('fecha');
  if (!fechaInput) return;

  const isWorkingDay = date => date.getDay() !== 0; // Sunday closed

  const nextWorkingDay = fromDate => {
    const d = new Date(fromDate);
    d.setHours(0, 0, 0, 0);
    while (!isWorkingDay(d)) d.setDate(d.getDate() + 1);
    return d;
  };

  // Preferred UX: flatpickr calendar with Sundays disabled.
  if (window.flatpickr) {
    const startDate = nextWorkingDay(new Date());
    window.flatpickr(fechaInput, {
      locale: window.flatpickr.l10ns.es,
      dateFormat: 'Y-m-d',
      minDate: startDate,
      disable: [date => !isWorkingDay(date)]
    });
    return;
  }

  // Fallback for native date input if flatpickr is blocked.
  const startDate = nextWorkingDay(new Date());
  fechaInput.min = startDate.toISOString().split('T')[0];

  fechaInput.addEventListener('change', () => {
    if (!fechaInput.value) return;
    const chosen = new Date(fechaInput.value + 'T00:00:00');
    if (!isWorkingDay(chosen)) {
      fechaInput.setCustomValidity('Solo hay citas de lunes a sábado.');
      fechaInput.reportValidity();
      fechaInput.value = '';
    } else {
      fechaInput.setCustomValidity('');
    }
  });
})();

/* ---- Contact form ---- */
const form = document.getElementById('contactForm');
if (form) {
  const servicioSelect = form.querySelector('#servicio');
  const serviceAdvisor = form.querySelector('#serviceAdvisor');

  const updateServiceAdvisor = () => {
    if (!serviceAdvisor) return;
    const selectedValue = (servicioSelect?.value || '').trim().toLowerCase();
    const selectedLabel = servicioSelect?.selectedOptions?.[0]?.textContent || '';
    const contact = getContactByServiceAndLabel(selectedValue, selectedLabel);
    serviceAdvisor.textContent = 'Te atiende: ' + contact.name + ' (' + contact.formatted + ').';
  };

  if (servicioSelect) {
    servicioSelect.addEventListener('change', updateServiceAdvisor);
  }

  updateServiceAdvisor();

  form.addEventListener('submit', e => {
    e.preventDefault();

    const nombre = (form.querySelector('#nombre')?.value || '').trim();
    const telefono = (form.querySelector('#telefono')?.value || '').trim();
    const servicioValue = (servicioSelect?.value || '').trim().toLowerCase();
    const servicio = servicioSelect?.selectedOptions?.[0]?.textContent || 'Consulta';
    const fecha = (form.querySelector('#fecha')?.value || '').trim();
    const mensaje = (form.querySelector('#mensaje')?.value || '').trim();

    if (!nombre || !telefono || !mensaje) {
      form.reportValidity();
      return;
    }

    const contact = getContactByServiceAndLabel(servicioValue, servicio);

    const waText = [
      'Hola MileNails, quiero reservar una cita.',
      'Nombre: ' + nombre,
      'Teléfono: ' + telefono,
      'Servicio: ' + servicio,
      'Profesional: ' + contact.name,
      'Fecha preferida: ' + (fecha || 'Por definir'),
      'Detalle: ' + mensaje
    ].join('\n');

    const waUrl = 'https://wa.me/' + contact.phone + '?text=' + encodeURIComponent(waText);
    const btn = form.querySelector('[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Abriendo WhatsApp...';
    btn.disabled = true;

    window.open(waUrl, '_blank', 'noopener,noreferrer');

    setTimeout(() => {
      btn.textContent = orig;
      btn.disabled = false;
    }, 700);
  });
}

/* ---- WhatsApp links routing by service ---- */
(function initServiceWhatsAppLinks() {
  const links = document.querySelectorAll('a.js-wa-route[data-wa-service]');
  if (!links.length) return;

  links.forEach(link => {
    const service = (link.getAttribute('data-wa-service') || '').trim().toLowerCase();
    const serviceLabel = (link.getAttribute('data-wa-label') || 'este servicio').trim();
    const contact = getContactByService(service);
    const text = 'Hola MileNails, quiero reservar ' + serviceLabel + ' con ' + contact.name + '.';
    link.setAttribute('href', 'https://wa.me/' + contact.phone + '?text=' + encodeURIComponent(text));
  });
})();

/* ---- WhatsApp picker for generic CTA buttons ---- */
(function initWhatsAppPicker() {
  const pickerLinks = document.querySelectorAll('a.js-wa-picker');
  if (!pickerLinks.length) return;

  const pickerTemplate = [
    '<div id="waPickerOverlay" style="position:fixed;inset:0;background:rgba(0,0,0,.58);display:none;align-items:center;justify-content:center;z-index:2500;padding:1rem;">',
    '  <div role="dialog" aria-modal="true" aria-labelledby="waPickerTitle" style="width:min(420px,100%);background:#fff;border-radius:16px;padding:1rem 1rem 1.1rem;box-shadow:0 30px 80px rgba(0,0,0,.32);">',
    '    <h3 id="waPickerTitle" style="margin:0 0 .35rem;font-size:1.1rem;line-height:1.25;color:#1f1f1f;">¿Qué servicio quieres reservar?</h3>',
    '    <p style="margin:0 0 .85rem;color:#646464;font-size:.92rem;">Te llevamos al WhatsApp de la profesional correcta.</p>',
    '    <div style="display:grid;gap:.6rem;">',
    '      <button type="button" data-wa-pick="unas-pedicura" style="width:100%;border:0;border-radius:12px;padding:.78rem .9rem;background:#ff1493;color:#fff;font-weight:600;cursor:pointer;">Uñas y pedicura · Melanny</button>',
    '      <button type="button" data-wa-pick="pestanas-cejas" style="width:100%;border:0;border-radius:12px;padding:.78rem .9rem;background:#ff4eaa;color:#fff;font-weight:600;cursor:pointer;">Pestañas y cejas · Sofía</button>',
    '      <button type="button" data-wa-pick="masajes" style="width:100%;border:0;border-radius:12px;padding:.78rem .9rem;background:#ff79bf;color:#fff;font-weight:600;cursor:pointer;">Masajes y terapias · Sandra</button>',
    '    </div>',
    '    <button type="button" data-wa-close="true" style="margin-top:.85rem;width:100%;border:1px solid #e2e2e2;border-radius:10px;padding:.62rem .8rem;background:#fff;color:#444;cursor:pointer;">Cancelar</button>',
    '  </div>',
    '</div>'
  ].join('');

  document.body.insertAdjacentHTML('beforeend', pickerTemplate);
  const overlay = document.getElementById('waPickerOverlay');
  if (!overlay) return;

  const closePicker = () => {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  };

  const openPicker = () => {
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  const openWhatsAppFor = service => {
    const contact = getContactByService(service);
    const labelMap = {
      'unas-pedicura': 'uñas y pedicura',
      'pestanas-cejas': 'pestañas y cejas',
      'masajes': 'masajes y terapias'
    };
    const serviceLabel = labelMap[service] || 'este servicio';
    const text = 'Hola MileNails, quiero reservar ' + serviceLabel + ' con ' + contact.name + '.';
    const url = 'https://wa.me/' + contact.phone + '?text=' + encodeURIComponent(text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  pickerLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      openPicker();
    });
  });

  overlay.addEventListener('click', e => {
    const pickBtn = e.target.closest('[data-wa-pick]');
    if (pickBtn) {
      const service = pickBtn.getAttribute('data-wa-pick') || '';
      closePicker();
      openWhatsAppFor(service);
      return;
    }

    if (e.target === overlay || e.target.closest('[data-wa-close]')) {
      closePicker();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.style.display === 'flex') {
      closePicker();
    }
  });
})();

/* ---- Cookies consent ---- */
(function initCookieConsent() {
  const CONSENT_KEY = 'milenails_cookie_consent_v1';
  const PREFS_KEY = 'milenails_cookie_preferences_v1';
  const isInnerPage = window.location.pathname.includes('/pages/');
  const legalPaths = {
    cookies: isInnerPage ? 'politica-cookies.html' : 'pages/politica-cookies.html',
    privacy: isInnerPage ? 'politica-privacidad.html' : 'pages/politica-privacidad.html'
  };

  const safeGet = key => {
    try {
      return window.localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  };

  const safeSet = (key, value) => {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (_) {
      return false;
    }
  };

  const parsePrefs = raw => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return {
        necessary: true,
        analytics: !!parsed.analytics,
        marketing: !!parsed.marketing,
        updatedAt: parsed.updatedAt || new Date().toISOString()
      };
    } catch (_) {
      return null;
    }
  };

  const readPrefs = () => {
    const parsed = parsePrefs(safeGet(PREFS_KEY));
    if (parsed) return parsed;

    const consent = safeGet(CONSENT_KEY);
    if (consent === 'accepted') {
      return { necessary: true, analytics: true, marketing: true, updatedAt: new Date().toISOString() };
    }
    if (consent === 'rejected') {
      return { necessary: true, analytics: false, marketing: false, updatedAt: new Date().toISOString() };
    }

    return { necessary: true, analytics: false, marketing: false, updatedAt: new Date().toISOString() };
  };

  const savePrefs = prefs => {
    const payload = {
      necessary: true,
      analytics: !!prefs.analytics,
      marketing: !!prefs.marketing,
      updatedAt: new Date().toISOString()
    };
    safeSet(PREFS_KEY, JSON.stringify(payload));
    return payload;
  };

  const consentFromPrefs = prefs => {
    if (prefs.analytics || prefs.marketing) return 'accepted';
    return 'rejected';
  };

  const applyConsent = value => {
    if (!value) {
      document.documentElement.removeAttribute('data-cookie-consent');
      return;
    }
    document.documentElement.setAttribute('data-cookie-consent', value);
  };

  const closeBanner = banner => {
    if (!banner) return;
    banner.classList.remove('is-visible');
    document.body.classList.remove('cookie-banner-open');
    window.setTimeout(() => {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 280);
  };

  const saveConsent = (value, banner) => {
    if (value === 'accepted') {
      savePrefs({ analytics: true, marketing: true });
    } else if (value === 'rejected') {
      savePrefs({ analytics: false, marketing: false });
    }
    safeSet(CONSENT_KEY, value);
    applyConsent(value);
    closeBanner(banner);
  };

  const renderBanner = () => {
    const current = document.getElementById('cookieBanner');
    if (current) return current;

    const banner = document.createElement('section');
    banner.id = 'cookieBanner';
    banner.className = 'cookie-banner';
    banner.setAttribute('aria-label', 'Aviso de cookies');
    banner.innerHTML =
      '<div class="cookie-inner">' +
        '<p class="cookie-text">Usamos cookies propias para mejorar tu experiencia de navegación. Puedes aceptar o rechazar las cookies no esenciales. Más información en nuestra <a href="' + legalPaths.cookies + '">Política de Cookies</a> y <a href="' + legalPaths.privacy + '">Política de Privacidad</a>.</p>' +
        '<div class="cookie-actions">' +
          '<button type="button" class="cookie-btn reject" data-cookie-action="reject">Rechazar</button>' +
          '<button type="button" class="cookie-btn accept" data-cookie-action="accept">Aceptar</button>' +
          '<button type="button" class="cookie-btn config" data-cookie-action="config">Configurar</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(banner);
    banner.classList.add('is-visible');
    document.body.classList.add('cookie-banner-open');

    banner.addEventListener('click', e => {
      const action = e.target && e.target.getAttribute('data-cookie-action');
      if (!action) return;
      if (action === 'accept') {
        saveConsent('accepted', banner);
      } else if (action === 'reject') {
        saveConsent('rejected', banner);
      } else if (action === 'config') {
        window.location.href = legalPaths.cookies + '#configuracion';
      }
    });

    return banner;
  };

  const openSettings = event => {
    if (event) event.preventDefault();
    const isCookiePolicyPage = window.location.pathname.endsWith('/politica-cookies.html') || window.location.pathname.endsWith('politica-cookies.html');
    if (isCookiePolicyPage) {
      const target = document.getElementById('configuracion');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      const status = document.getElementById('cookiePrefsStatus');
      if (status) {
        status.textContent = 'Ajusta tus preferencias y guarda los cambios.';
      }
      return;
    }

    try {
      window.localStorage.removeItem(CONSENT_KEY);
    } catch (_) {
      // ignore storage errors
    }
    applyConsent('pending');
    renderBanner();
  };

  document.querySelectorAll('[data-cookie-settings]').forEach(link => {
    link.addEventListener('click', openSettings);
  });

  const initCookiePreferencesPanel = () => {
    const panel = document.getElementById('cookiePreferencesPanel');
    if (!panel) return;

    const analyticsInput = document.getElementById('cookieAnalytics');
    const marketingInput = document.getElementById('cookieMarketing');
    const status = document.getElementById('cookiePrefsStatus');
    const acceptAllBtn = document.getElementById('acceptAllCookies');
    const rejectOptionalBtn = document.getElementById('rejectOptionalCookies');
    const saveBtn = document.getElementById('saveCookiePreferences');

    if (!analyticsInput || !marketingInput || !status || !acceptAllBtn || !rejectOptionalBtn || !saveBtn) {
      return;
    }

    const refreshInputs = () => {
      const prefs = readPrefs();
      analyticsInput.checked = !!prefs.analytics;
      marketingInput.checked = !!prefs.marketing;
      status.textContent = 'Estado actual: ' + (prefs.analytics || prefs.marketing ? 'cookies opcionales permitidas.' : 'solo cookies necesarias activas.');
    };

    const persistFromInputs = () => {
      const prefs = savePrefs({
        analytics: analyticsInput.checked,
        marketing: marketingInput.checked
      });
      const consent = consentFromPrefs(prefs);
      safeSet(CONSENT_KEY, consent);
      applyConsent(consent);
      const banner = document.getElementById('cookieBanner');
      if (banner) closeBanner(banner);
      status.textContent = 'Preferencias guardadas correctamente.';
    };

    acceptAllBtn.addEventListener('click', () => {
      analyticsInput.checked = true;
      marketingInput.checked = true;
      persistFromInputs();
    });

    rejectOptionalBtn.addEventListener('click', () => {
      analyticsInput.checked = false;
      marketingInput.checked = false;
      persistFromInputs();
    });

    saveBtn.addEventListener('click', persistFromInputs);
    refreshInputs();
  };

  initCookiePreferencesPanel();

  const saved = safeGet(CONSENT_KEY);
  if (saved === 'accepted' || saved === 'rejected' || saved === 'custom') {
    applyConsent(saved);
    return;
  }

  applyConsent('pending');
  renderBanner();
})();
