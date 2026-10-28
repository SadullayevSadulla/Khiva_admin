import React, { useState, useEffect } from 'react';
import { Table, Space, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import './xodimlar.css';

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
      message.error('O‘chirishda xatolik yuz berdi!');
    }
  };

  const columns = [
    {
      title: 'RASM',
      key: 'image',
      render: (_, record) => {
        const imagePath = record.images?.[0]?.url;

        let imageUrl = '';
        if (imagePath && imagePath !== 'string') {
          if (imagePath.startsWith('http')) {
            imageUrl = imagePath;
          } else {
            const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
            imageUrl = `https://api.atr.uz${cleanPath}`;
          }
        }

        if (imageUrl) {
          return (
            <img 
              src={imageUrl} 
              alt="xodim" 
              className="xodim-avatar" 
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
          );
        }

        const initial = record.fullName ? record.fullName.charAt(0).toUpperCase() : 'X';
        return (
          <div className="xodim-avatar-placeholder">
            {initial}
          </div>
        );
      },
    },
    {
      title: 'Ism va Familya',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'TUG\'ILGAN KUNI',
      dataIndex: 'birthDate',
      key: 'birthDate',
    },
    {
      title: 'LAVOZIMI',
      key: 'position',
      render: (_, record) => {
        if (typeof record.position === 'object' && record.position !== null) {
          return record.position.uz || record.position.ru || record.position.en || '-';
        }
        return record.position || '-';
      },
    },
    {
      title: 'AMALLAR',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            className="edit-btn-link" 
            onClick={() => navigate(`/xodimlar/tahrirlash/${record.id}`)}
          >
            Tahrirlash
          </Button>
          
          <Button 
            type="link" 
            danger 
            className="delete-btn-link"
            onClick={() => handleDelete(record.id)}
          >
            O'chirish
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="xodimlar-container">
      <div className="xodimlar-header">
        <h2 className="xodimlar-title"></h2>
        
        <Button 
          type="primary" 
          className="add-xodim-btn"
          onClick={() => navigate('/xodimlar/qoshish')}
        >
          + Xodim qo'shish
        </Button>
      </div>

      <Table 
        dataSource={employees} 
        columns={columns} 
        rowKey="id" 
        loading={loading} 
      />
    </div>
  );
}