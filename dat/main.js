// dat/main.js（書き直し版）
// main.js  — 入口アニメ & 文字ふわっと & ヘッダー/パララックス & セクションフェードイン
(() => {
  'use strict';

  /* =========================
     調整しやすい設定
     ========================= */
  const CFG = {
    // Entry timeline
    HOLD: 400,  // 青カーテンを真っ青で保つ(ms)
    BG:   700,  // 背景回復(青→透明)の時間(ms)  ※CSSの--ringトランジションと合わせる
    GAP:  350,  // 背景回復が終わってから文字が出るまでの“間”(ms)
    // ① 設定に追加（CFG内）
    MOBILE_FACTOR: 0.35,   // スマホは移動量を35%に

    // 文字の“ふわっ”（行ごとの基準ディレイ & スタッガ）
    CHAR: {
      eyebrow: { base: 700, stagger: 28 },
      line1:   { base: 900, stagger: 26 },
      line2:   { base: 1000, stagger: 26 },
      brand:   { base: 1050, stagger: 30 }
    },

    // ヘッダー縮小
    SHRINK_Y: 40,
    TOP_EPS: 4,

    // パララックス（任意）
    SPEED: { cactus: 0.30, cloud: 0.30 },
    EASE: 0.10
  };


  const state = {
    reduceMotion: false,
    shrink: null,
    atTop: null,
    sections: [],
    values: new Map()
  };

  /* =========================
     ユーティリティ
     ========================= */
  const qs  = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const lerp = (a,b,t) => a + (b-a)*t;

// ② CFG宣言の直後あたりに追加
const BASE_SPEED = { ...CFG.SPEED };
function applyParallaxScale(){
  const mq = window.matchMedia('(max-width: 900px)');
  const f = mq.matches ? CFG.MOBILE_FACTOR : 1;
  CFG.SPEED.cactus = BASE_SPEED.cactus * f;
  CFG.SPEED.cloud  = BASE_SPEED.cloud  * f;
}


  /* =========================
     文字を1文字ずつラップ
     ========================= */
  function splitChars(el, base=600, stagger=30) {
    if (!el || el.dataset.splitDone) return;
    const frag = document.createDocumentFragment();
    let i = 0;

    el.childNodes.forEach(node => {
      if (node.nodeType === 3) {
        for (const ch of node.textContent) {
          if (/\s/.test(ch)) {
            frag.appendChild(document.createTextNode(ch));
          } else {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = ch;
            span.style.setProperty('--i', i++);
            // ランダム演出は使わない（均一表示）
            span.style.setProperty('--rand', '0s');
            span.style.setProperty('--rot',  '0deg');
            frag.appendChild(span);
          }
        }
      } else if (node.nodeType === 1 && node.tagName === 'BR') {
        frag.appendChild(document.createElement('br'));
      } else {
        frag.appendChild(node.cloneNode(true));
      }
    });

    el.textContent = '';
    el.appendChild(frag);
    el.classList.add('split-chars');
    el.setAttribute('data-fx','pop');
    el.style.setProperty('--base', `${base/1000}s`);
    el.style.setProperty('--stagger', `${stagger/1000}s`);
    el.dataset.splitDone = '1';
  }

  /* =========================
     ヘッダー縮小 / 最上部判定
     ========================= */
  function applyHeader() {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    const shrink = y > CFG.SHRINK_Y;
    if (shrink !== state.shrink) {
      document.body.classList.toggle('is-shrink', shrink);
      state.shrink = shrink;
    }
    const atTop = y <= CFG.TOP_EPS;
    if (atTop !== state.atTop) {
      document.body.classList.toggle('is-at-top', atTop);
      state.atTop = atTop;
    }
  }
  function onScroll(){ requestAnimationFrame(applyHeader); }

  /* =========================
     パララックス（任意）
     ========================= */
  function tickParallax() {
    if (state.reduceMotion || !state.sections.length) return;
    const y = window.scrollY || document.documentElement.scrollTop || 0;

    state.sections.forEach(sec => {
      const v = state.values.get(sec);
      const targetC = y * CFG.SPEED.cactus;
      const targetL = y * CFG.SPEED.cloud;
      v.c = lerp(v.c, targetC, CFG.EASE);
      v.l = lerp(v.l, targetL, CFG.EASE);
      sec.style.setProperty('--shift-cactus', v.c.toFixed(2)+'px');
      sec.style.setProperty('--shift-cloud',  v.l.toFixed(2)+'px');
      // 旧CSSへの互換
      sec.style.setProperty('--decor-shift', v.c.toFixed(2)+'px');
    });

    requestAnimationFrame(tickParallax);
  }

  /* =========================
     入口アニメ（カーテン→背景回復→文字）
     ========================= */
  function runIntro() {
    state.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // has-reveal を先に（初期は文字を隠す）
    document.documentElement.classList.add('has-reveal');

    // カーテン要素を生成（青）
    const curtain = document.createElement('div');
    curtain.className = 'intro-curtain';
    document.body.appendChild(curtain);

    // 対象テキストを分割
    const eyebrow = qs('.hero .eyebrow');
    const brand   = qs('.hero .brand');
    const lines   = qsa('.hero .main-title .line');

    splitChars(eyebrow, CFG.CHAR.eyebrow.base, CFG.CHAR.eyebrow.stagger);
    lines.forEach((el, idx) => {
      const conf = idx === 0 ? CFG.CHAR.line1 : CFG.CHAR.line2;
      splitChars(el, conf.base, conf.stagger);
      el.style.setProperty('--sweep-delay', (1.0 + idx*0.12) + 's'); // 行演出の段差（任意）
    });
    splitChars(brand, CFG.CHAR.brand.base, CFG.CHAR.brand.stagger);

    if (state.reduceMotion) {
      // モーション弱者設定なら即表示
      curtain.remove();
      document.documentElement.classList.add('is-ready','is-hero-in');
      return;
    }

    const { HOLD, BG, GAP } = CFG;

    // 背景回復（青→透明）
    setTimeout(() => {
      curtain.classList.add('is-reveal-bg');
    }, HOLD);

    // カーテン退場（透明化→削除）
    setTimeout(() => {
      curtain.classList.add('is-hide');
      curtain.addEventListener('transitionend', () => curtain.remove(), { once:true });
    }, HOLD + BG - 150);

    // 文字などフェードイン開始（ここで初めて is-ready を付与）
    setTimeout(() => {
      document.documentElement.classList.add('is-ready','is-hero-in');
    }, HOLD + BG + GAP);
  }

  /* =========================
     実績セクションのふわっと表示（1回だけ）
     ========================= */
  function revealStatsBand() {
    const target = document.querySelector('.stats-band');
    if (!target) return;

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            target.classList.add('is-visible');
            io.unobserve(target);
          }
        });
      }, { threshold: 0.2 });
      io.observe(target);
    } else {
      // 古い環境向けフォールバック
      const onFallback = () => {
        const lim = window.innerHeight * 0.85;
        if (!target.classList.contains('is-visible') &&
            target.getBoundingClientRect().top < lim) {
          target.classList.add('is-visible');
          window.removeEventListener('scroll', onFallback);
        }
      };
      window.addEventListener('scroll', onFallback, { passive:true });
      onFallback();
    }
  }

  /* =========================
     セクションフェードイン（.fade-section）
     ========================= */
  function setupFadeSections() {
    const faders = qsa('.fade-section');
    if (!faders.length) return;

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target); // 1回だけ
          }
        });
      }, { threshold: 0.15 });
      faders.forEach(el => io.observe(el));
    } else {
      // フォールバック（質問に合わせた実装）
      function onFade() {
        const y = window.innerHeight * 0.85;
        faders.forEach(el => {
          if (!el.classList.contains('is-visible') &&
              el.getBoundingClientRect().top < y) {
            el.classList.add('is-visible');
          }
        });
      }
      window.addEventListener('scroll', onFade, { passive:true });
      onFade(); // 初期チェック
    }
  }

  /* =========================
     初期化
     ========================= */
  function init() {
    // セクション（デコあり）
    state.sections = qsa('.has-decor');
    state.sections.forEach(sec => state.values.set(sec, { c:0, l:0 }));

    // ヘッダー
    window.addEventListener('scroll', onScroll, { passive:true });
    applyHeader();

    // パララックス
    if (!state.reduceMotion && state.sections.length) {
      requestAnimationFrame(tickParallax);
    }

    // 入口アニメ
    runIntro();

    // セクションフェードイン
    setupFadeSections();

    // 実績セクションふわっと
    revealStatsBand();

    // スマホ移動量
    applyParallaxScale();
    const mq = window.matchMedia('(max-width: 900px)');
    mq.addEventListener ? mq.addEventListener('change', applyParallaxScale)
                        : mq.addListener && mq.addListener(applyParallaxScale); // 古いブラウザ対策
    window.addEventListener('orientationchange', applyParallaxScale);

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();


/* ===== メンバーカルーセル：ドット生成／同期 ===== */
function initTeamCarousel(){
  const wrap = document.querySelector('.team-carousel');
  if (!wrap) return;
  const track = wrap.querySelector('.team-track');
  const items = Array.from(track.children);

  // ドット生成
  const dots = document.createElement('div');
  dots.className = 'team-dots';
  items.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dot' + (i === 0 ? ' is-active' : '');
    b.setAttribute('aria-label', `スライド${i+1}`);
    b.addEventListener('click', () => {
      track.scrollTo({ left: items[i].offsetLeft, behavior: 'smooth' });
    });
    dots.appendChild(b);
  });
  wrap.appendChild(dots);

  // 現在位置を計算してドット同期
  function currentIndex(){
    const s = track.scrollLeft;
    let best = 1e9, idx = 0;
    items.forEach((it, i) => {
      const d = Math.abs(it.offsetLeft - s);
      if (d < best) { best = d; idx = i; }
    });
    return idx;
  }
  const update = () => {
    const i = currentIndex();
    dots.querySelectorAll('.dot').forEach((el, j) => {
      el.classList.toggle('is-active', i === j);
    });
  };
  track.addEventListener('scroll', () => {
    clearTimeout(track._t);
    track._t = setTimeout(update, 60);
  });
  update();
}

// ====== Member: ドットが無い場合だけ安全に生成（既存 initTeamCarousel と両立） ======
function ensureTeamDots(){
  const wrap  = document.querySelector('.team-carousel');
  if (!wrap) return;
  if (wrap.querySelector('.team-dots')) return; // 既にあるなら何もしない
  const track = wrap.querySelector('.team-track');
  if (!track) return;

  const items = Array.from(track.children).filter(el => !el.classList.contains('team-dots'));
  const dots = document.createElement('div');
  dots.className = 'team-dots';
  items.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dot' + (i === 0 ? ' is-active' : '');
    b.setAttribute('aria-label', `スライド${i+1}`);
    b.addEventListener('click', () => {
      track.scrollTo({ left: items[i].offsetLeft, behavior: 'smooth' });
    });
    dots.appendChild(b);
  });
  wrap.appendChild(dots);

  // スクロール位置に合わせてアクティブ同期
  function syncDots(){
    const s = track.scrollLeft;
    let best = 1e9, idx = 0;
    items.forEach((it, i) => {
      const d = Math.abs(it.offsetLeft - s);
      if (d < best) { best = d; idx = i; }
    });
    dots.querySelectorAll('.dot').forEach((el, j) => {
      el.classList.toggle('is-active', j === idx);
    });
  }
  track.addEventListener('scroll', () => {
    clearTimeout(track._syncT);
    track._syncT = setTimeout(syncDots, 60);
  });
  syncDots();
}

// ====== Member: 自動スクロール（手動操作中は一時停止・往復） ======
function autoScrollTeamCarousel(){
  const track = document.querySelector('.team-track');
  if (!track) return;

  let dir = 1;          // 1=右, -1=左
  const speed = 25;     // px/秒（ゆっくり）
  let paused = false;
  let rafId = null;
  let last = null;

  function step(ts){
    if (paused) { last = ts; rafId = requestAnimationFrame(step); return; }
    if (last == null) last = ts;
    const dt = (ts - last) / 1000; // 秒
    last = ts;

    track.scrollLeft += dir * speed * dt;

    // 端で反転
    if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 1) dir = -1;
    if (track.scrollLeft <= 0) dir = 1;

    rafId = requestAnimationFrame(step);
  }

  // ユーザー操作で一時停止／再開
  const pause = () => { paused = true; };
  const resume = () => { paused = false; };
  track.addEventListener('mouseenter', pause);
  track.addEventListener('mouseleave', resume);
  track.addEventListener('pointerdown', pause);
  track.addEventListener('pointerup', resume);
  track.addEventListener('touchstart', pause, {passive:true});
  track.addEventListener('touchend', resume);
  track.addEventListener('wheel', pause, {passive:true});
  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') pause();
  });

  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(step);
}

// ====== Member: 初期化（ロード後に実行、既存initとも共存） ======
function initMemberCarouselEnhance(){
  try { if (typeof initTeamCarousel === 'function') initTeamCarousel(); } catch(e){}
  ensureTeamDots();         // ドットが無い場合のみ作る
  autoScrollTeamCarousel(); // 自動スクロール開始
}

// DOM準備後に安全に実行（重複呼び出しでも安全）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(initMemberCarouselEnhance));
} else {
  requestAnimationFrame(initMemberCarouselEnhance);
}

// ③ init() 内で呼び出し＆リスナー設定（ヘッダー処理の前後どこでもOK）
applyParallaxScale();
const mq = window.matchMedia('(max-width: 900px)');
mq.addEventListener ? mq.addEventListener('change', applyParallaxScale)
                    : mq.addListener && mq.addListener(applyParallaxScale); // 古いブラウザ対策
window.addEventListener('orientationchange', applyParallaxScale);


// === Mobile nav toggle ===
(() => {
  const btn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('gnav');
  if (!btn || !nav) return;
  const toggle = () => {
    const open = nav.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open);
    document.body.classList.toggle('no-scroll', open);
  };
  btn.addEventListener('click', toggle);
  nav.addEventListener('click', e => { if (e.target.closest('a')) toggle(); });
})();
