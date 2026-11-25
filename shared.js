const filePreview = true;
const embeddedDemoAdmin = filePreview && location.hash === '#admin';
if (filePreview && document.body.dataset.page !== 'admin') {
  window.addEventListener('hashchange', () => {
    if ((location.hash === '#admin') !== embeddedDemoAdmin) location.reload();
  });
}
const demoDataKey = 'lila-salon-demo-v1';
const dateInStudio = (date = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Kaliningrad', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
const prettyDate = (date) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
const money = (value) => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
const htmlEscape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const bookingStatuses = { new: 'Новая', confirmed: 'Подтверждена', completed: 'Завершена', cancelled: 'Отменена' };
const demoData = () => {
  try {
    const saved = localStorage.getItem(demoDataKey);
    if (saved) return JSON.parse(saved);
  } catch { /* Continue with sample data. */ }
  return { catalog: structuredClone(initialStudio), bookings: [] };
};
const saveDemo = (data) => localStorage.setItem(demoDataKey, JSON.stringify(data));
async function requestApi(path, options = {}) {
  const response = await fetch('api/' + path, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Сервис временно недоступен. Попробуйте ещё раз.');
  return result;
}
const isTile = (tile) => ['tl', 'tr', 'bl', 'br'].includes(tile);
const lookArt = (look) => {
  if (look.image && (/^(?:media\/[a-f0-9-]+\.(?:jpg|png|webp)|data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+)$/.test(look.image))) {
    return { className: 'atlas', style: " style=\"--work-image:url('" + htmlEscape(look.image) + "')\"" };
  }
  return { className: 'atlas' + (isTile(look.tile) ? ' atlas-' + look.tile : ''), style: '' };
};
