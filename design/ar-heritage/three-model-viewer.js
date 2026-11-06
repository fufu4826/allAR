import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createModelViewer(host, status, error) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', 'โมเดลสามมิติ ลากเพื่อหมุน เลื่อนเพื่อซูม');
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xbfa79e, 3));
  const key = new THREE.DirectionalLight(0xffffff, 4); key.position.set(3, 5, 4); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 2); fill.position.set(-3, 2, -4); scene.add(fill);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 1000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.8;
  const loader = new GLTFLoader();
  let object, request, revision = 0, homePosition = new THREE.Vector3(), homeTarget = new THREE.Vector3();
  function dispose(model) {
    const textures = new Set(), materials = new Set(), geometries = new Set();
    model.traverse(node => {
      if (node.geometry) geometries.add(node.geometry);
      for (const material of (Array.isArray(node.material) ? node.material : [node.material])) {
        if (!material) continue;
        materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
    });
    textures.forEach(t => { t.source?.data?.close?.(); t.dispose(); });
    materials.forEach(m => m.dispose()); geometries.forEach(g => g.dispose());
  }
  function clear() {
    revision++; request?.abort();
    renderer.setAnimationLoop(null);
    if (object) { scene.remove(object); dispose(object); object = null; }
    renderer.clear();
  }
  function resize() {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  async function load(model) {
    clear(); const current = revision;
    status.hidden = false; status.textContent = 'กำลังโหลดโมเดล…'; error.hidden = true;
    request = new AbortController();
    try {
      const response = await fetch(model.src, { signal: request.signal });
      if (!response.ok) throw new Error('Model request failed');
      const buffer = await response.arrayBuffer();
      if (current !== revision) return;
      status.textContent = 'กำลังเตรียมโมเดล 3D…';
      const gltf = await loader.parseAsync(buffer, new URL('.', new URL(model.src, location.href)).href);
      if (current !== revision) { dispose(gltf.scene); return; }
      object = gltf.scene; scene.add(object); object.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3()); const center = box.getCenter(new THREE.Vector3());
      const span = Math.max(size.x, size.y, size.z) || 1;
      resize();
      const distance = span / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * Math.max(1, 1 / camera.aspect) * 1.4;
      camera.near = span / 1000; camera.far = distance * 100; camera.updateProjectionMatrix();
      homeTarget.copy(center); homePosition.copy(center).add(new THREE.Vector3(distance * .55, distance * .28, distance));
      camera.position.copy(homePosition); controls.target.copy(homeTarget);
      controls.minDistance = span * .1; controls.maxDistance = distance * 6; controls.update();
      renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
      status.hidden = true;
    } catch (cause) {
      if (current !== revision || cause.name === 'AbortError') return;
      status.hidden = true; error.hidden = false; console.error('3D model:', cause);
    }
  }
  return { load, clear, reset() { camera.position.copy(homePosition); controls.target.copy(homeTarget); controls.update(); },
    toggleRotation() { controls.autoRotate = !controls.autoRotate; return controls.autoRotate; } };
}
