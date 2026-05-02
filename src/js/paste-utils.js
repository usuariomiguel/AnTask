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
