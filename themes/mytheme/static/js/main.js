/**
 * mytheme - Interactive JavaScript
 * Theme Toggle, Real-time Search & Sort, Image Collage Generator, and Lightbox
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. Theme Toggle (Dark / Light Mode)
  // =========================================================================
  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', initialTheme);

    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('theme', nextTheme);
      });
    }
  };

  // =========================================================================
  // 2. Homepage Search, Sort, and Tag Filtering
  // =========================================================================
  const initSearchAndSort = () => {
    const grid = document.getElementById('posts-grid');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.post-card'));
    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');
    const sortSelect = document.getElementById('sort-select');
    const tagPills = document.querySelectorAll('.tag-pill');
    const resultCountEl = document.getElementById('filter-result-count');
    const emptyState = document.getElementById('empty-state');
    const resetFilterBtn = document.getElementById('reset-filter-btn');

    let currentQuery = '';
    let currentTag = 'all';
    let currentSort = 'date-desc';

    const applyFiltersAndSort = () => {
      let visibleCards = cards.filter((card) => {
        const title = (card.dataset.title || '').toLowerCase();
        const excerpt = (card.dataset.excerpt || '').toLowerCase();
        const tags = (card.dataset.tags || '').toLowerCase().split(',');

        // Search Query filter
        const matchesQuery =
          !currentQuery ||
          title.includes(currentQuery) ||
          excerpt.includes(currentQuery) ||
          tags.some((t) => t.trim().includes(currentQuery));

        // Tag filter
        const matchesTag =
          currentTag === 'all' ||
          tags.map((t) => t.trim()).includes(currentTag.toLowerCase());

        return matchesQuery && matchesTag;
      });

      // Sort visible cards
      visibleCards.sort((a, b) => {
        if (currentSort === 'date-desc') {
          return new Date(b.dataset.date) - new Date(a.dataset.date);
        } else if (currentSort === 'date-asc') {
          return new Date(a.dataset.date) - new Date(b.dataset.date);
        } else if (currentSort === 'title-asc') {
          return (a.dataset.title || '').localeCompare(b.dataset.title || '');
        } else if (currentSort === 'title-desc') {
          return (b.dataset.title || '').localeCompare(a.dataset.title || '');
        }
        return 0;
      });

      // Update DOM visibility & order
      cards.forEach((card) => {
        card.style.display = 'none';
      });

      visibleCards.forEach((card) => {
        card.style.display = 'flex';
        grid.appendChild(card);
      });

      // Update counters & empty state
      if (resultCountEl) {
        resultCountEl.textContent = `Menampilkan ${visibleCards.length} dari ${cards.length} artikel`;
      }

      if (emptyState) {
        if (visibleCards.length === 0) {
          emptyState.classList.add('visible');
        } else {
          emptyState.classList.remove('visible');
        }
      }
    };

    // Search events
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentQuery = e.target.value.trim().toLowerCase();
        applyFiltersAndSort();
      });
    }

    if (searchClearBtn && searchInput) {
      searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentQuery = '';
        searchInput.focus();
        applyFiltersAndSort();
      });
    }

    // Sort select event
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        applyFiltersAndSort();
      });
    }

    // Tag pills events
    tagPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        tagPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        currentTag = pill.dataset.tag || 'all';
        applyFiltersAndSort();
      });
    });

    // Reset filter button
    if (resetFilterBtn) {
      resetFilterBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        currentQuery = '';
        currentTag = 'all';
        tagPills.forEach((p) => {
          if (p.dataset.tag === 'all') p.classList.add('active');
          else p.classList.remove('active');
        });
        if (sortSelect) {
          sortSelect.value = 'date-desc';
          currentSort = 'date-desc';
        }
        applyFiltersAndSort();
      });
    }

    // Initial run
    applyFiltersAndSort();
  };

  // =========================================================================
  // 2b. Tag Filter Pills - Show More / Show Less Toggle
  // =========================================================================
  const initTagsToggle = () => {
    const bar = document.getElementById('tags-filter-bar');
    const toggleBtn = document.getElementById('tags-toggle-btn');
    if (!bar || !toggleBtn) return;

    const wrap = bar.closest('.tags-filter-wrap');
    const labelEl = toggleBtn.querySelector('.tags-toggle-label');
    const LABEL_MORE = 'Tampilkan lebih banyak';
    const LABEL_LESS = 'Tampilkan lebih sedikit';

    const measureRowHeight = () => {
      const firstPill = bar.querySelector('.tag-pill');
      if (!firstPill) return;
      bar.style.setProperty('--tags-row-h', `${firstPill.offsetHeight}px`);
    };

    const getCollapsedHeight = () => {
      const rowH = parseFloat(bar.style.getPropertyValue('--tags-row-h')) || 32;
      const rootFs = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      // Mirror of CSS: calc(2 * var(--tags-row-h) + 0.75rem)
      return 2 * rowH + 0.75 * rootFs;
    };

    const updateState = () => {
      const collapsed = bar.classList.contains('is-collapsed');

      if (collapsed) {
        // Compare against content height (scrollHeight), NOT clientHeight:
        // clientHeight is mid-animation right after collapsing, which used to
        // hide the toggle permanently.
        const overflowing = bar.scrollHeight > getCollapsedHeight() + 2;
        if (wrap) wrap.classList.toggle('has-overflow', overflowing);
        toggleBtn.hidden = !overflowing;
      } else {
        toggleBtn.hidden = false;
      }
    };

    toggleBtn.addEventListener('click', () => {
      const expanding = bar.classList.contains('is-collapsed');
      bar.classList.toggle('is-expanded', expanding);
      bar.classList.toggle('is-collapsed', !expanding);
      toggleBtn.setAttribute('aria-expanded', String(expanding));
      if (labelEl) labelEl.textContent = expanding ? LABEL_LESS : LABEL_MORE;
      updateState();
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        measureRowHeight();
        updateState();
      }, 150);
    });

    measureRowHeight();
    updateState();

    // Re-check once webfonts finish loading (pill height can change)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        measureRowHeight();
        updateState();
      });
    }
  };

  // =========================================================================
  // 3. Consecutive Image Collage Generator
  // =========================================================================
  const initImageCollages = () => {
    const postContent = document.querySelector('.post-content');
    if (!postContent) return;

    const isImageOnlyParagraph = (el) => {
      if (!el || el.nodeName !== 'P') return false;
      const images = el.querySelectorAll('img');
      if (images.length === 0) return false;
      const text = el.textContent.trim();
      return text.length === 0;
    };

    const children = Array.from(postContent.children);
    let i = 0;

    while (i < children.length) {
      const child = children[i];

      // Check Case A: Single <p> that has multiple <img> tags
      if (child.nodeName === 'P' && child.querySelectorAll('img').length > 1) {
        const imgs = Array.from(child.querySelectorAll('img'));
        const collage = createCollageElement(imgs);
        child.replaceWith(collage);
        i++;
        continue;
      }

      // Check Case B: Consecutive <p> tags that each contain only <img>
      if (isImageOnlyParagraph(child)) {
        const group = [child];
        let next = children[i + 1];

        while (next && isImageOnlyParagraph(next)) {
          group.push(next);
          i++;
          next = children[i + 1];
        }

        if (group.length > 1) {
          const allImgs = [];
          group.forEach((p) => {
            p.querySelectorAll('img').forEach((img) => allImgs.push(img));
          });

          const collage = createCollageElement(allImgs);
          group[0].replaceWith(collage);
          for (let g = 1; g < group.length; g++) {
            group[g].remove();
          }
        } else {
          const img = child.querySelector('img');
          if (img) {
            wrapSingleImage(img);
          }
        }
      }

      i++;
    }
  };

  const createCollageElement = (images) => {
    const count = images.length;
    const collage = document.createElement('div');
    const countClass = count > 5 ? 'count-5' : `count-${count}`;
    collage.className = `image-collage ${countClass}`;

    images.forEach((img, idx) => {
      const item = document.createElement('div');
      item.className = 'collage-item';
      item.setAttribute('data-index', idx);
      item.setAttribute('data-src', img.getAttribute('src'));
      item.setAttribute('data-alt', img.getAttribute('alt') || `Foto ${idx + 1}`);

      const newImg = document.createElement('img');
      newImg.src = img.src;
      newImg.alt = img.alt || '';
      newImg.loading = 'lazy';

      const hint = document.createElement('div');
      hint.className = 'item-hover-hint';
      hint.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
      `;

      item.appendChild(newImg);
      item.appendChild(hint);

      item.addEventListener('click', () => {
        const collageItems = Array.from(collage.querySelectorAll('.collage-item')).map((ci) => ({
          src: ci.getAttribute('data-src'),
          alt: ci.getAttribute('data-alt')
        }));
        openLightbox(collageItems, idx);
      });

      collage.appendChild(item);
    });

    return collage;
  };

  const wrapSingleImage = (img) => {
    const parent = img.parentElement;
    if (parent && parent.classList.contains('single-content-img-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'single-content-img-wrapper';

    img.replaceWith(wrapper);
    wrapper.appendChild(img);

    wrapper.addEventListener('click', () => {
      openLightbox([{ src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' }], 0);
    });
  };

  // =========================================================================
  // 4. Interactive Lightbox Modal
  // =========================================================================
  let currentGallery = [];
  let currentIndex = 0;

  const getLightboxModal = () => {
    let modal = document.getElementById('lightbox-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'lightbox-modal';
      modal.className = 'lightbox-modal';
      modal.innerHTML = `
        <div class="lightbox-topbar">
          <div class="lightbox-counter" id="lightbox-counter">1 / 1</div>
          <div class="lightbox-actions">
            <a href="#" target="_blank" rel="noopener noreferrer" class="lightbox-btn lightbox-btn-link" id="lightbox-external-btn" title="Buka gambar asli di tab baru (_blank)">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Buka Gambar Asli</span>
            </a>
            <button class="lightbox-btn" id="lightbox-close-btn" aria-label="Tutup preview">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div class="lightbox-stage" id="lightbox-stage">
          <button class="lightbox-nav-btn lightbox-prev" id="lightbox-prev-btn" aria-label="Gambar Sebelumnya">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <img src="" alt="" class="lightbox-img" id="lightbox-main-img" />
          <button class="lightbox-nav-btn lightbox-next" id="lightbox-next-btn" aria-label="Gambar Selanjutnya">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div class="lightbox-caption" id="lightbox-caption"></div>
      `;
      document.body.appendChild(modal);

      document.getElementById('lightbox-close-btn').addEventListener('click', closeLightbox);
      document.getElementById('lightbox-prev-btn').addEventListener('click', prevImage);
      document.getElementById('lightbox-next-btn').addEventListener('click', nextImage);

      document.getElementById('lightbox-stage').addEventListener('click', (e) => {
        if (e.target.id === 'lightbox-stage') {
          closeLightbox();
        }
      });

      window.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'ArrowRight') nextImage();
      });
    }
    return modal;
  };

  const openLightbox = (gallery, index) => {
    currentGallery = gallery;
    currentIndex = index;

    const modal = getLightboxModal();
    updateLightboxUI();

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    const modal = document.getElementById('lightbox-modal');
    if (modal) {
      modal.classList.remove('active');
    }
    document.body.style.overflow = '';
  };

  const prevImage = () => {
    if (currentGallery.length <= 1) return;
    currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
    updateLightboxUI();
  };

  const nextImage = () => {
    if (currentGallery.length <= 1) return;
    currentIndex = (currentIndex + 1) % currentGallery.length;
    updateLightboxUI();
  };

  const updateLightboxUI = () => {
    if (!currentGallery || currentGallery.length === 0) return;
    const current = currentGallery[currentIndex];

    const mainImg = document.getElementById('lightbox-main-img');
    const counterEl = document.getElementById('lightbox-counter');
    const captionEl = document.getElementById('lightbox-caption');
    const externalBtn = document.getElementById('lightbox-external-btn');
    const prevBtn = document.getElementById('lightbox-prev-btn');
    const nextBtn = document.getElementById('lightbox-next-btn');

    if (mainImg) {
      mainImg.src = current.src;
      mainImg.alt = current.alt || '';
    }

    if (counterEl) {
      counterEl.textContent = `Gambar ${currentIndex + 1} dari ${currentGallery.length}`;
    }

    if (captionEl) {
      captionEl.textContent = current.alt || '';
    }

    if (externalBtn) {
      externalBtn.href = current.src;
    }

    if (prevBtn && nextBtn) {
      const showNav = currentGallery.length > 1;
      prevBtn.style.display = showNav ? 'flex' : 'none';
      nextBtn.style.display = showNav ? 'flex' : 'none';
    }
  };

  // =========================================================================
  // Initialize
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSearchAndSort();
    initTagsToggle();
    initImageCollages();
  });
})();
