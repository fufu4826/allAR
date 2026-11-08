/* Design samples only. Production images must come from the community's own records. */
document.addEventListener('DOMContentLoaded', () => {
  const section = document.getElementById('community-gallery');
  if (!section) return;
  const grid = section.querySelector('.community-gallery-grid');
  const status = section.querySelector('.community-gallery-status');
  const empty = section.querySelector('.community-gallery-empty');
  const filters = [...section.querySelectorAll('[data-gallery-filter]')];
  const labels = { activity: 'ภาพกิจกรรม', model: 'ภาพโมเดล' };
  // Empty by default: never present another community's photos as this community's own.
  const samples = document.body.dataset.community === 'nonhom' ? [
    { src: 'assets/nonhom/images/phuthai_f.webp', title: 'ชุดผู้ไทหญิง', category: 'model', caption: 'ตัวอย่างการจัดแสดงภาพประกอบชิ้นงาน' },
    { src: 'assets/nonhom/images/baisri.webp', title: 'บายศรี', category: 'model', caption: 'ตัวอย่างภาพรายละเอียดภูมิปัญญาชุมชน' },
    { src: 'assets/nonhom/images/sabai.webp', title: 'ผ้าสไบ', category: 'model', caption: 'ตัวอย่างภาพลวดลายและงานหัตถกรรม' },
  ] : [];
  let visible = [];
  let current = 0;
  let opener;
  let previousOverflow;

  const dialog = document.createElement('dialog');
  dialog.className = 'community-gallery-dialog';
  dialog.setAttribute('aria-labelledby', 'community-gallery-image-title');
  dialog.innerHTML = `
    <div class="community-gallery-dialog-top">
      <span>ภาพตัวอย่างแกลเลอรีชุมชน</span>
      <button type="button" class="community-gallery-close" aria-label="ปิดภาพขยาย" autofocus>ปิด <span aria-hidden="true">×</span></button>
    </div>
    <div class="community-gallery-stage"><img class="community-gallery-full-image" alt=""></div>
    <div class="community-gallery-dialog-info">
      <p class="community-gallery-image-category"></p>
      <h2 id="community-gallery-image-title"></h2>
      <p id="community-gallery-image-caption"></p>
      <div class="community-gallery-controls">
        <button type="button" class="community-gallery-previous" aria-label="ภาพก่อนหน้า">← ก่อนหน้า</button>
        <span class="community-gallery-counter" role="status" aria-live="polite"></span>
        <button type="button" class="community-gallery-next" aria-label="ภาพถัดไป">ถัดไป →</button>
      </div>
    </div>`;
  document.body.append(dialog);
  const image = dialog.querySelector('img');
  const previous = dialog.querySelector('.community-gallery-previous');
  const next = dialog.querySelector('.community-gallery-next');

  function showImage(index) {
    current = (index + visible.length) % visible.length;
    const item = visible[current];
    image.src = item.src;
    image.alt = item.title;
    dialog.querySelector('h2').textContent = item.title;
    dialog.querySelector('#community-gallery-image-caption').textContent = item.caption;
    dialog.querySelector('.community-gallery-image-category').textContent = labels[item.category];
    dialog.querySelector('.community-gallery-counter').textContent = `${current + 1} / ${visible.length}`;
    previous.disabled = next.disabled = visible.length < 2;
  }

  function selectFilter(category) {
    visible = samples.filter(item => category === 'all' || item.category === category);
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.galleryFilter === category)));
    status.textContent = `${category === 'all' ? 'ภาพทั้งหมด' : labels[category]} · ${visible.length} ภาพ`;
    empty.hidden = visible.length > 0;
    empty.querySelector('strong').textContent = category === 'activity' ? 'ยังไม่มีภาพกิจกรรมในแกลเลอรี' : category === 'model' ? 'ยังไม่มีภาพโมเดลในแกลเลอรี' : 'ยังไม่มีภาพในแกลเลอรี';
    grid.replaceChildren();
    visible.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'community-gallery-card';
      button.setAttribute('aria-label', `ขยายภาพ ${item.title}`);
      button.setAttribute('aria-haspopup', 'dialog');
      const thumbnail = document.createElement('img');
      thumbnail.src = item.src;
      thumbnail.alt = '';
      thumbnail.loading = 'lazy';
      thumbnail.width = 640;
      thumbnail.height = 480;
      const body = document.createElement('span');
      body.className = 'community-gallery-card-body';
      const categoryLabel = document.createElement('small');
      categoryLabel.textContent = labels[item.category];
      const title = document.createElement('strong');
      title.textContent = item.title;
      const caption = document.createElement('span');
      caption.textContent = item.caption;
      body.append(categoryLabel, title, caption);
      button.append(thumbnail, body);
      button.addEventListener('click', () => {
        opener = button;
        showImage(index);
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        dialog.showModal();
      });
      grid.append(button);
    });
  }

  filters.forEach(button => button.addEventListener('click', () => selectFilter(button.dataset.galleryFilter)));
  previous.addEventListener('click', () => showImage(current - 1));
  next.addEventListener('click', () => showImage(current + 1));
  dialog.querySelector('.community-gallery-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showImage(current + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    opener?.focus();
  });
  selectFilter('all');
});
