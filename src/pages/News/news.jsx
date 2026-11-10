import React, { useEffect, useState } from "react";
import { Plus, SquarePen, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { message } from "antd";
import api, { fileUrl } from "../../api";

import './news.css';
import Loader from "../../components/Loader/loader";

const getLocalizedText = (value) => {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";

  const localized = value.uz ?? value.text ?? value.value ?? value.ru ?? value.en;
  return typeof localized === "string" ? localized : "";
};

const stripHtml = (html = "") =>
  String(html).replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();

const getArticlePreview = (item) => {
  const content = [item?.content, item?.description, item?.body, item?.text]
    .map(getLocalizedText)
    .map(stripHtml)
    .find(Boolean);
  return content?.substring(0, 140) || "";
};

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
      const list = Array.isArray(data) ? data : [];
      const enrichedList = await Promise.all(list.map(async (item) => {
        if (getArticlePreview(item)) return item;

        const id = item.id ?? item._id;
        if (!id) return item;

        try {
          const detailRes = await api.get(`/api/admin/news/${id}`);
          let detail = detailRes.data?.data || detailRes.data;
          if (Array.isArray(detail)) detail = detail.find((entry) => String(entry.id ?? entry._id) === String(id));
          return detail && typeof detail === "object" ? { ...item, ...detail } : item;
        } catch (detailError) {
          console.error(`Yangilik matnini yuklashda xatolik (${id}):`, detailError);
          return item;
        }
      }));

      setNewsList(enrichedList);
      setTotalItems(res.data?.total || res.data?.count || list.length);
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
            const text = getArticlePreview(item);
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
                  <p className="news-desc">{text || "Maqola matni yo'q"}</p>

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