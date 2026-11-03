import { useEffect, useState } from "react";
import { Table, message } from "antd";
import { Plus, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchAdmins, deleteAdmin, getAdminId, getAdminName, getErrorMessage } from "./adminsApi";
import "./admins.css";

export default function Admins() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadAdmins = async () => {
    setLoading(true);
    setNote("");
    try {
      setAdmins(await fetchAdmins());
    } catch (error) {
      console.error("Adminlar:", error.response?.status, error.response?.data || error);
      const text = error.response ? getErrorMessage(error) : error.message;
      setNote(`Adminlarni yuklab bo'lmadi: ${text}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const confirmDelete = async () => {
    const id = getAdminId(deleteTarget);
    if (!id) {
      message.error("Admin ID topilmadi.");
      return;
    }
    setDeleting(true);
    try {
      await deleteAdmin(id);
      message.success("Admin o'chirildi.");
      setDeleteTarget(null);
      loadAdmins();
    } catch (error) {
      console.error("O'chirishda xato:", error.response?.status, error.response?.data || error);
      message.error(`O'chirishda xatolik: ${getErrorMessage(error)}`, 8);
    } finally {
      setDeleting(false);
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
    { title: "Email", dataIndex: "email", key: "email", render: (value) => value || "—" },
    {
      title: "Amallar",
      key: "actions",
      width: 140,
      render: (_, admin) => (
        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(admin)}>
          <Trash2 size={15} /> O'chirish
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-bar">
        <p className="page-bar-info">Jami: {admins.length} ta admin</p>
        <button className="btn btn-primary" onClick={() => navigate("/adminlar/add")}>
          <Plus size={18} /> Yangi admin
        </button>
      </div>

      {note && <p className="admins-note">{note}</p>}

      <div className="panel table-panel admins-table-panel">
        <Table
          dataSource={admins}
          columns={columns}
          rowKey={(admin) => getAdminId(admin) || admin.email}
          loading={loading}
          scroll={{ x: 560 }}
          pagination={{ pageSize: 10, position: ["bottomRight"], hideOnSinglePage: true }}
          locale={{ emptyText: "Hozircha adminlar yo'q" }}
        />
      </div>

      {deleteTarget && (
        <div className="modal-overlay" onMouseDown={() => setDeleteTarget(null)}>
          <section
            className="modal-content admins-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Adminni o'chirish"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="admins-modal-close"
              onClick={() => setDeleteTarget(null)}
              aria-label="Yopish"
              type="button"
            >
              <X size={19} />
            </button>
            <h2 className="modal-title">O'chirishni tasdiqlang</h2>
            <p className="modal-text">
              <strong>{getAdminName(deleteTarget)}</strong> admin hisobi butunlay o'chiriladi. Buni ortga qaytarib bo'lmaydi.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Yo'q
              </button>
              <button className="btn btn-primary" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "O'chirilmoqda..." : "Ha, o'chirish"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}