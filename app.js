(() => {
  if (embeddedDemoAdmin) return;
  const $ = (id) => document.getElementById(id);
  const esc = htmlEscape;
  const booking = $('booking');
  const bookingContent = $('booking-content');
  const lookDialog = $('look-dialog');
  const historyDialog = $('history-dialog');
  const historyKey = 'lila-salon-my-requests-v1';
  let catalog = structuredClone(initialStudio);
  let priceFilter = '';
  let galleryFilter = '';
  let featuredLook = '';
  let current = null;
  let step = 0;
  let submitted = null;
  let catalogReady = filePreview;
  const activeServices = () => catalog.services.filter((service) => service.active && catalog.categories.some((category) => category.id === service.category));
  const serviceById = (id) => activeServices().find((service) => service.id === id);
  const activeLooks = () => catalog.looks.filter((look) => look.active);
  const lookById = (id) => activeLooks().find((look) => look.id === id);
  const times = ['', '10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00'];
  const duration = (minutes) => minutes < 60 ? minutes + ' мин' : Math.floor(minutes / 60) + ' ч' + (minutes % 60 ? ' ' + minutes % 60 + ' мин' : '');

  function option(value, label, chosen) {
    return '<option value="' + esc(value) + '"' + (value === chosen ? ' selected' : '') + '>' + esc(label) + '</option>';
  }

  function chips(items, selected, attribute) {
    return items.map(({ id, name }) => '<button type="button" data-' + attribute + '="' + esc(id) + '" aria-pressed="' + (id === selected) + '">' + esc(name) + '</button>').join('');
  }

  function renderPrice() {
    $('price-filters').innerHTML = chips([{ id: '', name: 'Все услуги' }, ...catalog.categories], priceFilter, 'price');
    const services = activeServices().filter((service) => !priceFilter || service.category === priceFilter);
    $('price-list').innerHTML = services.map((service) => '<article class="price-item"><div><h3>' + esc(service.name) + '</h3><p>' + esc(service.description) + '</p><p>' + duration(service.duration) + '</p></div><button data-book="' + esc(service.id) + '" aria-label="Записаться — ' + esc(service.name) + '">' + money(service.price) + ' ↗</button></article>').join('') || '<p class="empty">В этой категории пока нет услуг.</p>';
  }

  function renderPalette(id, animate = false) {
    const looks = activeLooks();
    const look = lookById(id) || looks[0];
    $('palette').hidden = !look;
    if (!look) return;
    featuredLook = look.id;
    $('swatches').innerHTML = looks.map((item) => '<button type="button" data-swatch="' + esc(item.id) + '" aria-label="' + esc(item.name) + '" aria-pressed="' + (item.id === look.id) + '" style="--finish:' + esc(item.color) + '"></button>').join('');
    $('palette-name').textContent = look.name;
    $('palette-note').textContent = look.note;
    const art = lookArt(look);
    const photo = $('palette-photo');
    photo.className = 'palette-photo ' + art.className;
    photo.style.removeProperty('--work-image');
    if (art.style) photo.style.setProperty('--work-image', 'url("' + look.image + '")');
    photo.setAttribute('aria-label', look.name);
    $('palette-book').dataset.book = look.service;
    $('palette-book').dataset.look = look.id;
    if (animate && window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.fromTo(photo, { opacity: .53, y: 7 }, { opacity: 1, y: 0, duration: .32, clearProps: 'transform,opacity', overwrite: true });
    }
  }

  function renderGallery() {
    const looks = activeLooks();
    const filters = [...new Set(looks.map((look) => look.category))].map((name) => ({ id: name, name }));
    if (galleryFilter && !filters.some((filter) => filter.id === galleryFilter)) galleryFilter = '';
    $('gallery-filters').innerHTML = chips([{ id: '', name: 'Все работы' }, ...filters], galleryFilter, 'gallery-filter');
    $('looks-grid').innerHTML = looks.filter((look) => !galleryFilter || look.category === galleryFilter).map((look) => {
      const art = lookArt(look);
      return '<button class="look-card" data-open-look="' + esc(look.id) + '"><span class="' + art.className + '"' + art.style + ' aria-hidden="true"></span><span class="look-name">' + esc(look.name) + '<span aria-hidden="true">↗</span></span></button>';
    }).join('') || '<p class="empty">В галерее пока нет работ.</p>';
  }

  function renderContacts() {
    const { city, hours, address, phone, telegram } = catalog.studio;
    $('studio-city').textContent = city;
    $('studio-hours').textContent = hours;
    $('studio-address').textContent = address;
    document.querySelector('.hero-label').innerHTML = '<span class="dot"></span>' + esc(city) + ' · nail studio';
    $('studio-links').innerHTML = (/^\+?[\d ()-]{7,20}$/.test(phone) ? '<a href="tel:' + esc(phone.replace(/[^\d+]/g, '')) + '">' + esc(phone) + '</a>' : '') +
      (/^@?[A-Za-z0-9_]{5,32}$/.test(telegram) ? '<a href="https://t.me/' + esc(telegram.replace(/^@/, '')) + '" target="_blank" rel="noopener noreferrer">Telegram ↗</a>' : '');
  }

  function renderCatalog() {
    const icons = ['✦', '◌', '❋'];
    if (priceFilter && !catalog.categories.some((category) => category.id === priceFilter)) priceFilter = '';
    $('service-cards').innerHTML = catalog.categories.map((category, index) => {
      const prices = activeServices().filter((service) => service.category === category.id).map((service) => service.price);
      if (!prices.length) return '';
      return '<button class="service-card" data-jump-price="' + esc(category.id) + '"><div class="service-icon" aria-hidden="true">' + icons[index % icons.length] + '</div><span class="arrow" aria-hidden="true">↗</span><div><h3>' + esc(category.name) + '</h3><p>от ' + money(Math.min(...prices)) + '</p></div></button>';
    }).join('') || '<p class="empty">Прайс обновляется.</p>';
    renderPrice();
    renderPalette(featuredLook);
    renderGallery();
    renderContacts();
  }

  function openLook(id) {
    const look = lookById(id);
    if (!look) return;
    const art = lookArt(look);
    $('look-detail').innerHTML = '<div class="' + art.className + '"' + art.style + ' role="img" aria-label="' + esc(look.name) + '"></div><div class="look-copy"><p class="eyebrow">' + esc(look.category) + '</p><h2>' + esc(look.name) + '</h2><p>' + esc(look.note) + '</p><button class="pill primary" data-book="' + esc(look.service) + '" data-look="' + esc(id) + '">Выбрать этот дизайн ↗</button></div>';
    lookDialog.showModal();
  }

  function openBooking(service, look) {
    if (lookDialog.open) lookDialog.close();
    const selectedLook = lookById(look);
    current = {
      id: self.crypto.randomUUID(), service: serviceById(service)?.id || '',
      look: selectedLook && (!selectedLook.service || serviceById(selectedLook.service)) ? selectedLook.id : '',
      artist: 'any', date: '', time: '', customer: '', contact: '', note: '', consent: false,
    };
    step = 0;
    submitted = null;
    renderBooking();
    booking.showModal();
  }

  function localHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem(historyKey) || '[]');
      return Array.isArray(saved) ? saved.filter((id) => typeof id === 'string') : [];
    } catch { return []; }
  }

  function rememberBooking(id) {
    try {
      const list = localHistory();
      localStorage.setItem(historyKey, JSON.stringify([id, ...list.filter((value) => value !== id)].slice(0, 20)));
    } catch { /* The appointment request is already saved. */ }
  }

  async function showHistory() {
    const list = $('history-items');
    const ids = localHistory();
    list.innerHTML = '<p class="empty">' + (ids.length ? 'Проверяем статусы…' : 'Здесь появятся заявки, оставленные в этом браузере.') + '</p>';
    historyDialog.showModal();
    if (!ids.length) return;
    let rows;
    if (filePreview) {
      rows = demoData().bookings.filter((item) => ids.includes(item.id));
    } else {
      const replies = await Promise.allSettled(ids.map((id) => requestApi('bookings/' + encodeURIComponent(id) + '/status')));
      rows = replies.filter((reply) => reply.status === 'fulfilled').map((reply) => reply.value.booking);
      if (rows.length !== ids.length) $('history-note').textContent = 'Часть статусов сейчас недоступна. Попробуйте открыть список позже.';
      else $('history-note').textContent = 'Заявки из этого браузера.';
    }
    list.innerHTML = rows.map((item) => '<article class="price-item"><div><h3>' + esc(item.serviceName) + '</h3><p>' + prettyDate(item.date) + (item.time ? ' · ' + esc(item.time) : '') + '</p></div><p class="history-status">' + (bookingStatuses[item.status] || '') + '</p></article>').join('') || '<p class="empty">Список пока пуст.</p>';
  }

  function renderBooking(focus = false) {
    const title = ['Выберите услугу', 'Выберите время', 'Оставьте контакт'][step];
    const service = serviceById(current.service);
    const look = lookById(current.look);
    if (submitted) {
      bookingContent.innerHTML = '<h2 id="booking-title">' + (filePreview ? 'Демо-заявка сохранена' : 'Заявка принята') + '</h2><p>' + esc(submitted.serviceName) + ' · ' + prettyDate(submitted.date) + (submitted.time ? ' в ' + esc(submitted.time) : '') + '.</p><p>' + (filePreview ? 'Посмотреть её можно в демонстрационном кабинете студии.' : 'Студия свяжется с вами, чтобы подтвердить время.') + '</p><div class="dialog-actions"><button class="pill primary" data-close="booking">Готово</button></div>';
      bookingContent.querySelector('button').focus();
      return;
    }
    const progress = ['Услуга', 'Время', 'Контакты'].map((name, idx) => '<li' + (idx === step ? ' aria-current="step"' : '') + '>' + (idx + 1) + '. ' + name + '</li>').join('');
    let fields = '';
    if (step === 0) fields = '<label class="field">Услуга<select name="service" required>' + option('', 'Выберите из прайса', current.service) + catalog.categories.map((category) => {
      const options = activeServices().filter((item) => item.category === category.id);
      return options.length ? '<optgroup label="' + esc(category.name) + '">' + options.map((item) => option(item.id, item.name + ' · ' + money(item.price), current.service)).join('') + '</optgroup>' : '';
    }).join('') + '</select></label><p class="selection-note" id="service-note"' + (!service ? ' hidden' : '') + '>' + (service ? duration(service.duration) + ' · ' + money(service.price) : '') + '</p>' + (look ? '<p class="selection-note">Выбранный дизайн · ' + esc(look.name) + '</p>' : '') + '<label class="field">Мастер<select name="artist">' + catalog.artists.map((artist) => option(artist.id, artist.name, current.artist)).join('') + '</select></label>';
    if (step === 1) fields = '<div class="field-grid"><label class="field">Желаемая дата<input name="date" type="date" min="' + dateInStudio() + '" max="' + dateInStudio(new Date(Date.now() + 90 * 86400000)) + '" value="' + esc(current.date) + '" required></label><label class="field">Желаемое время<select name="time">' + times.map((time) => option(time, time || 'Любое время', current.time)).join('') + '</select></label></div><p>Администратор уточнит доступность и свяжется с вами.</p>';
    if (step === 2) fields = '<p class="selection-note">' + esc(service?.name) + ' · ' + prettyDate(current.date) + (current.time ? ' в ' + esc(current.time) : '') + '</p><label class="field">Как к вам обращаться<input name="customer" autocomplete="given-name" maxlength="70" minlength="2" value="' + esc(current.customer) + '" required></label><label class="field">Телефон или Telegram<input name="contact" placeholder="+7 900 000-00-00 или @username" maxlength="45" value="' + esc(current.contact) + '" required></label><label class="field">Комментарий (по желанию)<textarea name="note" rows="2" maxlength="300">' + esc(current.note) + '</textarea></label><label class="field-check"><input name="consent" type="checkbox" required ' + (current.consent ? 'checked' : '') + '> Согласна или согласен передать контакт студии для подтверждения записи.</label>';
    const empty = !catalogReady || !activeServices().length;
    bookingContent.innerHTML = '<h2 id="booking-title" tabindex="-1">' + title + '</h2><ol class="steps">' + progress + '</ol><form id="booking-form">' + (empty ? '<p>Загрузка прайса. Если он не появился, обновите страницу.</p>' : fields) + '<p class="form-error" id="booking-error" role="alert"></p><div class="dialog-actions">' + (step > 0 ? '<button type="button" class="pill secondary" data-back>Назад</button>' : '') + '<button type="submit" class="pill primary"' + (empty ? ' disabled' : '') + '>' + (step < 2 ? 'Далее ↗' : (filePreview ? 'Сохранить демо-заявку ↗' : 'Отправить заявку ↗')) + '</button></div></form>';
    if (focus) $('booking-title').focus();
  }

  function saveStep(form) {
    const values = new FormData(form);
    if (step === 0) {
      const designService = lookById(current.look)?.service;
      if (designService && designService !== values.get('service')) current.look = '';
      current.service = values.get('service');
      current.artist = values.get('artist');
    } else if (step === 1) {
      current.date = values.get('date');
      current.time = values.get('time');
    } else {
      for (const name of ['customer', 'contact', 'note']) current[name] = values.get(name).trim();
      current.consent = values.has('consent');
    }
  }

  booking.addEventListener('change', (event) => {
    if (event.target.name !== 'service') return;
    const service = serviceById(event.target.value);
    const note = $('service-note');
    note.hidden = !service;
    note.textContent = service ? duration(service.duration) + ' · ' + money(service.price) : '';
  });

  booking.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    saveStep(form);
    if (step < 2) {
      step++;
      renderBooking(true);
      return;
    }
    const contact = current.contact;
    const isPhone = /^\+?[\d ()-]+$/.test(contact) && contact.replace(/\D/g, '').length >= 10 && contact.replace(/\D/g, '').length <= 15;
    if (current.customer.length < 2 || !(isPhone || /^@[A-Za-z0-9_]{5,32}$/.test(contact))) {
      $('booking-error').textContent = 'Укажите имя и телефон или Telegram в формате @username.';
      return;
    }
    const button = form.querySelector('button[type=submit]');
    const pending = current;
    button.disabled = true;
    button.textContent = 'Сохраняем…';
    $('booking-error').textContent = '';
    try {
      if (filePreview) {
        const data = demoData();
        const service = serviceById(current.service);
        if (!service) throw new Error('Эта услуга больше недоступна.');
        submitted = { ...current, serviceName: service.name, lookName: lookById(current.look)?.name || '', artistName: catalog.artists.find((artist) => artist.id === current.artist)?.name || '', status: 'new', telegram: 'disabled', createdAt: new Date().toISOString() };
        data.bookings.unshift(submitted);
        saveDemo(data);
      } else {
        const result = await requestApi('bookings', { method: 'POST', body: JSON.stringify(pending) });
        rememberBooking(result.booking.id);
        if (current !== pending || !booking.open) return;
        submitted = result.booking;
      }
      if (filePreview) rememberBooking(submitted.id);
      renderBooking();
    } catch (error) {
      if (current !== pending || !booking.open) return;
      $('booking-error').textContent = error.message || 'Не удалось сохранить заявку.';
      button.disabled = false;
      button.textContent = 'Попробовать ещё раз';
    }
  });

  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-book')) openBooking(button.dataset.book, button.dataset.look);
    if (button.hasAttribute('data-history')) showHistory();
    if (button.dataset.close) $(button.dataset.close).close();
    if (button.hasAttribute('data-back')) {
      saveStep($('booking-form'));
      step--;
      renderBooking(true);
    }
    if (button.hasAttribute('data-price') || button.hasAttribute('data-jump-price')) {
      const jump = button.hasAttribute('data-jump-price');
      priceFilter = jump ? button.dataset.jumpPrice : button.dataset.price;
      renderPrice();
      if (jump) $('price').scrollIntoView();
      $('price-filters').querySelector('[aria-pressed=true]')?.focus({ preventScroll: true });
    }
    if (button.hasAttribute('data-gallery-filter')) {
      galleryFilter = button.dataset.galleryFilter;
      renderGallery();
      $('gallery-filters').querySelector('[aria-pressed=true]')?.focus();
    }
    if (button.dataset.swatch) {
      renderPalette(button.dataset.swatch, true);
      $('swatches').querySelector('[aria-pressed=true]')?.focus({ preventScroll: true });
    }
    if (button.dataset.openLook) openLook(button.dataset.openLook);
  });

  if (filePreview) {
    catalog = demoData().catalog;
    $('preview-label').hidden = false;
    document.querySelector('.footer > a:last-child').href = '#admin';
  }
  renderCatalog();
  if (!filePreview) {
    requestApi('catalog').then((data) => {
      catalog = data;
      catalogReady = true;
      renderCatalog();
      window.ScrollTrigger?.refresh();
      if (booking.open && step === 0) renderBooking();
    }).catch(() => {
      $('service-cards').innerHTML = '<p class="form-error">Прайс временно недоступен. Обновите страницу через несколько минут.</p>';
    });
  } else {
    window.addEventListener('storage', (event) => {
      if (event.key === demoDataKey) {
        catalog = demoData().catalog;
        renderCatalog();
      }
    });
    window.addEventListener('pageshow', () => {
      catalog = demoData().catalog;
      renderCatalog();
    });
  }

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'transform,opacity' } })
        .from('.hero-copy h1 > *:not(br)', { opacity: 0, y: 38, stagger: .1, duration: .68 })
        .from('.hero-description, .hero-actions', { opacity: 0, y: 16, stagger: .1, duration: .55 }, '-=.40')
        .from('.hero-photo img', { scale: 1.07, duration: 1.15 }, 0)
        .from('.hero-caption', { opacity: 0, y: 15, duration: .45 }, '-=.45');
      for (const block of document.querySelectorAll('[data-reveal]')) {
        gsap.from(block, { opacity: 0, y: 24, duration: .55, ease: 'power2.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: block, start: 'top 91%', once: true } });
      }
    });
  }
})();
