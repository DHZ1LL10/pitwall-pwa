(() => {
  'use strict';

  const STORAGE_KEY = 'pitwall.messages.v1';
  const CHARACTER_KEY = 'pitwall.character.v1';
  const characters = [
    { id: 'driver', name: 'Mara Velo', role: 'Piloto', initials: 'MV', accent: '#e5363f', bio: 'Instinto y precisión' },
    { id: 'engineer', name: 'Leo Torque', role: 'Ingeniero', initials: 'LT', accent: '#45b6d8', bio: 'Datos que hablan' },
    { id: 'strategist', name: 'Nia Apex', role: 'Estratega', initials: 'NA', accent: '#d5a84a', bio: 'Un paso adelante' },
    { id: 'mechanic', name: 'Rafa Box', role: 'Mecánico', initials: 'RB', accent: '#8f76d9', bio: 'Manos a la obra' },
    { id: 'principal', name: 'Ivo Grid', role: 'Jefe de equipo', initials: 'IG', accent: '#72d29a', bio: 'La visión completa' }
  ];
  const seedMessages = [
    { id: 'seed-1', characterId: 'engineer', text: 'La degradación en el último stint cuenta otra historia. El ritmo está ahí; toca proteger la ventana de temperatura.', createdAt: Date.now() - 1000 * 60 * 18 },
    { id: 'seed-2', characterId: 'strategist', text: 'Si entra el VSC, la decisión se toma antes de que aparezca en las pantallas. El margen está en anticipar.', createdAt: Date.now() - 1000 * 60 * 9 },
    { id: 'seed-3', characterId: 'driver', text: 'Buen balance en el sector dos. Ahora necesitamos encontrar la décima sin pedirle demasiado al eje delantero.', createdAt: Date.now() - 1000 * 60 * 3 }
  ];

  const $ = (selector) => document.querySelector(selector);
  const characterGrid = $('#characterGrid');
  const feedSection = $('#feedSection');
  const messageList = $('#messageList');
  const composeModal = $('#composeModal');
  const messageInput = $('#messageInput');
  const formError = $('#formError');
  let selectedCharacterId = localStorage.getItem(CHARACTER_KEY) || null;
  let messages = loadMessages();

  function loadMessages() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(saved) ? saved : seedMessages;
    } catch (error) {
      return seedMessages;
    }
  }

  function getCharacter(id) { return characters.find((character) => character.id === id); }

  function avatarMarkup(character, small = false) {
    const className = small ? 'mini-avatar' : 'avatar';
    const label = small ? '' : ` aria-label="Avatar de ${character.name}"`;
    return `<span class="${className}" style="--accent:${character.accent}"${label}>${character.initials}</span>`;
  }

  function renderCharacters() {
    characterGrid.replaceChildren();
    characters.forEach((character, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `character-card${selectedCharacterId === character.id ? ' selected' : ''}`;
      card.style.setProperty('--accent', character.accent);
      card.setAttribute('role', 'listitem');
      card.setAttribute('aria-pressed', selectedCharacterId === character.id ? 'true' : 'false');
      card.innerHTML = `<span class="role-index">0${index + 1}</span>${avatarMarkup(character)}<span class="character-name">${character.name}</span><span class="character-role">${character.role} · ${character.bio}</span>`;
      card.addEventListener('click', () => selectCharacter(character.id));
      characterGrid.append(card);
    });
  }

  function selectCharacter(id) {
    selectedCharacterId = id;
    localStorage.setItem(CHARACTER_KEY, id);
    renderCharacters();
    feedSection.hidden = false;
    updateComposerIdentity();
    renderMessages();
    feedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updateComposerIdentity() {
    const character = getCharacter(selectedCharacterId);
    if (!character) return;
    $('#composerPerson').replaceChildren();
    $('#composerPerson').insertAdjacentHTML('beforeend', `${avatarMarkup(character, true)}<span>${character.name}</span>`);
  }

  function renderMessages() {
    messageList.replaceChildren();
    if (!messages.length) {
      messageList.innerHTML = '<div class="empty-feed">El pitwall está en silencio. Sé la primera voz.</div>';
      return;
    }
    [...messages].sort((a, b) => b.createdAt - a.createdAt).forEach((message) => {
      const character = getCharacter(message.characterId) || characters[0];
      const article = document.createElement('article');
      article.className = 'message-card';
      article.style.setProperty('--accent', character.accent);
      article.innerHTML = `${avatarMarkup(character, true)}<div><div class="message-author">${character.name}<span class="message-role">${character.role}</span></div></div><time class="message-time" datetime="${new Date(message.createdAt).toISOString()}">${formatTime(message.createdAt)}</time>`;
      const text = document.createElement('p');
      text.className = 'message-text';
      text.textContent = message.text;
      article.append(text);
      messageList.append(article);
    });
  }

  function formatTime(timestamp) {
    const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
    if (minutes < 1) return 'AHORA';
    if (minutes < 60) return `HACE ${minutes} MIN`;
    const hours = Math.floor(minutes / 60);
    return `HACE ${hours} H`;
  }

  function openComposer() {
    if (!selectedCharacterId) return;
    const character = getCharacter(selectedCharacterId);
    $('#modalAuthor').innerHTML = `${avatarMarkup(character, true)}<span>Publicando como <strong>${character.name}</strong></span>`;
    formError.hidden = true;
    messageInput.value = '';
    $('#characterCounter').textContent = '0 / 280';
    composeModal.hidden = false;
    messageInput.focus();
  }

  function closeComposer() { composeModal.hidden = true; }

  function publishMessage() {
    const text = messageInput.value.trim();
    if (!text) { showError('Escribe una lectura antes de publicar.'); return; }
    const duplicate = messages.some((message) => message.characterId === selectedCharacterId && message.text.toLocaleLowerCase() === text.toLocaleLowerCase());
    if (duplicate) { showError('Ese mensaje ya está en tu feed.'); return; }
    const message = { id: `local-${Date.now()}`, characterId: selectedCharacterId, text, createdAt: Date.now() };
    messages.push(message);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    renderMessages();
    closeComposer();
    notifyNewMessage(getCharacter(selectedCharacterId), text);
  }

  function showError(message) { formError.textContent = message; formError.hidden = false; }

  async function requestNotifications() {
    if (!('Notification' in window)) { window.alert('Este navegador no es compatible con notificaciones locales.'); return; }
    const permission = await Notification.requestPermission();
    updateNotificationUI(permission);
    if (permission === 'granted') notifyNewMessage({ name: 'PitWall', role: 'Sistema' }, 'Notificaciones locales activadas.');
  }

  function updateNotificationUI(permission = ('Notification' in window ? Notification.permission : 'unsupported')) {
    const button = $('#notificationButton');
    button.setAttribute('aria-label', permission === 'granted' ? 'Notificaciones activadas' : 'Activar notificaciones');
    $('.notification-badge').hidden = permission !== 'granted';
    button.title = permission === 'denied' ? 'Notificaciones bloqueadas por el navegador' : permission === 'granted' ? 'Notificaciones activadas' : 'Activar notificaciones';
  }

  async function notifyNewMessage(character, text) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const title = `${character.name} · PitWall`;
    const options = { body: text, icon: './icons/icon-192.svg', badge: './icons/icon-192.svg', tag: 'pitwall-local-message' };
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && 'showNotification' in registration) await registration.showNotification(title, options);
      else new Notification(title, options);
    } catch (error) { /* La UI sigue funcionando aunque el sistema no acepte esta notificación. */ }
  }

  $('#composeButton').addEventListener('click', openComposer);
  $('#modalClose').addEventListener('click', closeComposer);
  $('#publishButton').addEventListener('click', publishMessage);
  $('#notificationButton').addEventListener('click', requestNotifications);
  messageInput.addEventListener('input', () => { $('#characterCounter').textContent = `${messageInput.value.length} / 280`; });
  composeModal.addEventListener('click', (event) => { if (event.target === composeModal) closeComposer(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !composeModal.hidden) closeComposer(); });

  renderCharacters();
  if (selectedCharacterId && getCharacter(selectedCharacterId)) { feedSection.hidden = false; updateComposerIdentity(); renderMessages(); }
  updateNotificationUI();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
})();
