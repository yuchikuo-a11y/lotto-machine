import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ---------- 基本設定 ----------
const N = 49, PICKS = 6;
const R = 2.6;            // 球體半徑
const r = 0.3;            // 號碼球半徑
const C = new THREE.Vector3(0, 1.2, 0); // 球體中心
const colorOf = (n) => n <= 10 ? '#facc15' : n <= 20 ? '#60a5fa' : n <= 30 ? '#f87171' : n <= 40 ? '#4ade80' : '#c084fc';

// ---------- 場景 ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0f172a');
scene.fog = new THREE.Fog('#0f172a', 18, 34);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
function placeCamera() {
  const a = innerWidth / innerHeight;
  const d = a < 0.8 ? 15.5 : a < 1.2 ? 12 : 10;
  camera.position.set(0, 1.6, d);
}
placeCamera();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.4, 0);
controls.minDistance = 6;
controls.maxDistance = 22;
controls.maxPolarAngle = Math.PI * 0.55;

scene.add(new THREE.AmbientLight('#ffffff', 0.55));
const sun = new THREE.DirectionalLight('#ffffff', 2.2);
sun.position.set(5, 10, 7);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 });
scene.add(sun);
const rim = new THREE.PointLight('#f472b6', 18, 20);
rim.position.set(-5, 4, -4);
scene.add(rim);

// 地板
const floor = new THREE.Mesh(new THREE.CircleGeometry(12, 64), new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.85 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -3.6;
floor.receiveShadow = true;
scene.add(floor);

// 底座
const metal = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.8, roughness: 0.3 });
const red = new THREE.MeshStandardMaterial({ color: '#b91c1c', metalness: 0.3, roughness: 0.45 });
const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 0.7, 48), red);
base.position.y = -3.25; base.castShadow = base.receiveShadow = true; scene.add(base);
const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.2, 1.6, 32), metal);
neck.position.y = -2.1; neck.castShadow = true; scene.add(neck);
const ring = new THREE.Mesh(new THREE.TorusGeometry(R + 0.04, 0.08, 16, 96), metal);
ring.position.copy(C); ring.castShadow = true; scene.add(ring);
const ring2 = ring.clone(); ring2.rotation.y = Math.PI / 2; scene.add(ring2);

// 玻璃球
const glass = new THREE.Mesh(
  new THREE.SphereGeometry(R + 0.02, 64, 48),
  new THREE.MeshPhysicalMaterial({ color: '#e0f2fe', transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0,
    clearcoat: 1, side: THREE.DoubleSide, depthWrite: false })
);
glass.position.copy(C);
scene.add(glass);

// 出球管與軌道
const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.4, 24, 1, true),
  new THREE.MeshPhysicalMaterial({ color: '#e0f2fe', transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }));
{
  const a = new THREE.Vector3(0, C.y - R + 0.1, 0.4), b2 = new THREE.Vector3(0, C.y - R - 0.6, 2.0);
  tube.position.copy(a).add(b2).multiplyScalar(0.5);
  tube.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b2.clone().sub(a).normalize());
  tube.scale.y = a.distanceTo(b2) / 1.4;
}
scene.add(tube);

const trayY = -2.75, trayZ = 2.9;
const slotX = (i) => (i < PICKS ? (i - 3) * 0.78 : 2.85 + 0.2);
const tray = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.12, 0.8), metal);
tray.position.set(0.2, trayY - r - 0.06, trayZ); tray.castShadow = tray.receiveShadow = true; scene.add(tray);
const lip = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.25, 0.08), red);
lip.position.set(0.2, trayY - r + 0.1, trayZ + 0.38); scene.add(lip);
const divider = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.8), new THREE.MeshStandardMaterial({ color: '#facc15', metalness: 0.5, roughness: 0.3 }));
divider.position.set(2.42, trayY - 0.1, trayZ); scene.add(divider);

// ---------- 號碼球 ----------
function numberTexture(n) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = colorOf(n); g.fillRect(0, 0, 256, 128);
  g.font = 'bold 44px system-ui, Arial';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const x of [64, 192]) {
    g.fillStyle = '#fff';
    g.beginPath(); g.ellipse(x, 64, 30, 40, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#111'; g.fillText(String(n), x, 66);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const ballGeo = new THREE.SphereGeometry(r, 32, 24);
const balls = [];
for (let n = 1; n <= N; n++) {
  const m = new THREE.Mesh(ballGeo, new THREE.MeshStandardMaterial({ map: numberTexture(n), roughness: 0.25, metalness: 0.05 }));
  m.castShadow = true;
  m.userData = { n, v: new THREE.Vector3(), spin: new THREE.Vector3(), state: 'in', pop: 0 };
  scene.add(m);
  balls.push(m);
}

function scatter() {
  for (const b of balls) {
    const d = b.userData;
    // 隨機放在球體下半部
    let p;
    do { p = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).multiplyScalar(R - r - 0.05); }
    while (p.length() > R - r - 0.05);
    p.y = -Math.abs(p.y) * 0.9;
    b.position.copy(C).add(p);
    d.v.set(0, 0, 0); d.state = 'in'; d.anim = null;
    b.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    b.scale.setScalar(1);
  }
}
scatter();

// ---------- 物理 ----------
let blowing = 0; // 吹風強度 0~1
const G = 9.0, tmp = new THREE.Vector3(), nrm = new THREE.Vector3();
function physics(dt) {
  const inside = balls.filter((b) => b.userData.state === 'in');
  for (const b of inside) {
    const v = b.userData.v;
    v.y -= G * dt;
    if (blowing > 0) {
      // 底部往上吹的亂流
      const low = Math.max(0, (C.y - b.position.y) / R + 0.3);
      v.y += (14 + Math.random() * 10) * blowing * low * dt;
      v.x += (Math.random() - 0.5) * 30 * blowing * dt;
      v.z += (Math.random() - 0.5) * 30 * blowing * dt;
    }
    v.multiplyScalar(1 - 0.6 * dt);
    b.position.addScaledVector(v, dt);
    // 碰球壁
    tmp.subVectors(b.position, C);
    const len = tmp.length(), lim = R - r;
    if (len > lim) {
      nrm.copy(tmp).divideScalar(len);
      b.position.copy(C).addScaledVector(nrm, lim);
      const vn = v.dot(nrm);
      if (vn > 0) v.addScaledVector(nrm, -1.6 * vn);
      v.multiplyScalar(0.985);
    }
    // 轉動（跟著速度滾）
    b.rotation.x += v.z * dt / r * 0.5;
    b.rotation.z -= v.x * dt / r * 0.5;
  }
  // 球與球碰撞
  for (let i = 0; i < inside.length; i++) {
    const a = inside[i];
    for (let j = i + 1; j < inside.length; j++) {
      const b = inside[j];
      tmp.subVectors(b.position, a.position);
      const d2 = tmp.lengthSq(), min = 2 * r;
      if (d2 < min * min && d2 > 1e-8) {
        const d = Math.sqrt(d2);
        nrm.copy(tmp).divideScalar(d);
        const push = (min - d) / 2;
        a.position.addScaledVector(nrm, -push);
        b.position.addScaledVector(nrm, push);
        const rel = tmp.subVectors(b.userData.v, a.userData.v).dot(nrm);
        if (rel < 0) {
          const imp = -0.9 * rel;
          a.userData.v.addScaledVector(nrm, -imp);
          b.userData.v.addScaledVector(nrm, imp);
        }
      }
    }
  }
}

// ---------- 公平亂數（crypto） ----------
function randInt(max) {
  const lim = Math.floor(0x100000000 / max) * max;
  const u = new Uint32Array(1);
  do { crypto.getRandomValues(u); } while (u[0] >= lim);
  return u[0] % max;
}

// ---------- 開獎流程 ----------
const $ = (id) => document.getElementById(id);
const drawBtn = $('draw'), resetBtn = $('reset'), resultEl = $('result');
let drawing = false, drawn = [];
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

function ballHTML(n, special) {
  return `<span class="ball${special ? ' special' : ''}" style="background:${colorOf(n)}">${String(n).padStart(2, '0')}</span>`;
}
function renderResult(done) {
  const main = drawn.slice(0, PICKS), sp = drawn[PICKS];
  const shown = done ? [...main].sort((a, b) => a - b) : main;
  let h = shown.map((n) => ballHTML(n)).join('');
  if (sp) h += `<span class="plus">特別號</span>${ballHTML(sp, true)}`;
  resultEl.innerHTML = h || '<span class="hint">攪拌中…</span>';
}

function launch(b, slot) {
  const d = b.userData;
  d.state = 'out';
  const p0 = b.position.clone();
  const p1 = new THREE.Vector3(0, C.y - R + r + 0.05, 0.4);            // 出口
  const p2 = new THREE.Vector3(0, C.y - R - 0.6, 2.0);                  // 管子下方
  const p3 = new THREE.Vector3(slotX(slot), trayY, trayZ);              // 軌道位置
  const curve = new THREE.CatmullRomCurve3([p0, p1, p2, new THREE.Vector3((p2.x + p3.x) / 2, trayY + 0.4, trayZ), p3]);
  d.anim = { curve, t: 0, dur: 1.3 };
}

async function startDraw() {
  if (drawing) return;
  drawing = true; drawBtn.disabled = true; resetBtn.disabled = true;
  if (drawn.length) { scatter(); drawn = []; await wait(300); }
  renderResult(false);
  blowing = 1;
  await wait(2200);
  const pool = balls.slice();
  for (let i = 0; i <= PICKS; i++) {
    const b = pool.splice(randInt(pool.length), 1)[0];
    launch(b, i);
    await wait(1350);
    drawn.push(b.userData.n);
    renderResult(false);
    await wait(250);
  }
  blowing = 0;
  renderResult(true);
  saveHistory();
  drawing = false; drawBtn.disabled = false; resetBtn.disabled = false;
  drawBtn.textContent = '再開一次';
}
drawBtn.addEventListener('click', startDraw);
resetBtn.addEventListener('click', () => {
  if (drawing) return;
  scatter(); drawn = []; blowing = 0;
  resultEl.innerHTML = '<span class="hint">按「開獎」開始</span>';
  drawBtn.textContent = '開獎';
});

// ---------- 紀錄（存在這台裝置） ----------
const histEl = $('history');
function loadHistory() { try { return JSON.parse(localStorage.getItem('lotto-history') || '[]'); } catch { return []; } }
function saveHistory() {
  const list = loadHistory();
  const main = drawn.slice(0, PICKS).sort((a, b) => a - b).map((n) => String(n).padStart(2, '0')).join(' ');
  const t = new Date();
  list.unshift(`${t.getMonth() + 1}/${t.getDate()} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}　${main}　特別號 ${String(drawn[PICKS]).padStart(2, '0')}`);
  try { localStorage.setItem('lotto-history', JSON.stringify(list.slice(0, 20))); } catch {}
  if (histEl.style.display === 'block') showHistory();
}
function showHistory() {
  const list = loadHistory();
  histEl.innerHTML = list.length ? list.map((s) => `<div>${s}</div>`).join('') : '<div>還沒有開獎紀錄</div>';
}
$('histBtn').addEventListener('click', () => {
  const open = histEl.style.display !== 'block';
  histEl.style.display = open ? 'block' : 'none';
  if (open) showHistory();
});

// ---------- 點球互動 ----------
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), toast = $('toast');
let toastTimer;
renderer.domElement.addEventListener('pointerdown', (e) => {
  ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects(balls, false)[0];
  if (!hit) return;
  const b = hit.object, d = b.userData;
  d.pop = 1;
  if (d.state === 'in') d.v.add(new THREE.Vector3((Math.random() - 0.5) * 2, 5, (Math.random() - 0.5) * 2));
  toast.textContent = `${d.n} 號球`;
  toast.style.background = colorOf(d.n);
  toast.style.color = '#111';
  toast.style.opacity = 1;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.style.opacity = 0), 900);
});

// ---------- 動畫迴圈 ----------
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 1 / 30);
  const steps = 3;
  for (let i = 0; i < steps; i++) physics(dt / steps);
  for (const b of balls) {
    const d = b.userData;
    if (d.anim) {
      d.anim.t = Math.min(1, d.anim.t + dt / d.anim.dur);
      const e = 1 - Math.pow(1 - d.anim.t, 2);
      b.position.copy(d.anim.curve.getPoint(e));
      b.rotation.z -= dt * 8 * (1 - d.anim.t);
      if (d.anim.t >= 1) { d.anim = null; b.rotation.set(0, 0, 0); }
    }
    if (d.pop > 0) { d.pop = Math.max(0, d.pop - dt * 2.5); b.scale.setScalar(1 + Math.sin(d.pop * Math.PI) * 0.45); }
  }
  controls.update();
  renderer.render(scene, camera);
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

window.__lotto = { startDraw, get drawn() { return drawn.slice(); }, get drawing() { return drawing; } };
