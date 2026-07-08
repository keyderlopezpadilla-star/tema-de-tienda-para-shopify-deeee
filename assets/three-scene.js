/* ==========================================================================
   DEEE TODO — Lightweight Three.js hero scene
   Floating geometry + particle field + mouse-follow parallax + soft lights.
   Guards: DPR cap, reduced-motion, visibility pause, WebGL fallback.
   Requires window.THREE (loaded from CDN). Activates on [data-three-scene].
   ========================================================================== */
(function () {
  'use strict';

  const { qsa, reduceMotion } = window.DEEE.utils;
  const canvases = qsa('[data-three-scene]');
  if (!canvases.length || !window.THREE || document.documentElement.dataset.motion === 'off') return;

  // Bail on very small / low-power devices unless explicitly forced.
  const lowPower = window.matchMedia('(max-width: 749px)').matches;

  canvases.forEach((canvas) => {
    if (lowPower && canvas.dataset.mobile !== 'true') return;
    try {
      initScene(canvas);
    } catch (e) {
      canvas.style.display = 'none';
    }
  });

  function initScene(canvas) {
    const THREE = window.THREE;
    const parent = canvas.parentElement;
    const palette = {
      brand: new THREE.Color(canvas.dataset.colorBrand || '#fb2c36'),
      cyan: new THREE.Color(canvas.dataset.colorCyan || '#00f0ff'),
      purple: new THREE.Color(canvas.dataset.colorPurple || '#b300ff')
    };
    const shape = canvas.dataset.shape || 'icosahedron';

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 6;

    /* Lights */
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(palette.cyan, 2.2);
    key.position.set(4, 5, 5);
    scene.add(key);
    const rim = new THREE.PointLight(palette.brand, 3.5, 30);
    rim.position.set(-5, -2, 3);
    scene.add(rim);
    const fill = new THREE.PointLight(palette.purple, 2.5, 30);
    fill.position.set(3, -4, -2);
    scene.add(fill);

    /* Central floating object */
    const geometryMap = {
      icosahedron: () => new THREE.IcosahedronGeometry(1.6, 1),
      torus: () => new THREE.TorusKnotGeometry(1.1, 0.36, 160, 24),
      box: () => new THREE.BoxGeometry(2, 2, 2, 2, 2, 2),
      sphere: () => new THREE.SphereGeometry(1.7, 48, 48)
    };
    const geometry = (geometryMap[shape] || geometryMap.icosahedron)();
    const material = new THREE.MeshStandardMaterial({
      color: 0x11141b,
      metalness: 0.9,
      roughness: 0.15,
      flatShading: shape === 'icosahedron'
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: palette.cyan, transparent: true, opacity: 0.25 })
    );
    mesh.add(wire);

    /* Particle field */
    const COUNT = lowPower ? 260 : 620;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 18;
      positions[i + 1] = (Math.random() - 0.5) * 18;
      positions[i + 2] = (Math.random() - 0.5) * 12;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.03,
        transparent: true,
        opacity: 0.6,
        depthWrite: false
      })
    );
    scene.add(particles);

    /* Resize */
    function resize() {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    /* Pointer parallax */
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      pointer.tx = nx;
      pointer.ty = ny;
    };
    if (!('ontouchstart' in window)) window.addEventListener('pointermove', onMove, { passive: true });

    /* Render loop with visibility guard */
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.01 });
    io.observe(canvas);

    const clock = new THREE.Clock();
    let raf;
    const still = reduceMotion;

    function frame() {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      const t = clock.getElapsedTime();

      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;

      if (!still) {
        mesh.rotation.x = t * 0.15 + pointer.y * 0.4;
        mesh.rotation.y = t * 0.22 + pointer.x * 0.6;
        mesh.position.y = Math.sin(t * 0.8) * 0.15;
        particles.rotation.y = t * 0.02;
        camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.04;
        camera.position.y += (-pointer.y * 0.4 - camera.position.y) * 0.04;
        camera.lookAt(scene.position);
      }
      renderer.render(scene, camera);
    }
    frame();

    /* Cleanup on Shopify section unload (theme editor) */
    document.addEventListener('shopify:section:unload', (e) => {
      if (e.target.contains(canvas)) {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener('pointermove', onMove);
        geometry.dispose();
        material.dispose();
        pGeo.dispose();
        renderer.dispose();
      }
    });
  }
})();
