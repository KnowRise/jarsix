/* Tema admin Decap CMS — toggle light/dark untuk mytheme.
   Memakai localStorage key 'theme' yang sama dengan theme toggle di blog,
   sehingga preferensi tampilan blog dan admin tetap sinkron.
   Dimuat dari /admin/index.html setelah decap-cms.js. */
(function () {
  var KEY = 'theme';
  var root = document.documentElement;
  var toggle = null;

  function getTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  /* Preview pane Decap adalah <iframe> dokumen terpisah; samakan data-theme-nya
     supaya preview ikut light/dark seperti blog. */
  function syncPreviewFrames() {
    var frames = document.querySelectorAll('iframe');
    for (var i = 0; i < frames.length; i++) {
      try {
        var doc = frames[i].contentDocument;
        if (doc && doc.documentElement) {
          doc.documentElement.setAttribute('data-theme', getTheme());
        }
      } catch (err) {
        /* iframe cross-origin (mis. identity widget) — abaikan */
      }
    }
  }

  function apply(theme, persist) {
    root.setAttribute('data-theme', theme);
    if (persist) {
      try {
        localStorage.setItem(KEY, theme);
      } catch (err) {}
    }
    if (toggle) {
      var label = theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap';
      toggle.setAttribute('aria-label', label);
      toggle.setAttribute('title', label);
    }
    syncPreviewFrames();
  }

  function buildToggle() {
    if (toggle || !document.body) return;

    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'cms-theme-toggle';
    toggle.innerHTML =
      '<svg class="cms-theme-toggle-moon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>' +
      '<svg class="cms-theme-toggle-sun" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.36 6.36l-.71-.71M6.34 6.34l-.71-.71m12.73 0l-.71.71M6.34 17.66l-.71.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>';

    toggle.addEventListener('click', function () {
      apply(getTheme() === 'dark' ? 'light' : 'dark', true);
    });

    document.body.appendChild(toggle);
    apply(getTheme(), false);
  }

  /* Decap me-render ulang preview secara asinkron; pantau ringan. */
  var watcher = setInterval(function () {
    buildToggle();
    syncPreviewFrames();
  }, 1000);
  window.addEventListener('pagehide', function () {
    clearInterval(watcher);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildToggle);
  } else {
    buildToggle();
  }
  window.addEventListener('load', buildToggle);
})();
