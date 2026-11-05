import React, { useEffect, useMemo, useState } from "react";
import { Table, message } from "antd";
import { Trash2 } from "lucide-react";
import {
  fetchRequests,
  fetchRequest,
  deleteRequest,
  getErrorText,
  getName,
  getEmail,
  getPhone,
  getSubject,
  getText,
  getDate,
  formatDate,
  preview,
} from "./requestsApi";
import "./requests.css";
// Qator ochilganda ko'rsatiladigan to'liq xabar
function RequestDetails({ request, loading }) {
  const email = getEmail(request);
  const phone = getPhone(request);
  const subject = getSubject(request);
  const text = getText(request);

  return (
    <div className={`req-details ${loading ? "is-loading" : ""}`}>
      <div className="req-meta">
        <div>
          <span>Ism</span>
          <strong>{getName(request)}</strong>
        </div>
        {email && (
          <div>
            <span>Email</span>
            <strong>{email}</strong>
          </div>
        )}
        {phone && (
          <div>
            <span>Telefon</span>
            <strong>{phone}</strong>
          </div>
        )}
        {getDate(request) && (
          <div>
            <span>Yuborilgan vaqt</span>
            <strong>{formatDate(getDate(request))}</strong>
          </div>
        )}
      </div>

      {subject && <h4 className="req-subject">{subject}</h4>}
      <p className="req-message">{text || "Xabar matni yo'q."}</p>
    </div>
  );
}

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(null);
  const [note, setNote] = useState("");

  const [expandedKeys, setExpandedKeys] = useState([]);
  const [details, setDetails] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    setNote("");
    try {
      const { list, total: serverTotal } = await fetchRequests();
      setRequests(list);
      setTotal(serverTotal);
    } catch (err) {
      console.error("Xabarlar:", err.response?.status, err.response?.data || err);
      if (err.isShapeError) {
        setRequests([]);
        setNote(err.message);
      } else {
        setNote("Xabarlarni yuklab bo'lmadi: " + getErrorText(err));
        message.error("Xabarlarni yuklab bo'lmadi: " + getErrorText(err), 8);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const loadDetail = async (record) => {
    if (details[record.id]) return;
    setDetailLoadingId(record.id);
    try {
      const data = await fetchRequest(record.id);
      if (data) setDetails((prev) => ({ ...prev, [record.id]: { ...record, ...data } }));
    } catch (err) {
      console.error("Xabar:", err.response?.status, err.response?.data);
    } finally {
      setDetailLoadingId(null);
    }
  };

  const handleExpand = (expanded, record) => {
    setExpandedKeys((prev) => (expanded ? [...prev, record.id] : prev.filter((key) => key !== record.id)));
    if (expanded) loadDetail(record);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteRequest(deleteTarget.id);
      message.success("Xabar o'chirildi.");
      setDeleteTarget(null);
      loadRequests();
    } catch (err) {
      console.error("O'chirishda xato:", err.response?.status, err.response?.data);
      message.error("O'chirishda xatolik: " + getErrorText(err), 8);
    } finally {
      setDeleting(false);
    }
  };

  const has = useMemo(
    () => ({
      email: requests.some((r) => getEmail(r)),
      phone: requests.some((r) => getPhone(r)),
      subject: requests.some((r) => getSubject(r)),
      text: requests.some((r) => getText(r)),
      date: requests.some((r) => getDate(r)),
    }),
    [requests]
  );

  const sortedRequests = useMemo(() => {
    const time = (r) => {
      const t = new Date(getDate(r)).getTime();
      return Number.isNaN(t) ? 0 : t;
    };
    return [...requests].sort((a, b) => time(b) - time(a));
  }, [requests]);

  const columns = [
    {
      title: "Yuboruvchi",
      key: "name",
      render: (_, r) => (
        <div className="req-person">
          <span className="req-avatar">{getName(r).charAt(0).toUpperCase()}</span>
          <span className="req-name">{getName(r)}</span>
        </div>
      ),
    },
    has.email && {
      title: "Email",
      key: "email",
      render: (_, r) => getEmail(r) || "—",
    },
    has.phone && {
      title: "Telefon",
      key: "phone",
      render: (_, r) => getPhone(r) || "—",
    },
    (has.subject || has.text) && {
      title: "Xabar",
      key: "preview",
      render: (_, r) => <span className="req-preview">{preview(getSubject(r) || getText(r))}</span>,
    },
    has.date && {
      title: "Sana",
      key: "date",
      width: 170,
      render: (_, r) => formatDate(getDate(r)),
    },
    {
      title: "Amallar",
      key: "actions",
      width: 130,
      render: (_, r) => (
        <button
          className="btn btn-danger btn-sm"
          onClick={(event) => {
            event.stopPropagation();
            setDeleteTarget(r);
          }}
        >
          <Trash2 size={15} /> O'chirish
        </button>
      ),
    },
  ].filter(Boolean);

  return (
    <div>
      <div className="page-bar">
        <p className="page-bar-info">Jami: {total || requests.length} ta xabar</p>
      </div>

      {note && <p className="req-note">{note}</p>}

      <div className="panel table-panel req-table-panel">
        <Table
          dataSource={sortedRequests}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 760 }}
          pagination={{ pageSize: 10, position: ["bottomRight"], hideOnSinglePage: true }}
          locale={{ emptyText: "Hozircha xabarlar yo'q" }}
          expandable={{
            showExpandColumn: false,
            expandedRowKeys: expandedKeys,
            onExpand: handleExpand,
            expandRowByClick: true,
            expandedRowRender: (record) => (
              <RequestDetails request={details[record.id] || record} loading={detailLoadingId === record.id} />
            ),
          }}
        />
      </div>

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
              <strong>{getName(deleteTarget)}</strong> yuborgan xabar butunlay o'chiriladi. Buni ortga qaytarib bo'lmaydi.
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