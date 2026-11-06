// ========================================================
// 5 Cultural Identities Data Dictionary
// ========================================================
const identityData = {
  tharae: {
    badge: 'อำเภอเมืองสกลนคร • ชุมชนคาทอลิกโบราณ',
    title: '1. ชุมชนท่าแร่ (Tha Rae Community)',
    desc: 'ชุมชนคาทอลิกที่ใหญ่ที่สุดในประเทศไทย โดดเด่นด้วยสถาปัตยกรรมตึกโบราณสไตล์โคโลเนียล (ฝรั่งเศส-เวียดนาม) อายุกว่าร้อยปี ผสานวัฒนธรรมประเพณีแห่ดาวคริสต์มาสอันตระการตาและมีเอกลักษณ์ระดับนานาชาติ',
    features: [
      'แบบจำลอง 3 มิติตึกโบราณคฤหาสน์อุดมเดชวัฒน์ ถอดแบบสถาปัตยกรรมก่ออิฐฉาบปูน',
      'ดวงดาวคริสต์มาส 3D Interactive เอกลักษณ์งานเทศกาลแห่ดาวท่าแร่',
      'Hotspot แสดงประวัติศาสตร์การอพยพและการตั้งถิ่นฐานริมหนองหาร'
    ],
    modelTag: '3D Architecture Model (Colonial Style)',
    modelSrc: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'
  },
  watklang: {
    badge: 'อำเภอเมืองสกลนคร • มรดกพุทธศิลป์ล้านช้าง',
    title: '2. ท่าวัด (วัดกลางศรีเชียงใหม่)',
    desc: 'ศูนย์รวมจิตใจของชุมชนท่าวัด โดดเด่นด้วย "สิม" (โบสถ์โบราณ) ศิลปะล้านช้างอันวิจิตร บรรจุภาพจิตรกรรมฝาผนังและลวดลายแกะสลักไม้โบราณที่สะท้อนถึงความศรัทธาและความเชื่อมโยงระหว่างสองฝั่งโขง',
    features: [
      'แบบจำลองสิมโบราณและลวดลายคันทวยแกะสลักแบบ 3D Photogrammetry',
      'ระบบแสงจำลองสภาพบรรยากาศทั้งกลางวันและยามค่ำคืน',
      'จุดอธิบายองค์ประกอบสถาปัตยกรรมพื้นถิ่นอีสาน-ล้านช้าง'
    ],
    modelTag: '3D Heritage Scan (Buddhist Art)',
    modelSrc: 'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb'
  },
  watnuea: {
    badge: 'อำเภอเมืองสกลนคร • โบราณสถานและศิลาจารึก',
    title: '3. ท่าวัด (วัดมหาพรหมโพธิราช / วัดเหนือ)',
    desc: 'วัดเก่าแก่คู่เมืองสกลนคร ประดิษฐานพระพุทธรูปโบราณและใบเสมาศิลาแลงอันทรงคุณค่าทางประวัติศาสตร์ เป็นแหล่งเรียนรู้โบราณคดีที่สะท้อนถึงการตั้งถิ่นฐานยุคขอมและทวารวดี',
    features: [
      'แบบจำลอง 3D สแกนใบเสมาโบราณและพระพุทธรูปศักดิ์สิทธิ์',
      'เทคโนโลยี AR ซ้อนภาพลายเส้นจารึกโบราณที่เลือนหายไปให้กลับมาชัดเจน',
      'แผนผังแหล่งประวัติศาสตร์รอบชุมชนท่าวัดแบบ 3D Map'
    ],
    modelTag: '3D Archaeological Artifact',
    modelSrc: 'https://modelviewer.dev/shared-assets/models/DamagedHelmet.glb'
  },
  nonhom: {
    badge: 'อำเภอเมืองสกลนคร • ชนเผ่าภูไท & ผ้าย้อมคราม',
    title: '4. ชุมชนโนนหอม (Ban Non Hom)',
    desc: 'แหล่งเรียนรู้วิถีชีวิตและวัฒนธรรมชนเผ่าภูไทที่ยังคงรักษาประเพณี ภาษา การแต่งกาย และภูมิปัญญาการย้อมครามธรรมชาติได้อย่างเหนียวแน่น มีศูนย์วัฒนธรรมชนเผ่าและเรือนไทยโบราณ',
    features: [
      'โมเดล 3D กี่ทอผ้าโบราณและลวดลายผ้ามัดหมี่ย้อมครามเอกลักษณ์โนนหอม',
      'ระบบ AR สวมใส่ชุดชนเผ่าภูไทและผ้าสไบขิดเสมือนจริง (Virtual Fitting)',
      'การนำเสนอวิดีโอเสียงดนตรีและฟ้อนรำภูไทแบบซิงค์กับโมเดล 3D'
    ],
    modelTag: '3D Cultural Textile & Artifact',
    modelSrc: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb'
  },
  phuphan: {
    badge: 'เทือกเขาภูพาน • โครงการอันเนื่องมาจากพระราชดำริ',
    title: '5. ศูนย์ศึกษาการพัฒนาภูพานฯ',
    desc: 'ต้นแบบการพัฒนาและถ่ายทอดเทคโนโลยีการเกษตรยั่งยืน แหล่งกำเนิด "3 ดำมหัศจรรย์แห่งภูพาน" (ไก่ดำ หมูดำ และโคเนื้อทาจิมะภูพาน) รวมถึงระบบวนเกษตรและการอนุรักษ์ป่าต้นน้ำตามแนวพระราชดำริ',
    features: [
      'โมเดล 3 มิติสายพันธุ์สัตว์เศรษฐกิจ 3 ดำมหัศจรรย์ พร้อมข้อมูลทางสัตวศาสตร์',
      'แบบจำลองระบบชลประทานและแปลงเกษตรทฤษฎีใหม่แบบ 3D Diorama',
      'AR Interactive เพื่อการศึกษาสำหรับนักเรียน เยาวชน และผู้เข้าศึกษาดูงาน'
    ],
    modelTag: '3D Royal Project Diorama',
    modelSrc: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'
  }
};

// ========================================================
// DOM Ready Handler
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
  // Mobile Navigation
  initNavbar();

  // 5 Cultural Identity Tabs Switcher
  initIdentityTabs();

  // Gallery Filters
  initGalleryFilter();

  // Download & AR Action Modal
  initActionModal();

  // Smooth Active Nav on Scroll
  initScrollSpy();

  // Interactive Map Controls & Card Linking
  initMapFeatures();
});

// ========================================================
// 1. Navigation Functions
// ========================================================
function initNavbar() {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = navToggle.querySelector('i');
      if (navMenu.classList.contains('active')) {
        icon.className = 'fa-solid fa-xmark';
      } else {
        icon.className = 'fa-solid fa-bars';
      }
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const icon = navToggle.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-bars';
      });
    });
  }
}

// ========================================================
// 2. Identity Tabs & 3D Model Switcher
// ========================================================
function initIdentityTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const locBadge = document.getElementById('locBadge');
  const locTitle = document.getElementById('locTitle');
  const locDesc = document.getElementById('locDesc');
  const locFeatures = document.getElementById('locFeatures');
  const modelTag = document.getElementById('modelTag');
  const mainViewer = document.getElementById('mainModelViewer');
  const btnReset = document.getElementById('btnResetView');
  const btnLaunchAR = document.getElementById('btnLaunchAR');
  let updateTimer;

  renderModelCatalog('tharae');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Set active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const key = tab.getAttribute('data-id');
      const data = identityData[key];
      clearTimeout(updateTimer);
      renderModelCatalog(key);

      if (data) {
        // Animate text change
        locTitle.style.opacity = '0';
        locDesc.style.opacity = '0';

        updateTimer = setTimeout(() => {
          locBadge.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${data.badge}`;
          locTitle.textContent = data.title;
          locDesc.textContent = data.desc;
          modelTag.textContent = data.modelTag;

          // Render features list
          locFeatures.innerHTML = data.features
            .map(f => `<li><i class="fa-solid fa-check"></i> ${f}</li>`)
            .join('');

          // Update Model Viewer
          if (mainViewer) {
            mainViewer.setAttribute('src', data.modelSrc);
            if (typeof mainViewer.dismissPoster === 'function') mainViewer.dismissPoster();
          }

          locTitle.style.opacity = '1';
          locDesc.style.opacity = '1';
        }, 150);
      }
    });
  });

  // Reset 3D View Camera
  if (btnReset && mainViewer) {
    btnReset.addEventListener('click', () => {
      mainViewer.cameraOrbit = '0deg 75deg 105%';
      mainViewer.cameraTarget = 'auto auto auto';
      mainViewer.fieldOfView = 'auto';
      showModal(
        'fa-solid fa-rotate-left',
        'รีเซ็ตมุมมองสำเร็จ',
        'ตำแหน่งกล้องของโมเดล 3 มิติกลับสู่มุมมองเริ่มต้นเรียบร้อยแล้ว'
      );
    });
  }

  // Launch AR trigger
  if (btnLaunchAR && mainViewer) {
    btnLaunchAR.addEventListener('click', () => {
      if (mainViewer.canActivateAR) {
        mainViewer.activateAR();
      } else {
        showModal(
          'fa-solid fa-mobile-screen-button',
          'เปิดใช้งานระบบ AR บนมือถือ',
          'สำหรับการเปิดกล้องจำลองวัตถุเสมือนจริงในสถานที่ของคุณ กรุณาเปิดเว็บไซต์นี้ผ่านเบราว์เซอร์บนสมาร์ตโฟน (Chrome บน Android หรือ Safari บน iPhone) เพื่อเข้าสู่โหมด WebAR ได้ทันที'
        );
      }
    });
  }
}

// Catalog data can be added for other communities as it becomes available.
const communityModels = {
  phuphan: typeof phuphanModels === 'undefined' ? [] : phuphanModels
};

function renderModelCatalog(community) {
  const box = document.getElementById('identityDetail');
  const description = document.getElementById('catalogDescription');
  const categories = document.getElementById('modelCategories');
  const status = document.getElementById('modelCatalogStatus');
  const grid = document.getElementById('modelCatalogGrid');
  const source = document.getElementById('modelCatalogSource');
  if (!box || !description || !categories || !status || !grid || !source) return;

  const models = communityModels[community] || [];
  box.classList.toggle('has-model-catalog', models.length > 0);
  categories.replaceChildren();
  grid.replaceChildren();
  source.hidden = models.length === 0;
  if (!models.length) {
    description.textContent = 'หมวดหมู่โมเดลของชุมชนนี้';
    status.textContent = 'ยังไม่มีข้อมูลหมวดหมู่โมเดลของชุมชนนี้';
    return;
  }

  const groups = [...new Set(models.map(model => model.category))];
  description.textContent = `เลือกแหล่งเรียนรู้เพื่อชมโมเดล ${groups.length} หมวดหมู่`;
  const selectCategory = category => {
    const filtered = models.filter(model => model.category === category);
    categories.querySelectorAll('button').forEach(button => {
      const selected = button.dataset.category === category;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    status.textContent = `${category} · ${filtered.length} โมเดล`;
    grid.replaceChildren();
    filtered.forEach(model => {
      const link = document.createElement('a');
      link.className = 'catalog-model-card';
      link.href = model.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      const image = document.createElement('img');
      image.src = model.image;
      image.alt = '';
      image.loading = 'lazy';
      const body = document.createElement('span');
      body.className = 'catalog-model-body';
      const name = document.createElement('strong');
      name.textContent = model.name;
      const action = document.createElement('span');
      action.className = 'catalog-model-action';
      action.textContent = 'ดูโมเดล 3D / AR ↗';
      body.append(name, action);
      link.append(image, body);
      grid.append(link);
    });
  };

  groups.forEach(category => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'model-category-btn';
    button.dataset.category = category;
    button.textContent = category;
    button.addEventListener('click', () => selectCategory(category));
    categories.append(button);
  });
  selectCategory(groups[0]);
}

// ========================================================
// 3. Photo Gallery Filtering
// ========================================================
function initGalleryFilter() {
  const filterBtns = document.querySelectorAll('.gallery-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      galleryItems.forEach(item => {
        const category = item.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // Clicking on gallery item opens quick view modal
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const title = item.querySelector('h4') ? item.querySelector('h4').textContent : 'ภาพกิจกรรม';
      const desc = item.querySelector('p') ? item.querySelector('p').textContent : 'บันทึกภาพการดำเนินงาน';
      showModal('fa-solid fa-image', title, desc);
    });
  });
}

// ========================================================
// 4. Modal Notification System
// ========================================================
function initActionModal() {
  const modal = document.getElementById('actionModal');
  const closeBtn = document.getElementById('modalCloseBtn');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }


}

function showModal(iconClass, title, message) {
  const modal = document.getElementById('actionModal');
  const modalIcon = document.getElementById('modalIcon');
  const modalTitle = document.getElementById('modalTitle');
  const modalMsg = document.getElementById('modalMsg');

  if (modal && modalIcon && modalTitle && modalMsg) {
    modalIcon.innerHTML = `<i class="${iconClass}"></i>`;
    modalTitle.textContent = title;
    modalMsg.textContent = message;
    modal.classList.add('active');
  }
}

// ========================================================
// 5. ScrollSpy for Navbar
// ========================================================
function initScrollSpy() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section');

  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollPos = window.scrollY + 120;

    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = sec.getAttribute('id');
      }
    });

    if (currentId) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentId}`) {
          link.classList.add('active');
        }
      });
    }
  });
}

// ========================================================
// 6. Map Interactivity & Fullscreen
// ========================================================
function initMapFeatures() {
  const btnFullscreen = document.getElementById('btnToggleMapFullscreen');
  const mapFrame = document.getElementById('mapFrame');
  const highlightItems = document.querySelectorAll('.map-highlight-item');

  if (btnFullscreen && mapFrame) {
    btnFullscreen.addEventListener('click', () => {
      mapFrame.classList.toggle('fullscreen');
      if (mapFrame.classList.contains('fullscreen')) {
        btnFullscreen.innerHTML = '<i class="fa-solid fa-compress"></i> ปิดเต็มจอ';
      } else {
        btnFullscreen.innerHTML = '<i class="fa-solid fa-expand"></i> ขยายแผนที่';
      }
    });

    mapFrame.addEventListener('click', (e) => {
      if (mapFrame.classList.contains('fullscreen')) {
        mapFrame.classList.remove('fullscreen');
        if (btnFullscreen) {
          btnFullscreen.innerHTML = '<i class="fa-solid fa-expand"></i> ขยายแผนที่';
        }
      }
    });
  }

  // Clicking quick location cards activates the corresponding 3D tab
  highlightItems.forEach(item => {
    item.addEventListener('click', () => {
      const locId = item.getAttribute('data-id');
      const targetTab = document.querySelector(`.tab-btn[data-id="${locId}"]`);
      if (targetTab) {
        targetTab.click();
      }
    });
  });
}

