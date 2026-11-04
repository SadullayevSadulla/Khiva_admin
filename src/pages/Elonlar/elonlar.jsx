import React, { useEffect, useState } from "react";
import { Plus, SquarePen, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { message } from "antd";
import api, { fileUrl } from "../../api";

import './elonlar.css';
import Loader from "../../components/Loader/loader";

// HTML teglarni olib tashlab, oddiy matn qaytaradi
const stripHtml = (html = "") => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export default function Elonlar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const [elonlarList, setElonlarList] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchElonlar = async (page) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/announcement?page=${page}`);
      const data = res.data?.data || res.data || [];
      setElonlarList(Array.isArray(data) ? data : []);
      setTotalItems(res.data?.total || res.data?.count || data.length);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("E'lonlarni yuklashda xatolik yuz berdi!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElonlar(currentPage);
  }, [currentPage]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/api/admin/announcement/${selectedId}`);
      message.success("E'lon muvaffaqiyatli o'chirildi!");
      setConfirm(false);
      fetchElonlar(currentPage);
    } catch (err) {
      console.error(err);
      message.error("O'chirishda xatolik yuz berdi!");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <Loader />;

  if (error) return <p className="elon-error">{error}</p>;

  return (
    <div>
      <div className="page-bar">
        <p className="page-bar-info">Jami: {totalItems} ta e'lon</p>
        <button onClick={() => navigate("/elonlar/add")} className="btn btn-primary">
          <Plus size={18} />
          <span>E'lon qo'shish</span>
        </button>
      </div>

      {elonlarList.length === 0 ? (
        <div className="elon-empty panel">
          <img src="/logo.png" alt="" />
          <p>Hozircha hech qanday e'lon yo'q</p>
          <button onClick={() => navigate("/elonlar/add")} className="btn btn-primary">
            <Plus size={18} /> Birinchi e'lonni qo'shing
          </button>
        </div>
      ) : (
        <div className="elon-grid">
          {elonlarList.map((item) => {
            const mainImg = item.images?.find((img) => img.mainImage)?.url || item.images?.[0]?.url;
            const image = fileUrl(mainImg);
            const text = stripHtml(item.description?.uz || item.content?.uz).substring(0, 140);
            return (
              <article key={item.id} className="elon-card">
                <div className="elon-img-wrapper">
                  {image ? (
                    <img src={image} alt={item.title?.uz || ''} />
                  ) : (
                    <img src="/logo.png" alt="" className="elon-img-empty" />
                  )}
                </div>
                <div className="elon-content">
                  <h3 className="elon-title">{item.title?.uz || 'Nomsiz'}</h3>
                  <p className="elon-desc">{text || "Tavsif mavjud emas"}</p>

                  <div className="elon-actions">
                    <button
                      onClick={() => navigate(`/elonlar/add/${item.id}`, { state: { elonItem: item } })}
                      className="btn btn-ghost btn-sm"
                    >
                      <SquarePen size={15} /> Tahrirlash
                    </button>
                    <button
                      onClick={() => {
                        setSelectedId(item.id);
                        setConfirm(true);
                      }}
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
            <p className="modal-text">E'lon butunlay o'chiriladi. Buni ortga qaytarib bo'lmaydi.</p>
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