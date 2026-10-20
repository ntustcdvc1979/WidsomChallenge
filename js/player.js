import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { db, auth, getRoom, PUZZLES, hashAnswer, escapeHtml } from "./common.js";

const room = getRoom();
const $ = (id) => document.getElementById(id);
const SUITS = [
  { id: "spade", sym: "♠", name: "黑桃" },
  { id: "heart", sym: "♥", name: "紅心", red: true },
  { id: "diamond", sym: "♦", name: "方塊", red: true },
  { id: "club", sym: "♣", name: "梅花" },
];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

let uid = null;
let playerRef = null;
let solved = {};

$("meTotal").textContent = PUZZLES.length;
$("nameInput").value = localStorage.getItem("wc-name") || "";

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  uid = user.uid;
  playerRef = doc(db, "rooms", room, "players", uid);
  const snap = await getDoc(playerRef);
  if (snap.exists()) startGame(snap.data());
});
signInAnonymously(auth).catch((e) => {
  $("joinMsg").textContent = "連線失敗，請重新整理";
  console.error(e);
});

$("joinBtn").onclick = async () => {
  const name = $("nameInput").value.trim().slice(0, 12);
  if (!name) return ($("joinMsg").textContent = "請輸入暱稱");
  if (!uid) return ($("joinMsg").textContent = "連線中，請稍候再按一次");
  $("joinBtn").disabled = true;
  try {
    const data = { name, joinedAt: serverTimestamp(), solved: {} };
    await setDoc(playerRef, data);
    localStorage.setItem("wc-name", name);
    startGame(data);
  } catch (e) {
    console.error(e);
    $("joinMsg").textContent = "加入失敗，請再試一次";
    $("joinBtn").disabled = false;
  }
};
$("nameInput").addEventListener("keydown", (e) => e.key === "Enter" && $("joinBtn").click());

function startGame(data) {
  solved = { ...(data.solved || {}) };
  $("join").classList.add("hidden");
  $("game").classList.remove("hidden");
  $("meName").textContent = data.name;
  renderList();
  updateScore();
}

function renderList() {
  $("plist").innerHTML = PUZZLES.map(
    (p) => `
    <article class="pitem paper ${solved[p.id] ? "solved" : ""}" data-id="${p.id}">
      <div class="pc-label"><span class="brush" style="--bg:${p.color}">${p.no}．${p.title}</span></div>
      <div class="stamp">過關</div>
      <div class="hint">${escapeHtml(p.hint)}</div>
      <img src="${p.img}" alt="${p.title}" loading="lazy">
      <div class="answer">${p.type === "card" ? cardPicker() : textInput()}
        <div class="msg"></div>
      </div>
      <div class="solved-tag">答對了！</div>
    </article>`
  ).join("");

  for (const el of document.querySelectorAll(".pitem")) {
    const p = PUZZLES.find((x) => x.id === el.dataset.id);
    el.querySelector("img").onclick = () => {
      $("zoom").querySelector("img").src = p.img;
      $("zoom").classList.remove("hidden");
    };
    if (p.type === "card") bindCard(el, p);
    else bindText(el, p);
  }
}
$("zoom").onclick = () => $("zoom").classList.add("hidden");

function textInput() {
  return `<div class="row"><input class="input" placeholder="輸入答案" autocomplete="off" autocapitalize="off"><button class="btn">送出</button></div>`;
}

function cardPicker() {
  return `
    <div class="suits">${SUITS.map((s) => `<button class="chip ${s.red ? "red" : ""}" data-suit="${s.id}" aria-label="${s.name}">${s.sym}</button>`).join("")}</div>
    <div class="ranks">${RANKS.map((r) => `<button class="chip" data-rank="${r}">${r}</button>`).join("")}</div>
    <div class="card-preview">你選的是：<b class="pick">—</b></div>
    <button class="btn">送出</button>`;
}

function bindText(el, p) {
  const input = el.querySelector("input");
  const btn = el.querySelector(".btn");
  btn.onclick = () => submit(el, p, input.value);
  input.addEventListener("keydown", (e) => e.key === "Enter" && btn.click());
}

function bindCard(el, p) {
  let suit = null, rank = null;
  const refresh = () => {
    el.querySelectorAll("[data-suit]").forEach((b) => b.classList.toggle("on", b.dataset.suit === suit));
    el.querySelectorAll("[data-rank]").forEach((b) => b.classList.toggle("on", b.dataset.rank === rank));
    const s = SUITS.find((x) => x.id === suit);
    el.querySelector(".pick").textContent = s || rank ? `${s ? s.name + " " + s.sym : "？"} ${rank || "？"}` : "—";
  };
  el.querySelectorAll("[data-suit]").forEach((b) => (b.onclick = () => ((suit = b.dataset.suit), refresh())));
  el.querySelectorAll("[data-rank]").forEach((b) => (b.onclick = () => ((rank = b.dataset.rank), refresh())));
  el.querySelector(".answer > .btn").onclick = () => {
    if (!suit || !rank) return showMsg(el, "請選花色和數字");
    submit(el, p, `${suit}-${rank}`);
  };
}

const cooldown = {};
async function submit(el, p, answer) {
  if (!String(answer).trim()) return showMsg(el, "請輸入答案");
  if (Date.now() < (cooldown[p.id] || 0)) return showMsg(el, "休息一下，2 秒後再試");
  const ok = (await hashAnswer(p.id, answer)) === p.hash;
  if (!ok) {
    cooldown[p.id] = Date.now() + 2000;
    return showMsg(el, "答錯了，再想想！");
  }
  try {
    await updateDoc(playerRef, { [`solved.${p.id}`]: serverTimestamp() });
  } catch (e) {
    console.error(e);
    return showMsg(el, "網路不穩，請再按一次送出");
  }
  solved[p.id] = true;
  el.classList.add("solved");
  updateScore();
  navigator.vibrate?.(120);
  if (PUZZLES.every((q) => solved[q.id])) setTimeout(() => $("celebrate").classList.remove("hidden"), 600);
}

function showMsg(el, text) {
  const m = el.querySelector(".msg");
  m.textContent = text;
  m.classList.remove("bad");
  void m.offsetWidth;
  m.classList.add("bad");
}

function updateScore() {
  $("meScore").textContent = PUZZLES.filter((q) => solved[q.id]).length;
}
