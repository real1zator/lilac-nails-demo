const initialStudio = {
  studio: { city: 'Калининград', hours: 'Ежедневно · 10:00–20:00', address: '', phone: '', telegram: '' },
  categories: [
    { id: 'manicure', name: 'Маникюр' },
    { id: 'pedicure', name: 'Педикюр' },
    { id: 'design', name: 'Дизайн' },
  ],
  services: [
    { id: 'gel', category: 'manicure', name: 'Маникюр с покрытием', description: 'Форма, обработка кутикулы и однотонное гель-покрытие.', price: 2200, duration: 90, active: true },
    { id: 'clean', category: 'manicure', name: 'Маникюр без покрытия', description: 'Аккуратная форма и бережный уход за кутикулой.', price: 1500, duration: 60, active: true },
    { id: 'strength', category: 'manicure', name: 'Маникюр с укреплением', description: 'Выравнивание и укрепление ногтевой пластины с покрытием.', price: 2800, duration: 120, active: true },
    { id: 'pedi', category: 'pedicure', name: 'Педикюр с покрытием', description: 'Уход за стопами и пальцами, завершённый гель-покрытием.', price: 3100, duration: 105, active: true },
    { id: 'pedi-care', category: 'pedicure', name: 'Педикюр без покрытия', description: 'Обработка стоп и пальцев с увлажняющим уходом.', price: 2500, duration: 75, active: true },
    { id: 'french', category: 'design', name: 'Маникюр с френчем', description: 'Тонкие линии френча в классическом или цветном исполнении.', price: 2700, duration: 105, active: true },
    { id: 'art', category: 'design', name: 'Маникюр с дизайном', description: 'Покрытие и акценты по вашему референсу.', price: 2900, duration: 120, active: true },
  ],
  artists: [{ id: 'any', name: 'Любой мастер' }, { id: 'alina', name: 'Алина' }, { id: 'vika', name: 'Вика' }],
  looks: [
    { id: 'milky', name: 'Молочная вуаль', category: 'Нюд', note: 'Полупрозрачный оттенок с мягким глянцем.', color: '#e5c4c6', tile: 'tl', service: 'gel', active: true },
    { id: 'plum', name: 'Спелая слива', category: 'Однотон', note: 'Глубокий сливовый цвет с зеркальным блеском.', color: '#59334f', tile: 'tr', service: 'gel', active: true },
    { id: 'cherry', name: 'Вишнёвый френч', category: 'Френч', note: 'Тонкая винная линия на натуральной базе.', color: '#873746', tile: 'bl', service: 'french', active: true },
    { id: 'pearl', name: 'Лунный перламутр', category: 'Дизайн', note: 'Лавандовый перелив, заметный при движении руки.', color: '#b8a4c3', tile: 'br', service: 'art', active: true },
  ],
};

if (typeof module !== 'undefined') module.exports = initialStudio;
