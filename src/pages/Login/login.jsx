import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../../api';
import './login.css';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="lg-page" data-theme="light">
      <aside className="lg-photo">
        <div className="lg-photo-text">
          <h2>Xiva muzeyi</h2>
          <p>Kolleksiyalar, xodimlar, yangiliklar va chiptalarni bir joydan boshqaring.</p>
        </div>
      </aside>

      <main className="lg-panel">
        <form onSubmit={handleLogin} className="lg-form">
          <img src="/logo.png" alt="Xiva muzeyi logotipi" className="lg-logo" />
          <h1 className="lg-title">Boshqaruv paneliga kirish</h1>
          <p className="lg-sub">Davom etish uchun email va parolingizni kiriting.</p>

          {error && (
            <div className="lg-error" role="alert">
              {error}
            </div>
          )}

          <div className="lg-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="username"
              placeholder="admin@example.com"
            />
          </div>

          <div className="lg-field">
            <label htmlFor="password">Parol</label>
            <div className="lg-password">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                placeholder="********"
              />
              <button
                type="button"
                className="lg-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="lg-btn" disabled={loading}>
            {loading ? 'Tekshirilmoqda...' : 'Kirish'}
          </button>
        </form>
      </main>
    </div>
  );
}