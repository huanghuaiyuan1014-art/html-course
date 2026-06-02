/* ============================================
   新畑算力科技 — 赛博国风 全局交互
   含：页面转场、导航、轮播、表单、BGM播放列表
   ============================================ */

/* --- 播放列表 --- */
const PLAYLIST = [
  { name: 'NO BATIDÃO', artist: 'ZXKAI,SLXUGHTER', src: 'images/nobatidao.mp3' },
  { name: 'PARADOX', artist: 'MY FIRST STORY', src: 'images/paradox.mp3' },
  { name: 'War of Change', artist: 'Thousand Foot Krutch', src: 'images/bgm.mp3' },
];

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('page-enter');

  const scanline = document.createElement('div');
  scanline.className = 'scanline';
  document.body.appendChild(scanline);

  const transition = document.createElement('div');
  transition.className = 'page-transition';
  document.body.appendChild(transition);

  initPageTransitions(transition);
  initAudioOverlay();
  initNavbar();
  initScrollReveal();
  initBackToTop();
  initChatPopup();
  initHamburger();
  initHeroCarousel();
  initContactForm();
  initServiceDetail();
  initStatsCounter();
  initSmoothScroll();
  setActiveNav();
  initBGM();
  initGlitchEffect();
});

/* ============================================
   页面转场 — 轻量 GPU 加速
   ============================================ */
function initPageTransitions(transitionEl) {
  transitionEl.style.willChange = 'opacity';
  transitionEl.style.transform = 'translateZ(0)';
  transitionEl.style.pointerEvents = 'none';
  transitionEl.style.opacity = '1';
  transitionEl.style.transition = 'opacity 0.3s ease';
  requestAnimationFrame(() => { transitionEl.style.opacity = '0'; });
  setTimeout(() => { transitionEl.style.display = 'none'; }, 350);

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('//') || link.target === '_blank') return;
    if (link.hasAttribute('download')) return;
    e.preventDefault();

    const bgm = document.getElementById('bgmAudio');
    if (bgm) {
      sessionStorage.setItem('bgm_index', PLAYLIST.findIndex(s => bgm.src.includes(s.src.split('/').pop())));
      sessionStorage.setItem('bgm_time', bgm.currentTime);
      sessionStorage.setItem('bgm_playing', (!bgm.paused).toString());
    }

    transitionEl.style.display = 'block';
    transitionEl.style.opacity = '0';
    transitionEl.style.transition = 'opacity 0.2s ease';
    requestAnimationFrame(() => { transitionEl.style.opacity = '1'; });

    const delay = (bgm && bgm.paused) ? 250 : 200;
    setTimeout(() => { window.location.href = href; }, delay);
  });
}

/* ============================================
   音频首次启动遮罩
   ============================================ */
function initAudioOverlay() {
  if (sessionStorage.getItem('bgm_user_enabled') === 'true') return;

  const overlay = document.createElement('div');
  overlay.className = 'audio-overlay';
  overlay.innerHTML = `
    <div class="hint-box">
      <span class="hint-icon">🔊</span>
      <span class="hint-text">点击任意位置</span>
      <span class="hint-sub">启用背景音乐</span>
    </div>`;
  document.body.appendChild(overlay);

  function dismiss() {
    if (overlay.classList.contains('fading')) return;
    overlay.classList.add('fading');
    setTimeout(() => overlay.classList.add('hidden'), 500);
    const bgm = document.getElementById('bgmAudio');
    if (bgm && bgm.paused) {
      bgm.play().then(() => {
        sessionStorage.setItem('bgm_user_enabled', 'true');
        sessionStorage.setItem('bgm_playing', 'true');
        const btn = document.getElementById('bgmToggle');
        if (btn) { btn.textContent = '🔊'; btn.style.color = 'var(--gold)'; }
      }).catch(() => {});
    }
  }
  overlay.addEventListener('click', dismiss);
  overlay.addEventListener('pointerdown', dismiss);
}

/* ============================================
   BGM 播放列表 — 跨页连续 + 切歌
   ============================================ */
function initBGM() {
  const bgm = document.getElementById('bgmAudio');
  const btn = document.getElementById('bgmToggle');
  if (!bgm || !btn) return;

  bgm.volume = 0.35;
  let currentIndex = parseInt(sessionStorage.getItem('bgm_index')) || 0;
  if (currentIndex >= PLAYLIST.length) currentIndex = 0;

  const savedTime = parseFloat(sessionStorage.getItem('bgm_time')) || 0;
  const wasPlaying = sessionStorage.getItem('bgm_playing') === 'true';
  const userEnabled = sessionStorage.getItem('bgm_user_enabled') === 'true';

  function loadSong(index) {
    currentIndex = index;
    bgm.src = PLAYLIST[index].src;
    bgm.load();
  }

  loadSong(currentIndex);
  if (savedTime > 0.5) bgm.currentTime = savedTime;

  function updateUI(playing) {
    btn.textContent = playing ? '🔊' : '🔇';
    btn.style.color = playing ? 'var(--gold)' : 'var(--cyan)';
  }
  function saveState() {
    sessionStorage.setItem('bgm_index', currentIndex);
    sessionStorage.setItem('bgm_time', bgm.currentTime);
    sessionStorage.setItem('bgm_playing', (!bgm.paused).toString());
  }

  function nextSong() {
    const next = (currentIndex + 1) % PLAYLIST.length;
    loadSong(next);
    bgm.play().then(() => { saveState(); updateUI(true); }).catch(() => {});
    renderMusicControls(next);
  }
  function prevSong() {
    const prev = (currentIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    loadSong(prev);
    bgm.play().then(() => { saveState(); updateUI(true); }).catch(() => {});
    renderMusicControls(prev);
  }

  bgm.addEventListener('ended', nextSong);

  function startBGM() {
    bgm.play().then(() => {
      sessionStorage.setItem('bgm_user_enabled', 'true');
      saveState(); updateUI(true);
    }).catch(() => {});
  }

  // 恢复播放
  if (userEnabled && wasPlaying) {
    bgm.play().then(() => updateUI(true))
      .catch(() => { updateUI(false); sessionStorage.setItem('bgm_playing', 'false'); });
  } else {
    updateUI(false);
  }

  // 手动开关
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!bgm.paused) { bgm.pause(); sessionStorage.setItem('bgm_playing', 'false'); updateUI(false); }
    else startBGM();
  });

  // 切歌按钮
  document.addEventListener('click', (e) => {
    if (e.target.id === 'bgmNext') nextSong();
    if (e.target.id === 'bgmPrev') prevSong();
  });

  // 任意触碰激活
  document.addEventListener('pointerdown', () => {
    if (bgm.paused && sessionStorage.getItem('bgm_user_enabled') !== 'true') startBGM();
  });

  // 切页保存
  window.addEventListener('beforeunload', saveState);
  setInterval(() => { if (!bgm.paused) saveState(); }, 1000);

  renderMusicControls(currentIndex);
}

function renderMusicControls(index) {
  const old = document.querySelector('.music-controls');
  if (old) old.remove();
  const toolbar = document.querySelector('.toolbar');
  if (!toolbar) return;

  const song = PLAYLIST[index];
  const ctrl = document.createElement('div');
  ctrl.className = 'music-controls';
  ctrl.style.cssText = 'text-align:center;margin-bottom:6px;';
  ctrl.innerHTML = `
    <button id="bgmPrev" title="上一首" style="width:30px;height:30px;font-size:0.7rem;margin:0 2px;">⏮</button>
    <button id="bgmNext" title="下一首" style="width:30px;height:30px;font-size:0.7rem;margin:0 2px;">⏭</button>
    <div style="font-size:0.6rem;color:var(--text-light);margin-top:2px;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${song.name}">${song.name}</div>`;
  toolbar.insertBefore(ctrl, toolbar.firstChild);
}

/* ============================================
   导航栏
   ============================================ */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 10));
}

/* ============================================
   滚动渐入
   ============================================ */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
  reveals.forEach(el => observer.observe(el));
}

/* ============================================
   汉堡菜单
   ============================================ */
function initHamburger() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (!hamburger || !navLinks) return;
  hamburger.addEventListener('click', () => { hamburger.classList.toggle('active'); navLinks.classList.toggle('open'); });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => { hamburger.classList.remove('active'); navLinks.classList.remove('open'); });
  });
}

/* ============================================
   回到顶部
   ============================================ */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 300));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ============================================
   Hero 轮播
   ============================================ */
function initHeroCarousel() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dots button');
  if (!slides.length) return;
  let current = 0, isTransitioning = false;
  function goTo(index) {
    if (isTransitioning) return;
    isTransitioning = true;
    slides[current].classList.remove('active');
    if (dots.length) dots[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    if (dots.length) dots[current].classList.add('active');
    setTimeout(() => { isTransitioning = false; }, 1200);
  }
  function next() { goTo(current + 1); }
  let interval = setInterval(next, 5000);
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { clearInterval(interval); goTo(i); interval = setInterval(next, 5000); });
  });
  let touchStartX = 0;
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, {passive: true});
    hero.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { clearInterval(interval); diff > 0 ? goTo(current + 1) : goTo(current - 1); interval = setInterval(next, 5000); }
    });
  }
}

/* ============================================
   联系表单
   ============================================ */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const fields = {
    name: form.querySelector('#contactName'), email: form.querySelector('#contactEmail'),
    phone: form.querySelector('#contactPhone'), message: form.querySelector('#contactMessage')
  };
  function showError(input, msg) { input.classList.add('error'); const e = input.parentElement.querySelector('.error-msg'); if (e) { e.textContent = msg; e.style.display = 'block'; } }
  function clearError(input) { input.classList.remove('error'); const e = input.parentElement.querySelector('.error-msg'); if (e) e.style.display = 'none'; }
  function validate(input) {
    const val = input.value.trim();
    if (!val) { showError(input, '必填项'); return false; }
    if (input === fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { showError(input, '请输入有效邮箱'); return false; }
    if (input === fields.phone && val && !/^[\d\-\+\s()]{7,15}$/.test(val)) { showError(input, '请输入有效电话'); return false; }
    clearError(input); return true;
  }
  Object.values(fields).forEach(input => {
    if (!input) return;
    input.addEventListener('blur', () => validate(input));
    input.addEventListener('input', () => { if (input.classList.contains('error')) validate(input); });
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (Object.values(fields).map(f => validate(f)).every(v => v)) { showToast('◆ 消息已送达 ◆'); form.reset(); }
  });
}

/* ============================================
   服务详情
   ============================================ */
function initServiceDetail() {
  const container = document.getElementById('serviceDetailContent');
  if (!container) return;
  const params = new URLSearchParams(window.location.search);
  const serviceId = params.get('service') || 'consulting';
  const services = {
    consulting: { title: '战略咨询', desc: '为企业提供全面的数字化转型战略咨询服务，制定从数据采集到算力部署的完整路线图。', features: ['业务流程诊断与优化','数字化转型战略规划','算力架构顶层设计','市场进入策略制定','技术选型与架构评审'], icon: '📊' },
    software: { title: '软件开发', desc: '基于最新技术栈提供高质量定制化软件开发服务。从分布式计算平台到轻量级边缘应用，交付稳定高效的软件产品。', features: ['分布式 Web 应用开发','移动端 App 开发','微服务架构设计与实现','API 接口开发与集成','DevOps 自动化部署'], icon: '💻' },
    cloud: { title: '云计算服务', desc: '提供全方位的云计算解决方案，涵盖云迁移、云原生架构设计、算力调度优化。帮助企业安全高效地部署弹性算力。', features: ['云迁移评估与实施','云原生架构设计','算力资源调度优化','多云管理与成本控制','7×24 运维监控'], icon: '☁️' },
    data: { title: '数据分析', desc: '通过先进的AI算力和大数据技术，为客户提供数据采集、清洗、分析、可视化的一站式服务。', features: ['数据仓库与数据湖搭建','商业智能(BI)报表','AI模型训练与推理','实时流式数据处理','可视化数据看板'], icon: '📈' },
    security: { title: '网络安全', desc: '提供全面的企业级网络安全解决方案，涵盖渗透测试、安全审计、合规咨询、应急响应。', features: ['渗透测试与漏洞扫描','安全架构评审','ISO 27001合规咨询','应急响应与取证','安全意识培训'], icon: '🔒' },
    design: { title: 'UI/UX 设计', desc: '以用户为中心的设计理念，为企业提供从品牌设计到产品体验的全链路设计服务。', features: ['用户研究与可用性测试','交互原型设计','视觉界面设计','品牌VI设计','设计系统搭建'], icon: '🎨' }
  };
  const service = services[serviceId] || services.consulting;
  const titleEl = document.getElementById('serviceDetailTitle');
  const descEl = document.getElementById('serviceDetailDesc');
  const iconEl = document.getElementById('serviceDetailIcon');
  const featuresEl = document.getElementById('serviceDetailFeatures');
  const breadcrumbTitleEl = document.getElementById('breadcrumbTitle');
  if (titleEl) titleEl.textContent = service.title;
  if (descEl) descEl.textContent = service.desc;
  if (iconEl) iconEl.textContent = service.icon;
  if (featuresEl) featuresEl.innerHTML = service.features.map(f => `<li>${f}</li>`).join('');
  if (breadcrumbTitleEl) breadcrumbTitleEl.textContent = service.title;
  document.querySelectorAll('.service-sidebar a').forEach(link => {
    link.classList.toggle('active', link.dataset.service === serviceId);
  });
}

/* ============================================
   Toast
   ============================================ */
function showToast(msg) {
  const old = document.querySelector('.toast'); if (old) old.remove();
  const toast = document.createElement('div'); toast.className = 'toast'; toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 350); }, 3000);
}

/* ============================================
   数字滚动
   ============================================ */
function initStatsCounter() {
  const statNums = document.querySelectorAll('.stat-number');
  if (!statNums.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target) || 0;
        const suffix = el.dataset.suffix || '';
        const start = performance.now();
        function update(now) {
          const progress = Math.min((now - start) / 2200, 1);
          el.textContent = Math.floor(target * (1 - Math.pow(1 - progress, 3))) + (progress >= 1 ? suffix : '');
          if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  statNums.forEach(el => observer.observe(el));
}

/* ============================================
   平滑滚动
   ============================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
}

/* ============================================
   客服弹窗
   ============================================ */
function initChatPopup() {
  const chatBtn = document.getElementById('chatBtn'), chatPopup = document.getElementById('chatPopup');
  const chatClose = document.getElementById('chatClose'), chatSend = document.getElementById('chatSend'), chatInput = document.getElementById('chatInput');
  if (!chatBtn || !chatPopup) return;
  chatBtn.addEventListener('click', () => chatPopup.classList.toggle('open'));
  if (chatClose) chatClose.addEventListener('click', () => chatPopup.classList.remove('open'));
  if (chatSend && chatInput) {
    const send = () => {
      const msg = chatInput.value.trim(); if (!msg) return;
      const body = chatPopup.querySelector('.chat-body');
      body.innerHTML += `<p style="margin-bottom:10px;"><strong style="color:var(--cyan);">您：</strong>${escapeHtml(msg)}<br><strong style="color:var(--gold);">客服：</strong>收到！（模拟回复）</p>`;
      body.scrollTop = body.scrollHeight; chatInput.value = '';
    };
    chatSend.addEventListener('click', send);
    chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  }
}

function escapeHtml(str) { const div = document.createElement('div'); div.textContent = str; return div.innerHTML; }

/* ============================================
   导航高亮
   ============================================ */
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === path || (path === '' && link.getAttribute('href') === 'index.html')) link.classList.add('active');
  });
}

/* ============================================
   毛刺特效
   ============================================ */
function initGlitchEffect() {
  const heroTitle = document.querySelector('.hero-content h1');
  if (!heroTitle) return;
  setInterval(() => {
    heroTitle.style.textShadow = `${Math.random()*4-2}px ${Math.random()*4-2}px 0 rgba(255,0,110,0.7), ${Math.random()*4-2}px ${Math.random()*4-2}px 0 rgba(0,240,255,0.7)`;
    setTimeout(() => { heroTitle.style.textShadow = 'none'; }, 80);
  }, 4000);
}
