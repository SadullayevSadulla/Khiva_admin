import api from "../../api";
import { extractList, extractTotal } from "../requests/requestsApi";

export async function countOf(url) {
  const res = await api.get(url);
  const list = extractList(res.data);

  if (!list) {
    console.warn(`${url}: kutilmagan server javobi`, res.data);
    throw new Error("Ro'yxat topilmadi");
  }

  const total = extractTotal(res.data);
  if (total) return total;
  if (list.length === 0) return 0;

  let count = list.length;
  const firstId = list[0]?.id;
  for (let page = 2; page <= 50; page += 1) {
    let chunk;
    try {
      const r = await api.get(`${url}?page=${page}`);
      chunk = extractList(r.data) || [];
    } catch {
      break;
    }
    if (chunk.length === 0 || chunk[0]?.id === firstId) break;
    count += chunk.length;
  }
  return count;
}

export const STAT_SOURCES = [
  { key: "news", label: "Yangiliklar", url: "/api/admin/news", to: "/news" },
  { key: "collections", label: "Kolleksiyalar", url: "/api/admin/collection", to: "/collaction" },
  { key: "announcements", label: "E'lonlar", url: "/api/admin/announcement", to: "/elonlar" },
  { key: "employees", label: "Xodimlar", url: "/api/admin/employee", to: "/xodimlar" },
  { key: "gallery", label: "Galereya rasmlari", url: "/api/admin/gallery", to: "/galereya" },
  { key: "users", label: "Foydalanuvchilar", url: "/api/admin/user", to: "/foydalanuvchilar" },
  { key: "requests", label: "So'rovlar", url: "/api/admin/contact", to: "/requests" },
  { key: "tickets", label: "Chipta tariflari", url: "/api/admin/tickets", to: "/chipta-tariflari" },
  { key: "orders", label: "Sotilgan chiptalar", url: "/api/admin/tickets/orders", to: "/sotilgan-chiptalar" },
  { key: "admins", label: "Adminlar", url: "/api/admin", to: "/adminlar" },
];