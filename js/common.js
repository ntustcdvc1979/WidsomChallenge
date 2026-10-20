import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";
import { PUZZLE_LIST } from "./puzzles.js";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// 場次：網址 ?room=xxx，預設 main。投影幕開新場次時會換一個 room。
export function getRoom() {
  const r = new URLSearchParams(location.search).get("room") || "main";
  return r.replace(/[^\w-]/g, "").slice(0, 40) || "main";
}

// 海報配色輪流套用
const PALETTE = ["#e0457b", "#1f8a7a", "#8a4fb0", "#3a6fd0", "#e8503a", "#d98a1c", "#2e9b5a", "#b0476a"];

// 1 → 壹、12 → 拾貳、20 → 貳拾
export function cnNumber(n) {
  const d = "零壹貳參肆伍陸柒捌玖";
  if (n < 10) return d[n];
  if (n < 100) return (n >= 20 ? d[Math.floor(n / 10)] : "") + "拾" + (n % 10 ? d[n % 10] : "");
  return String(n);
}

// 答案只存雜湊，避免玩家看原始碼直接看到答案。題目在 js/puzzles.js 編輯。
export const PUZZLES = PUZZLE_LIST.map((p, i) => ({
  ...p,
  no: cnNumber(i + 1),
  color: p.color || PALETTE[i % PALETTE.length],
}));

// 全形轉半形、去空白、轉小寫
export function normalize(s) {
  return String(s)
    .replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, "")
    .toLowerCase();
}

export async function hashAnswer(puzzleId, answer) {
  const data = new TextEncoder().encode(`wisdom-challenge|${puzzleId}|${normalize(answer)}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
