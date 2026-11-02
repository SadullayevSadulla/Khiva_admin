import { useState } from "react";
import { message } from "antd";
import { ArrowLeftOutlined, DeleteOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api";
import "../Xodimlar/add-employee.css";
import "./admins.css";

function getAdminName(admin) {
	const firstName = admin.firstName || admin.first_name || admin.firstname || admin.givenName;
	const lastName = admin.lastName || admin.last_name || admin.lastname || admin.surname || admin.familyName;
	const fullName = admin.fullName || admin.full_name || admin.fullname || admin.name || admin.adminName;
	const name = fullName || [firstName, lastName].filter(Boolean).join(" ");
	if (name) return name;
	return admin.username && !admin.username.includes("@") ? admin.username : "Admin";
}

export default function AdminAdd() {
	const navigate = useNavigate();
	const { state } = useLocation();
	const admin = state?.admin;
	const [deleting, setDeleting] = useState(false);
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState({ fullName: "", email: "", password: "" });

	const confirmDelete = async () => {
		const adminId = admin.id || admin._id;
		if (!adminId) {
			message.error("Admin ID topilmadi.");
			return;
		}

		setDeleting(true);
		try {
			await api.delete(`/api/admin/${adminId}`);
			message.success("Admin o'chirildi.");
			navigate("/adminlar", { replace: true });
		} catch (error) {
			const detail = error.response?.data?.message || error.response?.data?.error;
			message.error(`O'chirishda xatolik: ${detail || "Xatolik yuz berdi."}`);
		} finally {
			setDeleting(false);
		}
	};

	const createAdmin = async (event) => {
		event.preventDefault();
		setSaving(true);
		try {
			await api.post("/api/admin", {
				name: form.fullName.trim(),
				email: form.email.trim().toLowerCase(),
				password: form.password,
			});
			message.success("Yangi admin yaratildi.");
			navigate("/adminlar", { replace: true });
		} catch (error) {
			console.error("Admin yaratishda xatolik:", error.response?.data || error);
			const detail = error.response?.data?.message || error.response?.data?.error;
			message.error(`Saqlashda xatolik: ${detail || "Xatolik yuz berdi."}`);
		} finally {
			setSaving(false);
		}
	};

	if (admin) return (
		<section className="add-employee-page admin-delete-page">
			<button className="back-btn" type="button" onClick={() => navigate("/adminlar")}>
				<ArrowLeftOutlined /> Qaytish
			</button>
			<div className="form-card admin-delete-card">
				<div className="admin-delete-content">
					<h1>Adminni o'chirish</h1>
					<p><strong>{getAdminName(admin)}</strong> admin hisobini butunlay o'chirmoqchimisiz?</p>
					<p className="admin-delete-warning">Bu amalni ortga qaytarib bo'lmaydi.</p>
				</div>
				<div className="form-footer admin-delete-actions">
					<button className="btn btn-ghost" type="button" onClick={() => navigate("/adminlar")} disabled={deleting}>Bekor qilish</button>
					<button className="btn btn-danger" type="button" onClick={confirmDelete} disabled={deleting}>
						<DeleteOutlined /> {deleting ? "O'chirilmoqda..." : "Ha, o'chirish"}
					</button>
				</div>
			</div>
		</section>
	);

	return (
		<section className="add-employee-page admin-delete-page">
			<button className="back-btn" type="button" onClick={() => navigate("/adminlar")}>
				<ArrowLeftOutlined /> Qaytish
			</button>
			<div className="form-card admin-create-card">
				<form className="admins-form admin-create-form" onSubmit={createAdmin}>
					<label>
						Ism va familiya
						<input
							value={form.fullName}
							onChange={(event) => setForm({ ...form, fullName: event.target.value })}
							placeholder="Admin nomi"
							autoComplete="name"
							required
						/>
					</label>
					<label>
						Email
						<input
							type="email"
							value={form.email}
							onChange={(event) => setForm({ ...form, email: event.target.value })}
							placeholder="admin@example.com"
							autoComplete="email"
							required
						/>
					</label>
					<label>
						Parol
						<input
							type="password"
							value={form.password}
							onChange={(event) => setForm({ ...form, password: event.target.value })}
							minLength={6}
							autoComplete="new-password"
							required
						/>
					</label>
					<div className="form-footer flex gap-2">
						<button className="btn btn-primary" type="submit" disabled={saving}>
							{saving ? "Saqlanmoqda..." : "Saqlash"}
						</button>
					</div>
				</form>
			</div>
		</section>
	);
}
