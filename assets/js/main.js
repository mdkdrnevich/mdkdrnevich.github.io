// Theme toggle
(function () {
  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
})();

// Banner: particles advected along a smooth, slowly evolving flow field.
// A quiet visual nod to normalizing flows. Static for reduced-motion users.
(function () {
  var canvas = document.getElementById('field');
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W, H, particles = [], t = 0, raf = null;

  function color() {
    return getComputedStyle(document.documentElement).getPropertyValue('--field').trim();
  }

  function resize() {
    var r = canvas.parentElement.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(260, (W * H) / 900));
    particles = [];
    for (var i = 0; i < n; i++) particles.push(spawn());
  }

  function spawn() {
    return { x: Math.random() * W, y: Math.random() * H, age: Math.random() * 400, life: 300 + Math.random() * 300 };
  }

  // Divergence-free velocity: u = (dpsi/dy, -dpsi/dx) for a sum-of-sines stream function psi.
  function velocity(x, y) {
    var s = 0.012, a = t * 0.0015;
    var dpsidy = Math.cos(y * s + a) * 1.0 + Math.cos((x + y) * s * 0.7 - a) * 0.6;
    var dpsidx = Math.cos(x * s * 0.8 - a * 1.3) * 0.9 + Math.cos((x + y) * s * 0.7 - a) * 0.6;
    return [dpsidy * 0.9, -dpsidx * 0.9];
  }

  // Each frame fades what's already drawn a little, then adds a short segment per
  // particle, so the trails trace out streamlines of the flow.
  function draw(rgb) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.045)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = 1.1;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var v = velocity(p.x, p.y);
      var x0 = p.x, y0 = p.y;
      p.x += v[0]; p.y += v[1]; p.age++;
      if (p.age > p.life || p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10) {
        particles[i] = spawn(); particles[i].age = 0; continue;
      }
      var fade = Math.sin(Math.PI * p.age / p.life); // fade in and out over a lifetime
      ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.55 * fade).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }

  function frame() {
    t++;
    draw(color());
    raf = requestAnimationFrame(frame);
  }

  // Reduced motion: render one still image of settled trails instead of animating.
  function still() {
    var rgb = color();
    for (var k = 0; k < 160; k++) { t++; draw(rgb); }
  }

  function onResize() { resize(); if (reduce) still(); }

  resize();
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(canvas.parentElement);
  else window.addEventListener('resize', onResize);

  if (reduce) { still(); return; }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
    else if (!raf) { frame(); }
  });
  frame();
})();
