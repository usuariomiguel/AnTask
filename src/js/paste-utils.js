// Paste options handler — intercepts HTML pastes and lets the user choose
// between keeping sanitized formatting or stripping to plain text.
(function () {
  var _pendingHtml  = null;
  var _pendingPlain = null;
  var _pendingRange = null;
  var _activeEditor = null;
  var _onSave       = null;
  var _autoTimer    = null;
  var TIMEOUT_MS    = 8000;

  // Remove colour/font inline styles but keep bold, italic, underline, strikethrough.
  function sanitizeHtml(html) {
    var doc  = new DOMParser().parseFromString(html, "text/html");
    var els  = doc.body.querySelectorAll("*");
    var DROP = ["color","background-color","background","font-size","font-family","font-weight","text-align"];
    els.forEach(function (el) {
      if (!el.style) return;
      DROP.forEach(function (p) { el.style.removeProperty(p); });
      if (el.style.cssText.trim() === "") el.removeAttribute("style");
    });
    // Remove tags that carry no useful formatting
    ["span","p","div"].forEach(function (tag) {
      doc.body.querySelectorAll(tag).forEach(function (el) {
        if (!el.hasAttributes()) {
          var frag = document.createDocumentFragment();
          while (el.firstChild) frag.appendChild(el.firstChild);
          el.replaceWith(frag);
        }
      });
    });
    return doc.body.innerHTML;
  }

  function getToast() { return document.getElementById("paste-toast"); }

  function showToast(editor, htmlContent, plainContent, savedRange, saveCallback) {
    _pendingHtml  = htmlContent;
    _pendingPlain = plainContent;
    _pendingRange = savedRange;
    _activeEditor = editor;
    _onSave       = saveCallback;

    var toast = getToast();
    if (!toast) return;
    toast.classList.add("paste-toast-visible");

    // Auto-apply "con formato" after timeout
    if (_autoTimer) clearTimeout(_autoTimer);
    _autoTimer = setTimeout(function () { applyPaste(true); }, TIMEOUT_MS);

    // Restart progress bar animation
    var bar = toast.querySelector(".paste-toast-bar");
    if (bar) {
      bar.style.animation = "none";
      void bar.offsetHeight; // reflow
      bar.style.animation = "paste-bar-shrink " + (TIMEOUT_MS / 1000) + "s linear forwards";
    }
  }

  function hideToast() {
    var toast = getToast();
    if (toast) toast.classList.remove("paste-toast-visible");
    if (_autoTimer) { clearTimeout(_autoTimer); _autoTimer = null; }
    _pendingHtml = _pendingPlain = _pendingRange = null;
  }

  function applyPaste(withFormat) {
    if (!_activeEditor) { hideToast(); return; }
    _activeEditor.focus();

    var sel = window.getSelection();
    if (_pendingRange && sel) {
      sel.removeAllRanges();
      sel.addRange(_pendingRange);
    }

    if (withFormat && _pendingHtml) {
      document.execCommand("insertHTML", false, sanitizeHtml(_pendingHtml));
    } else {
      document.execCommand("insertText", false, _pendingPlain || "");
    }

    if (_onSave) _onSave();
    hideToast();
  }

  // Public API
  window.setupPasteHandler = function (editorEl, saveCallback) {
    editorEl.addEventListener("paste", function (e) {
      var cd   = e.clipboardData || window.clipboardData;
      var html  = cd.getData("text/html");
      var plain = cd.getData("text/plain");

      // Only intercept when there is actual HTML markup
      if (!html || html.trim() === "") return;

      e.preventDefault();

      var savedRange = null;
      var sel = window.getSelection();
      if (sel && sel.rangeCount > 0) savedRange = sel.getRangeAt(0).cloneRange();

      showToast(editorEl, html, plain, savedRange, saveCallback);
    });
  };

  document.addEventListener("DOMContentLoaded", function () {
    var btnPlain  = document.getElementById("paste-btn-plain");
    var btnFormat = document.getElementById("paste-btn-format");
    if (btnPlain)  btnPlain.addEventListener("click",  function () { applyPaste(false); });
    if (btnFormat) btnFormat.addEventListener("click", function () { applyPaste(true); });
  });
})();

// ── Image resizer ────────────────────────────────────────────────────────────
(function () {
  var overlay    = null;
  var activeImg  = null;
  var activeEl   = null;  // the editor element that owns activeImg
  var dragStartX = 0;
  var dragStartW = 0;
  var dragging   = false;

  function px(n) { return n + "px"; }

  function clientX(e) {
    return (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
  }

  function buildOverlay() {
    var o = document.createElement("div");
    o.id        = "img-resize-overlay";
    o.className = "img-resize-overlay";
    o.innerHTML =
      '<span class="img-rh img-rh-nw"></span>' +
      '<span class="img-rh img-rh-ne"></span>' +
      '<span class="img-rh img-rh-sw"></span>' +
      '<span class="img-rh img-rh-se" title="Arrastrar para redimensionar"></span>';
    document.body.appendChild(o);

    var se = o.querySelector(".img-rh-se");
    se.addEventListener("mousedown",  onDragStart);
    se.addEventListener("touchstart", onDragStart, { passive: false });
    return o;
  }

  function reposition() {
    if (!activeImg || !overlay) return;
    var r = activeImg.getBoundingClientRect();
    overlay.style.left   = px(r.left   + window.scrollX);
    overlay.style.top    = px(r.top    + window.scrollY);
    overlay.style.width  = px(r.width);
    overlay.style.height = px(r.height);
  }

  function showFor(img) {
    if (!overlay) overlay = buildOverlay();
    activeImg = img;
    reposition();
    overlay.classList.add("img-resize-visible");
  }

  function hide() {
    if (overlay) overlay.classList.remove("img-resize-visible");
    activeImg = null;
    activeEl  = null;
  }

  function onDragStart(e) {
    e.preventDefault();
    e.stopPropagation();
    dragging   = true;
    dragStartX = clientX(e);
    dragStartW = activeImg ? activeImg.getBoundingClientRect().width : 0;
  }

  function onMove(e) {
    if (!dragging || !activeImg) return;
    var newW = Math.max(40, dragStartW + (clientX(e) - dragStartX));
    activeImg.style.width  = px(newW);
    activeImg.style.height = "auto";
    reposition();
  }

  function onUp() {
    if (!dragging) return;
    dragging = false;
    if (activeEl) activeEl.dispatchEvent(new Event("input"));
  }

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup",   onUp);
  document.addEventListener("touchmove", onMove, { passive: true });
  document.addEventListener("touchend",  onUp);

  // Reposition while editor or window scrolls
  window.addEventListener("scroll",  reposition, true);
  window.addEventListener("resize",  reposition);

  document.addEventListener("click", function (e) {
    if (!activeImg) return;
    if (e.target === activeImg) return;
    if (overlay && overlay.contains(e.target)) return;
    hide();
  });

  window.setupImageResizer = function (editorEl) {
    editorEl.addEventListener("click", function (e) {
      if (e.target.tagName !== "IMG" || !editorEl.contains(e.target)) return;
      e.stopPropagation();
      activeEl = editorEl;
      showFor(e.target);
    });
  };
})();
