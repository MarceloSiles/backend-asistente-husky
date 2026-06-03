(function () {
  if (window.HuskyAssistantLoaded) return;
  window.HuskyAssistantLoaded = true;

  var script = document.currentScript;
  var backendUrl = (script && script.getAttribute('data-backend')) || window.HUSKY_BACKEND_URL || 'https://backend-asistente-husky.onrender.com';

  function getSessionId() {
    try {
      var key = 'husky_assistant_session_id';
      var existing = window.localStorage && window.localStorage.getItem(key);
      if (existing) return existing;
      var id = 'husky-' + Date.now() + '-' + Math.random().toString(16).slice(2);
      if (window.localStorage) window.localStorage.setItem(key, id);
      return id;
    } catch (e) {
      return 'husky-' + Date.now() + '-' + Math.random().toString(16).slice(2);
    }
  }

  var sessionId = getSessionId();

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

  function looksLikeHugeEncodedText(text) {
    var value = String(text || '').trim();
    if (!value) return false;
    if (value.indexOf('data:image/') === 0) return true;
    if (value.length > 1500 && /^[A-Za-z0-9+/=\s]+$/.test(value.slice(0, 1500))) return true;
    return false;
  }

  function safeDisplayText(text, fallback) {
    var value = String(text || '').trim();
    if (!value) return fallback || '';
    if (looksLikeHugeEncodedText(value)) return fallback || 'Imagen adjunta';
    if (value.length > 1200) return value.slice(0, 1200) + '\n\n[Texto demasiado largo recortado]';
    return value;
  }

  function renderMessageText(node, text) {
    node.textContent = '';
    var value = safeDisplayText(text, 'Imagen adjunta');
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    var lastIndex = 0;
    var match;
    while ((match = urlRegex.exec(value)) !== null) {
      if (match.index > lastIndex) node.appendChild(document.createTextNode(value.slice(lastIndex, match.index)));
      var url = match[0].replace(/[),.;]+$/, '');
      var trailing = match[0].slice(url.length);
      var a = document.createElement('a');
      a.href = url;
      a.textContent = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'husky-link';
      node.appendChild(a);
      if (trailing) node.appendChild(document.createTextNode(trailing));
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < value.length) node.appendChild(document.createTextNode(value.slice(lastIndex)));
  }

  function addMessage(container, text, type) {
    var msg = el('div', { class: 'husky-message husky-' + type });
    renderMessageText(msg, text);
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    return msg;
  }

  function setMessageText(node, text) {
    renderMessageText(node, text);
  }

  function formatFileSize(bytes) {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function isAllowedImage(file) {
    if (!file) return false;
    if (file.type && file.type.indexOf('image/') === 0) return true;
    // Algunos navegadores Android no informan bien el MIME. En ese caso miramos la extensión.
    var name = String(file.name || '').toLowerCase();
    return /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(name);
  }

  function init() {
    var selectedImage = null;
    var selectedImagePreviewUrl = null;
    var currentAbortController = null;
    var requestCounter = 0;

    var button = el('button', { id: 'husky-chat-button', type: 'button' }, '💬 Asistente Husky');
    var win = el('section', { id: 'husky-chat-window', 'aria-label': 'Asistente Husky Software' });

    var header = el('div', { class: 'husky-header' });
    var titleWrap = el('div');
    titleWrap.appendChild(el('div', { class: 'husky-title' }, 'Asistente Husky Software'));
    titleWrap.appendChild(el('div', { class: 'husky-subtitle' }, 'Soporte técnico guiado'));
    var headerActions = el('div', { class: 'husky-header-actions' });
    var reset = el('button', { class: 'husky-reset', type: 'button', title: 'Nueva consulta' }, 'Nueva consulta');
    var close = el('button', { class: 'husky-close', type: 'button', 'aria-label': 'Cerrar' }, '×');
    headerActions.appendChild(reset);
    headerActions.appendChild(close);
    header.appendChild(titleWrap);
    header.appendChild(headerActions);

    var messages = el('div', { id: 'husky-messages' });

    var form = el('form', { class: 'husky-form', autocomplete: 'off' });
    var attach = el('button', { id: 'husky-attach', type: 'button', title: 'Adjuntar imagen' }, '📎');
    var fileInput = el('input', { id: 'husky-file-input', type: 'file', accept: 'image/*', style: 'display:none' });
    var inputWrap = el('div', { class: 'husky-input-wrap' });
    var input = el('input', { id: 'husky-input', type: 'text', placeholder: 'Escribí tu consulta...', autocomplete: 'off' });
    var attachmentInfo = el('div', { id: 'husky-attachment-info' });
    inputWrap.appendChild(input);
    inputWrap.appendChild(attachmentInfo);
    var send = el('button', { id: 'husky-send', type: 'submit', title: 'Enviar' }, 'Enviar');
    form.appendChild(attach);
    form.appendChild(fileInput);
    form.appendChild(inputWrap);
    form.appendChild(send);

    win.appendChild(header);
    win.appendChild(messages);
    win.appendChild(form);
    document.body.appendChild(win);
    document.body.appendChild(button);

    function clearAttachment() {
      selectedImage = null;
      fileInput.value = '';
      attachmentInfo.innerHTML = '';
      if (selectedImagePreviewUrl) URL.revokeObjectURL(selectedImagePreviewUrl);
      selectedImagePreviewUrl = null;
    }

    function resetChat() {
      requestCounter += 1;
      sessionId = 'husky-' + Date.now() + '-' + Math.random().toString(16).slice(2);
      try { window.localStorage.setItem('husky_assistant_session_id', sessionId); } catch (e) {}
      if (currentAbortController) {
        try { currentAbortController.abort(); } catch (e) {}
      }
      currentAbortController = null;
      input.value = '';
      clearAttachment();
      send.disabled = false;
      messages.innerHTML = '';
      addMessage(messages, 'Hola 😊 Soy el asistente de Husky Software. Escribí una consulta nueva y la reviso desde cero.', 'bot');
      input.focus();
    }

    resetChat();

    button.addEventListener('click', function () {
      win.classList.add('open');
      input.focus();
    });

    close.addEventListener('click', function () {
      win.classList.remove('open');
    });

    reset.addEventListener('click', resetChat);

    attach.addEventListener('click', function () {
      fileInput.click();
    });

    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      if (!isAllowedImage(file)) {
        clearAttachment();
        attachmentInfo.textContent = 'El archivo seleccionado no parece ser una imagen. Probá con una captura JPG, PNG o WEBP.';
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        clearAttachment();
        attachmentInfo.textContent = 'La imagen es demasiado grande. Máximo recomendado: 8 MB.';
        return;
      }
      selectedImage = file;
      if (selectedImagePreviewUrl) URL.revokeObjectURL(selectedImagePreviewUrl);
      selectedImagePreviewUrl = URL.createObjectURL(file);
      attachmentInfo.innerHTML = '';
      var chip = el('div', { class: 'husky-attachment-chip' });
      chip.appendChild(el('span', {}, '📷 ' + (file.name || 'imagen') + ' · ' + formatFileSize(file.size)));
      var remove = el('button', { type: 'button', class: 'husky-remove-attachment', title: 'Quitar imagen' }, '×');
      remove.addEventListener('click', clearAttachment);
      chip.appendChild(remove);
      attachmentInfo.appendChild(chip);
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var text = input.value.trim();
      if (looksLikeHugeEncodedText(text)) {
        text = '';
      }
      if (!text && !selectedImage) return;

      var thisRequest = ++requestCounter;
      if (currentAbortController) {
        try { currentAbortController.abort(); } catch (e) {}
      }
      currentAbortController = new AbortController();

      var imageToSend = selectedImage;
      var previewUrlToShow = selectedImagePreviewUrl;
      var displayText = imageToSend ? (text || 'Imagen adjunta') : safeDisplayText(text, 'Consulta enviada');
      addMessage(messages, displayText, 'user');

      if (imageToSend && previewUrlToShow) {
        var preview = el('img', { class: 'husky-image-preview', src: previewUrlToShow, alt: 'Imagen adjunta' });
        var previewWrap = el('div', { class: 'husky-preview-wrap' });
        previewWrap.appendChild(preview);
        messages.appendChild(previewWrap);
        messages.scrollTop = messages.scrollHeight;
      }

      input.value = '';
      clearAttachment();
      send.disabled = true;

      var thinking = addMessage(messages, imageToSend ? 'Estoy revisando la imagen...' : 'Estoy revisando tu consulta...', 'bot');

      function ignoreOldResponse() {
        return thisRequest !== requestCounter;
      }

      if (imageToSend) {
        var formData = new FormData();
        formData.append('image', imageToSend, imageToSend.name || 'imagen.jpg');
        formData.append('message', text);
        formData.append('request_id', String(thisRequest));
        formData.append('sessionId', sessionId);

        fetch(backendUrl + '/chat-image', { method: 'POST', body: formData, signal: currentAbortController.signal, cache: 'no-store' })
          .then(function (response) {
            if (!response.ok) throw new Error('Error HTTP ' + response.status);
            return response.json();
          })
          .then(function (data) {
            if (!ignoreOldResponse()) setMessageText(thinking, data.answer || 'Imagen recibida correctamente.');
          })
          .catch(function (error) {
            if (!ignoreOldResponse() && error.name !== 'AbortError') setMessageText(thinking, 'No pude enviar la imagen al backend. Probá con una captura JPG, PNG o WEBP de menos de 8 MB.');
          })
          .finally(function () {
            if (!ignoreOldResponse()) {
              send.disabled = false;
              input.focus();
            }
          });
        return;
      }

      fetch(backendUrl + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify({ message: text, request_id: String(thisRequest), sessionId: sessionId }),
        signal: currentAbortController.signal,
        cache: 'no-store'
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Error HTTP ' + response.status);
          return response.json();
        })
        .then(function (data) {
          if (!ignoreOldResponse()) setMessageText(thinking, data.answer || 'No pude obtener una respuesta en este momento.');
        })
        .catch(function (error) {
          if (!ignoreOldResponse() && error.name !== 'AbortError') setMessageText(thinking, 'No pude conectarme con el asistente en este momento. Probá nuevamente o contactá al soporte de Husky Software.');
        })
        .finally(function () {
          if (!ignoreOldResponse()) {
            send.disabled = false;
            input.focus();
          }
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();