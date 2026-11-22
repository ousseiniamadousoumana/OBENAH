(function () {
  var $ = function (s) { return document.querySelector(s); };
  var root = document.documentElement;

  /* Thème clair / sombre */
  var theme = $('#theme');
  if (theme) theme.addEventListener('click', function () {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
  });

  /* Menu latéral */
  var openBtn = $('#open'), closeBtn = $('#close'), backdrop = $('#backdrop'), drawer = $('#drawer');
  function setMenu(v) {
    document.body.classList.toggle('open', v);
    if (drawer) drawer.setAttribute('aria-hidden', String(!v));
    if (openBtn) openBtn.setAttribute('aria-expanded', String(v));
  }
  if (openBtn) openBtn.addEventListener('click', function () { setMenu(true); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setMenu(false); });
  if (backdrop) backdrop.addEventListener('click', function () { setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* Formulaires -> récapitulatif -> message WhatsApp structuré */
  var cfg = (window.SSEINY_CONFIG && window.SSEINY_CONFIG.whatsapp) || {};

  function labelFor(form, el) {
    if (el.dataset.label) return el.dataset.label;
    var l = el.id && form.querySelector('label[for="' + el.id + '"]');
    return l ? l.textContent.trim() : el.name;
  }

  function buildMessage(form) {
    var title = form.dataset.title || 'Demande';
    var seen = {}, lines = ['*' + title + '*', ''];
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || seen[el.name] || el.type === 'submit' || el.type === 'button') return;
      if ((el.type === 'radio' || el.type === 'checkbox') && !el.checked) return;
      if (el.type === 'radio') {
        var v = form.querySelector('input[name="' + el.name + '"]:checked');
        seen[el.name] = true;
        lines.push(el.dataset.labelGroup + ' : ' + (v ? v.value : '-'));
        return;
      }
      seen[el.name] = true;
      var value = (el.value || '').trim() || '-';
      lines.push(labelFor(form, el) + ' : ' + value);
    });
    lines.push('', 'Statut : demande en attente de confirmation manuelle.');
    lines.push("Envoyé depuis le site SSEINY'S.");
    return lines.join('\n');
  }

  document.querySelectorAll('form.wa-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var number = cfg[form.dataset.service] || cfg['default'];
      var text = buildMessage(form);
      var old = form.parentElement.querySelector('.recap');
      if (old) old.remove();
      var box = document.createElement('div');
      box.className = 'recap';
      box.innerHTML =
        '<p class="recap-title">Vérifiez votre récapitulatif avant l\'envoi</p>' +
        '<pre class="recap-text"></pre>' +
        '<div class="recap-actions">' +
        '<button type="button" class="btn ghost" data-edit>Modifier</button>' +
        '<a class="btn primary" target="_blank" rel="noopener">Envoyer sur WhatsApp ↗</a>' +
        '</div>';
      box.querySelector('.recap-text').textContent = text;
      box.querySelector('a').href = 'https://wa.me/' + number + '?text=' + encodeURIComponent(text);
      box.querySelector('[data-edit]').addEventListener('click', function () {
        box.remove(); form.hidden = false; form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      form.hidden = true;
      form.parentElement.insertBefore(box, form.nextSibling);
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
})();
