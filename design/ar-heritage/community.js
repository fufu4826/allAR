document.addEventListener('DOMContentLoaded', () => {
  const categories = document.getElementById('communityCategories');
  const grid = document.getElementById('communityModelGrid');
  const status = document.getElementById('communityModelStatus');
  if (document.body.dataset.community !== 'phuphan' || typeof phuphanModels === 'undefined' || !phuphanModels.length) {
    status.textContent = 'ยังไม่มีข้อมูลหมวดหมู่โมเดลสำหรับชุมชนนี้';
    return;
  }
  const groups = [...new Set(phuphanModels.map(model => model.category))];
  function selectCategory(category) {
    const filtered = phuphanModels.filter(model => model.category === category);
    categories.querySelectorAll('button').forEach(button => {
      const selected = button.dataset.category === category;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    status.textContent = `${category} · ${filtered.length} โมเดล`;
    grid.replaceChildren();
    filtered.forEach(model => {
      const link = document.createElement('a');
      link.className = 'model-card'; link.href = model.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      const image = document.createElement('img'); image.src = model.image; image.alt = ''; image.loading = 'lazy';
      const body = document.createElement('span');
      const name = document.createElement('strong'); name.textContent = model.name;
      const action = document.createElement('small'); action.textContent = 'ดูโมเดล 3D / AR ↗';
      body.append(name, action); link.append(image, body); grid.append(link);
    });
  }
  groups.forEach(category => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'community-category'; button.dataset.category = category; button.textContent = category;
    button.addEventListener('click', () => selectCategory(category)); categories.append(button);
  });
  selectCategory(groups[0]);
});
