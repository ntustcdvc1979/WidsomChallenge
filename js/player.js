import { doc, getDoc, getDocs, setDoc, collection, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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
let myName = "";
let solved = {};
// 答對但還沒成功寫到 Firebase 的題目，存在手機上，連線恢復後自動補送
const PENDING_KEY = `wc-pending-${room}`;
let pending = new Set(JSON.parse(localStorage.getItem(PENDING_KEY) || "[]"));
const savePending = () => localStorage.setItem(PENDING_KEY, JSON.stringify([...pending]));

$("meTotal").textContent = PUZZLES.length;
$("nameInput").value = localStorage.getItem("wc-name") || "";

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  uid = user.uid;
  playerRef = doc(db, "rooms", room, "players", uid);
  const snap = await getDoc(playerRef);
  if (snap.exists()) startGame(snap.data());
  else pending.clear(), savePending();
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
    const data = { name, joinedAt: serverTimestamp() };
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

async function startGame(data) {
  myName = data.name;
  $("join").classList.add("hidden");
  $("game").classList.remove("hidden");
  $("meName").textContent = myName;
  for (const id of pending) solved[id] = true;
  renderList();
  updateScore();
  // 讀回已答對的題目（換頁、重新整理後不會消失）
  try {
    const mine = await getDocs(query(collection(db, "rooms", room, "solves"), where("uid", "==", uid)));
    mine.forEach((d) => (solved[d.data().puzzle] = true));
    if ($("detail").classList.contains("hidden")) renderList();
    updateScore();
  } catch (e) {
    console.error(e);
  }
  flushPending();
}

// 寫入一筆答對紀錄：rooms/{room}/solves/{uid}_{題目id}
async function saveSolve(pid) {
  const ref = doc(db, "rooms", room, "solves", `${uid}_${pid}`);
  try {
    await setDoc(ref, { uid, puzzle: pid, name: myName, at: serverTimestamp() });
  } catch (e) {
    // 已經寫過（例如重送）規則會拒絕覆寫，這時檢查是否已存在
    const snap = await getDoc(ref).catch(() => null);
    if (!snap?.exists()) throw e;
  }
}

let flushing = false;
async function flushPending() {
  if (flushing || !pending.size) return updateSync();
  flushing = true;
  for (const pid of [...pending]) {
    try {
      await saveSolve(pid);
      pending.delete(pid);
      savePending();
    } catch (e) {
      console.error("同步失敗", pid, e.code || e);
    }
  }
  flushing = false;
  updateSync();
  if (pending.size) setTimeout(flushPending, 5000);
}

function updateSync() {
  $("syncNote").textContent = pending.size ? "成績上傳中…" : "";
}
addEventListener("online", flushPending);

// 題目列表（縮圖格）
function renderList() {
  $("tiles").innerHTML = PUZZLES.map(
    (p) => `
    <button class="tile paper ${solved[p.id] ? "solved" : ""}" data-id="${p.id}">
      <span class="tile-img" style="background-image:url('${p.img}')"></span>
      <span class="tile-name" style="--bg:${p.color}">${p.no}．${escapeHtml(p.title)}</span>
      <span class="stamp">過關</span>
    </button>`
  ).join("");
  for (const el of document.querySelectorAll(".tile")) el.onclick = () => openPuzzle(el.dataset.id);
}

// 單題作答
function openPuzzle(id) {
  const p = PUZZLES.find((x) => x.id === id);
  $("detailBody").innerHTML = `
    <article class="pitem paper ${solved[p.id] ? "solved" : ""}" data-id="${p.id}">
      <div class="pc-label"><span class="brush" style="--bg:${p.color}">${p.no}．${escapeHtml(p.title)}</span></div>
      <div class="stamp">過關</div>
      <div class="hint">${escapeHtml(p.hint || "")}</div>
      <img src="${p.img}" alt="${escapeHtml(p.title)}">
      <div class="answer">${p.type === "card" ? cardPicker() : textInput(p)}
        <div class="msg"></div>
      </div>
      <div class="solved-tag">答對了！</div>
    </article>`;
  const el = $("detailBody").querySelector(".pitem");
  el.querySelector("img").onclick = () => {
    $("zoom").querySelector("img").src = p.img;
    $("zoom").classList.remove("hidden");
  };
  if (p.type === "card") bindCard(el, p);
  else bindText(el, p);
  $("overview").classList.add("hidden");
  $("detail").classList.remove("hidden");
  history.pushState({ puzzle: id }, "");
  scrollTo(0, 0);
}

function closePuzzle() {
  $("detail").classList.add("hidden");
  $("overview").classList.remove("hidden");
  renderList();
}
$("backBtn").onclick = () => history.back();
addEventListener("popstate", closePuzzle); // 手機返回鍵也能回列表
$("zoom").onclick = () => $("zoom").classList.add("hidden");

function textInput(p) {
  const attrs = p.type === "number"
    ? `inputmode="numeric" pattern="[0-9]*" placeholder="${escapeHtml(p.placeholder || "輸入數字")}"`
    : `placeholder="${escapeHtml(p.placeholder || "輸入答案（英文大小寫皆可）")}" autocapitalize="off"`;
  return `<div class="row"><input class="input" ${attrs} autocomplete="off"><button class="btn">送出</button></div>`;
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
  const ok = p.hashes.includes(await hashAnswer(p.id, answer));
  if (!ok) {
    cooldown[p.id] = Date.now() + 2000;
    return showMsg(el, "答錯了，再想想！");
  }
  // 答對就立即顯示，成績在背景上傳（失敗會自動重試，不影響玩家）
  solved[p.id] = true;
  pending.add(p.id);
  savePending();
  flushPending();
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
