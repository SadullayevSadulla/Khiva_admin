import api, { fileUrl } from '../../api';

export function unwrapProfile(body) {
  let value = body;
  for (let i = 0; i < 3; i += 1) {
    if (value?.data && typeof value.data === 'object' && !Array.isArray(value.data)) value = value.data;
    else if (value?.user && typeof value.user === 'object') value = value.user;
    else if (value?.profile && typeof value.profile === 'object') value = value.profile;
    else break;
  }
  return value || {};
}

export function getNameParts(profile) {
  let firstName = profile.firstName || profile.first_name || profile.firstname || '';
  let lastName = profile.lastName || profile.last_name || profile.lastname || '';
  if (!firstName && !lastName) {
    const full = profile.fullName || profile.full_name || profile.name || '';
    const parts = String(full).trim().split(/\s+/).filter(Boolean);
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ');
  }
  return { firstName, lastName };
}

export function getProfileName(profile) {
  const { firstName, lastName } = getNameParts(profile);
  const name = [firstName, lastName].filter(Boolean).join(' ');
  if (name) return name;
  const username = profile.username;
  return username && !String(username).includes('@') ? username : 'Profil';
}

const AVATAR_KEY = /avatar|photo|image|picture|img|pic/i;
const URL_KEYS = ['url', 'path', 'src', 'location', 'link', 'fileUrl', 'file_url'];

const toUrl = (item) => {
  if (typeof item === 'string') return item === 'string' ? '' : item;
  if (Array.isArray(item)) {
    for (const element of item) {
      const url = toUrl(element);
      if (url) return url;
    }
    return '';
  }
  if (item && typeof item === 'object') {
    for (const key of URL_KEYS) {
      if (typeof item[key] === 'string' && item[key]) return item[key];
    }
  }
  return '';
};

const IMAGE_LIKE = /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i;

function findAvatar(profile) {
  const known = [
    profile.avatar, profile.avatarUrl, profile.avatar_url, profile.image, profile.photo,
    profile.photoUrl, profile.photo_url, profile.picture, profile.profileImage, profile.profile_image,
    profile.profileImageUrl, profile.profile_image_url, profile.imageUrl, profile.image_url,
      profile.avatarPath, profile.avatar_path, profile.images,
  ];
  for (const item of known) {
    const url = toUrl(item);
    if (url) return url;
  }
  for (const [key, value] of Object.entries(profile)) {
    if (!AVATAR_KEY.test(key)) continue;
    const url = toUrl(value);
    if (url) return url;
  }
  for (const value of Object.values(profile)) {
    if (typeof value === 'string' && IMAGE_LIKE.test(value)) return value;
  }
  return '';
}


const FALLBACK_PREFIX = 'avatar-fallback:';
const fallbackKey = (profile) => {
  const id = profile?.id || profile?.email || profile?.username;
  return id ? `${FALLBACK_PREFIX}${id}` : '';
};
const readFallback = (profile) => {
  try {
    const key = fallbackKey(profile);
    return key ? localStorage.getItem(key) || '' : '';
  } catch {
    return '';
  }
};
export const saveAvatarFallback = (profile, url) => {
  try {
    const key = fallbackKey(profile);
    if (key && url) localStorage.setItem(key, url);
  } catch {
  }
};
export const clearAvatarFallback = (profile) => {
  try {
    const key = fallbackKey(profile);
    if (key) localStorage.removeItem(key);
  } catch {
    /* localStorage mavjud emas */
  }
};

export const hasServerAvatar = (profile) => Boolean(findAvatar(profile || {}));

export function extractAvatarFromResponse(response) {
  const body = response?.data;
  if (!body || typeof body !== 'object') return '';
  return findAvatar(unwrapProfile(body)) || toUrl(body) || toUrl(body.data) || '';
}

function withVersion(url, profile) {
  const version = profile.updatedAt || profile.updated_at;
  if (!version || /^(blob:|data:)/i.test(url) || url.includes('?')) return url;
  return `${url}?v=${encodeURIComponent(version)}`;
}

export function getAvatarUrl(profile) {
  const safe = profile || {};
  const raw = findAvatar(safe) || readFallback(safe);
  return raw ? withVersion(fileUrl(raw), safe) : '';
}

export const getRole = (profile) =>
  (typeof profile.role === 'object' && profile.role ? profile.role.name : profile.role) || '';

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

const SHAPE_ERROR =
  /(received undefined|required|invalid input|unrecognized|not allowed|must be a|should not exist|no file|unexpected field|missing)/i;

const isShapeError = (error) => {
  if (![400, 422].includes(error.response?.status)) return false;
  return SHAPE_ERROR.test(JSON.stringify(error.response?.data || ''));
};

async function tryShapes(send, shapes) {
  let lastError;
  for (const shape of shapes) {
    try {
      return await send(shape);
    } catch (error) {
      if (!isShapeError(error)) throw error;
      console.warn("So'rov shakli rad etildi:", shape, error.response?.data);
      lastError = error;
    }
  }
  throw lastError;
}

export const notifyProfileChanged = () => window.dispatchEvent(new Event('profile-updated'));

export async function fetchProfile() {
  const response = await api.get('/api/profile');
  return unwrapProfile(response.data);
}

export function updateName({ firstName, lastName }) {
  const full = `${firstName} ${lastName}`.trim();
  return tryShapes((body) => api.patch('/api/profile', body), [
    { firstName, lastName },
    { fullName: full },
    { name: full },
    { firstName, lastName, fullName: full, name: full },
  ]);
}

const AVATAR_FIELDS = ['file', 'avatar', 'image', 'photo'];

const avatarSlotIsEmpty = (response) => {
  const user = unwrapProfile(response?.data);
  if (!user || typeof user !== 'object') return false;
  const hasSlot = Object.keys(user).some((key) => AVATAR_KEY.test(key));
  return hasSlot && !findAvatar(user);
};

export async function uploadAvatar(file) {
  let lastError;
  let lastResponse;
  for (const field of AVATAR_FIELDS) {
    const form = new FormData();
    form.append(field, file);
    try {
      const response = await api.put('/api/profile/avatar', form);
      lastResponse = response;
      if (!avatarSlotIsEmpty(response)) return response;
      console.warn(`Avatar "${field}" maydoni bilan yuborildi, lekin javobda rasm bo'sh. Keyingisini sinayman.`, response.data);
    } catch (error) {
      if (!isShapeError(error)) throw error;
      console.warn(`Avatar maydoni "${field}" rad etildi:`, error.response?.data);
      lastError = error;
    }
  }
  if (lastResponse) return lastResponse;
  throw lastError;
}

export function deleteAvatar() {
  return api.delete('/api/profile/avatar');
}

export function changePassword({ current, next }) {
  return tryShapes((body) => api.patch('/api/profile/password', body), [
    { currentPassword: current, newPassword: next, confirmPassword: next },
    { oldPassword: current, newPassword: next, confirmPassword: next },
    { currentPassword: current, newPassword: next },
    { oldPassword: current, newPassword: next },
  ]);
}

export function requestEmailChange(newEmail) {
  return api.post('/api/profile/email/request', { email: newEmail });
}

export function confirmEmailChange({ code, newEmail }) {
  return api.post('/api/profile/email/confirm', {
    otp: code,
    email: newEmail,
  });
}