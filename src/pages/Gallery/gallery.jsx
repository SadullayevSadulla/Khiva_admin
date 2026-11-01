import React, { useEffect, useRef, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import lightGallery from 'lightgallery';
import lgZoom from 'lightgallery/plugins/zoom';
import lgThumbnail from 'lightgallery/plugins/thumbnail';

import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-thumbnail.css';

import api, { fileUrl } from "../../api";
import { getImageUrl, getErrorText, replaceGalleryImage } from "./galleryApi";
import './gallery.css';
import Loader from "../../components/Loader/loader";

export default function Gallery() {
  const navigate = useNavigate();
  const gridRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/gallery');
      const data = res.data?.data || res.data || [];
      setItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Rasmlarni yuklashda xatolik yuz berdi!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  useEffect(() => {
    if (!gridRef.current || items.length === 0) return;
    const instance = lightGallery(gridRef.current, {
      plugins: [lgZoom, lgThumbnail],
      selector: '.gallery-link',
      speed: 400,
      download: false,
    });
    return () => instance.destroy();
  }, [items]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/api/admin/gallery/${selectedId}`);
      message.success("Rasm galereyadan o'chirildi!");
      setConfirm(false);
      fetchGallery();
    } catch (err) {
      console.error(err);
      message.error("O'chirishda xatolik: " + getErrorText(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleReplace = async (id, e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      message.error("Rasm hajmi 5MB dan oshmasligi kerak!");
      return;
    }
    setBusyId(id);
    try {
      await replaceGalleryImage(id, file);
      message.success("Rasm almashtirildi!");
      fetchGallery();
    } catch (err) {
      console.error("Almashtirishda xato:", err.response?.status, err.response?.data);
      message.error("Almashtirishda xatolik: " + getErrorText(err), 8);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loader />;

  if (error) return <p className="gallery-error">{error}</p>;

  return (
    <div>
      <div className="page-bar">
        <p className="page-bar-info">Jami: {items.length} ta rasm</p>
        <button onClick={() => navigate("/galereya/add")} className="btn btn-primary">
          <Plus size={18} />
          <span>Rasm qo'shish</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="gallery-empty panel">
          <img src="/logo.png" alt="" />
          <p>Galereyada hozircha rasm yo'q</p>
          <button onClick={() => navigate("/galereya/add")} className="btn btn-primary">
            <Plus size={18} /> Birinchi rasmni qo'shing
          </button>
        </div>
      ) : (
        <div className="gallery-grid" ref={gridRef}>
          {items.map((item) => {
            const src = fileUrl(getImageUrl(item));
            return (
              <article key={item.id} className="gallery-card">
                <a className="gallery-link" href={src} data-src={src}>
                  <img src={src} alt="" loading="lazy" />
                </a>
                <div className="gallery-actions">
                  <label className={`btn btn-ghost btn-sm ${busyId === item.id ? 'is-busy' : ''}`}>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      hidden
                      disabled={busyId === item.id}
                      onChange={(e) => handleReplace(item.id, e)}
                    />
                    <RefreshCw size={15} />
                    {busyId === item.id ? "Yuklanmoqda..." : "Almashtirish"}
                  </label>
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
              </article>
            );
          })}
        </div>
      )}

      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(false)}>
          <div className="modal-content" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">O'chirishni tasdiqlang</h2>
            <p className="modal-text">Rasm galereyadan butunlay o'chiriladi. Buni ortga qaytarib bo'lmaydi.</p>
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