import { useEffect, useMemo, useState } from "react";
import { Table, message } from "antd";
import { Plus, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import "./admins.css";

const LIST_KEYS = ["data", "admins", "items", "rows", "results", "list", "docs", "content"];
const SECRET_KEY = /pass|token|secret|hash|salt/i;

function extractList(body, depth = 0) {
	if (Array.isArray(body)) return body;
	if (!body || typeof body !== "object" || depth > 3) return null;
	for (const key of LIST_KEYS) {
		if (key in body) {
			const list = extractList(body[key], depth + 1);
			if (list) return list;
		}
	}
	return Object.values(body).find(Array.isArray) || null;
}

function unwrap(body) {
	let value = body;
	while (value?.data && !Array.isArray(value.data) && typeof value.data === "object") {
		value = value.data;
	}
	return value;
}

function getAdminName(admin) {
	const firstName = admin.firstName || admin.first_name || admin.firstname || admin.givenName;
	const lastName = admin.lastName || admin.last_name || admin.lastname || admin.surname || admin.familyName;
	const fullName = admin.fullName || admin.full_name || admin.fullname || admin.name || admin.adminName;
	const name = fullName || [firstName, lastName].filter(Boolean).join(" ");
	if (name) return name;
	return admin.username && !admin.username.includes("@") ? admin.username : "Admin";
}

function getErrorMessage(error) {
	const response = error.response;
	if (!response) return "Serverga ulanib bo'lmadi (tarmoq yoki CORS xatosi).";
	const detail = response.data?.message || response.data?.error;
	return `${response.status}: ${typeof detail === "string" ? detail : "Xatolik yuz berdi."}`;
}

function AdminModal({ title, onClose, children, wide = false }) {
	return (
		<div className="modal-overlay" onMouseDown={onClose}>
			<section
				className={`modal-content admins-modal${wide ? " admins-modal-wide" : ""}`}
				role="dialog"
				aria-modal="true"
				aria-label={title}
				onMouseDown={(event) => event.stopPropagation()}
			>
				<button className="admins-modal-close" onClick={onClose} aria-label="Yopish" type="button">
					<X size={19} />
				</button>
				{children}
			</section>
		</div>
	);
}

export default function Admins() {
	const navigate = useNavigate();
	const [admins, setAdmins] = useState([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [selected, setSelected] = useState(null);
	const [detailLoading, setDetailLoading] = useState(false);
	const [passwordAdmin, setPasswordAdmin] = useState(null);
	const [newPassword, setNewPassword] = useState("");
	const [changingPassword, setChangingPassword] = useState(false);

	const fetchAdmins = async () => {
		setLoading(true);
		try {
			const response = await api.get("/api/admin");
			const list = extractList(response.data);
			if (!list) throw new Error("Adminlar ro'yxati javobda topilmadi.");
			setAdmins(list);
		} catch (error) {
			console.error("Adminlar:", error.response?.status, error.response?.data || error);
			message.error(`Adminlarni yuklab bo'lmadi: ${getErrorMessage(error)}`);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchAdmins();
	}, []);

	const visibleAdmins = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return admins;
		return admins.filter((admin) =>
			[getAdminName(admin), admin.email, admin.username]
				.filter(Boolean)
				.some((value) => String(value).toLowerCase().includes(query))
		);
	}, [admins, search]);

	const openDetails = async (admin) => {
		setSelected(admin);
		setDetailLoading(true);
		try {
			const response = await api.get(`/api/admin/${admin.id}`);
			const detail = unwrap(response.data);
			if (detail && typeof detail === "object" && !Array.isArray(detail)) {
				setSelected({ ...admin, ...detail });
			}
		} catch (error) {
			console.error("Admin ma'lumotlari:", error.response?.data || error);
			message.error(`Admin ma'lumotlarini yuklab bo'lmadi: ${getErrorMessage(error)}`);
		} finally {
			setDetailLoading(false);
		}
	};

	const submitPassword = async (event) => {
		event.preventDefault();
		setChangingPassword(true);
		try {
			await api.patch(`/api/admin/${passwordAdmin.id}/change-password`, { password: newPassword });
			message.success("Admin paroli o'zgartirildi.");
			setPasswordAdmin(null);
			setNewPassword("");
		} catch (error) {
			message.error(`Parolni o'zgartirishda xatolik: ${getErrorMessage(error)}`);
		} finally {
			setChangingPassword(false);
		}
	};

	const columns = [
		{
			title: "Admin",
			key: "admin",
			render: (_, admin) => (
				<div className="admin-person">
					<span className="admin-avatar">{getAdminName(admin).charAt(0).toUpperCase()}</span>
					<span className="admin-person-name">{getAdminName(admin)}</span>
				</div>
			),
		},
		{ title: "Email", dataIndex: "email", key: "email", responsive: ["md"], render: (value) => value || "—" },
		{
			title: "Amallar",
			key: "actions",
			width: 88,
			render: (_, admin) => (
				<div className="admin-row-actions">
					<button className="btn btn-danger btn-sm" onClick={() => navigate("/adminlar/add", { state: { admin } })} title="O'chirish" aria-label="O'chirish">
						<Trash2 size={15} />
					</button>
				</div>
			),
		},
	];

	const detailFields = selected
		? Object.entries(selected).filter(([key, value]) => !SECRET_KEY.test(key) && (value === null || typeof value !== "object"))
		: [];

	return (
		<section className="admins-page">
			<header className="admins-heading">
					<button className="btn btn-primary" onClick={() => navigate("/adminlar/add")}>
					<Plus size={18} /> Yangi admin
				</button>
			</header>

			<div className="panel table-panel admins-table-panel">
				<Table
					dataSource={visibleAdmins}
					columns={columns}
					rowKey={(admin) => admin.id || admin._id || admin.email}
					loading={loading}
					pagination={{ pageSize: 10, position: ["bottomRight"], hideOnSinglePage: true }}
					locale={{ emptyText: search ? "Qidiruv bo'yicha admin topilmadi" : "Hozircha adminlar yo'q" }}
				/>
			</div>
			{selected && (
				<AdminModal title="Admin ma'lumotlari" onClose={() => setSelected(null)} wide>
					<div className={`admins-detail${detailLoading ? " is-loading" : ""}`}>
						<span className="admin-avatar admin-avatar-large">{getAdminName(selected).charAt(0).toUpperCase()}</span>
						<div><h2 className="admins-modal-title">{getAdminName(selected)}</h2><p className="admins-modal-subtitle">Admin hisob ma'lumotlari</p></div>
					</div>
					<dl className={`admins-detail-fields${detailLoading ? " is-loading" : ""}`}>
						{detailFields.map(([key, value]) => (
							<div key={key}><dt>{key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase())}</dt><dd>{value === null || value === "" ? "—" : String(value)}</dd></div>
						))}
					</dl>
				</AdminModal>
			)}

			{passwordAdmin && (
				<AdminModal title="Admin parolini o'zgartirish" onClose={() => setPasswordAdmin(null)}>
					<h2 className="admins-modal-title">Parolni o'zgartirish</h2>
					<p className="admins-modal-subtitle">{getAdminName(passwordAdmin)} uchun yangi parol kiriting.</p>
					<form className="admins-form" onSubmit={submitPassword}>
						<label>Yangi parol<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={6} autoComplete="new-password" required /></label>
						<div className="admins-form-actions">
							<button type="button" className="btn btn-ghost" onClick={() => setPasswordAdmin(null)}>Bekor qilish</button>
							<button type="submit" className="btn btn-primary" disabled={changingPassword}>{changingPassword ? "Saqlanmoqda..." : "Parolni saqlash"}</button>
						</div>
					</form>
				</AdminModal>
			)}
		</section>
	);
}
