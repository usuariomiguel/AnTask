(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  var glow = document.querySelector('.cursor-glow');
  if (!glow) return;

  var tx = 0, ty = 0;
  var cx = 0, cy = 0;
  var visible = false;
  var LERP = 0.04;


  document.addEventListener('mousemove', function (e) {
    tx = e.clientX;
    ty = e.clientY;
    if (!visible) {
      cx = tx; cy = ty;
      glow.style.opacity = '1';
      visible = true;
    }
  });

  document.addEventListener('mouseleave', function () {
    glow.style.opacity = '0';
    visible = false;
  });

  document.addEventListener('mouseover', function (e) {
    if (e.target.closest('button, a, [role="button"], input, textarea, [contenteditable], label')) {
      glow.classList.add('cursor-glow--active');
    } else {
      glow.classList.remove('cursor-glow--active');
    }
  });

  document.addEventListener('mousedown', function () {
    var ripple = document.createElement('div');
    ripple.className = 'cursor-ripple';
    ripple.style.left = cx + 'px';
    ripple.style.top  = cy + 'px';
    document.body.appendChild(ripple);
    ripple.addEventListener('animationend', function () { ripple.remove(); });
  });

  (function tick() {
    cx += (tx - cx) * LERP;
    cy += (ty - cy) * LERP;
    glow.style.transform = 'translate(' + cx + 'px, ' + cy + 'px) translate(-50%, -50%)';
    requestAnimationFrame(tick);
  })();
})();

// ── Button ripple ────────────────────────────────────────────
(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  document.addEventListener('mousedown', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;

    var rect = btn.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height) * 2.2;
    var x    = e.clientX - rect.left;
    var y    = e.clientY - rect.top;

    var wave = document.createElement('span');
    wave.className = 'btn-ripple-wave';
    wave.style.cssText =
      'width:'  + size + 'px;' +
      'height:' + size + 'px;' +
      'left:'   + x    + 'px;' +
      'top:'    + y    + 'px;';

    btn.appendChild(wave);
    wave.addEventListener('animationend', function () { wave.remove(); });
  });
})();
