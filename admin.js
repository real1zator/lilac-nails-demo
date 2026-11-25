(() => {
  if (!embeddedDemoAdmin && document.body.dataset.page !== 'admin') return;
  if (filePreview && !embeddedDemoAdmin) {
    location.replace('index.html' + (location.protocol === 'file:' ? '' : '?demo=1') + '#admin');
    return;
  }
  renderAdminLayout();
  document.title = 'ЛИЛА — кабинет студии';
  const $ = (id) => document.getElementById(id);
  const esc = htmlEscape;
  const panel = $('admin-content');
  const dialog = $('edit-record');
  const form = $('record-form');
  const filters = { status: '', query: '' };
  const labels = {
    categories: { title: 'Категории', one: 'категорию' },
    services: { title: 'Услуги', one: 'услугу' },
    looks: { title: 'Работы', one: 'работу' },
    artists: { title: 'Мастера', one: 'мастера' },
  };
  let data;
  let activeTab = 'bookings';
  let editing = null;

  function status(message) { $('admin-status').textContent = message; }
  function selectOptions(items, choice) {
    return items.map(({ id, name }) => '<option value="' + esc(id) + '"' + (choice === id ? ' selected' : '') + '>' + esc(name) + '</option>').join('');
  }
  function input(label, name, value, attrs = '') {
    return '<label class="field">' + label + '<input name="' + name + '" value="' + esc(value) + '" ' + attrs + '></label>';
  }
  function select(label, name, items, choice, attrs = '') {
    return '<label class="field">' + label + '<select name="' + name + '" ' + attrs + '>' + selectOptions(items, choice) + '</select></label>';
  }
  function textarea(label, name, value) {
    return '<label class="field">' + label + '<textarea name="' + name + '" maxlength="250" rows="2">' + esc(value) + '</textarea></label>';
  }
  function statusOptions(choice, all = false) {
    return selectOptions([...(all ? [{ id: '', name: 'Все статусы' }] : []), ...Object.entries(bookingStatuses).map(([id, name]) => ({ id, name }))], choice);
  }
  function header(title, button = '') {
    return '<div class="admin-head"><h2>' + title + '</h2>' + button + '</div>';
  }

  function showLogin() {
    $('login').hidden = false;
    $('dashboard').hidden = true;
    $('logout').hidden = true;
  }
  async function load() {
    if (filePreview) {
      data = demoData();
      $('demo-info').hidden = false;
      for (const link of document.querySelectorAll('.admin-top a')) link.href = '#top';
    } else {
      try { data = await requestApi('admin/data'); }
      catch { showLogin(); return; }
    }
    $('login').hidden = true;
    $('dashboard').hidden = false;
    $('logout').hidden = filePreview;
    render();
  }

  function renderBookingRows() {
    const query = filters.query.trim().toLocaleLowerCase('ru');
    const filtered = data.bookings.filter((booking) => (!filters.status || filters.status === booking.status) &&
      [booking.customer, booking.contact, booking.serviceName].some((value) => value.toLocaleLowerCase('ru').includes(query)));
    $('booking-rows').innerHTML = filtered.map((booking) => {
      const notify = { disabled: 'Telegram не подключён', pending: 'Telegram · в очереди', failed: 'Telegram · не доставлено', sent: 'Telegram · доставлено' }[booking.telegram];
      const contactURL = booking.contact.startsWith('@') ? 'https://t.me/' + booking.contact.slice(1) : 'tel:' + booking.contact.replace(/[^\d+]/g, '');
      return '<article class="admin-row"><div><h3>' + esc(booking.customer) + ' · ' + esc(booking.serviceName) + '</h3><p>' + prettyDate(booking.date) + (booking.time ? ' · ' + esc(booking.time) : '') + (booking.artistName ? ' · ' + esc(booking.artistName) : '') + '</p><p><a class="contact-link" href="' + esc(contactURL) + '">' + esc(booking.contact) + '</a>' + (booking.lookName ? ' · ' + esc(booking.lookName) : '') + '</p>' + (booking.note ? '<p>' + esc(booking.note) + '</p>' : '') + (notify ? '<p class="booking-notification">' + notify + '</p>' : '') + '</div><div class="admin-actions"><select aria-label="Статус заявки ' + esc(booking.customer) + '" data-booking="' + esc(booking.id) + '">' + statusOptions(booking.status) + '</select></div></article>';
    }).join('') || '<p class="empty">' + (data.bookings.length ? 'По вашим фильтрам заявок нет.' : 'Здесь появятся заявки на запись.') + '</p>';
  }

  function renderClients() {
    const list = new Map();
    for (const booking of data.bookings) {
      const key = booking.contact.startsWith('@') ? booking.contact.toLowerCase() : booking.contact.replace(/\D/g, '').replace(/^8(?=\d{10}$)/, '7');
      if (!list.has(key)) list.set(key, { name: booking.customer, contact: booking.contact, count: 0 });
      list.get(key).count++;
    }
    return header('Клиенты') + '<p class="empty">Люди, которые оставили заявку.</p>' + [...list.values()].map(({ name, contact, count }) =>
      '<article class="admin-row"><div><h3>' + esc(name) + '</h3><p>' + esc(contact) + '</p></div><p>Заявок: ' + count + '</p></article>').join('') +
      (list.size ? '' : '<p class="empty">Список пока пуст.</p>');
  }

  function renderStudio() {
    const studio = data.catalog.studio;
    return header('Контакты') + '<form id="studio-form" class="admin-form">' +
      input('Город', 'city', studio.city, 'required maxlength="80"') +
      input('Адрес', 'address', studio.address, 'maxlength="200"') +
      input('Часы работы', 'hours', studio.hours, 'maxlength="120"') +
      input('Телефон', 'phone', studio.phone, 'type="tel" maxlength="32"') +
      input('Имя в Telegram', 'telegram', studio.telegram, 'maxlength="34" placeholder="@studio"') +
      '<button class="pill primary" type="submit">Сохранить</button></form>';
  }

  function renderRecords(kind) {
    const rows = data.catalog[kind];
    const byCategory = (id) => data.catalog.categories.find((category) => category.id === id)?.name || 'Без категории';
    return header(labels[kind].title, '<button class="pill primary" data-new>Добавить ' + labels[kind].one + ' +</button>') +
      rows.map((item) => {
        const look = kind === 'looks' ? lookArt(item) : null;
        const info = kind === 'services' ? byCategory(item.category) + ' · ' + money(item.price) + ' · ' + item.duration + ' мин' : kind === 'looks' ? item.category : '';
        const visible = 'active' in item ? (item.active ? ' · Опубликовано' : ' · Скрыто') : '';
        return '<article class="admin-row"><div class="entry-main">' + (look ? '<div class="' + look.className + '"' + look.style + '></div>' : '') + '<div><h3>' + esc(item.name) + '</h3><p>' + esc(info + visible) + '</p></div></div><div class="admin-actions"><button class="pill secondary" data-edit="' + esc(item.id) + '">Изменить</button>' +
          (item.id === 'any' ? '' : '<button class="pill secondary admin-destructive" data-remove="' + esc(item.id) + '">Удалить</button>') + '</div></article>';
      }).join('') + (rows.length ? '' : '<p class="empty">Пока нет записей.</p>');
  }

  function render() {
    document.querySelectorAll('[data-tab]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.tab === activeTab)));
    if (activeTab === 'bookings') {
      panel.innerHTML = '<section class="admin-panel">' + header('Заявки', '<button class="pill secondary" data-refresh>Обновить</button>') + '<div class="admin-tools">' +
        input('Поиск', 'search', filters.query, 'id="booking-search" type="search" placeholder="Имя, контакт или услуга"') + '<label class="field">Статус<select id="status-filter">' + statusOptions(filters.status, true) + '</select></label></div><div id="booking-rows"></div></section>';
      renderBookingRows();
      return;
    }
    const content = activeTab === 'studio' ? renderStudio() : activeTab === 'clients' ? renderClients() : renderRecords(activeTab);
    panel.innerHTML = '<section class="admin-panel">' + content + '</section>';
  }

  async function persistCatalog(catalog) {
    if (filePreview) {
      const latest = demoData();
      latest.catalog = catalog;
      saveDemo(latest);
      data = latest;
    } else {
      const result = await requestApi('admin/catalog', { method: 'PUT', body: JSON.stringify({ ...catalog, version: data.catalogVersion }) });
      data.catalog = result.catalog;
      data.catalogVersion = result.catalogVersion;
    }
    render();
  }

  function openEditor(id) {
    const kind = activeTab;
    const item = data.catalog[kind].find((record) => record.id === id) || {};
    editing = { kind, item };
    $('edit-title').textContent = id ? 'Редактировать' : 'Добавить ' + labels[kind].one;
    $('edit-error').textContent = '';
    let fields = input('Название', 'name', item.name, 'maxlength="70" required');
    if (kind === 'services') {
      fields += select('Категория', 'category', data.catalog.categories, item.category, 'required') + textarea('Описание', 'description', item.description) +
        '<div class="field-grid">' + input('Цена, ₽', 'price', item.price, 'type="number" min="0" max="10000000" step="1" required') +
        input('Длительность, мин', 'duration', item.duration, 'type="number" min="5" max="600" step="1" required') + '</div>';
    }
    if (kind === 'looks') {
      fields += input('Категория работы', 'category', item.category, 'maxlength="50" required') + textarea('Описание', 'note', item.note) +
        select('Услуга для записи', 'service', [{ id: '', name: 'Любая услуга' }, ...data.catalog.services], item.service) +
        input('Цвет в палитре', 'color', item.color || '#b8a4c3', 'type="color"') +
        '<label class="field">Фото (до 2 МБ)<input type="file" name="image" accept="image/jpeg,image/png,image/webp"' + (!item.id ? ' required' : '') + '></label>';
    }
    if (kind === 'looks' || kind === 'services') fields += '<label class="field-check"><input type="checkbox" name="active" ' + (item.active !== false ? 'checked' : '') + '> Показывать на сайте</label>';
    $('record-fields').innerHTML = fields;
    dialog.showModal();
  }

  async function upload(file) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2000000) throw new Error('Выберите JPG, PNG или WebP до 2 МБ.');
    const image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result));
      reader.addEventListener('error', () => reject(new Error('Не удалось прочитать изображение.')));
      reader.readAsDataURL(file);
    });
    if (filePreview) return image;
    const result = await requestApi('admin/media', { method: 'POST', body: JSON.stringify({ image }) });
    return result.image;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const { kind, item } = editing;
    const values = new FormData(form);
    const name = values.get('name').trim();
    if (!name) { $('edit-error').textContent = 'Укажите название.'; return; }
    const submit = form.querySelector('button[type=submit]');
    submit.disabled = true;
    try {
      const next = structuredClone(data.catalog);
      const record = { ...item, id: item.id || crypto.randomUUID(), name };
      if (kind === 'services') Object.assign(record, {
        category: values.get('category'), description: values.get('description').trim(),
        price: Number(values.get('price')), duration: Number(values.get('duration')), active: values.has('active'),
      });
      if (kind === 'looks') {
        const category = values.get('category').trim();
        if (!category) throw new Error('Укажите категорию работы.');
        Object.assign(record, { category, service: values.get('service'), note: values.get('note').trim(), color: values.get('color'), active: values.has('active') });
        const file = values.get('image');
        if (file.size) record.image = await upload(file);
      }
      const index = next[kind].findIndex((value) => value.id === record.id);
      if (index >= 0) next[kind][index] = record;
      else next[kind].push(record);
      await persistCatalog(next);
      dialog.close();
      status('Изменения сохранены.');
    } catch (error) { $('edit-error').textContent = error.message; }
    finally { submit.disabled = false; }
  });

  async function remove(id) {
    const kind = activeTab;
    const source = data.catalog[kind].find((record) => record.id === id);
    if (!source || id === 'any') return;
    if (kind === 'categories' && data.catalog.services.some((service) => service.category === id)) {
      status('Сначала переместите услуги из этой категории.');
      return;
    }
    if (!confirm('Удалить «' + source.name + '»?')) return;
    const next = structuredClone(data.catalog);
    next[kind] = next[kind].filter((record) => record.id !== id);
    if (kind === 'services') next.looks = next.looks.map((look) => look.service === id ? { ...look, service: '' } : look);
    try { await persistCatalog(next); status('Карточка удалена.'); }
    catch (error) { status(error.message); }
  }

  document.querySelector('.admin-nav').addEventListener('click', (event) => {
    const button = event.target.closest('[data-tab]');
    if (!button) return;
    activeTab = button.dataset.tab;
    status('');
    render();
  });
  panel.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-new')) {
      if (activeTab === 'services' && !data.catalog.categories.length) { status('Сначала добавьте категорию.'); return; }
      openEditor();
    }
    if (button.dataset.edit) openEditor(button.dataset.edit);
    if (button.dataset.remove) remove(button.dataset.remove);
    if (button.hasAttribute('data-refresh')) load();
  });
  panel.addEventListener('input', (event) => {
    if (event.target.id !== 'booking-search') return;
    filters.query = event.target.value;
    renderBookingRows();
  });
  panel.addEventListener('change', async (event) => {
    const target = event.target;
    if (target.id === 'status-filter') {
      filters.status = target.value;
      renderBookingRows();
    }
    if (!target.dataset.booking) return;
    const id = target.dataset.booking;
    target.disabled = true;
    try {
      if (filePreview) {
        const latest = demoData();
        latest.bookings.find((booking) => booking.id === id).status = target.value;
        saveDemo(latest);
        data = latest;
      } else {
        const result = await requestApi('admin/bookings/' + id, { method: 'PATCH', body: JSON.stringify({ status: target.value }) });
        data.bookings = data.bookings.map((booking) => booking.id === id ? result.booking : booking);
      }
      status('Статус обновлён.');
    } catch (error) { status(error.message); }
    finally { if (activeTab === 'bookings') renderBookingRows(); }
  });

  panel.addEventListener('submit', async (event) => {
    if (event.target.id !== 'studio-form') return;
    event.preventDefault();
    const next = structuredClone(data.catalog);
    next.studio = Object.fromEntries([...new FormData(event.target)].map(([key, value]) => [key, value.trim()]));
    try { await persistCatalog(next); status('Контакты сохранены.'); }
    catch (error) { status(error.message); }
  });
  $('login').addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = new FormData(event.target).get('password');
    const submit = event.target.querySelector('button[type=submit]');
    submit.disabled = true;
    $('login-error').textContent = '';
    try {
      await requestApi('admin/login', { method: 'POST', body: JSON.stringify({ password }) });
      event.target.reset();
      await load();
    } catch (error) { $('login-error').textContent = error.message; }
    finally { submit.disabled = false; }
  });
  $('logout').addEventListener('click', async () => {
    try {
      await requestApi('admin/logout', { method: 'POST', body: '{}' });
      data = null;
      panel.replaceChildren();
      showLogin();
    } catch (error) { status(error.message); }
  });
  $('edit-close').addEventListener('click', () => dialog.close());
  $('edit-cancel').addEventListener('click', () => dialog.close());
  load();
})();
