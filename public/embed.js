(function () {
  if (window.HuskyAssistantLoaded) return;
  window.HuskyAssistantLoaded = true;

  var script = document.currentScript;
  var backendUrl = (script && script.getAttribute('data-backend')) || window.HUSKY_BACKEND_URL || 'https://backend-asistente-husky.onrender.com';

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === 'class') node.className = attrs[key];
      else if (key === 'id') node.id = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    if (text) node.textContent = text;
    return node;
  }

  function addMessage(container, text, type) {
    var msg = el('div', { class: 'husky-message husky-' + type }, text);
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    return msg;
  }

  function init() {
    var button = el('button', { id: 'husky-chat-button', type: 'button' }, '💬 Asistente Husky');
    var win = el('section', { id: 'husky-chat-window', 'aria-label': 'Asistente Husky Software' });

    var header = el('div', { class: 'husky-header' });
    var titleWrap = el('div');
    titleWrap.appendChild(el('div', { class: 'husky-title' }, 'Asistente Husky Software'));
    titleWrap.appendChild(el('div', { class: 'husky-subtitle' }, 'Soporte técnico guiado'));
    var close = el('button', { class: 'husky-close', type: 'button', 'aria-label': 'Cerrar' }, '×');
    header.appendChild(titleWrap);
    header.appendChild(close);

    var messages = el('div', { id: 'husky-messages' });
    addMessage(messages, 'Hola, soy el asistente de Husky Software. ¿En qué te puedo ayudar?', 'bot');

    var form = el('form', { class: 'husky-form' });
    var input = el('input', { id: 'husky-input', type: 'text', placeholder: 'Escribí tu consulta...', autocomplete: 'off' });
    var send = el('button', { id: 'husky-send', type: 'submit' }, 'Enviar');
    form.appendChild(input);
    form.appendChild(send);

    win.appendChild(header);
    win.appendChild(messages);
    win.appendChild(form);
    document.body.appendChild(win);
    document.body.appendChild(button);

    button.addEventListener('click', function () {
      win.classList.add('open');
      input.focus();
    });

    close.addEventListener('click', function () {
      win.classList.remove('open');
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var text = input.value.trim();
      if (!text) return;

      addMessage(messages, text, 'user');
      input.value = '';
      send.disabled = true;
      var thinking = addMessage(messages, 'Estoy revisando la consulta...', 'bot');

      fetch(backendUrl + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Error HTTP ' + response.status);
          return response.json();
        })
        .then(function (data) {
          thinking.textContent = data.answer || 'No pude obtener una respuesta en este momento.';
        })
        .catch(function () {
          thinking.textContent = 'No pude conectarme con el asistente en este momento. Probá nuevamente o contactá al soporte de Husky Software.';
        })
        .finally(function () {
          send.disabled = false;
          input.focus();
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
