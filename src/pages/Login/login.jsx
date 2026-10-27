import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api'; 
import './login.css';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Inputlar o'zgarganda avtomatik yangilab turish uchun
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Axios orqali so'rov yuborish
      const response = await api.post('/api/login', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      const token =
        response.data.token ||
        response.data.access_token ||
        response.data.data?.token;

      if (token) {
        localStorage.setItem('token', token);
        navigate('/dashboard', { replace: true });
      } else {
        setError('Serverdan token kelmadi.');
      }
    } catch (err) {
      console.error('Xatolik tafsiloti:', err);

      if (!err.response) {
        setError('Serverga ulanib bo‘lmadi (tarmoq yoki CORS xatosi).');
      } else if (err.response.status === 404) {
        setError('Manzil topilmadi (404). API manzilini tekshiring.');
      } else if (err.response.status === 403) {
        setError(err.response.data?.error || 'Akkaunt tasdiqlanmagan yoki ruxsat yo‘q.');
      } else if (err.response.status >= 500) {
        setError('Serverda xatolik (' + err.response.status + ').');
      } else {
        setError(err.response.data?.error || err.response.data?.message || 'Email yoki parol xato!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-bg">
      <div className="login-container">
        <form onSubmit={handleLogin} className="login-form">
          <h2>Khiva Admin - Kirish</h2>
          
          {error && <div className="error-alert">{error}</div>}

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="admin@example.com"
            />
          </div>

          <div className="input-group">
            <label>Parol</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="********"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Tekshirilmoqda...' : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}