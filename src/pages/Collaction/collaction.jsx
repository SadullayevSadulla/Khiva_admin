import React, { useEffect, useState } from "react";
import { Plus, SquarePen, Trash } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { message } from "antd"; 
import api from "../../api";

import './collaction.css';
import Loader from "../../components/Loader/loader";

export default function Collaction() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader/>
      </div>
    );
  }

  if (error) return <p className="text-red-500 p-6">{error}</p>;

  return (
    <div className="xodimlar-container">
      <div className="xodimlar-header">
        <h1 className="xodimlar-title"></h1>
        <button
          type="primary"
          onClick={() => navigate("/collaction/add")}
          className="ant-btn add-xodim-btn flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden md:block">Kolleksiya qo'shish</span>
        </button>
      </div>

      {collections?.length === 0 ? (
        <div className="text-center p-10 text-gray-500 font-medium">Hozircha hech qanday kolleksiya yo'q</div>
      ) : (
        <>
          <div className="collection-grid">
            {collections.map((item) => (
              <div key={item.id} className="collection-card">
                <div className="collection-img-wrapper">
                  <img
                    src={item.images?.[0]?.url || 'https://via.placeholder.com/300'}
                    alt={item.title?.uz}
                  />
                </div>
                <div className="collection-content">
                  <h1 className="collection-title">{item.title?.uz || 'Nomsiz'}</h1>
                  <p className="collection-desc">{item.description?.uz || 'Tavsif yo\'q'}</p>

                  <div className="collection-actions mt-auto">
                    <button
                      onClick={() => navigate(`/collaction/add/${item.id}`)}
                      className="btn-edit"
                    >
                       Tahrirlash
                    </button>
                    <button
                      onClick={() => {
                        setSelectedId(item.id);
                        setConfirm(true); 
                      }}
                      disabled={deleteLoading}
                      className="btn-delete"
                    >
                     O'chirish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {confirm && (
            <div className="modal-overlay" onClick={() => setConfirm(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Haqiqatan ham o'chirmoqchimisiz?</h2>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setConfirm(false)}
                    className="px-6 py-2 border border-gray-400 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                  >
                    Yo'q
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2 cursor-pointer"
                  >
                    {deleteLoading ? "O'chirilmoqda..." : "Ha"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}