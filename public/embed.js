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

  function formatFileSize(bytes) {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function init() {
    var selectedImage = null;
    var selectedImagePreviewUrl = null;

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
    var attach = el('button', { id: 'husky-attach', type: 'button', title: 'Adjuntar imagen' }, '📎');
    var fileInput = el('input', { id: 'husky-file-input', type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif', style: 'display:none' });
    var inputWrap = el('div', { class: 'husky-input-wrap' });
    var input = el('input', { id: 'husky-input', type: 'text', placeholder: 'Escribí tu consulta...', autocomplete: 'off' });
    var attachmentInfo = el('div', { id: 'husky-attachment-info' });
    inputWrap.appendChild(input);
    inputWrap.appendChild(attachmentInfo);
    var send = el('button', { id: 'husky-send', type: 'submit' }, 'Enviar');
    form.appendChild(attach);
    form.appendChild(fileInput);
    form.appendChild(inputWrap);
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

    attach.addEventListener('click', function () {
      fileInput.click();
    });

    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;

      if (!file.type || !file.type.startsWith('image/')) {
        selectedImage = null;
        attachmentInfo.textContent = 'El archivo seleccionado no es una imagen.';
        fileInput.value = '';
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        selectedImage = null;
        attachmentInfo.textContent = 'La imagen es demasiado grande. Máximo recomendado: 8 MB.';
        fileInput.value = '';
        return;
      }

      selectedImage = file;
      if (selectedImagePreviewUrl) URL.revokeObjectURL(selectedImagePreviewUrl);
      selectedImagePreviewUrl = URL.createObjectURL(file);
      attachmentInfo.innerHTML = '';
      var chip = el('div', { class: 'husky-attachment-chip' });
      chip.appendChild(el('span', {}, '📷 ' + file.name + ' · ' + formatFileSize(file.size)));
      var remove = el('button', { type: 'button', class: 'husky-remove-attachment', title: 'Quitar imagen' }, '×');
      remove.addEventListener('click', function () {
        selectedImage = null;
        fileInput.value = '';
        attachmentInfo.innerHTML = '';
        if (selectedImagePreviewUrl) URL.revokeObjectURL(selectedImagePreviewUrl);
        selectedImagePreviewUrl = null;
      });
      chip.appendChild(remove);
      attachmentInfo.appendChild(chip);
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var text = input.value.trim();
      if (!text && !selectedImage) return;

      var displayText = text || 'Imagen adjunta';
      addMessage(messages, displayText, 'user');

      if (selectedImage && selectedImagePreviewUrl) {
        var preview = el('img', { class: 'husky-image-preview', src: selectedImagePreviewUrl, alt: 'Imagen adjunta' });
        var previewWrap = el('div', { class: 'husky-preview-wrap' });
        previewWrap.appendChild(preview);
        messages.appendChild(previewWrap);
        messages.scrollTop = messages.scrollHeight;
      }

      input.value = '';
      send.disabled = true;

      var thinkingText = selectedImage
        ? 'Recibí la imagen adjunta. En este paso ya puedo mostrarla, pero todavía falta conectar el análisis automático de imágenes en el backend.'
        : 'Estoy revisando la consulta...';
      var thinking = addMessage(messages, thinkingText, 'bot');

      if (selectedImage) {
        selectedImage = null;
        fileInput.value = '';
        attachmentInfo.innerHTML = '';
        send.disabled = false;
        input.focus();
        return;
      }

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
