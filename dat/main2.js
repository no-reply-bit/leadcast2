// dat/main2.js — Mobile Nav only
(() => {
  const btn = document.querySelector('.nav-toggle');   // 右上ボタン
  const nav = document.getElementById('gnav');         // 開閉ターゲット
  if (!btn || !nav) return;

  const open  = () => { nav.classList.add('is-open');  btn.setAttribute('aria-expanded','true');  document.body.classList.add('no-scroll'); };
  const close = () => { nav.classList.remove('is-open');btn.setAttribute('aria-expanded','false'); document.body.classList.remove('no-scroll'); };
  const toggle = () => (nav.classList.contains('is-open') ? close() : open());

  btn.addEventListener('click', toggle);
  nav.addEventListener('click', e => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  document.addEventListener('click', e => {
    if (!nav.classList.contains('is-open')) return;
    if (!e.target.closest('#gnav') && !e.target.closest('.nav-toggle')) close();
  }, { passive:true });
})();
