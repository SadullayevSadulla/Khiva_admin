import React, { useEffect, useState } from "react";
import { Plus, SquarePen, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { message } from "antd";
import api, { fileUrl } from "../../api";

import './news.css';
import Loader from "../../components/Loader/loader";

// HTML teglarni olib tashlab, oddiy matn qaytaradi
const stripHtml = (html = "") => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export default function News() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const [newsList, setNewsList] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchNews = async (page) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/news?page=${page}`);
      const data = res.data?.data || res.data || [];
      setNewsList(Array.isArray(data) ? data : []);
      setTotalItems(res.data?.total || res.data?.count || data.length);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Yangiliklarni yuklashda xatolik yuz berdi!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(currentPage);
  }, [currentPage]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/api/admin/news/${selectedId}`);
      message.success("Yangilik muvaffaqiyatli o'chirildi!");
      setConfirm(false);
      fetchNews(currentPage);
    } catch (err) {
      console.error(err);
      message.error("O'chirishda xatolik yuz berdi!");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <Loader />;

  if (error) return <p className="news-error">{error}</p>;

  return (
    <div>
      <div className="page-bar">
        <p className="page-bar-info">Jami: {totalItems} ta yangilik</p>
        <button onClick={() => navigate("/news/add")} className="btn btn-primary">
          <Plus size={18} />
          <span>Yangilik qo'shish</span>
        </button>
      </div>

      {newsList.length === 0 ? (
        <div className="news-empty panel">
          <img src="/logo.png" alt="" />
          <p>Hozircha hech qanday yangilik yo'q</p>
          <button onClick={() => navigate("/news/add")} className="btn btn-primary">
            <Plus size={18} /> Birinchi yangilikni qo'shing
          </button>
        </div>
      ) : (
        <div className="news-grid">
          {newsList.map((item) => {
            const mainImg = item.images?.find((img) => img.mainImage)?.url || item.images?.[0]?.url;
            const image = fileUrl(mainImg);
            const text = stripHtml(item.description?.uz) || stripHtml(item.content?.uz).substring(0, 140);
            return (
              <article key={item.id} className="news-card">
                <div className="news-img-wrapper">
                  {image ? (
                    <img src={image} alt={item.title?.uz || ''} />
                  ) : (
                    <img src="/logo.png" alt="" className="news-img-empty" />
                  )}
                </div>
                <div className="news-content">
                  <h3 className="news-title">{item.title?.uz || 'Nomsiz'}</h3>
                  <p className="news-desc">{text || "Tavsif yo'q"}</p>

                  <div className="news-actions">
                    <button
                      onClick={() => navigate(`/news/add/${item.id}`, { state: { newsItem: item } })}
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
            <p className="modal-text">Yangilik butunlay o'chiriladi. Buni ortga qaytarib bo'lmaydi.</p>
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