import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Switch, Select, Space, message, Popconfirm, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const API_BASE = import.meta.env.VITE_API_URL || 'https://api.atr.uz';

const TiketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  // Tokenni local storage'dan olish (loyihangizdagi usulga moslang)
  const token = localStorage.getItem('token'); 
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/admin/tickets`, axiosConfig);
      setTickets(response.data.data || response.data);
    } catch (error) {
      message.error("Chiptalarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/admin/tickets/${id}`, axiosConfig);
      message.success("Chipta o'chirildi");
      fetchTickets();
    } catch (error) {
      message.error("O'chirishda xatolik yuz berdi");
    }
  };

  const handleSave = async (values) => {
    try {
      if (editingId) {
        await axios.patch(`${API_BASE}/api/admin/tickets/${editingId}`, values, axiosConfig);
        message.success("Chipta yangilandi");
      } else {
        await axios.post(`${API_BASE}/api/admin/tickets`, values, axiosConfig);
        message.success("Yangi chipta qo'shildi");
      }
      setIsModalVisible(false);
      fetchTickets();
    } catch (error) {
      message.error("Saqlashda xatolik yuz berdi");
    }
  };

  const columns = [
    { title: 'Sarlavha (UZ)', dataIndex: ['title', 'uz'], key: 'titleUz' },
    { title: 'Narxi', dataIndex: 'price', key: 'price', render: (price) => `${price} so'm` },
    { title: 'Kategoriya', dataIndex: 'category', key: 'category' },
    { title: 'Holati', dataIndex: 'isActive', key: 'isActive', render: (isActive) => isActive ? 'Faol' : 'Nofaol' },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="primary" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Rostdan ham o'chirmoqchimisiz?" onConfirm={() => handleDelete(record.id)}>
            <Button type="primary" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Chipta Tariflari</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Yangi qo'shish
        </Button>
      </div>

      <Table columns={columns} dataSource={tickets} rowKey="id" loading={loading} />

      <Modal
        title={editingId ? "Chiptani tahrirlash" : "Yangi chipta qo'shish"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={8}><Form.Item name={['title', 'uz']} label="Sarlavha (UZ)" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name={['title', 'ru']} label="Sarlavha (RU)" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name={['title', 'en']} label="Sarlavha (EN)" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="price" label="Narxi" rules={[{ required: true }]}><InputNumber className="w-full" /></Form.Item></Col>
            <Col span={8}>
              <Form.Item name="category" label="Kategoriya" rules={[{ required: true }]}>
                <Select>
                  <Option value="ADULT">Kattalar</Option>
                  <Option value="CHILD">Bolalar</Option>
                  <Option value="STUDENT">Talabalar</Option>
                  <Option value="FOREIGNER">Xorijliklar</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}><Form.Item name="personCount" label="Odam soni" rules={[{ required: true }]}><InputNumber min={1} className="w-full" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
             <Col span={12}><Form.Item name="validFrom" label="Amal qilish boshlanishi (Sana)"><Input type="date" /></Form.Item></Col>
             <Col span={12}><Form.Item name="validTo" label="Amal qilish tugashi (Sana)"><Input type="date" /></Form.Item></Col>
          </Row>
          <Form.Item name="visitingHours" label="Tashrif soatlari (Masalan: 09:00 - 18:00)"><Input /></Form.Item>
          <Form.Item name="isActive" label="Faollik holati" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TiketsPage;