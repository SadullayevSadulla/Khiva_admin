import { useEffect, useRef, useState } from "react";
import { message } from "antd";
import { Camera, Eye, Trash2 } from "lucide-react";
import lightGallery from "lightgallery";
import lgZoom from "lightgallery/plugins/zoom";
import lgThumbnail from "lightgallery/plugins/thumbnail";
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-zoom.css";
import "lightgallery/css/lg-thumbnail.css";
import Loader from "../../components/Loader/loader";
import {
  fetchProfile,
  updateName,
  uploadAvatar,
  deleteAvatar,
  changePassword,
  requestEmailChange,
  confirmEmailChange,
  getNameParts,
  getProfileName,
  getAvatarUrl,
  getRole,
  getErrorMessage,
  notifyProfileChanged,
} from "./profileApi.js";
import "./profile.css";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

function Avatar({ profile, size = 88, previewUrl, busy, onUpload, onView, onDelete }) {
  const url = previewUrl || getAvatarUrl(profile);
  const [imageFailed, setImageFailed] = useState(false);
  const initial = getProfileName(profile).charAt(0).toUpperCase();
  const hasAvatar = Boolean(url && !imageFailed);

  useEffect(() => setImageFailed(false), [url]);

  return (
    <div className="pf-avatar-wrap" style={{ width: size, height: size }}>
      <div className="pf-avatar" aria-label={hasAvatar ? "Profil rasmi" : "Profil rasmi yo'q"}>
        {hasAvatar ? (
          <img src={url} alt={getProfileName(profile)} onError={() => setImageFailed(true)} />
        ) : (
          <span>{initial}</span>
        )}
      </div>
      <div className="pf-avatar-actions">
        {hasAvatar ? (
          <>
            <button type="button" className="pf-avatar-action" onClick={onView} aria-label="Rasmni ko'rish" title="Ko'rish">
              <Eye size={18} />
            </button>
            <button type="button" className="pf-avatar-action pf-avatar-delete" onClick={onDelete} disabled={busy} aria-label="Rasmni o'chirish" title="O'chirish">
              <Trash2 size={18} />
            </button>
          </>
        ) : (
          <label
            className="pf-avatar-action pf-avatar-upload"
            aria-label="Profil rasmni yuklash"
            title="Rasm yuklash"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.currentTarget.querySelector("input")?.click();
              }
            }}
          >
            <input type="file" accept="image/png, image/jpeg, image/webp" hidden disabled={busy} onChange={onUpload} />
            <Camera size={20} />
          </label>
        )}
      </div>
    </div>
  );
}

function HeaderCard({ profile, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const galleryRef = useRef(null);
  const galleryInstanceRef = useRef(null);
  const avatarUrl = previewUrl || getAvatarUrl(profile);

  useEffect(() => {
    if (!galleryRef.current || !avatarUrl) return undefined;

    const instance = lightGallery(galleryRef.current, {
      plugins: [lgZoom, lgThumbnail],
      selector: ".pf-lightgallery-item",
      speed: 400,
      download: false,
    });
    galleryInstanceRef.current = instance;

    return () => {
      instance.destroy();
      galleryInstanceRef.current = null;
    };
  }, [avatarUrl]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFile = async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      message.error("Iltimos, rasm faylini tanlang!");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      message.error("Rasm hajmi 5MB dan oshmasligi kerak!");
      return;
    }
    setBusy(true);
    try {
      await uploadAvatar(file);
      setPreviewUrl(URL.createObjectURL(file));
      message.success("Rasm yangilandi.");
      await onChanged();
    } catch (error) {
      console.error("Rasm yuklashda xato:", error.response?.status, error.response?.data || error);
      message.error(`Rasm yuklashda xatolik: ${getErrorMessage(error)}`, 8);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteAvatar();
      setPreviewUrl("");
      message.success("Rasm o'chirildi.");
      setConfirmDelete(false);
      await onChanged();
    } catch (error) {
      console.error("Rasmni o'chirishda xato:", error.response?.status, error.response?.data || error);
      message.error(`Rasmni o'chirishda xatolik: ${getErrorMessage(error)}`, 8);
    } finally {
      setBusy(false);
    }
  };

  const openAvatar = () => galleryInstanceRef.current?.openGallery(0);

  const role = getRole(profile);

  return (
    <section className="panel pf-card pf-head">
      <Avatar
        profile={profile}
        size={96}
        previewUrl={previewUrl}
        busy={busy}
        onUpload={handleFile}
        onView={openAvatar}
        onDelete={() => setConfirmDelete(true)}
      />
      {avatarUrl && (
        <div ref={galleryRef} className="pf-lightgallery-source" aria-hidden="true">
          <a className="pf-lightgallery-item" href={avatarUrl} data-src={avatarUrl}>
            <img src={avatarUrl} alt={getProfileName(profile)} />
          </a>
        </div>
      )}
      <div className="pf-head-info">
        <h2 className="pf-name">{getProfileName(profile)}</h2>
        <p className="pf-email">{profile.email || "—"}</p>
        {role && <span className="pf-role">{role}</span>}
        {busy && <p className="pf-upload-status">Rasm yuklanmoqda...</p>}
      </div>

      {confirmDelete && (
        <div className="modal-overlay" onMouseDown={() => setConfirmDelete(false)}>
          <section
            className="modal-content"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 className="modal-title">Rasmni o'chirish</h2>
            <p className="modal-text">Profil rasmingiz o'chiriladi. Davom etasizmi?</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)} disabled={busy}>
                Yo'q
              </button>
              <button className="btn btn-primary" onClick={handleDelete} disabled={busy}>
                {busy ? "O'chirilmoqda..." : "Ha, o'chirish"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function NameCard({ profile, onChanged }) {
  const initial = getNameParts(profile);
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!firstName.trim()) {
      message.error("Iltimos, ismingizni kiriting!");
      return;
    }
    setSaving(true);
    try {
      await updateName({ firstName: firstName.trim(), lastName: lastName.trim() });
      message.success("Ism va familiya yangilandi.");
      await onChanged();
    } catch (error) {
      console.error("Ismni o'zgartirishda xato:", error.response?.status, error.response?.data || error);
      message.error(`Saqlashda xatolik: ${getErrorMessage(error)}`, 8);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel pf-card">
      <h3 className="pf-title">Shaxsiy ma'lumotlar</h3>
      <form className="pf-form" onSubmit={handleSubmit}>
        <div className="pf-grid">
          <label className="pf-field">
            Ism
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" required />
          </label>
          <label className="pf-field">
            Familiya
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
          </label>
        </div>
        <div className="pf-footer">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </form>
    </section>
  );
}

function EmailCard({ profile, onChanged }) {
  const [step, setStep] = useState(0); // 0: ko'rinish, 1: yangi email, 2: kod
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setStep(0);
    setNewEmail("");
    setCode("");
  };

  const sendCode = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await requestEmailChange(newEmail.trim().toLowerCase());
      message.success("Tasdiqlash kodi yangi emailga yuborildi.");
      setStep(2);
    } catch (error) {
      console.error("Email so'rovida xato:", error.response?.status, error.response?.data || error);
      message.error(`Kod yuborishda xatolik: ${getErrorMessage(error)}`, 8);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await confirmEmailChange({ code: code.trim(), newEmail: newEmail.trim().toLowerCase() });
      message.success("Email o'zgartirildi.");
      reset();
      await onChanged();
    } catch (error) {
      console.error("Emailni tasdiqlashda xato:", error.response?.status, error.response?.data || error);
      message.error(`Tasdiqlashda xatolik: ${getErrorMessage(error)}`, 8);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel pf-card">
      <h3 className="pf-title">Email</h3>

      {step === 0 && (
        <div className="pf-row">
          <div>
            <p className="pf-hint">Hozirgi email</p>
            <p className="pf-value">{profile.email || "—"}</p>
          </div>
          <button className="btn btn-ghost" onClick={() => setStep(1)}>
            Emailni o'zgartirish
          </button>
        </div>
      )}

      {step === 1 && (
        <form className="pf-form" onSubmit={sendCode}>
          <label className="pf-field">
            Yangi email
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="yangi@example.com"
              autoComplete="email"
              required
              autoFocus
            />
          </label>
          <p className="pf-hint">Shu manzilga tasdiqlash kodi yuboriladi.</p>
          <div className="pf-footer">
            <button type="button" className="btn btn-ghost" onClick={reset} disabled={busy}>
              Bekor qilish
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Yuborilmoqda..." : "Kod yuborish"}
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form className="pf-form" onSubmit={confirm}>
          <p className="pf-hint">
            <strong>{newEmail}</strong> manziliga yuborilgan kodni kiriting.
          </p>
          <label className="pf-field">
            Tasdiqlash kodi
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Kod"
              required
              autoFocus
            />
          </label>
          <div className="pf-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)} disabled={busy}>
              Orqaga
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Tekshirilmoqda..." : "Tasdiqlash"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function PasswordCard() {
  const [form, setForm] = useState({ current: "", next: "", repeat: "" });
  const [saving, setSaving] = useState(false);

  const setField = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.next !== form.repeat) {
      message.error("Yangi parol va takrori bir xil emas!");
      return;
    }
    if (form.next === form.current) {
      message.error("Yangi parol eskisidan farq qilishi kerak!");
      return;
    }
    setSaving(true);
    try {
      await changePassword({ current: form.current, next: form.next });
      message.success("Parol o'zgartirildi.");
      setForm({ current: "", next: "", repeat: "" });
    } catch (error) {
      console.error("Parolni o'zgartirishda xato:", error.response?.status, error.response?.data || error);
      message.error(`Parolni o'zgartirishda xatolik: ${getErrorMessage(error)}`, 8);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel pf-card">
      <h3 className="pf-title">Parol</h3>
      <form className="pf-form" onSubmit={handleSubmit}>
        <label className="pf-field">
          Hozirgi parol
          <input type="password" value={form.current} onChange={setField("current")} autoComplete="current-password" required />
        </label>
        <div className="pf-grid">
          <label className="pf-field">
            Yangi parol
            <input
              type="password"
              value={form.next}
              onChange={setField("next")}
              minLength={6}
              placeholder="Kamida 6 ta belgi"
              autoComplete="new-password"
              required
            />
          </label>
          <label className="pf-field">
            Yangi parolni takrorlang
            <input
              type="password"
              value={form.repeat}
              onChange={setField("repeat")}
              minLength={6}
              autoComplete="new-password"
              required
            />
          </label>
        </div>
        <div className="pf-footer">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saqlanmoqda..." : "Parolni o'zgartirish"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = async () => {
    try {
      setProfile(await fetchProfile());
      setError("");
      notifyProfileChanged();
    } catch (err) {
      console.error("Profil:", err.response?.status, err.response?.data || err);
      setError(`Profilni yuklab bo'lmadi: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) return <Loader />;

  if (!profile) return <p className="pf-error">{error || "Profil topilmadi."}</p>;

  const nameKey = `${getNameParts(profile).firstName}|${getNameParts(profile).lastName}`;

  return (
    <div className="pf-page">
      <HeaderCard profile={profile} onChanged={loadProfile} />
      <NameCard key={nameKey} profile={profile} onChanged={loadProfile} />
      <EmailCard profile={profile} onChanged={loadProfile} />
      <PasswordCard />
    </div>
  );
}