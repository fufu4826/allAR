document.addEventListener('DOMContentLoaded', () => {
  const categories = document.getElementById('communityCategories');
  const grid = document.getElementById('communityModelGrid');
  const status = document.getElementById('communityModelStatus');
  const dialog = document.getElementById('nonhomModelDialog');
  const viewer = document.getElementById('nonhomViewer');
  const title = document.getElementById('nonhomModelTitle');
  const description = document.getElementById('nonhomModelDescription');
  const error = document.getElementById('nonhomModelError');
  if (!categories || !grid || !status || !dialog || !viewer || typeof nonhomModels === 'undefined') return;
  let engine, selectedModel, arViewer;
  const loading = document.getElementById('nonhomModelLoading');
  const arStatus = document.getElementById('nonhomARStatus');
  const rotation = document.getElementById('nonhomToggleRotation');
  const enginePromise = (location.protocol === 'file:' ? Promise.reject(new Error('LOCAL_FILE')) : import('./three-model-viewer.js?v=20261106b')).then(module => {
    engine = module.createModelViewer(viewer, loading, error);
    return engine;
  });
  function showEngineError(cause) {
    loading.hidden = true; error.hidden = false;
    error.textContent = location.protocol === 'file:'
      ? 'กรุณาเปิดผ่านไฟล์ เปิดเว็บไซต์.cmd ในโฟลเดอร์โปรเจกต์ เพื่อโหลดโมเดล 3D ได้ครบถ้วน'
      : 'เริ่มระบบ 3D ไม่สำเร็จ กรุณากด Ctrl+Shift+R เพื่อโหลดหน้าใหม่';
    console.error('3D viewer initialization:', cause);
  }
  enginePromise.catch(showEngineError);
  dialog.addEventListener('close', () => { selectedModel = null; engine?.clear(); arViewer?.removeAttribute('src'); error.hidden = true; });
  document.getElementById('nonhomResetCamera').addEventListener('click', () => engine?.reset());
  rotation.addEventListener('click', () => {
    if (!engine) return;
    const active = engine.toggleRotation();
    rotation.setAttribute('aria-pressed', String(active));
    rotation.textContent = active ? 'หยุดหมุนอัตโนมัติ' : 'หมุนอัตโนมัติ';
  });
  document.getElementById('nonhomLaunchAR').addEventListener('click', async () => {
    if (!selectedModel) return;
    if (!window.customElements.get('model-viewer')) { arStatus.textContent = 'กำลังเตรียมระบบ AR กรุณาลองอีกครั้ง'; return; }
    if (!arViewer) {
      arViewer = document.createElement('model-viewer');
      arViewer.className = 'nonhom-ar-helper';
      arViewer.setAttribute('ar', '');
      arViewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
      dialog.append(arViewer);
    }
    arViewer.src = selectedModel.src;
    arStatus.textContent = 'กำลังเตรียม AR…';
    await arViewer.updateComplete;
    if (arViewer.canActivateAR) {
      arViewer.activateAR().catch(() => { arStatus.textContent = 'ไม่สามารถเปิด AR บนอุปกรณ์นี้ได้'; });
      arStatus.textContent = '';
    } else { arStatus.textContent = 'เปิดผ่านมือถือที่รองรับ AR และเว็บไซต์ HTTPS'; }
  });
  document.getElementById('nonhomCloseViewer').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  async function openModel(model) {
    selectedModel = model;
    title.textContent = model.name;
    description.textContent = model.description;
    error.hidden = true; loading.hidden = false; arStatus.textContent = '';
    dialog.showModal();
    try {
      const ready = await enginePromise;
      if (dialog.open && selectedModel === model) ready.load(model);
    } catch (cause) { showEngineError(cause); }
  }
  function selectCategory(category) {
    const filtered = nonhomModels.filter(model => model.category === category);
    categories.querySelectorAll('button').forEach(button => {
      const selected = button.dataset.category === category;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    status.textContent = `${category} · ${filtered.length} โมเดล`;
    grid.replaceChildren();
    filtered.forEach(model => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'model-card nonhom-model-card';
      button.setAttribute('aria-label', `ดูโมเดลสามมิติ ${model.name}`);
      const image = document.createElement('img'); image.src = model.image; image.alt = ''; image.loading = 'lazy';
      const body = document.createElement('span');
      const name = document.createElement('strong'); name.textContent = model.name;
      const action = document.createElement('small'); action.textContent = 'ดูโมเดล 3D / AR →';
      body.append(name, action); button.append(image, body); button.addEventListener('click', () => openModel(model)); grid.append(button);
    });
  }
  [...new Set(nonhomModels.map(model => model.category))].forEach(category => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'community-category'; button.dataset.category = category; button.textContent = category;
    button.addEventListener('click', () => selectCategory(category)); categories.append(button);
  });
  if (nonhomModels.length) selectCategory(nonhomModels[0].category);
});
