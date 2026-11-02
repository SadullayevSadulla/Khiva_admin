import React, { useEffect, useMemo, useState } from "react";
import { Table, message } from "antd";
import { Eye, X } from "lucide-react";
import api from "../../api";
import "./users.css";

const SENSITIVE = /pass|token|secret|hash|salt/i;

const LIST_KEYS = ["data", "users", "items", "rows", "results", "list", "docs", "content"];

const extractList = (body, depth = 0) => {
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

const extractTotal = (body) => {
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

const getErrorText = (err) => {
  const res = err.response;
  if (!res) return "Serverga ulanib bo'lmadi (tarmoq yoki CORS xatosi).";
  const raw = res.data?.message ?? res.data?.error ?? res.data?.errors ?? res.data;
  let text = "";
  if (typeof raw === "string") text = raw;
  else if (Array.isArray(raw)) text = raw.map((x) => (typeof x === "string" ? x : x?.message || JSON.stringify(x))).join("; ");
  else if (raw && typeof raw === "object") text = JSON.stringify(raw);
  return `${res.status}: ${text || "Xatolik yuz berdi!"}`;
};

const getName = (u) =>
  u.fullName ||
  [u.firstName, u.lastName].filter(Boolean).join(" ") ||
  u.name ||
  u.username ||
  "—";

const getRole = (u) => (typeof u.role === "object" && u.role ? u.role.name : u.role) || "";

const getPhone = (u) => u.phone || u.phoneNumber || "";

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const LABELS = {
  id: "ID",
  fullName: "Ism va familiya",
  firstName: "Ism",
  lastName: "Familiya",
  middleName: "Otasining ismi",
  name: "Ism",
  username: "Foydalanuvchi nomi",
  email: "Email",
  phone: "Telefon",
  phoneNumber: "Telefon",
  role: "Rol",
  address: "Manzil",
  birthDate: "Tug'ilgan kuni",
  isVerified: "Tasdiqlangan",
  verified: "Tasdiqlangan",
  isActive: "Faol",
  createdAt: "Ro'yxatdan o'tgan",
  updatedAt: "Yangilangan",
};

const prettyKey = (key) =>
  LABELS[key] ||
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

const formatValue = (key, value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Ha" : "Yo'q";
  if (/(At|Date)$/.test(key) || /created|updated/i.test(key)) return formatDate(value);
  return String(value);
};

function UserAvatar({ user }) {
  const initial = getName(user).charAt(0).toUpperCase();
  return <div className="user-avatar">{initial}</div>;
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(null);
  const [note, setNote] = useState("");

  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setNote("");
    try {
      const res = await api.get("/api/admin/user");
      let list = extractList(res.data);

      if (!list) {
        console.warn("Kutilmagan server javobi:", res.data);
        setUsers([]);
        setNote("Server javobida foydalanuvchilar ro'yxati topilmadi. F12 → Console da javobni ko'ring.");
        return;
      }

      const serverTotal = extractTotal(res.data);

      if (serverTotal && list.length < serverTotal) {
        const all = [...list];
        const firstId = list[0]?.id;
        for (let page = 2; all.length < serverTotal && page <= 50; page += 1) {
          const r = await api.get(`/api/admin/user?page=${page}`);
          const chunk = extractList(r.data) || [];
          if (chunk.length === 0 || chunk[0]?.id === firstId) break;
          all.push(...chunk);
        }
        list = all;
      }

      setUsers(list);
      setTotal(serverTotal);
    } catch (err) {
      console.error("Foydalanuvchilar:", err.response?.status, err.response?.data);
      setNote("Foydalanuvchilarni yuklab bo'lmadi: " + getErrorText(err));
      message.error("Foydalanuvchilarni yuklab bo'lmadi: " + getErrorText(err), 8);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openDetail = async (user) => {
    setSelected(user);
    setDetail(user);
    setDetailLoading(true);
    try {
      const res = await api.get(`/api/admin/user/${user.id}`);
      const data = res.data?.data || res.data;
      if (data && typeof data === "object" && !Array.isArray(data)) {
        setDetail({ ...user, ...data });
      }
    } catch (err) {
      console.error("Foydalanuvchi ma'lumoti:", err.response?.status, err.response?.data);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setDetail(null);
  };

  const has = useMemo(
    () => ({
      email: users.some((u) => u.email),
      phone: users.some((u) => getPhone(u)),
      role: users.some((u) => getRole(u)),
      created: users.some((u) => u.createdAt),
    }),
    [users]
  );

  const columns = [
    {
      title: "Foydalanuvchi",
      key: "name",
      render: (_, user) => (
        <div className="user-cell">
          <UserAvatar user={user} />
          <span className="user-name">{getName(user)}</span>
        </div>
      ),
    },
    has.email && { title: "Email", dataIndex: "email", key: "email", render: (v) => v || "—" },
    has.phone && { title: "Telefon", key: "phone", render: (_, u) => getPhone(u) || "—" },
    has.role && {
      title: "Rol",
      key: "role",
      render: (_, u) => (getRole(u) ? <span className="role-badge">{getRole(u)}</span> : "—"),
    },
    has.created && {
      title: "Ro'yxatdan o'tgan",
      key: "createdAt",
      render: (_, u) => formatDate(u.createdAt),
    },
  ].filter(Boolean);

  const fields = detail
    ? Object.entries(detail).filter(
        ([key, value]) => !SENSITIVE.test(key) && (value === null || typeof value !== "object")
      )
    : [];

  return (
    <div>
      <div className="page-bar">
        <p className="page-bar-info">Jami: {total || users.length} ta foydalanuvchi</p>
      </div>

      {note && <p className="users-note">{note}</p>}

      <div className="panel table-panel users-table-panel">
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 640 }}
          pagination={{ pageSize: 10, position: ["bottomRight"], hideOnSinglePage: true }}
          locale={{ emptyText: "Hozircha foydalanuvchilar yo'q" }}
        />
      </div>

      {selected && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div
            className="modal-content user-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="user-modal-close" onClick={closeDetail} aria-label="Yopish">
              <X size={18} />
            </button>

            <div className="user-modal-head">
              <UserAvatar user={detail || selected} />
              <div>
                <h2 className="user-modal-name">{getName(detail || selected)}</h2>
                {(detail || selected).email && (
                  <p className="user-modal-email">{(detail || selected).email}</p>
                )}
              </div>
            </div>

            <dl className={`user-fields ${detailLoading ? "is-loading" : ""}`}>
              {fields.map(([key, value]) => (
                <div key={key} className="user-field">
                  <dt>{prettyKey(key)}</dt>
                  <dd>{formatValue(key, value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}