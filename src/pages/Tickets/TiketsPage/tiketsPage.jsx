import React, { useEffect, useState } from "react";
import { message } from "antd";
import { Plus, SquarePen, Trash2, Users, Clock, CalendarDays, ShieldAlert, CircleCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Loader from "../../../components/Loader/loader";
import {
  fetchTickets,
  deleteTicket,
  getErrorText,
  pickLang,
  formatNumber,
  formatDateDot,
  categoryLabel,
} from "../ticketsApi";
import "../tickets.css";
import "./tiketsPage.css";

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="tkt-info-item">
      <span className="tkt-info-icon">
        <Icon size={17} />
      </span>
      <span className="tkt-info-text">
        <small>{label}</small>
        <strong title={String(value)}>{value}</strong>
      </span>
    </div>
  );
}

export default function TiketsPage() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    setNote("");
    try {
      const { list } = await fetchTickets();
      setTickets(list);
    } catch (err) {
      console.error("Chipta tariflari:", err.response?.status, err.response?.data || err);
      setTickets([]);
      if (err.isShapeError) {
        setNote(err.message);
      } else {
        setNote("Chipta tariflarini yuklab bo'lmadi: " + getErrorText(err));
        message.error("Chipta tariflarini yuklab bo'lmadi: " + getErrorText(err), 8);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTicket(deleteTarget.id);
      message.success("Chipta tarifi o'chirildi.");
      setDeleteTarget(null);
      loadTickets();
    } catch (err) {
      console.error("O'chirishda xato:", err.response?.status, err.response?.data);
      message.error("O'chirishda xatolik: " + getErrorText(err), 8);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-bar">
        <p className="page-bar-info">Jami: {tickets.length} ta tarif</p>
        <button className="btn btn-primary" onClick={() => navigate("/chipta-tariflari/add")}>
          <Plus size={18} />
          <span>Tarif qo'shish</span>
        </button>
      </div>

      {note && <p className="tkt-note">{note}</p>}

      {tickets.length === 0 ? (
        <div className="tkt-empty panel">
          <img src="/logo.png" alt="" />
          <p>Hozircha chipta tariflari yo'q</p>
          <button className="btn btn-primary" onClick={() => navigate("/chipta-tariflari/add")}>
            <Plus size={18} /> Birinchi tarifni qo'shing
          </button>
        </div>
      ) : (
        <div className="tkt-grid">
          {tickets.map((t) => {
            const services = Array.isArray(t.includedServices) ? t.includedServices : [];
            const from = formatDateDot(t.validFrom);
            const to = formatDateDot(t.validTo);
            return (
              <article key={t.id} className={`tkt-card ${t.isActive ? "" : "is-inactive"}`}>
                <div className="tkt-card-top">
                  <span className="tkt-card-cat">{categoryLabel(t.category)}</span>
                  {t.isActive ? (
                    <span className="tkt-badge tkt-badge--ok">Faol</span>
                  ) : (
                    <span className="tkt-badge">Nofaol</span>
                  )}
                </div>

                <h3 className="tkt-card-title">{pickLang(t.title) || "Nomsiz"}</h3>

                <div className="tkt-card-price">
                  <strong>{formatNumber(t.price)}</strong>
                  <span>so'm</span>
                </div>

                <div className="tkt-card-info">
                  <InfoItem icon={Users} label="Sig'im" value={t.personCount ? `${t.personCount} kishi` : "—"} />
                  <InfoItem icon={Clock} label="Vaqt" value={t.visitingHours || "—"} />
                  <InfoItem icon={CalendarDays} label="Muddat" value={t.validDays ? `${t.validDays} kun` : "—"} />
                  <InfoItem icon={ShieldAlert} label="Yosh" value={t.ageRestriction || "—"} />
                </div>

                <h4 className="tkt-services-title">Kiritilgan xizmatlar</h4>
                {services.length > 0 ? (
                  <ul className="tkt-services-ul">
                    {services.map((s) => (
                      <li key={s}>
                        <CircleCheck size={16} />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="tkt-services-none">Xizmatlar ko'rsatilmagan</p>
                )}

                <div className="tkt-card-foot">
                  <div className="tkt-card-valid">
                    Amal qiladi:
                    <strong>
                      {from || "—"} — {to || "—"}
                    </strong>
                  </div>
                  <div className="tkt-icon-actions">
                    <button
                      className="tkt-icon-btn"
                      title="Tahrirlash"
                      aria-label="Tahrirlash"
                      onClick={() => navigate(`/chipta-tariflari/add/${t.id}`, { state: { ticket: t } })}
                    >
                      <SquarePen size={17} />
                    </button>
                    <button
                      className="tkt-icon-btn tkt-icon-btn--danger"
                      title="O'chirish"
                      aria-label="O'chirish"
                      onClick={() => setDeleteTarget(t)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onMouseDown={() => setDeleteTarget(null)}>
          <section
            className="modal-content"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 className="modal-title">O'chirishni tasdiqlang</h2>
            <p className="modal-text">
              <strong>{pickLang(deleteTarget.title) || "Tarif"}</strong> tarifi butunlay o'chiriladi. Buni ortga
              qaytarib bo'lmaydi.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Yo'q
              </button>
              <button className="btn btn-primary" onClick={handleDelete} disabled={deleting}>
                {deleting ? "O'chirilmoqda..." : "Ha, o'chirish"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}