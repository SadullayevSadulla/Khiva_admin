import api from '../../api';

const LIST_KEYS = ['data', 'admins', 'items', 'rows', 'results', 'list', 'docs', 'content'];

export function extractList(body, depth = 0) {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== 'object' || depth > 3) return null;
  for (const key of LIST_KEYS) {
    if (key in body) {
      const list = extractList(body[key], depth + 1);
      if (list) return list;
    }
  }
  return Object.values(body).find(Array.isArray) || null;
}

export const getAdminId = (admin) => admin?.id || admin?._id;

export function getAdminName(admin) {
  const firstName = admin.firstName || admin.first_name || admin.firstname || admin.givenName;
  const lastName = admin.lastName || admin.last_name || admin.lastname || admin.surname || admin.familyName;
  const fullName = admin.fullName || admin.full_name || admin.fullname || admin.name || admin.adminName;
  const name = fullName || [firstName, lastName].filter(Boolean).join(' ');
  if (name) return name;
  return admin.username && !admin.username.includes('@') ? admin.username : 'Admin';
}

function describeIssues(data) {
  const lists = [data?.issues, data?.errors, data?.details, data?.error?.issues];
  for (const list of lists) {
    if (Array.isArray(list) && list.length) {
      return list
        .map((item) => {
          if (typeof item === 'string') return item;
          const path = Array.isArray(item?.path) ? item.path.join('.') : item?.path || item?.field || item?.param;
          const text = item?.message || item?.msg || '';
          return path ? `${path}: ${text}` : text;
        })
        .filter(Boolean)
        .join('; ');
    }
  }
  const fieldErrors = data?.fieldErrors || data?.errors?.fieldErrors || data?.error?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === 'object') {
    return Object.entries(fieldErrors)
      .map(([key, value]) => `${key}: ${[].concat(value).join(', ')}`)
      .join('; ');
  }
  return '';
}

export function getErrorMessage(error) {
  const response = error.response;
  if (!response) return "Serverga ulanib bo'lmadi (tarmoq yoki CORS xatosi).";
  const data = response.data;
  const raw = data?.message ?? data?.error ?? data?.errors ?? data;
  let text = '';
  if (typeof raw === 'string') text = raw;
  else if (Array.isArray(raw)) {
    text = raw.map((x) => (typeof x === 'string' ? x : x?.message || JSON.stringify(x))).join('; ');
  } else if (raw && typeof raw === 'object') {
    text = Object.values(raw).flat().map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join('; ');
  }
  const details = describeIssues(data);
  if (details && !text.includes(details)) text = text ? `${text} (${details})` : details;
  if (!text && data && typeof data === 'object') text = JSON.stringify(data).slice(0, 300);
  return `${response.status}: ${text || 'Xatolik yuz berdi.'}`;
}

export async function fetchAdmins() {
  const response = await api.get('/api/admin');
  const list = extractList(response.data);
  if (!list) {
    console.warn('Kutilmagan server javobi:', response.data);
    throw new Error("Adminlar ro'yxati javobda topilmadi.");
  }
  return list;
}

export async function createAdmin({ firstName, lastName, email, password }) {
  return api.post('/api/admin', { firstName, lastName, email, password });
}

// Adminni o'chiradi: DELETE /api/admin/{id}
export function deleteAdmin(id) {
  return api.delete(`/api/admin/${id}`);
}