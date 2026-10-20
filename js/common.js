import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// 場次：網址 ?room=xxx，預設 main。投影幕開新場次時會換一個 room。
export function getRoom() {
  const r = new URLSearchParams(location.search).get("room") || "main";
  return r.replace(/[^\w-]/g, "").slice(0, 40) || "main";
}

// 答案只存雜湊，避免玩家看原始碼直接看到答案。
// 產生方式：開 tools/hash.html 輸入謎題 id 與答案。
export const PUZZLES = [
  {
    id: "card",
    no: "壹",
    title: "撲克之謎",
    hint: "猜一張撲克牌：花色 + 數字",
    img: "img/one.webp",
    type: "card",
    color: "var(--c-pink)",
    hash: "248d206bd32d2c1ad3e9debd1a1542a2c83076a3dcdf484f2ab60c7126215fad",
  },
  {
    id: "wisdom",
    no: "貳",
    title: "智慧之問",
    hint: "看圖解出英文答案",
    img: "img/wisdom.webp",
    type: "text",
    color: "var(--c-teal)",
    hash: "5f02def641b8660568d75dc3924b8ae023cd2bc184b1b476983eaf377905e10b",
  },
  {
    id: "seven",
    no: "參",
    title: "水果之謎",
    hint: "請輸入英文答案",
    img: "img/7.webp",
    type: "text",
    color: "var(--c-purple)",
    hash: "7237bd8e7ec8e2b6f1dc410cf3ccc79913e3cde56e5265e853e7a580861b46f4",
  },
];

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
