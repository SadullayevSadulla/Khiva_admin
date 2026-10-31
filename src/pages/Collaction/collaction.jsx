import React, { useEffect, useState } from "react";
import { Plus, SquarePen, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { message } from "antd";
import api, { fileUrl } from "../../api";

import './collaction.css';
import Loader from "../../components/Loader/loader";

export default function Collaction() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const [collections, setCollections] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCollections = async (page) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/collection?page=${page}`);
      const data = res.data?.data || res.data || [];
      setCollections(data);
      setTotalItems(res.data?.total || res.data?.count || data.length);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections(currentPage);
  }, [currentPage]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/api/admin/collection/${selectedId}`);
      message.success("Kolleksiya muvaffaqiyatli o'chirildi!");
      setConfirm(false);
      fetchCollections(currentPage);
    } catch (err) {
      console.error(err);
      message.error("O'chirishda xatolik yuz berdi!");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <Loader />;

  if (error) return <p className="collection-error">{error}</p>;

  return (
    <div>
      <div className="page-bar">
        <p className="page-bar-info">Jami: {totalItems} ta kolleksiya</p>
        <button onClick={() => navigate("/collaction/add")} className="btn btn-primary">
          <Plus size={18} />
          <span>Kolleksiya qo'shish</span>
        </button>
      </div>

      {collections?.length === 0 ? (
        <div className="collection-empty panel">
          <img src="/logo.png" alt="" />
          <p>Hozircha hech qanday kolleksiya yo'q</p>
          <button onClick={() => navigate("/collaction/add")} className="btn btn-primary">
            <Plus size={18} /> Birinchi kolleksiyani qo'shing
          </button>
        </div>
      ) : (
        <div className="collection-grid">
          {collections.map((item) => {
            const image = fileUrl(item.images?.[0]?.url);
            return (
              <article key={item.id} className="collection-card">
                <div className="collection-img-wrapper">
                  {image ? (
                    <img src={image} alt={item.title?.uz || ''} />
                  ) : (
                    <img src="/logo.png" alt="" className="collection-img-empty" />
                  )}
                </div>
                <div className="collection-content">
                  <h3 className="collection-title">{item.title?.uz || 'Nomsiz'}</h3>
                  <p className="collection-desc">{item.description?.uz || "Tavsif yo'q"}</p>

                  <div className="collection-actions">
                    <button
                      onClick={() => navigate(`/collaction/add/${item.id}`, { state: { collection: item } })}
                      className="btn btn-ghost btn-sm"
                    >
                      <SquarePen size={15} /> Tahrirlash
                    </button>
                    <button
                      onClick={() => {
                        setSelectedId(item.id);
                        setConfirm(true);
                      }}
                      disabled={deleteLoading}
                      className="btn btn-danger btn-sm"
                    >
                      <Trash2 size={15} /> O'chirish
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(false)}>
          <div className="modal-content" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">O'chirishni tasdiqlang</h2>
            <p className="modal-text">Kolleksiya butunlay o'chiriladi. Buni ortga qaytarib bo'lmaydi.</p>
            <div className="modal-actions">
              <button onClick={() => setConfirm(false)} className="btn btn-ghost">
                Yo'q
              </button>
              <button onClick={handleDelete} disabled={deleteLoading} className="btn btn-primary">
                {deleteLoading ? "O'chirilmoqda..." : "Ha, o'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}