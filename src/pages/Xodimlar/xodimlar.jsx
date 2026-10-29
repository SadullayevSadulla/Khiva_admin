import React, { useState, useEffect } from 'react';
import { Table, Popconfirm, message } from 'antd';
import { Plus, SquarePen, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { fileUrl } from '../../api';
import './xodimlar.css';

function Avatar({ record }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = fileUrl(record.images?.[0]?.url);

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={record.fullName || 'xodim'}
        className="xodim-avatar"
        onError={() => setFailed(true)}
      />
    );
  }

  const initial = record.fullName ? record.fullName.charAt(0).toUpperCase() : 'X';
  return <div className="xodim-avatar-placeholder">{initial}</div>;
}

export default function Xodimlar() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/admin/employee/${id}`);
      message.success('Xodim muvaffaqiyatli o‘chirildi!');
      fetchEmployees();
    } catch (err) {
      console.error(err);
      message.error('O‘chirishda xatolik yuz berdi!');
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
            onClick={() => navigate(`/xodimlar/tahrirlash/${record.id}`)}
          >
            <SquarePen size={15} /> Tahrirlash
          </button>
          <button className="btn btn-danger btn-sm">
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
          locale={{ emptyText: "Hozircha xodimlar yo'q" }}
        />
      </div>
    </div>
  );
}