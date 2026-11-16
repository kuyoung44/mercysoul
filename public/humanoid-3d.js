import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas = document.querySelector("#avatar3d");
const stage = document.querySelector(".avatar-stage");
if (canvas && stage) {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 1.0, 8.8);

    scene.add(new THREE.HemisphereLight(0xffe9d1, 0x171020, 2.1));
    const key = new THREE.DirectionalLight(0xffdfb0, 3.1);
    key.position.set(3, 5, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0xd5a0ff, 34, 12);
    rim.position.set(-4, 2, -2);
    scene.add(rim);
    const goldLight = new THREE.PointLight(0xd9b75c, 24, 10);
    goldLight.position.set(2, -1, 4);
    scene.add(goldLight);

    const avatar = new THREE.Group();
    scene.add(avatar);
    const skin = new THREE.MeshStandardMaterial({ color: 0x986044, roughness: 0.68 });
    const skinLight = new THREE.MeshStandardMaterial({ color: 0xb77a56, roughness: 0.62 });
    const shadowSkin = new THREE.MeshStandardMaterial({ color: 0x6f432f, roughness: 0.8 });
    const cloth = new THREE.MeshStandardMaterial({ color: 0x241b30, roughness: 0.78, metalness: 0.12 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xd9b75c, metalness: 0.72, roughness: 0.28 });
    const hair = new THREE.MeshStandardMaterial({ color: 0x171316, roughness: 0.94 });
    const white = new THREE.MeshStandardMaterial({ color: 0xf0dfc7, roughness: 0.3 });
    const iris = new THREE.MeshStandardMaterial({ color: 0x281b16, roughness: 0.3 });
    const mouthMat = new THREE.MeshStandardMaterial({ color: 0x51252a, roughness: 0.55 });

    const sphere = (parent, material, position, scale, geometry = new THREE.SphereGeometry(1, 32, 24)) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      mesh.scale.set(...scale);
      parent.add(mesh);
      return mesh;
    };
    const capsule = (parent, material, position, radius, length, rotation = [0, 0, 0]) => {
      const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 8, 16), material);
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      parent.add(mesh);
      return mesh;
    };

    const torso = sphere(avatar, cloth, [0, -1.55, 0], [1.18, 1.45, 0.58]);
    sphere(avatar, cloth, [-0.76, -0.9, 0], [0.47, 0.72, 0.5]);
    sphere(avatar, cloth, [0.76, -0.9, 0], [0.47, 0.72, 0.5]);
    capsule(avatar, cloth, [-1.13, -1.55, 0], 0.23, 1.05, [0, 0, -0.14]);
    capsule(avatar, cloth, [1.13, -1.55, 0], 0.23, 1.05, [0, 0, 0.14]);
    sphere(avatar, skin, [-1.18, -2.35, 0.02], [0.22, 0.3, 0.24]);
    sphere(avatar, skin, [1.18, -2.35, 0.02], [0.22, 0.3, 0.24]);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.34, 0.65, 24), skin);
    neck.position.set(0, 0.15, 0);
    avatar.add(neck);
    sphere(avatar, gold, [0, -0.22, 0.48], [0.43, 0.045, 0.035]);

    const head = new THREE.Group();
    head.position.set(0, 1.22, 0.02);
    avatar.add(head);
    sphere(head, skin, [0, 0, 0], [0.76, 0.96, 0.63]);
    sphere(head, skinLight, [0, -0.34, 0.19], [0.58, 0.47, 0.49]);
    sphere(head, shadowSkin, [-0.72, -0.02, 0], [0.16, 0.27, 0.17]);
    sphere(head, shadowSkin, [0.72, -0.02, 0], [0.16, 0.27, 0.17]);
    sphere(head, skinLight, [-0.73, -0.02, 0.07], [0.08, 0.15, 0.08]);
    sphere(head, skinLight, [0.73, -0.02, 0.07], [0.08, 0.15, 0.08]);

    const hairCap = sphere(head, hair, [0, 0.58, -0.02], [0.78, 0.47, 0.68]);
    hairCap.rotation.z = -0.04;
    sphere(head, hair, [0, 0.35, 0.49], [0.68, 0.22, 0.22]);
    for (let i = 0; i < 7; i++) {
      const curl = sphere(head, hair, [-0.52 + i * 0.17, 0.48 + (i % 2) * 0.06, 0.53], [0.14, 0.17, 0.14]);
      curl.rotation.z = (i - 3) * 0.08;
    }

    const eyes = [];
    for (const x of [-0.29, 0.29]) {
      sphere(head, shadowSkin, [x, 0.1, 0.55], [0.2, 0.095, 0.08]);
      sphere(head, white, [x, 0.08, 0.59], [0.13, 0.055, 0.055]);
      eyes.push(sphere(head, iris, [x, 0.08, 0.638], [0.045, 0.05, 0.025]));
      sphere(head, white, [x - 0.012, 0.1, 0.658], [0.012, 0.014, 0.009]);
    }
    sphere(head, skinLight, [0, -0.08, 0.64], [0.12, 0.2, 0.14]);
    sphere(head, shadowSkin, [0, -0.2, 0.66], [0.1, 0.035, 0.08]);
    const mouth = sphere(head, mouthMat, [0, -0.43, 0.61], [0.18, 0.035, 0.035]);

    const halo = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.012, 10, 100), gold);
    halo.position.set(0, 1.15, -0.5);
    avatar.add(halo);
    const chestMark = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.025, 10, 64), gold);
    chestMark.position.set(0, -1.15, 0.53);
    avatar.add(chestMark);
    sphere(avatar, gold, [0, -1.15, 0.54], [0.07, 0.07, 0.025]);

    avatar.scale.setScalar(1.02);
    let state = "idle";
    window.setMercyAvatarState = (next) => { state = next || "idle"; };
    const clock = new THREE.Clock();
    let blinkAt = 3.4;
    let blinkUntil = 0;
    const resize = () => {
      const width = Math.max(240, stage.clientWidth);
      const height = Math.max(320, stage.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width < 460 ? 9.7 : 8.8;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    resize();

    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      avatar.rotation.y = Math.sin(t * 0.32) * 0.09;
      avatar.position.y = Math.sin(t * 0.8) * 0.035;
      head.rotation.y = Math.sin(t * 0.48) * 0.055;
      head.rotation.x = Math.sin(t * 0.7) * 0.018;
      halo.rotation.z = t * 0.08;
      const talking = state === "speaking";
      mouth.scale.y = talking ? 0.035 + Math.abs(Math.sin(t * 13)) * 0.09 : 0.035;
      mouth.scale.x = talking ? 0.18 + Math.abs(Math.sin(t * 9)) * 0.035 : 0.18;
      if (t > blinkAt) { blinkUntil = t + 0.14; blinkAt = t + 3.2 + Math.random() * 2.8; }
      const blinkScale = t < blinkUntil ? 0.012 : 1;
      eyes.forEach((eye) => { eye.scale.y = 0.05 * blinkScale; });
      if (state === "listening") halo.material.emissive = new THREE.Color(0x6d4b00);
      else if (state === "thinking") halo.material.emissive = new THREE.Color(0x40205f);
      else halo.material.emissive = new THREE.Color(0x000000);
      renderer.render(scene, camera);
    }
    animate();
  } catch (error) {
    canvas.hidden = true;
    const fallback = document.querySelector("#avatar-fallback");
    if (fallback) fallback.hidden = false;
    const status = document.querySelector("#avatar-status");
    if (status) status.textContent = "3D rendering unavailable on this browser; using the accessible fallback.";
    console.warn("MercySoul 3D avatar could not initialize:", error);
  }
}
