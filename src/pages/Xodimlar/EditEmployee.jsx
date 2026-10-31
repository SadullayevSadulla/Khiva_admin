import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { UploadOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import api, { fileUrl } from '../../api';
import './add-employee.css';
import Loader from '../../components/Loader/loader';

const emptyForm = {
  firstName: '',
  lastName: '',
  middleName: '',
  birthDate: '',
  position: { uz: '', ru: '', en: '' },
};

// Sanani <input type="date"> tushunadigan YYYY-MM-DD ko'rinishiga keltiradi
const toDateInput = (value) => {
  if (!value) return '';
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10);
  const m = str.match(/^(\d{2})[./-](\d{2})[./-](\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
};

// Serverdan kelgan xodimni forma ko'rinishiga o'tkazadi
const mapEmployee = (data) => {
  let fName = data.firstName || '';
  let lName = data.lastName || '';
  let mName = data.middleName || '';

  if (data.fullName && !data.firstName) {
    const nameParts = data.fullName.trim().split(' ');
    lName = nameParts[0] || '';
    fName = nameParts[1] || '';
    mName = nameParts.slice(2).join(' ') || '';
  }

  return {
    form: {
      firstName: fName,
      lastName: lName,
      middleName: mName,
      birthDate: toDateInput(data.birthDate),
      position: {
        uz: data.position?.uz || (typeof data.position === 'string' ? data.position : ''),
        ru: data.position?.ru || '',
        en: data.position?.en || '',
      },
    },
    image: data.images?.[0]?.url || data.image || '',
  };
};

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  // Ro'yxatdan kelgan xodim ma'lumoti: forma darhol to'la ochiladi
  const passed = state?.employee && String(state.employee.id) === String(id) ? mapEmployee(state.employee) : null;

  const [lang, setLang] = useState('uz');
  const [loading, setLoading] = useState(false);

  const [imageUrl, setImageUrl] = useState(passed?.image || '');
  const [imagePreview, setImagePreview] = useState(passed?.image ? fileUrl(passed.image) : '');
  const [imgUploading, setImgUploading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!passed);

  const [formData, setFormData] = useState(passed?.form || emptyForm);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const response = await api.get(`/api/admin/employee/${id}`);
        let data = response.data?.data || response.data;
        if (Array.isArray(data)) data = data.find((item) => String(item.id) === String(id));
        if (!data) return;

        const mapped = mapEmployee(data);
        // Serverdan bo'sh kelgan maydon ro'yxatdagi qiymatni o'chirib yubormasin
        setFormData((prev) => ({
          firstName: mapped.form.firstName || prev.firstName,
          lastName: mapped.form.lastName || prev.lastName,
          middleName: mapped.form.middleName || prev.middleName,
          birthDate: mapped.form.birthDate || prev.birthDate,
          position: {
            uz: mapped.form.position.uz || prev.position.uz,
            ru: mapped.form.position.ru || prev.position.ru,
            en: mapped.form.position.en || prev.position.en,
          },
        }));
        if (mapped.image) {
          setImageUrl(mapped.image);
          setImagePreview(fileUrl(mapped.image));
        }
      } catch (err) {
        console.error("Xodim ma'lumotlarini yuklashda xato:", err);
        if (!passed) message.error("Xodim ma'lumotlarini yuklab bo'lmadi!");
      } finally {
        setPageLoading(false);
      }
    };
    fetchEmployeeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <ArrowLeftOutlined /> Qaytish
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
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--line)', opacity: imgUploading ? 0.5 : 1 }}
                  />
                  <span style={{ color: imgUploading ? 'var(--teal)' : (imageUrl ? 'var(--ok)' : 'var(--danger)'), fontWeight: 500, fontSize: '14px' }}>
                    {imgUploading ? 'Yangi rasm serverga yuklanmoqda, kuting...' : (imageUrl ? 'Rasm yuklangan (Almashtirish uchun bosing)' : 'Yuklashda xato, rasmni qayta tanlang')}
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <UploadOutlined style={{ fontSize: '20px', color: 'var(--teal)' }} />
                  <span className="upload-title">Yangi rasm tanlash</span>
                </div>
              )}
            </label>
          </div>

          <div className="form-footer">
            <button type="submit" className="save-btn" disabled={loading || imgUploading}>
              <SaveOutlined /> {loading ? 'Saqlanmoqda...' : 'O\'zgarishlarni saqlash'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}