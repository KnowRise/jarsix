/* Preview template Decap CMS untuk collection "posts" — meniru layout
   themes/netblog/layouts/_default/single.html (breadcrumbs, badge tag, judul,
   meta tanggal/baca/author, cover, isi). Gaya visual ada di /admin/preview.css.

   Dimuat dari /admin/index.html setelah decap-cms.js. Karena index.html menyetel
   CMS_MANUAL_INIT, di sini kita registrasi dulu lalu panggil CMS.init().
   window.h (React.createElement) dan window.createClass disediakan oleh bundle Decap. */
(function () {
  if (!window.CMS) {
    console.error('[admin] Decap CMS gagal dimuat; preview template tidak terpasang.');
    return;
  }

  var h = window.h;

  try {
    if (!h) throw new Error('window.h (React.createElement) tidak tersedia');
  } catch (err) {
    console.error('[admin] Preview tidak bisa dijalankan:', err);
  }

  /* Lapis pertama: daftarkan style agar Decap ikut menyalinnya ke iframe.
     (Lapis kedua adalah penyuntikan <style> di bagian bawah file, karena cara
     ini tidak selalu ter-apply di iframe srcdoc.) */
  try {
    CMS.registerPreviewStyle('/admin/preview.css');
  } catch (err) {
    console.warn('[admin] registerPreviewStyle gagal, mengandalkan injeksi <style>', err);
  }


  function toArray(value) {
    if (!value) return [];
    if (typeof value.toArray === 'function') return value.toArray();
    return Array.isArray(value) ? value : [];
  }

  function tagValue(item) {
    if (item == null) return '';
    if (typeof item.get === 'function') return item.get('tag') || '';
    if (typeof item === 'object') return item.tag || '';
    return String(item);
  }

  function renderMarkdown(md) {
    var text = md == null ? '' : String(md);
    if (window.marked && typeof window.marked.parse === 'function') {
      try {
        return window.marked.parse(text, { headerIds: false, mangle: false });
      } catch (err) {
        /* jatuh ke fallback di bawah */
      }
    }
    var escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return '<p>' + escaped.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br />') + '</p>';
  }

  function formatDate(value) {
    if (!value) return '';
    var date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    try {
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch (err) {
      return date.toISOString().slice(0, 10);
    }
  }

  function readingTime(md) {
    var words = String(md || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }

  function icon(key, path) {
    return h(
      'svg',
      {
        key: key,
        xmlns: 'http://www.w3.org/2000/svg',
        fill: 'none',
        viewBox: '0 0 24 24',
        stroke: 'currentColor',
      },
      h('path', {
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeWidth: 2,
        d: path,
      })
    );
  }

  function metaItem(key, iconPath, label) {
    return h('span', { key: key, className: 'meta-item' }, icon(key, iconPath), h('span', {}, label));
  }

  function PostPreview(props) {
    var data = props.entry.get('data');
    var title = data.get('title') || '(judul belum diisi)';
    var cover = data.get('coverImage') || '';
    var body = data.get('body') || '';
    var date = formatDate(data.get('date'));
    var author = data.get('author') || (window.SITE_PARAMS && window.SITE_PARAMS.author) || '';
    var tags = toArray(data.get('tags'))
      .map(tagValue)
      .filter(Boolean);

    var children = [];

    children.push(
      h(
        'nav',
        { key: 'breadcrumbs', className: 'breadcrumbs', 'aria-label': 'Breadcrumb' },
        h('span', {}, 'Beranda'),
        h('span', { className: 'sep' }, '/'),
        h('span', {}, 'Tags'),
        h('span', { className: 'sep' }, '/'),
        h('span', { className: 'breadcrumb-current' }, title)
      )
    );

    var headerChildren = [];

    if (tags.length) {
      headerChildren.push(
        h(
          'div',
          { key: 'tags', className: 'post-header-tags' },
          tags.map(function (tag, i) {
            return h('span', { key: i, className: 'badge-tag' }, '#' + tag);
          })
        )
      );
    }

    headerChildren.push(h('h1', { key: 'title', className: 'single-title' }, title));

    var metaChildren = [];
    if (date) {
      metaChildren.push(
        metaItem(
          'date',
          'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
          date
        )
      );
    }
    metaChildren.push(
      metaItem(
        'reading',
        'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        readingTime(body) + ' menit baca'
      )
    );
    if (author) {
      metaChildren.push(
        metaItem(
          'author',
          'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
          author
        )
      );
    }

    headerChildren.push(h('div', { key: 'meta', className: 'post-meta-details' }, metaChildren));

    children.push(h('header', { key: 'header', className: 'post-header' }, headerChildren));

    if (cover) {
      children.push(
        h(
          'figure',
          { key: 'cover', className: 'single-cover-wrapper' },
          h('img', { src: cover, alt: title, className: 'single-cover-img' })
        )
      );
    }

    children.push(
      h('div', {
        key: 'body',
        className: 'post-content',
        dangerouslySetInnerHTML: { __html: renderMarkdown(body) },
      })
    );

    return h('article', { className: 'post-layout' }, children);
  }

  try {
    CMS.registerPreviewTemplate('posts', PostPreview);
  } catch (err) {
    console.error('[admin] Gagal registrasi preview template:', err);
  }

  /* CMS_MANUAL_INIT diset di index.html; init wajib tetap dijalankan apa pun yang terjadi. */
  try {
    CMS.init();
  } catch (err) {
    console.error('[admin] Gagal init Decap CMS:', err);
  }

  /* --------------------------------------------------------------------------
     Injeksi <style> ke iframe preview.
     registerPreviewStyle() tidak selalu membuat gaya ter-apply di iframe srcdoc
     (base URL / timing). Maka CSS di-fetch sebagai teks lalu disuntik langsung
     sebagai <style> ke <head> tiap iframe preview. Idempoten & aman.
     -------------------------------------------------------------------------- */
  function theme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  var previewCssText = null;
  var previewCssPromise = null;

  function loadPreviewCss() {
    if (previewCssPromise) return previewCssPromise;
    previewCssPromise = fetch('/admin/preview.css', { cache: 'no-cache' })
      .then(function (r) { return r.text(); })
      .then(function (text) { previewCssText = text; return text; })
      .catch(function (err) {
        console.error('[admin] Gagal memuat preview.css:', err);
        return '';
      });
    return previewCssPromise;
  }
  loadPreviewCss();

  function injectStyleTag(doc) {
    if (doc.querySelector('style[data-ok-preview]')) return;
    var style = doc.createElement('style');
    style.setAttribute('data-ok-preview', '1');
    style.textContent = previewCssText || '';
    doc.head.appendChild(style);
  }

  function styleIframe(frame) {
    if (!frame) return;
    var doc;
    try {
      doc = frame.contentDocument;
    } catch (err) {
      return; /* cross-origin (identity widget) */
    }
    if (!doc || !doc.head) return;

    if (previewCssText != null) {
      injectStyleTag(doc);
    } else {
      loadPreviewCss().then(function () { injectStyleTag(doc); });
    }

    var want = theme();
    if (doc.documentElement.getAttribute('data-theme') !== want) {
      doc.documentElement.setAttribute('data-theme', want);
    }
  }

  function scanFrames() {
    var frames = document.querySelectorAll('iframe');
    for (var i = 0; i < frames.length; i++) styleIframe(frames[i]);
  }

  /* Decap me-render ulang preview saat mengetik; pantau ringan agar <style>
     selalu ada di iframe terbaru. Idempoten (dilewati bila sudah terpasang). */
  setInterval(scanFrames, 800);
  window.addEventListener('load', scanFrames);
})();
