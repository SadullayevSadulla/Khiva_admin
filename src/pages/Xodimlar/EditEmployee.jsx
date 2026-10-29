import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { message } from 'antd';
import { UploadOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import api from '../../api';
import './add-employee.css';
import Loader from '../../components/Loader/loader';

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lang, setLang] = useState('uz');
  const [loading, setLoading] = useState(false);

  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imgUploading, setImgUploading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    birthDate: '',
    position: { uz: '', ru: '', en: '' },
  });

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const response = await api.get(`/api/admin/employee/${id}`);
        const data = response.data.data || response.data;

        let fName = data.firstName || '';
        let lName = data.lastName || '';
        let mName = data.middleName || '';

        if (data.fullName && !data.firstName) {
          const nameParts = data.fullName.trim().split(' ');
          lName = nameParts[0] || '';
          fName = nameParts[1] || '';
          mName = nameParts.slice(2).join(' ') || '';
        }

        setFormData({
          firstName: fName,
          lastName: lName,
          middleName: mName,
          birthDate: data.birthDate ? data.birthDate.substring(0, 10) : '',
          position: {
            uz: data.position?.uz || (typeof data.position === 'string' ? data.position : ''),
            ru: data.position?.ru || '',
            en: data.position?.en || '',
          },
        });

        const existingImg = data.images?.[0]?.url || data.image || '';
        if (existingImg) {
          setImageUrl(existingImg);
          setImagePreview(existingImg.startsWith('http') ? existingImg : `https://api.atr.uz${existingImg.startsWith('/') ? '' : '/'}${existingImg}`);
        }
      } catch (err) {
        console.error("Xodim ma'lumotlarini yuklashda xato:", err);
        message.error("Xodim ma'lumotlarini yuklab bo'lmadi!");
      } finally {
        setPageLoading(false);
      }
    };
    fetchEmployeeData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePositionChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      position: {
        ...prev.position,
        [lang]: value,
      },
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      message.error("Rasm hajmi 5MB dan oshmasligi kerak!");
      return;
    }

    setImagePreview(URL.createObjectURL(file));

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      setImgUploading(true);
      const res = await api.post('/api/admin/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      let uploadedUrl = '';
      if (res.data?.files && res.data.files.length > 0) {
        uploadedUrl = res.data.files[0].url;
      } else {
        uploadedUrl = res.data?.url || res.data?.data?.url || '';
      }

      if (uploadedUrl) {
        setImageUrl(uploadedUrl);
        message.success("Yangi rasm serverga muvaffaqiyatli yuklandi!");
      } else {
        message.error("Serverdan rasm manzili kelmadi!");
        setImageUrl('');
      }
    } catch (err) {
      console.error("Rasm yuklashda xatolik:", err);
      message.error("Rasmni serverga yuklab bo'lmadi! Tarmoq yoki CORS xatosi.");
      setImageUrl('');
    } finally {
      setImgUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.position.uz || !formData.position.ru || !formData.position.en) {
      message.error("Iltimos, lavozimni barcha tillarda (UZ, RU, EN) kiriting!");
      return;
    }

    if (!imageUrl) {
      message.error("Iltimos, xodim rasmini kiriting!");
      return;
    }

    setLoading(true);

    try {
      const fullName = `${formData.lastName} ${formData.firstName} ${formData.middleName || ''}`.trim();

      const payload = {
        fullName: fullName,
        birthDate: formData.birthDate,
        position: formData.position,
        images: [
          {
            url: imageUrl,
            mainImage: true,
            isGallery: false,
          },
        ],
      };

      await api.patch(`/api/admin/employee/${id}`, payload);

      message.success("Muvaffaqiyatli saqlandi!");
      navigate('/xodimlar');
    } catch (err) {
      console.error("Server xatosi:", err.response?.data || err.message);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || "Saqlashda xatolik yuz berdi!";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <Loader />;

  return (
    <div className="add-employee-page">
      <div className="back-btn" onClick={() => navigate('/xodimlar')}>
        <ArrowLeftOutlined /> Chiqish
      </div>

         <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid-3">
            <div className="input-group">
              <label>Ism</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Namuna: Sadulla"
                required
              />
            </div>
            <div className="input-group">
              <label>Familiya</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Namuna: Sadullayev"
                required
              />
            </div>
            <div className="input-group">
              <label>Otasining ismi</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                placeholder="Namuna: Nazar o'gli"
              />
            </div>
          </div>
          <div className="form-grid-2">
            <div className="input-group">
              <label>Tug'ilgan kuni va oyi</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <div className="label-with-langs">
                <label>Lavozimi (UZ, RU, EN to'ldiring)</label>
                <div className="lang-switcher">
                  <span className={lang === 'uz' ? 'active' : ''} onClick={() => setLang('uz')}>uz</span>
                  <span className={lang === 'ru' ? 'active' : ''} onClick={() => setLang('ru')}>ru</span>
                  <span className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>en</span>
                </div>
              </div>
              <input
                type="text"
                value={formData.position[lang]}
                onChange={handlePositionChange}
                placeholder={`${lang.toUpperCase()} tilida lavozimni kiriting`}
                required
              />
            </div>
          </div>
          <div className="input-group">
            <label>Rasmi</label>
            <label className="file-upload-box" style={{ justifyContent: imagePreview ? 'flex-start' : 'center' }}>
              <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} hidden disabled={imgUploading} />
              {imagePreview ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', paddingLeft: '10px' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #4b5563', opacity: imgUploading ? 0.5 : 1 }}
                  />
                  <span style={{ color: imgUploading ? '#f59e0b' : (imageUrl ? '#22c55e' : '#ef4444'), fontWeight: 500, fontSize: '14px' }}>
                    {imgUploading ? 'Yangi rasm serverga yuklanmoqda, kuting...' : (imageUrl ? 'Rasm yuklangan (Almashtirish uchun bosing)' : 'Yuklashda xato, rasmni qayta tanlang')}
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <UploadOutlined style={{ fontSize: '20px', color: '#f59e0b' }} />
                  <span className="upload-title">Yangi rasm tanlash</span>
                </div>
              )}
            </label>
          </div>

          <div className="form-footer">
            <button type="submit" className="save-btn" disabled={loading || imgUploading}>
              <SaveOutlined /> {loading ? 'Saqlanmoqda...' : 'O\'zgarishlarni Saqlash'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}