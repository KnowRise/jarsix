/* Preview template Decap CMS untuk collection "posts" — meniru layout single.html
   blog mytheme (breadcrumb, badge tag, judul, meta, cover, isi).

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

    CMS.registerPreviewStyle('/css/style.css');
    CMS.registerPreviewStyle('/admin/preview.css');
  } catch (err) {
    console.error('[admin] Gagal registrasi preview style:', err);
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
    return h('div', { key: key, className: 'meta-item' }, icon(key, iconPath), h('span', {}, label));
  }

  function PostPreview(props) {
    var data = props.entry.get('data');
    var title = data.get('title') || '(judul belum diisi)';
    var cover = data.get('coverImage') || '';
    var body = data.get('body') || '';
    var date = formatDate(data.get('date'));
    var tags = toArray(data.get('tags'))
      .map(tagValue)
      .filter(Boolean);

    var children = [];

    children.push(
      h(
        'nav',
        { key: 'breadcrumbs', className: 'breadcrumbs', 'aria-label': 'Breadcrumb' },
        h('span', {}, 'Beranda'),
        h('span', {}, '/'),
        h('span', {}, 'Artikel'),
        h('span', {}, '/'),
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

    headerChildren.push(
      h(
        'div',
        { key: 'meta', className: 'post-meta-details' },
        date
          ? metaItem(
              'date',
              'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
              date
            )
          : null,
        metaItem(
          'reading',
          'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
          readingTime(body) + ' menit waktu baca'
        )
      )
    );

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
})();
