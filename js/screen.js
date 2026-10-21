import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, getRoom, PUZZLES, escapeHtml } from "./common.js";

const room = getRoom();
const board = document.getElementById("board");
const zoom = document.getElementById("zoom");

// ---- 題目卡：依題數自動排版（1 排最多 4 題，超過就分 2、3… 排） ----
const n = PUZZLES.length;
const rows = Math.max(1, Math.ceil(n / 4));
const cols = Math.ceil(n / rows);
board.innerHTML =
  `<div class="pgrid" style="--cols:${cols};--rows:${rows};--s:${rows === 1 ? 1 : rows === 2 ? 0.62 : 0.45}">` +
  PUZZLES.map(
    (p) => `
  <section class="pcard paper" data-id="${p.id}" style="--c:${p.color}">
    <div class="pc-label"><span class="brush" style="--bg:${p.color}">${p.no}．${p.title}</span></div>
    <div class="pc-hint">${escapeHtml(p.hint || "")}</div>
    <div class="pc-img" style="background-image:url('${p.img}')"></div>
    <div class="pc-foot">
      <div class="count"><span class="n">0</span><small>人答對</small></div>
      <div class="bar"><i></i></div>
      <div class="pct">答對率 0%</div>
    </div>
  </section>`
  ).join("") +
  `</div>
  <aside class="side">
    <div class="qr-box paper">
      <div id="qr"></div>
      <div class="qr-tip">掃我加入挑戰</div>
      <div class="qr-url" id="qrUrl"></div>
    </div>
    <div class="feed paper">
      <h3>即時快報</h3>
      <ul id="feed"></ul>
    </div>
  </aside>`;

board.addEventListener("click", (e) => {
  const card = e.target.closest(".pcard");
  if (!card) return;
  const p = PUZZLES.find((x) => x.id === card.dataset.id);
  zoom.querySelector("img").src = p.img;
  zoom.classList.remove("hidden");
});
zoom.addEventListener("click", () => zoom.classList.add("hidden"));
document.addEventListener("keydown", (e) => e.key === "Escape" && zoom.classList.add("hidden"));

// ---- QR Code ----
const playerUrl = new URL("index.html", location.href);
playerUrl.search = room === "main" ? "" : `?room=${room}`;
const qr = qrcode(0, "M");
qr.addData(playerUrl.href);
qr.make();
document.getElementById("qr").innerHTML = qr.createSvgTag({ cellSize: 6, margin: 0, scalable: true });
document.getElementById("qrUrl").textContent = playerUrl.href;
document.getElementById("roomLabel").textContent = `場次：${room}`;

// ---- 工具 ----
document.getElementById("fullscreen").onclick = () =>
  document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
document.getElementById("newRoom").onclick = () => {
  if (!confirm("開新場次會換一個新的 QR Code，計數從 0 開始（舊資料保留）。確定？")) return;
  const d = new Date();
  const id = `r${d.getMonth() + 1}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
  location.search = `?room=${id}`;
};

// ---- 即時統計 ----
// players：加入的人（算總人數）；solves：每一筆答對紀錄 {uid, puzzle, name, at}
const prev = {};
const seen = new Set();
let first = true;
let total = 0;
let solves = [];
const feed = document.getElementById("feed");

onSnapshot(collection(db, "rooms", room, "players"), (snap) => {
  total = snap.size;
  render();
});
onSnapshot(collection(db, "rooms", room, "solves"), (snap) => {
  solves = snap.docs.map((d) => d.data()).filter((s) => PUZZLES.some((q) => q.id === s.puzzle));
  render();
  first = false; // 第一次載入的舊紀錄不播動畫
});

function render() {
  document.getElementById("total").textContent = total;

  const byUser = {};
  for (const s of solves) (byUser[s.uid] ||= new Set()).add(s.puzzle);
  document.getElementById("allclear").textContent = Object.values(byUser).filter((set) => set.size >= PUZZLES.length).length;

  for (const q of PUZZLES) {
    const n = solves.filter((s) => s.puzzle === q.id).length;
    const card = board.querySelector(`.pcard[data-id="${q.id}"]`);
    card.querySelector(".n").textContent = n;
    const pct = total ? Math.min(100, Math.round((n / total) * 100)) : 0;
    card.querySelector(".bar i").style.width = pct + "%";
    card.querySelector(".pct").textContent = `答對率 ${pct}%`;
    if (prev[q.id] !== undefined && n > prev[q.id]) {
      card.classList.remove("bump");
      void card.offsetWidth;
      card.classList.add("bump");
    }
    prev[q.id] = n;
  }

  // 快報：依答對時間排序，最新在上
  const events = solves
    .map((s) => ({ key: `${s.uid}:${s.puzzle}`, name: s.name, q: PUZZLES.find((q) => q.id === s.puzzle), t: s.at?.toMillis?.() ?? Date.now() }))
    .sort((a, b) => b.t - a.t);
  feed.innerHTML = events
    .slice(0, 30)
    .map(
      (e) =>
        `<li style="--c:${e.q.color}"${seen.has(e.key) || first ? ' class="old"' : ""}><span class="dot"></span><span class="who">${escapeHtml(e.name)}</span> 解開了「${escapeHtml(e.q.title)}」</li>`
    )
    .join("");
  events.forEach((e) => seen.add(e.key));
}
