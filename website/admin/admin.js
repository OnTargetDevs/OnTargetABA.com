/* =========================================================
   On Target ABA — Admin shared JS
   Auth gate, API client, toasts, slugify, dirty-form guard,
   PR-submitted modal. Loaded by every page under /admin/.
   ========================================================= */
(function () {
  'use strict';

  // ---------------------------------------------------------
  // Auth gate
  // ---------------------------------------------------------
  async function requireAuth(opts) {
    opts = opts || {};
    const allowAnonymous = !!opts.allowAnonymous;
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        document.documentElement.dataset.authed = '1';
        const slot = document.querySelector('[data-user-email]');
        if (slot && data && data.email) slot.textContent = data.email;
        return data;
      }
      if (res.status === 401) {
        if (allowAnonymous) return null;
        const here = location.pathname.replace(/\/$/, '');
        const onIndex = here === '/admin' || here === '/admin/index.html';
        if (!onIndex) {
          location.href = '/admin/';
          return null;
        }
        return null;
      }
      throw new Error('auth check failed: ' + res.status);
    } catch (err) {
      if (allowAnonymous) return null;
      console.error('[admin] auth check failed', err);
      return null;
    }
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (_) { /* ignore */ }
    location.href = '/admin/';
  }

  // ---------------------------------------------------------
  // API client (returns parsed JSON, throws on non-OK)
  // ---------------------------------------------------------
  async function request(method, path, body) {
    const opts = {
      method: method,
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' }
    };
    if (body !== undefined && body !== null) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(path, opts);
    if (res.status === 204) return null;
    let data = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try { data = await res.json(); } catch (_) { data = null; }
    } else {
      try { data = await res.text(); } catch (_) { data = null; }
    }
    if (!res.ok) {
      const err = new Error((data && data.error) || ('Request failed: ' + res.status));
      err.status = res.status;
      err.body = data;
      throw err;
    }
    return data;
  }

  const api = {
    get:  function (path)         { return request('GET',    path); },
    post: function (path, body)   { return request('POST',   path, body); },
    put:  function (path, body)   { return request('PUT',    path, body); },
    del:  function (path, body)   { return request('DELETE', path, body); }
  };

  // ---------------------------------------------------------
  // Slugify
  // ---------------------------------------------------------
  function slugify(s) {
    return (s || '')
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/['"`]+/g, '')
      .replace(/&[a-z]+;/g, ' ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  // ---------------------------------------------------------
  // Toast notifications
  // ---------------------------------------------------------
  function ensureToastStack() {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('role', 'region');
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    return stack;
  }

  function toast(message, kind, opts) {
    kind = kind || 'info';
    opts = opts || {};
    const stack = ensureToastStack();
    const node = document.createElement('div');
    node.className = 'toast toast--' + kind;
    const text = document.createElement('div');
    text.textContent = message;
    node.appendChild(text);
    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Dismiss');
    close.innerHTML = '&times;';
    close.addEventListener('click', function () { dismiss(); });
    node.appendChild(close);
    stack.appendChild(node);
    const ttl = opts.ttl != null ? opts.ttl : (kind === 'error' ? 6000 : 3500);
    const timer = setTimeout(dismiss, ttl);
    function dismiss() {
      clearTimeout(timer);
      if (!node.parentNode) return;
      node.style.transition = 'opacity 160ms ease, transform 160ms ease';
      node.style.opacity = '0';
      node.style.transform = 'translateY(6px)';
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 200);
    }
    return dismiss;
  }

  // ---------------------------------------------------------
  // Dirty-form guard
  // ---------------------------------------------------------
  function dirtyGuard() {
    let dirty = false;
    function handler(e) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
    window.addEventListener('beforeunload', handler);
    return {
      set: function (v) { dirty = !!v; },
      get: function () { return dirty; },
      dispose: function () { window.removeEventListener('beforeunload', handler); }
    };
  }

  // ---------------------------------------------------------
  // PR-submitted modal
  // ---------------------------------------------------------
  function showPrSubmittedModal(pr, opts) {
    pr = pr || {};
    opts = opts || {};
    closeAnyModal();

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.dataset.adminModal = '1';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const number = pr.number != null ? ('#' + pr.number) : '';
    const branch = pr.branch || '';
    const url = pr.url || '#';
    const title = opts.title || ('Pull request ' + number + ' submitted');
    const description = opts.description ||
      'Your changes are waiting for your review on GitHub. The page goes live the moment you merge the PR.';

    modal.innerHTML =
      '<div class="modal__head">' +
        '<div class="modal__icon" aria-hidden="true">' +
          '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="6" cy="6" r="2.2"></circle>' +
            '<circle cx="6" cy="18" r="2.2"></circle>' +
            '<circle cx="18" cy="18" r="2.2"></circle>' +
            '<path d="M6 8v8"></path>' +
            '<path d="M18 9a3 3 0 0 1-3 3H9"></path>' +
            '<path d="M15 12v3"></path>' +
          '</svg>' +
        '</div>' +
        '<h2></h2>' +
        '<p></p>' +
      '</div>' +
      '<div class="modal__body">' +
        (branch ? '<div class="modal__branch"></div>' : '') +
      '</div>' +
      '<div class="modal__foot">' +
        '<a class="btn btn-primary btn-lg" target="_blank" rel="noopener">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M9 19c-5 1.5-5-2.5-7-3"></path>' +
            '<path d="M15 22v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7a5.44 5.44 0 0 0-1.5-3.75 5.07 5.07 0 0 0-.09-3.77S17.68 1 15 2.5a13 13 0 0 0-7 0C5.33 1 4.09 1 4.09 1a5.07 5.07 0 0 0-.09 3.77 5.44 5.44 0 0 0-1.5 3.75c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 8 18.13V22"></path>' +
          '</svg>' +
          '<span>View on GitHub</span>' +
        '</a>' +
        '<button class="btn btn-ghost" type="button" data-modal-secondary>' +
          (opts.secondaryLabel || 'Back to dashboard') +
        '</button>' +
      '</div>';

    modal.querySelector('h2').textContent = title;
    modal.querySelector('p').textContent = description;
    if (branch) modal.querySelector('.modal__branch').textContent = 'branch: ' + branch;
    const viewBtn = modal.querySelector('a.btn-primary');
    viewBtn.href = url;
    if (opts.primaryLabel) viewBtn.querySelector('span').textContent = opts.primaryLabel;

    const secondary = modal.querySelector('[data-modal-secondary]');
    secondary.addEventListener('click', function () {
      if (typeof opts.onSecondary === 'function') {
        opts.onSecondary();
      } else {
        location.href = opts.secondaryHref || '/admin/';
      }
    });

    backdrop.appendChild(modal);
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop && opts.dismissOnBackdrop !== false) {
        backdrop.remove();
        if (typeof opts.onDismiss === 'function') opts.onDismiss();
      }
    });
    document.addEventListener('keydown', escClose);
    function escClose(e) {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', escClose);
        if (backdrop.parentNode) backdrop.remove();
      }
    }
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function closeAnyModal() {
    document.querySelectorAll('[data-admin-modal="1"]').forEach(function (n) { n.remove(); });
  }

  // ---------------------------------------------------------
  // Saving indicator helper
  // ---------------------------------------------------------
  function saving(node, label) {
    if (!node) return function () {};
    const old = node.innerHTML;
    node.classList.add('saving-dot');
    node.classList.remove('saving-dot--idle');
    node.textContent = label || 'Saving…';
    return function done(idleLabel) {
      node.innerHTML = old;
      if (idleLabel) {
        node.classList.add('saving-dot', 'saving-dot--idle');
        node.textContent = idleLabel;
      } else {
        node.classList.remove('saving-dot', 'saving-dot--idle');
      }
    };
  }

  // ---------------------------------------------------------
  // Top bar wiring (logout button, current-page hint)
  // ---------------------------------------------------------
  function wireTopbar() {
    const logoutBtn = document.querySelector('[data-action="logout"]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        logout();
      });
    }
    // Mark current nav link
    const path = location.pathname.replace(/\/$/, '');
    document.querySelectorAll('.admin-topbar__nav a').forEach(function (a) {
      const href = (a.getAttribute('href') || '').replace(/\/$/, '');
      if (href && (path === href || path.indexOf(href) === 0 && href !== '/admin')) {
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', wireTopbar);

  // ---------------------------------------------------------
  // Local-storage helpers (drafts auto-save)
  // ---------------------------------------------------------
  const drafts = {
    load: function (key) {
      try {
        const raw = localStorage.getItem('admin:draft:' + key);
        return raw ? JSON.parse(raw) : null;
      } catch (_) { return null; }
    },
    save: function (key, value) {
      try { localStorage.setItem('admin:draft:' + key, JSON.stringify(value)); } catch (_) {}
    },
    clear: function (key) {
      try { localStorage.removeItem('admin:draft:' + key); } catch (_) {}
    }
  };

  function debounce(fn, ms) {
    let t = null;
    return function () {
      const ctx = this; const args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  // ---------------------------------------------------------
  // Image optimization (client-side, before upload)
  // ---------------------------------------------------------
  // Strips EXIF, downscales anything bigger than maxDim on the longest
  // edge, and re-encodes as WebP at the given quality. Returns
  // { base64, filename, mimeType, originalSize, optimizedSize, width, height }.
  function optimizeImage(file, opts) {
    opts = opts || {};
    const maxDim = opts.maxDim || 2000;
    const quality = typeof opts.quality === 'number' ? opts.quality : 0.85;
    return new Promise(function (resolve, reject) {
      const fr = new FileReader();
      fr.onerror = function () { reject(new Error('could not read file')); };
      fr.onload = function () {
        const img = new Image();
        img.onerror = function () { reject(new Error('not a valid image')); };
        img.onload = function () {
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          const scale = Math.min(1, maxDim / Math.max(w, h));
          w = Math.round(w * scale);
          h = Math.round(h * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingQuality = 'high';
          // The drawImage->toBlob round-trip discards EXIF metadata.
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(function (blob) {
            if (!blob) { reject(new Error('canvas encode failed (browser may not support WebP)')); return; }
            const br = new FileReader();
            br.onload = function () {
              const dataUrl = String(br.result || '');
              const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '');
              const baseName = (file.name || 'image').replace(/\.[^.]+$/, '');
              resolve({
                base64: base64,
                filename: baseName + '.webp',
                mimeType: 'image/webp',
                originalSize: file.size,
                optimizedSize: blob.size,
                width: w,
                height: h
              });
            };
            br.onerror = function () { reject(new Error('blob read failed')); };
            br.readAsDataURL(blob);
          }, 'image/webp', quality);
        };
        img.src = String(fr.result || '');
      };
      fr.readAsDataURL(file);
    });
  }

  // Modal picker: grid of every uploaded image + an Upload-new tile.
  // Calls onPick({ path, name, size }) when the user picks (or just
  // uploaded) an image.
  function openImagePicker(onPick) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" style="max-width:920px;width:95vw;max-height:88vh;display:flex;flex-direction:column;">' +
        '<div class="modal__head" style="text-align:left;padding:1.1rem 1.25rem .25rem;display:flex;justify-content:space-between;align-items:center;gap:.5rem;">' +
          '<h2 style="margin:0;font-size:1.05rem;">Pick an image</h2>' +
          '<span class="admin-muted" data-count style="font-size:.78rem;"></span>' +
        '</div>' +
        '<div class="modal__body" style="padding:.5rem 1.25rem 0;flex:1;overflow:auto;">' +
          '<div style="display:flex;gap:.75rem;align-items:center;margin-bottom:.85rem;flex-wrap:wrap;">' +
            '<label class="btn btn-primary btn-sm" style="cursor:pointer;">' +
              '<input type="file" accept="image/*" data-upload-input style="display:none;"> Upload new' +
            '</label>' +
            '<span class="admin-muted" style="font-size:.78rem;">Auto-optimized: max 2000px, EXIF stripped, WebP.</span>' +
            '<span class="admin-muted" data-upload-status style="font-size:.78rem;margin-left:auto;"></span>' +
          '</div>' +
          '<div data-grid style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.5rem;"></div>' +
        '</div>' +
        '<div class="modal__foot" style="flex-direction:row;justify-content:flex-end;padding:1rem 1.25rem 1.1rem;">' +
          '<button class="btn btn-ghost" type="button" data-cancel>Close</button>' +
        '</div>' +
      '</div>';
    const grid = backdrop.querySelector('[data-grid]');
    const status = backdrop.querySelector('[data-upload-status]');
    const countSlot = backdrop.querySelector('[data-count]');
    const uploadInput = backdrop.querySelector('[data-upload-input]');
    backdrop.querySelector('[data-cancel]').addEventListener('click', function () { backdrop.remove(); });
    backdrop.addEventListener('click', function (e) { if (e.target === backdrop) backdrop.remove(); });

    function tileFor(img) {
      const t = document.createElement('button');
      t.type = 'button';
      t.style.cssText = 'background:#fff;border:1px solid var(--line);border-radius:10px;padding:.4rem;cursor:pointer;display:flex;flex-direction:column;gap:.35rem;text-align:left;';
      t.innerHTML =
        '<div style="aspect-ratio:4/3;overflow:hidden;border-radius:6px;background:var(--cream);">' +
          '<img loading="lazy" src="' + img.path + '" alt="" style="width:100%;height:100%;object-fit:cover;">' +
        '</div>' +
        '<div style="font-size:.72rem;font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (img.name || '') + '</div>' +
        '<div class="admin-muted" style="font-size:.66rem;">' + (img.month || '') + ' &middot; ' + Math.round((img.size || 0) / 1024) + ' KB</div>';
      t.addEventListener('click', function () { onPick(img); backdrop.remove(); });
      t.addEventListener('mouseenter', function () { t.style.borderColor = 'var(--coral)'; });
      t.addEventListener('mouseleave', function () { t.style.borderColor = 'var(--line)'; });
      return t;
    }

    function render(images) {
      countSlot.textContent = images.length + ' image' + (images.length === 1 ? '' : 's');
      grid.innerHTML = '';
      images.forEach(function (img) { grid.appendChild(tileFor(img)); });
      if (!images.length) {
        grid.innerHTML = '<div class="empty" style="grid-column:1/-1;">No images uploaded yet. Use "Upload new" above.</div>';
      }
    }

    let images = [];
    api.get('/api/images').then(function (data) {
      images = (data && data.images) || [];
      render(images);
    }).catch(function () { render([]); });

    uploadInput.addEventListener('change', async function () {
      const file = uploadInput.files && uploadInput.files[0];
      if (!file) return;
      status.textContent = 'Optimizing ' + file.name + '...';
      try {
        const opt = await optimizeImage(file, { maxDim: 2000, quality: 0.85 });
        const saved = ((opt.originalSize - opt.optimizedSize) / opt.originalSize * 100);
        status.textContent = 'Uploading ' + opt.filename + ' (' + Math.round(opt.optimizedSize / 1024) + ' KB, ' + (saved > 0 ? '-' + saved.toFixed(0) + '%' : 'no shrink') + ')...';
        const res = await api.post('/api/images/upload', {
          filename: opt.filename,
          contentType: opt.mimeType,
          data: opt.base64,
        });
        if (res && res.path) {
          const month = (res.path.match(/\/(\d{4}-\d{2})\//) || [, ''])[1];
          const newEntry = { path: res.path, name: opt.filename, size: opt.optimizedSize, month: month };
          images.unshift(newEntry);
          render(images);
          status.textContent = 'Uploaded.';
          onPick(newEntry);
          backdrop.remove();
        } else {
          status.textContent = 'Upload returned no path.';
        }
      } catch (err) {
        status.textContent = 'Failed: ' + (err.message || err);
        toast(err.message || 'Upload failed', 'error');
      }
      uploadInput.value = '';
    });

    document.body.appendChild(backdrop);
  }

  // ---------------------------------------------------------
  // Export
  // ---------------------------------------------------------
  window.Admin = {
    requireAuth: requireAuth,
    logout: logout,
    api: api,
    slugify: slugify,
    toast: toast,
    showPrSubmittedModal: showPrSubmittedModal,
    closeAnyModal: closeAnyModal,
    dirtyGuard: dirtyGuard,
    saving: saving,
    drafts: drafts,
    debounce: debounce,
    optimizeImage: optimizeImage,
    openImagePicker: openImagePicker
  };
})();
