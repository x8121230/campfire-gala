// A DOM curtain survives Phaser scene shutdown and reveals only a drawn destination.
let active = null;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function animate(el, frames, duration) {
  if (!el.animate) { Object.assign(el.style, frames.at(-1)); await wait(duration); return; }
  try { await el.animate(frames, { duration, easing: 'ease-in-out', fill: 'forwards' }).finished; } catch {}
}
function remove(state) {
  clearTimeout(state.timeout);
  state.root.remove();
  if (active === state) active = null;
}

export async function travelBetweenRealms(scene, target, data = {}) {
  if (active) return;
  const root = document.createElement('div');
  root.setAttribute('aria-label', '花環傳送中');
  root.style.cssText = 'position:fixed;inset:0;z-index:10050;overflow:hidden;pointer-events:auto';
  const veil = document.createElement('div');
  veil.style.cssText = 'position:absolute;inset:0;background:radial-gradient(ellipse at 50% 56%,#fffdf0 5%,#f5f2d7 55%,#d4e7d6);opacity:0';
  root.append(veil);
  const garden = document.createElement('div');
  garden.style.cssText = 'position:absolute;inset:0;pointer-events:none';
  root.append(garden);
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) for (let i = 0; i < 28; i++) {
    const petal = document.createElement('i');
    const angle = i * 2.39996;
    petal.style.cssText = `position:absolute;left:${50 + Math.cos(angle) * 62}%;top:${52 + Math.sin(angle) * 65}%;width:${8 + i % 4 * 3}px;height:${16 + i % 3 * 5}px;border-radius:80% 10% 80% 10%;background:${['#fff7d6','#c7e5c2','#efd6a5','#e4eed7'][i % 4]};box-shadow:0 0 10px #fff4c9;opacity:0`;
    garden.append(petal);
    animate(petal, [{ opacity: 0, transform: `rotate(${i * 37}deg)` }, { opacity: .95, offset: .3 }, { opacity: 0, left: '50%', top: '52%', transform: `rotate(${i * 37 + 100}deg) scale(.2)` }], 560);
  }
  const title = document.createElement('div');
  title.textContent = target === 'RealmWorldGame' ? '星芽營地' : '晨曦蒲公英丘陵';
  title.style.cssText = 'position:absolute;inset:0;display:grid;place-items:center;color:#526b50;font:700 clamp(22px,3vw,38px) "Microsoft JhengHei",sans-serif;letter-spacing:.18em;opacity:0;text-shadow:0 2px 0 #fffdf0';
  root.append(title); document.body.append(root);
  const state = { root, veil, title, garden };
  active = state;
  // Never leave an opaque input-blocking layer if loading or scene startup fails.
  state.timeout = setTimeout(() => remove(state), 12000);
  await animate(veil, [{ opacity: 0 }, { opacity: 1 }], reduced ? 150 : 600);
  if (active !== state) return;
  animate(title, [{ opacity: 0 }, { opacity: 1 }], 180);
  try { scene.scene.start(target, { ...data, portalArrival: true }); }
  catch (error) { remove(state); throw error; }
}

export async function revealRealmArrival() {
  const state = active;
  if (!state) return;
  await Promise.all([
    animate(state.veil, [{ opacity: 1 }, { opacity: 0 }], 350),
    animate(state.title, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(-10px)' }], 350)
  ]);
  remove(state);
}
