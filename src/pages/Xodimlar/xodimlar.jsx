import React, { useState, useEffect, useRef } from 'react';
import { Table, message } from 'antd';
import { Plus, SquarePen, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import lightGallery from 'lightgallery';
import lgZoom from 'lightgallery/plugins/zoom';
import lgThumbnail from 'lightgallery/plugins/thumbnail';

import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-thumbnail.css';

import api, { fileUrl } from '../../api';
import './xodimlar.css';

function Avatar({ record }) {
  const [failed, setFailed] = useState(false);
  const galleryRef = useRef(null);
  const imageUrl = fileUrl(record.images?.[0]?.url);

  useEffect(() => {
    if (!galleryRef.current || !imageUrl || failed) return;

    const instance = lightGallery(galleryRef.current, {
      plugins: [lgZoom, lgThumbnail],
      speed: 400,
      selector: 'a',
      download: false,
    });

    return () => {
      instance.destroy();
    };
  }, [imageUrl, failed]);

  if (imageUrl && !failed) {
    return (
      <div ref={galleryRef} className="xodim-avatar-wrapper">
        <a href={imageUrl} data-src={imageUrl}>
          <img
            src={imageUrl}
            alt={record.fullName || 'xodim'}
            className="xodim-avatar"
            onError={() => setFailed(true)}
            style={{ cursor: 'pointer' }}
          />
        </a>
      </div>
    );
  }

  const initial = record.fullName ? record.fullName.charAt(0).toUpperCase() : 'X';
  return <div className="xodim-avatar-placeholder">{initial}</div>;
}

export default function Xodimlar() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/employee');
      setEmployees(response.data.data || []);
    } catch (err) {
      console.error(err);
      message.error('Xodimlarni yuklashda xatolik yuz berdi!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/api/admin/employee/${selectedId}`);
      message.success('Xodim muvaffaqiyatli o‘chirildi!');
      setConfirm(false);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      message.error('O‘chirishda xatolik yuz berdi!');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      title: 'Rasm',
      key: 'image',
      width: 80,
      render: (_, record) => <Avatar record={record} />,
    },
    {
      title: 'Ism va familiya',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (value) => <span className="xodim-name">{value}</span>,
    },
    {
      title: "Tug'ilgan kuni",
      dataIndex: 'birthDate',
      key: 'birthDate',
    },
    {
      title: 'Lavozimi',
      key: 'position',
      render: (_, record) => {
        if (typeof record.position === 'object' && record.position !== null) {
          return record.position.uz || record.position.ru || record.position.en || '-';
        }
        return record.position || '-';
      },
    },
    {
      title: 'Amallar',
      key: 'action',
      width: 250,
      render: (_, record) => (
        <div className="row-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(`/xodimlar/tahrirlash/${record.id}`, { state: { employee: record } })}
          >
            <SquarePen size={15} /> Tahrirlash
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              setSelectedId(record.id);
              setConfirm(true);
            }}
          >
            <Trash2 size={15} /> O'chirish
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-bar">
        <p className="page-bar-info">Jami: {employees.length} ta xodim</p>
        <button className="btn btn-primary" onClick={() => navigate('/xodimlar/qoshish')}>
          <Plus size={18} /> Xodim qo'shish
        </button>
      </div>

      <div className="panel table-panel">
        <Table
          dataSource={employees}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 760 }}
          pagination={{ pageSize: 10, position: ['bottomRight'], hideOnSinglePage: true }}
          locale={{ emptyText: "Hozircha xodimlar yo'q" }}
        />
      </div>

      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(false)}>
          <div className="modal-content" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">O'chirishni tasdiqlang</h2>
            <p className="modal-text">Xodim butunlay o'chiriladi. Buni ortga qaytarib bo'lmaydi.</p>
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