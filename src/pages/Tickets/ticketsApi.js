import api from "../../api";
import { extractList, extractTotal, getErrorText } from "../requests/requestsApi";

export { getErrorText };

// Swagger'dagi `category` enum qiymatlari. Agar backendda boshqa qiymatlar
// bo'lsa (masalan FOREIGNER), shu ro'yxatni moslab qo'ying.
export const CATEGORIES = [
  { value: "ADULT", label: "Kattalar" },
  { value: "CHILD", label: "Bolalar" },
  { value: "STUDENT", label: "Talabalar" },
  { value: "FOREIGNER", label: "Xorijliklar" },
];

export const categoryLabel = (value) =>
  CATEGORIES.find((c) => c.value === value)?.label || value || "—";

// Buyurtma holatlari: label + rang (tickets.css dagi .tkt-badge--*)
const STATUS_META = {
  PAID: { label: "To'langan", tone: "ok" },
  CONFIRMED: { label: "Tasdiqlangan", tone: "ok" },
  ACTIVE: { label: "Faol", tone: "ok" },
  PENDING: { label: "Kutilmoqda", tone: "warn" },
  USED: { label: "Ishlatilgan", tone: "teal" },
  CANCELLED: { label: "Bekor qilingan", tone: "danger" },
  CANCELED: { label: "Bekor qilingan", tone: "danger" },
  EXPIRED: { label: "Muddati o'tgan", tone: "muted" },
};

export const statusMeta = (status) => {
  const key = String(status || "").toUpperCase();
  return STATUS_META[key] || { label: status || "—", tone: "muted" };
};

// Holatni o'zgartirish mumkin bo'lmagan (yakuniy) holatlar
export const FINAL_STATUSES = ["USED", "CANCELLED", "CANCELED"];

/* Umumiy yordamchilar */

export const LANGS = ["uz", "ru", "en"];

// {uz, ru, en} dan birinchi to'liq tilni qaytaradi
export const pickLang = (value, lang = "uz") => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.uz || value.ru || value.en || "";
};

export const formatNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-US") : "—";
};

export const formatPrice = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${formatNumber(n)} so'm`;
};

// "2026-03-01T00:00:00Z" -> "2026-03-01"
export const dateOnly = (value) => (value ? String(value).slice(0, 10) : "");

// "2026-03-01..." -> "01.03.2026"
export const formatDateDot = (value) => {
  const m = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : value ? String(value) : "";
};

const p2 = (n) => String(n).padStart(2, "0");
export const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
};

const dig = (obj, path) => path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);

// Berilgan yo'llardan birinchi bo'sh bo'lmagan oddiy qiymatni qaytaradi
export const pick = (obj, paths) => {
  for (const path of paths) {
    const v = dig(obj, path);
    if (v !== undefined && v !== null && v !== "" && typeof v !== "object") return v;
  }
  return "";
};

/* Ro'yxatni (sahifalab) to'liq yuklash */

async function fetchAll(url) {
  const res = await api.get(url);
  let list = extractList(res.data);

  if (!list) {
    console.warn("Kutilmagan server javobi:", res.data);
    const error = new Error("Server javobida ro'yxat topilmadi. F12 → Console da javobni ko'ring.");
    error.isShapeError = true;
    throw error;
  }

  const total = extractTotal(res.data);
  if (total && list.length < total) {
    const all = [...list];
    const firstId = list[0]?.id;
    for (let page = 2; all.length < total && page <= 50; page += 1) {
      const r = await api.get(`${url}?page=${page}`);
      const chunk = extractList(r.data) || [];
      if (chunk.length === 0 || chunk[0]?.id === firstId) break;
      all.push(...chunk);
    }
    list = all;
  }

  return { list, total };
}

const unwrap = (body, key) => {
  const data = body?.[key] || body?.data || body;
  return data && typeof data === "object" && !Array.isArray(data) ? data : null;
};

/* Chipta tariflari (CRUD) */

export const fetchTickets = () => fetchAll("/api/admin/tickets");

export async function fetchTicket(id) {
  const res = await api.get(`/api/admin/tickets/${id}`);
  return unwrap(res.data, "ticket");
}

export const createTicket = (payload) => api.post("/api/admin/tickets", payload);
export const updateTicket = (id, payload) => api.patch(`/api/admin/tickets/${id}`, payload);
export const deleteTicket = (id) => api.delete(`/api/admin/tickets/${id}`);

/* Sotilgan chiptalar (buyurtmalar) */

export const fetchOrders = () => fetchAll("/api/admin/tickets/orders");

export async function fetchOrder(id) {
  const res = await api.get(`/api/admin/tickets/orders/${id}`);
  return unwrap(res.data, "order");
}

// status: "USED" yoki "CANCELLED"
export const updateOrderStatus = (id, status) =>
  api.patch(`/api/admin/tickets/orders/${id}/status`, { status });

// Buyurtma obyektidan maydonlarni o'qish (server nomlari har xil bo'lishi mumkin)
const CODE_PATTERN = /^[A-Z]{1,5}-\d{3,}(-\d+)*$/;

export const getOrderCode = (o) =>
  pick(o, ["orderNumber", "orderCode", "ticketNumber", "ticketCode", "code", "number", "orderNo", "serial", "reference"]) ||
  Object.values(o).find((v) => typeof v === "string" && CODE_PATTERN.test(v)) ||
  (o.id ? String(o.id).slice(0, 8).toUpperCase() : "—");

export const getBuyerName = (o) =>
  pick(o, ["fullName", "buyerName", "customerName", "name", "user.fullName", "user.name", "customer.fullName", "customer.name"]) ||
  [pick(o, ["firstName", "user.firstName"]), pick(o, ["lastName", "user.lastName"])].filter(Boolean).join(" ") ||
  "—";

export const getBuyerPhone = (o) => pick(o, ["phone", "phoneNumber", "buyerPhone", "user.phone", "customer.phone"]);
export const getBuyerEmail = (o) => pick(o, ["email", "buyerEmail", "user.email", "customer.email"]);

export const getOrderTicketTitle = (o) =>
  pickLang(o.ticket?.title) || pickLang(o.ticketTitle) || pickLang(o.title) || pick(o, ["ticketName", "ticket.name"]) || "—";

export const getOrderQuantity = (o) => pick(o, ["quantity", "count", "ticketCount", "personCount", "visitorsCount", "visitorCount", "peopleCount", "guestsCount", "persons"]);
export const getOrderAmount = (o) => pick(o, ["totalPrice", "totalAmount", "amount", "total", "sum", "price"]);
export const getOrderStatus = (o) => pick(o, ["status", "orderStatus"]);
export const getOrderDate = (o) => pick(o, ["createdAt", "created_at", "orderedAt", "date"]);
export const getVisitDate = (o) => pick(o, ["visitDate", "visitingDate", "visitedAt", "validDate", "validFrom"]);

export const getOrderValidTo = (o) => pick(o, ["validTo", "validUntil", "expiresAt", "expireDate", "expirationDate", "validDate"]);