import React, { useEffect, useRef, useState } from "react";
import { UploadOutlined, SaveOutlined, ArrowLeftOutlined, CloseOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { createGalleryImages, getErrorText } from "./galleryApi";

import '../Xodimlar/add-employee.css';
import './gallery.css';

const MAX_SIZE = 5 * 1024 * 1024;

export default function GalleryAdd() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]); 
  const [saving, setSaving] = useState(false);
  const filesRef = useRef([]);
  filesRef.current = files;

  useEffect(() => {
    return () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.preview));
  }, []);

  const handleSelect = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';

    const accepted = [];
    picked.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        message.error(`"${file.name}" rasm emas`);
      } else if (file.size > MAX_SIZE) {
        message.error(`"${file.name}" 5MB dan katta`);
      } else {
        accepted.push({
          id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          preview: URL.createObjectURL(file),
        });
      }
    });
    setFiles((prev) => [...prev, ...accepted]);
  };

  const removeFile = (id) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      message.error("Iltimos, kamida bitta rasm tanlang!");
      return;
    }

    setSaving(true);
    try {
      await createGalleryImages(files.map((f) => f.file));
      message.success(`${files.length} ta rasm galereyaga qo'shildi`);
      navigate("/galereya");
    } catch (err) {
      console.error("Server javobi:", err.response?.status, err.response?.data);
      message.error(getErrorText(err), 8);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="add-employee-page">
      <div className="back-btn" onClick={() => navigate("/galereya")}>
        <ArrowLeftOutlined /> Qaytish
      </div>

      <div className="form-card">
        <form onSubmit={handleSave}>
          <div className="input-group">
            <label>Rasmlar (bir nechtasini tanlash mumkin)</label>
            <label className="file-upload-box">
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                multiple
                hidden
                disabled={saving}
                onChange={handleSelect}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UploadOutlined style={{ fontSize: '20px', color: 'var(--teal)' }} />
                <span className="upload-title">Rasmlarni tanlang</span>
              </div>
            </label>
          </div>

          {files.length > 0 && (
            <div className="gallery-preview-grid">
              {files.map((f) => (
                <div key={f.id} className="gallery-preview">
                  <img src={f.preview} alt={f.file.name} />
                  <button
                    type="button"
                    className="gallery-preview-remove"
                    onClick={() => removeFile(f.id)}
                    disabled={saving}
                    aria-label="Rasmni olib tashlash"
                  >
                    <CloseOutlined />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="form-footer">
            <button type="submit" className="save-btn" disabled={saving || files.length === 0}>
              <SaveOutlined /> {saving ? 'Yuklanmoqda...' : `Saqlash${files.length ? ` (${files.length})` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}