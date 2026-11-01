import api from '../../api';

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

export const getImageUrl = (item) =>
  item?.url || item?.path || item?.image?.url || item?.images?.[0]?.url || '';

export const getErrorText = (err) => {
  const res = err.response;
  if (!res) return err.message || "Serverga ulanib bo'lmadi (tarmoq yoki CORS xatosi).";
  const data = res.data;
  const raw = data?.message ?? data?.error ?? data?.errors ?? data;
  let text = '';
  if (typeof raw === 'string') text = raw;
  else if (Array.isArray(raw)) {
    text = raw.map((x) => (typeof x === 'string' ? x : x?.message || JSON.stringify(x))).join('; ');
  } else if (raw && typeof raw === 'object') {
    text = Object.values(raw).flat().map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join('; ');
  }
  return `${res.status}: ${text || 'Xatolik yuz berdi!'}`;
};

const buildForm = (field, files) => {
  const fd = new FormData();
  files.forEach((f) => fd.append(field, f));
  return fd;
};

const canRetry = (err) => [400, 415, 422].includes(err.response?.status);

const uploadOne = async (file) => {
  const res = await api.post('/api/admin/upload', buildForm('file', [file]), multipart);
  const url = res.data?.files?.[0]?.url || res.data?.url || res.data?.data?.url || '';
  if (!url) throw new Error('Serverdan rasm manzili kelmadi');
  return url;
};

export const createGalleryImages = async (files) => {
  try {
    return await api.post('/api/admin/gallery', buildForm('files', files), multipart);
  } catch (e1) {
    if (!canRetry(e1)) throw e1;
    try {
      return await api.post('/api/admin/gallery', buildForm('file', files), multipart);
    } catch (e2) {
      if (!canRetry(e2)) throw e2;
      const urls = [];
      for (const f of files) urls.push(await uploadOne(f));
      return api.post('/api/admin/gallery', {
        images: urls.map((url) => ({ url, mainImage: false, isGallery: true })),
      });
    }
  }
};

export const replaceGalleryImage = async (id, file) => {
  try {
    return await api.patch(`/api/admin/gallery/${id}`, buildForm('file', [file]), multipart);
  } catch (e1) {
    if (!canRetry(e1)) throw e1;
    const url = await uploadOne(file);
    return api.patch(`/api/admin/gallery/${id}`, { url });
  }
};