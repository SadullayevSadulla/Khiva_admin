import api from "../../api";

const LIST_KEYS = ["data", "contacts", "messages", "items", "rows", "results", "list", "docs", "content"];

export const extractList = (body, depth = 0) => {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== "object" || depth > 2) return null;
  for (const key of LIST_KEYS) {
    if (key in body) {
      const found = extractList(body[key], depth + 1);
      if (found) return found;
    }
  }
  for (const value of Object.values(body)) {
    if (Array.isArray(value)) return value;
  }
  return null;
};

export const extractTotal = (body) => {
  const candidates = [
    body?.total,
    body?.count,
    body?.totalItems,
    body?.meta?.total,
    body?.pagination?.total,
    body?.data?.total,
    body?.data?.count,
    body?.data?.meta?.total,
  ];
  const found = candidates.find((v) => Number.isFinite(Number(v)) && Number(v) > 0);
  return found ? Number(found) : null;
};

// Server xatosini o'qiladigan matnga aylantiradi
export const getErrorText = (err) => {
  const res = err.response;
  if (!res) return err.message || "Serverga ulanib bo'lmadi (tarmoq yoki CORS xatosi).";
  const raw = res.data?.message ?? res.data?.error ?? res.data?.errors ?? res.data;
  let text = "";
  if (typeof raw === "string") text = raw;
  else if (Array.isArray(raw)) text = raw.map((x) => (typeof x === "string" ? x : x?.message || JSON.stringify(x))).join("; ");
  else if (raw && typeof raw === "object") text = JSON.stringify(raw);
  return `${res.status}: ${text || "Xatolik yuz berdi!"}`;
};

export const getName = (r) =>
  r.fullName ||
  [r.firstName, r.lastName].filter(Boolean).join(" ") ||
  r.name ||
  r.username ||
  r.senderName ||
  "—";
export const getEmail = (r) => r.email || r.senderEmail || "";
export const getPhone = (r) => r.phone || r.phoneNumber || r.tel || "";
export const getSubject = (r) => r.subject || r.title || r.topic || "";
export const getText = (r) => r.message || r.text || r.content || r.body || r.comment || r.description || "";
export const getDate = (r) => r.createdAt || r.created_at || r.date || r.sentAt || "";

export const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const preview = (text, max = 70) => {
  const clean = String(text).replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean || "—";
};

export async function fetchRequests() {
  const res = await api.get("/api/admin/contact");
  let list = extractList(res.data);

  if (!list) {
    console.warn("Kutilmagan server javobi:", res.data);
    const error = new Error("Server javobida xabarlar ro'yxati topilmadi. F12 → Console da javobni ko'ring.");
    error.isShapeError = true;
    throw error;
  }

  const total = extractTotal(res.data);

  if (total && list.length < total) {
    const all = [...list];
    const firstId = list[0]?.id;
    for (let page = 2; all.length < total && page <= 50; page += 1) {
      const r = await api.get(`/api/admin/contact?page=${page}`);
      const chunk = extractList(r.data) || [];
      if (chunk.length === 0 || chunk[0]?.id === firstId) break;
      all.push(...chunk);
    }
    list = all;
  }

  return { list, total };
}

export async function fetchRequest(id) {
  const res = await api.get(`/api/admin/contact/${id}`);
  const data = res.data?.data || res.data;
  return data && typeof data === "object" && !Array.isArray(data) ? data : null;
}

export const deleteRequest = (id) => api.delete(`/api/admin/contact/${id}`);