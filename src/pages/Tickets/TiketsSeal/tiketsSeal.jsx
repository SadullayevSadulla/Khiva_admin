import React, { useState, useEffect } from 'react';
import { Table, Select, Tag, message } from 'antd';
import axios from 'axios';

const { Option } = Select;
const API_BASE = import.meta.env.VITE_API_URL || 'https://api.atr.uz';

const TiketsSeal = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/admin/tickets/orders`, axiosConfig);
      setOrders(response.data.data || response.data);
    } catch (error) {
      message.error("Buyurtmalarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.patch(`${API_BASE}/api/admin/tickets/orders/${orderId}/status`, { status: newStatus }, axiosConfig);
      message.success("Holat muvaffaqiyatli o'zgartirildi");
      fetchOrders(); // Jadvalni yangilash
    } catch (error) {
      message.error("Holatni o'zgartirishda xatolik yuz berdi");
    }
  };

  const columns = [
    { title: 'Buyurtma ID', dataIndex: 'id', key: 'id' },
    { title: 'Mijoz Ismi', dataIndex: 'customerName', key: 'customerName' }, 
    { title: 'Telefon', dataIndex: 'phoneNumber', key: 'phoneNumber' },
    { title: 'Jami summa', dataIndex: 'totalPrice', key: 'totalPrice', render: (price) => `${price} so'm` },
    { 
      title: 'Holati', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => {
        let color = status === 'PAID' ? 'green' : status === 'USED' ? 'blue' : 'red';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Harakat',
      key: 'action',
      render: (_, record) => (
        <Select 
          defaultValue={record.status} 
          style={{ width: 120 }} 
          onChange={(value) => handleStatusChange(record.id, value)}
        >
          <Option value="PAID">To'langan</Option>
          <Option value="USED">Foydalanilgan</Option>
          <Option value="CANCELLED">Bekor qilingan</Option>
        </Select>
      )
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tasdiqlangan Buyurtmalar (Sotilgan chiptalar)</h1>
      <Table 
        columns={columns} 
        dataSource={orders} 
        rowKey="id" 
        loading={loading} 
      />
    </div>
  );
};

export default TiketsSeal;