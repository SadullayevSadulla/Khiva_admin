import { useState } from "react";
import { message } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createAdmin, getErrorMessage } from "./adminsApi";
import "../Xodimlar/add-employee.css";
import "./admins.css";

export default function AdminAdd() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const setField = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const [firstName, ...lastNameParts] = form.fullName.trim().split(/\s+/);
    const lastName = lastNameParts.join(" ");

    if (!firstName || !lastName) {
      message.error("Iltimos, ism va familiyani kiriting (masalan, Ali Valiyev)!");
      return;
    }

    setSaving(true);
    try {
      await createAdmin({
        firstName,
        lastName,
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      message.success("Yangi admin yaratildi.");
      navigate("/adminlar", { replace: true });
    } catch (error) {
      console.error("Admin yaratishda xato:", error.response?.status, error.response?.data || error);
      message.error(`Saqlashda xatolik: ${getErrorMessage(error)}`, 8);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="add-employee-page">
      <div className="back-btn" onClick={() => navigate("/adminlar")}>
        <ArrowLeftOutlined /> Qaytish
      </div>

      <div className="form-card admin-form-card">
        <form className="admin-form" onSubmit={handleSubmit}>
          <label className="admin-field">
            Ism va familiya
            <input
              value={form.fullName}
              onChange={setField("fullName")}
              placeholder="Ali Valiyev"
              autoComplete="name"
              required
            />
          </label>

          <label className="admin-field">
            Email
            <input
              type="email"
              value={form.email}
              onChange={setField("email")}
              placeholder="admin@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="admin-field">
            Parol
            <div className="admin-password">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={setField("password")}
                placeholder="Kamida 6 ta belgi"
                minLength={6}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="admin-password-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <div className="form-footer">
            <button type="submit" className="save-btn" disabled={saving}>
              <SaveOutlined /> {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}