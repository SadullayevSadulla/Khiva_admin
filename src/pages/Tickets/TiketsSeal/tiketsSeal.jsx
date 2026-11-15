import React, { useEffect, useState } from "react";
import { message } from "antd";
import { CheckCircle2, Ban, X, Ticket } from "lucide-react";
import {
  fetchOrders,
  fetchOrder,
  updateOrderStatus,
  getErrorText,
  statusMeta,
  FINAL_STATUSES,
  formatPrice,
  formatDateTime,
  formatDateDot,
  getOrderCode,
  getBuyerName,
  getBuyerPhone,
  getBuyerEmail,
  getOrderTicketTitle,
  getOrderQuantity,
  getOrderAmount,
  getOrderStatus,
  getOrderDate,
  getVisitDate,
  getOrderValidTo,
} from "../ticketsApi";
import Loader from "../../../components/Loader/loader";
import "../tickets.css";
import "./TiketsSeal.css";

const SHOWN_KEYS = new Set([
  "id", "orderNumber", "orderCode", "code", "ticketCode", "number",
  "fullName", "buyerName", "customerName", "name", "firstName", "lastName",
  "phone", "phoneNumber", "buyerPhone", "email", "buyerEmail",
  "ticketTitle", "title", "ticketName",
  "quantity", "count", "ticketCount", "personCount", "persons",
  "totalPrice", "totalAmount", "amount", "total", "sum", "price",
  "status", "orderStatus", "createdAt", "created_at", "orderedAt", "date",
  "visitDate", "visitingDate", "visitedAt", "validDate", "validFrom", "validTo", "validUntil", "expiresAt",
  "ticketNumber", "orderNo", "serial", "reference", "visitorsCount", "visitorCount", "peopleCount", "guestsCount",
]);

const formatExtra = (value) => {
  if (typeof value === "boolean") return value ? "Ha" : "Yo'q";
  if (/^\d{4}-\d{2}-\d{2}T/.test(String(value))) return formatDateTime(value);
  return String(value);
};

function StatusBadge({ status }) {
  const meta = statusMeta(status);
  return <span className={`tkt-badge tkt-badge--${meta.tone}`}>{meta.label}</span>;
}

function OrderDetails({ order, loading }) {
  const phone = getBuyerPhone(order);
  const email = getBuyerEmail(order);
  const qty = getOrderQuantity(order);
  const amount = getOrderAmount(order);
  const visit = getVisitDate(order);
  const validTo = getOrderValidTo(order);
  const created = getOrderDate(order);

  const extras = Object.entries(order).filter(
    ([key, value]) =>
      !SHOWN_KEYS.has(key) && value !== null && value !== "" && typeof value !== "object" && value !== undefined
  );

  const rows = [
    ["Buyurtma raqami", getOrderCode(order)],
    ["Holati", <StatusBadge key="s" status={getOrderStatus(order)} />],
    ["Xaridor", getBuyerName(order)],
    phone && ["Telefon", phone],
    email && ["Email", email],
    ["Chipta tarifi", getOrderTicketTitle(order)],
    qty && ["Soni", qty],
    amount && ["Summa", formatPrice(amount)],
    visit && ["Tashrif sanasi", formatDateDot(visit)],
    validTo && ["Amal qilish muddati", formatDateDot(validTo)],
    created && ["Buyurtma vaqti", formatDateTime(created)],
  ].filter(Boolean);

  return (
    <>
      <div className={`seal-details ${loading ? "is-loading" : ""}`}>
        {rows.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {extras.length > 0 && (
        <>
          <h4 className="seal-extra-title">Boshqa ma'lumotlar</h4>
          <div className={`seal-details ${loading ? "is-loading" : ""}`}>
            {extras.map(([key, value]) => (
              <div key={key}>
                <span>{key}</span>
                <strong>{formatExtra(value)}</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default function TiketsSeal() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [updating, setUpdating] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    setNote("");
    try {
      const { list } = await fetchOrders();
      setOrders(list);
    } catch (err) {
      console.error("Buyurtmalar:", err.response?.status, err.response?.data || err);
      setOrders([]);
      if (err.isShapeError) {
        setNote(err.message);
      } else {
        setNote("Sotilgan chiptalarni yuklab bo'lmadi: " + getErrorText(err));
        message.error("Sotilgan chiptalarni yuklab bo'lmadi: " + getErrorText(err), 8);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openOrder = async (record) => {
    setSelected(record);
    setDetail(null);
    setPendingStatus(null);
    setDetailLoading(true);
    try {
      const data = await fetchOrder(record.id);
      if (data) setDetail({ ...record, ...data });
    } catch (err) {
      console.error("Buyurtma:", err.response?.status, err.response?.data);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeOrder = () => {
    if (updating) return;
    setSelected(null);
    setDetail(null);
    setPendingStatus(null);
  };

  const handleStatus = async () => {
    setUpdating(true);
    try {
      await updateOrderStatus(selected.id, pendingStatus);
      message.success(pendingStatus === "USED" ? "Chipta ishlatilgan deb belgilandi." : "Buyurtma bekor qilindi.");
      setSelected(null);
      setDetail(null);
      setPendingStatus(null);
      loadOrders();
    } catch (err) {
      console.error("Holatni o'zgartirishda xato:", err.response?.status, err.response?.data);
      message.error("Holatni o'zgartirib bo'lmadi: " + getErrorText(err), 8);
    } finally {
      setUpdating(false);
    }
  };

  const visible = [...orders].sort((a, b) => {
    const time = (order) => {
      const timestamp = new Date(getOrderDate(order)).getTime();
      return Number.isNaN(timestamp) ? 0 : timestamp;
    };
    return time(b) - time(a);
  });

  if (loading) return <Loader />;

  const current = detail || selected;
  const isFinal = current && FINAL_STATUSES.includes(norm(getOrderStatus(current)));

  return (
    <div>
      <div className="page-bar">
        <p className="page-bar-info">Jami: {orders.length} ta buyurtma</p>
      </div>

      {note && <p className="tkt-note">{note}</p>}

      {visible.length === 0 ? (
        <div className="seal-empty panel">
          <img src="/logo.png" alt="" />
          <p>Sotilgan chiptalar topilmadi</p>
        </div>
      ) : (
        <div className="seal-grid">
          {visible.map((o) => {
            const phone = getBuyerPhone(o);
            const qty = getOrderQuantity(o);
            const amount = getOrderAmount(o);
            const visit = getVisitDate(o);
            const validTo = getOrderValidTo(o);
            const tone = statusMeta(getOrderStatus(o)).tone;
            const ticketName = getOrderTicketTitle(o);
            return (
              <article
                key={o.id}
                className={`seal-ticket seal-ticket--${tone}`}
                role="button"
                tabIndex={0}
                onClick={() => openOrder(o)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openOrder(o);
                  }
                }}
              >
                <div className="seal-stub">
                  <span>{getOrderCode(o)}</span>
                </div>

                <div className="seal-body">
                  <div className="seal-body-top">
                    <div>
                      <span className="seal-buyer-label">Xaridor</span>
                      <span className="seal-buyer-name">{getBuyerName(o)}</span>
                      {ticketName !== "—" && (
                        <span className="seal-ticket-name">
                          <Ticket size={14} /> {ticketName}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={getOrderStatus(o)} />
                  </div>

                  <div className="seal-fields">
                    {visit && (
                      <div className="seal-field">
                        <small>Tashrif sanasi</small>
                        <strong>{formatDateDot(visit)}</strong>
                      </div>
                    )}
                    {qty && (
                      <div className="seal-field">
                        <small>Kishilar soni</small>
                        <strong>{qty}</strong>
                      </div>
                    )}
                    {phone && (
                      <div className="seal-field">
                        <small>Telefon</small>
                        <strong>{phone}</strong>
                      </div>
                    )}
                    {amount && (
                      <div className="seal-field">
                        <small>Summa</small>
                        <strong>{formatPrice(amount)}</strong>
                      </div>
                    )}
                  </div>

                  <div className="seal-body-foot">
                    <span>{validTo ? `Amal qilish muddati ${formatDateDot(validTo)}` : formatDateTime(getOrderDate(o))}</span>
                    <code title={String(o.id)}>ID: {String(o.id).slice(0, 8)}…</code>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onMouseDown={closeOrder}>
          <section
            className="modal-content tkt-modal"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="tkt-modal-head">
              <div>
                <h2 className="modal-title">Buyurtma tafsiloti</h2>
                <p>#{getOrderCode(current)}</p>
              </div>
              <button className="icon-btn" onClick={closeOrder} aria-label="Yopish" disabled={updating}>
                <X size={20} />
              </button>
            </div>

            <OrderDetails order={current} loading={detailLoading} />

            {pendingStatus ? (
              <div className={`seal-confirm ${pendingStatus === "CANCELLED" ? "seal-confirm--danger" : ""}`}>
                <p>
                  {pendingStatus === "USED"
                    ? "Chipta ishlatilgan deb belgilansinmi?"
                    : "Buyurtma bekor qilinsinmi? Buni ortga qaytarib bo'lmaydi."}
                </p>
                <div className="modal-actions">
                  <button className="btn btn-ghost" onClick={() => setPendingStatus(null)} disabled={updating}>
                    Yo'q
                  </button>
                  <button className="btn btn-primary" onClick={handleStatus} disabled={updating}>
                    {updating ? "Saqlanmoqda..." : "Ha, tasdiqlash"}
                  </button>
                </div>
              </div>
            ) : (
              !isFinal && (
                <div className="seal-actions">
                  <button className="btn btn-danger" onClick={() => setPendingStatus("CANCELLED")}>
                    <Ban size={16} /> Bekor qilish
                  </button>
                  <button className="btn btn-primary" onClick={() => setPendingStatus("USED")}>
                    <CheckCircle2 size={16} /> Ishlatilgan deb belgilash
                  </button>
                </div>
              )
            )}
          </section>
        </div>
      )}
    </div>
  );
}