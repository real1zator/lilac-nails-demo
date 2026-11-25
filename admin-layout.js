function renderAdminLayout() {
  document.body.className = 'admin-page';
  document.body.innerHTML = `
    <header class="wrap admin-top"><a class="wordmark" href="index.html#top"><span class="mark" aria-hidden="true">✦</span><strong>лила.</strong></a><a class="text-link" id="back-to-site" href="index.html#top">На сайт ↗</a></header>
    <main class="wrap admin-main">
      <div class="admin-heading"><div><p class="eyebrow">ЛИЛА</p><h1>Кабинет <em>студии.</em></h1></div><button class="pill secondary" id="logout" hidden>Выйти</button></div>
      <p class="demo-info" id="demo-info" hidden>Демонстрационный кабинет. Здесь можно попробовать изменить каталог или обработать тестовую заявку.</p>
      <form class="admin-panel admin-login" id="login" hidden><label class="field">Пароль владельца <input name="password" type="password" autocomplete="current-password" required></label><button class="pill primary" type="submit">Войти ↗</button><p class="form-error" id="login-error" role="alert"></p></form>
      <div id="dashboard" hidden>
        <nav class="chips admin-nav" aria-label="Разделы кабинета">
          <button data-tab="bookings" aria-pressed="true">Заявки</button><button data-tab="services" aria-pressed="false">Услуги</button><button data-tab="categories" aria-pressed="false">Категории</button><button data-tab="looks" aria-pressed="false">Работы</button><button data-tab="artists" aria-pressed="false">Мастера</button><button data-tab="clients" aria-pressed="false">Клиенты</button><button data-tab="studio" aria-pressed="false">Контакты</button>
        </nav>
        <p class="admin-status" id="admin-status" role="status"></p>
        <div id="admin-content"></div>
      </div>
    </main>
    <dialog id="edit-record" aria-labelledby="edit-title"><div class="dialog-frame"><div class="dialog-top"><span class="eyebrow">Кабинет студии</span><button class="round" type="button" id="edit-close" aria-label="Закрыть">×</button></div><h2 id="edit-title"></h2><form id="record-form"><div id="record-fields"></div><p class="form-error" id="edit-error" role="alert"></p><div class="dialog-actions"><button type="button" class="pill secondary" id="edit-cancel">Отмена</button><button type="submit" class="pill primary">Сохранить</button></div></form></div></dialog>`;
}
