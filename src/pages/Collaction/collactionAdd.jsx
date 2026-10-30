import React, { useEffect, useState } from "react";
import { UploadOutlined, SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { message } from "antd";
import TextEditor from "../../components/TextEditor";
import api, { fileUrl } from "../../api";

import '../Xodimlar/add-employee.css';
import Loader from "../../components/Loader/loader";

export default function CollactionAdd() {
  const navigate = useNavigate();
  const { cid } = useParams();
  const isEdit = Boolean(cid);

  const [activeLangN, setActiveLangN] = useState("uz");
  const [activeLangD, setActiveLangD] = useState("uz");
  const [activeLangC, setActiveLangC] = useState("uz");

  const [imgUrl, setImgUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imgUploading, setImgUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);

  const { register, handleSubmit, reset, control } = useForm({
    defaultValues: {
      title: { en: "", ru: "", uz: "" },
      description: { en: "", ru: "", uz: "" },
      content: { en: "", ru: "", uz: "" },
    },
  });

  useEffect(() => {
    if (isEdit && cid) {
      const loadCollection = async () => {
        try {
          const res = await api.get(`/api/admin/collection/${cid}`);
          const item = res.data?.data || res.data;

          if (item) {
            reset({
              title: {
                en: item.title?.en || "",
                ru: item.title?.ru || "",
                uz: item.title?.uz || "",
              },
              description: {
                en: item.description?.en || "",
                ru: item.description?.ru || "",
                uz: item.description?.uz || "",
              },
              content: {
                en: item.content?.en || "",
                ru: item.content?.ru || "",
                uz: item.content?.uz || "",
              },
            });

            const currentImg = item.images?.[0]?.url || "";
            if (currentImg) {
              setImgUrl(currentImg);
              setImagePreview(fileUrl(currentImg));
            }
          }
        } catch (err) {
          console.error(err);
          message.error("Kolleksiya ma'lumotlarini yuklab bo'lmadi!");
        } finally {
          setPageLoading(false);
        }
      };
      loadCollection();
    }
  }, [cid, isEdit, reset]);

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
        setImgUrl(uploadedUrl);
        message.success("Rasm serverga yuklandi!");
      } else {
        message.error("Serverdan rasm manzili kelmadi!");
        setImgUrl("");
      }
    } catch (err) {
      message.error("Rasm yuklashda tarmoq xatosi yuz berdi!");
      setImgUrl("");
    } finally {
      setImgUploading(false);
    }
  };

  const onSubmit = async (values) => {
    const langs = ["uz", "ru", "en"];
    const missing = (field) => langs.filter((l) => !values[field]?.[l]?.trim());
    const noTitle = missing("title");
    const noDesc = missing("description");
    if (noTitle.length) {
      message.error(`Kolleksiya nomini kiriting: ${noTitle.join(", ").toUpperCase()}`);
      return;
    }
    if (noDesc.length) {
      message.error(`Tavsifni kiriting: ${noDesc.join(", ").toUpperCase()}`);
      return;
    }
    if (!imgUrl) {
      message.error("Iltimos, kolleksiya rasmini yuklang!");
      return;
    }

    const payload = {
      title: values.title,
      description: values.description,
      content: values.content,
      images: [
        {
          url: imgUrl,
          mainImage: true,
          isGallery: false,
        },
      ],
    };

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await api.patch(`/api/admin/collection/${cid}`, payload);
        message.success("Kolleksiya muvaffaqiyatli tahrirlandi");
      } else {
        await api.post('/api/admin/collection', payload);
        message.success("Kolleksiya yaratildi");
      }
      navigate("/collaction");
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || err.response?.data?.error || "Xatolik yuz berdi!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageLoading) return <Loader />;

  return (
    <div className="add-employee-page">
      <div className="back-btn" onClick={() => navigate("/collaction")}>
        <ArrowLeftOutlined /> Qaytish
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit(onSubmit)}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div className="input-group">
              <div className="label-with-langs">
                <label>Kolleksiya nomi</label>
                <div className="lang-switcher">
                  {["uz", "ru", "en"].map((lang) => (
                    <span
                      key={lang}
                      onClick={() => setActiveLangN(lang)}
                      className={activeLangN === lang ? "active" : ""}
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
              <input
                key={`title-${activeLangN}`}
                type="text"
                placeholder={`${activeLangN.toUpperCase()} tilida nomini kiriting`}
                {...register(`title.${activeLangN}`)}
              />
            </div>

            <div className="input-group">
              <div className="label-with-langs">
                <label>Tavsif</label>
                <div className="lang-switcher">
                  {["uz", "ru", "en"].map((lang) => (
                    <span
                      key={lang}
                      onClick={() => setActiveLangD(lang)}
                      className={activeLangD === lang ? "active" : ""}
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
              <input
                key={`desc-${activeLangD}`}
                type="text"
                placeholder={`${activeLangD.toUpperCase()} tilida tavsifni kiriting`}
                {...register(`description.${activeLangD}`)}
              />
            </div>

          </div>

          <div className="input-group">
            <div className="label-with-langs">
              <label>Content (Maqola)</label>
              <div className="lang-switcher">
                {["uz", "ru", "en"].map((lang) => (
                  <span
                    key={lang}
                    onClick={() => setActiveLangC(lang)}
                    className={activeLangC === lang ? "active" : ""}
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
            <div className="editor-box">
              <Controller
                name={`content.${activeLangC}`}
                control={control}
                render={({ field }) => (
                  <TextEditor
                    value={field.value || ""}
                    onChange={field.onChange}
                  />
                )}
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
                  <span style={{ color: imgUploading ? 'var(--teal)' : (imgUrl ? 'var(--ok)' : 'var(--danger)'), fontWeight: 500, fontSize: '14px' }}>
                    {imgUploading ? 'Rasm serverga yuklanmoqda...' : (imgUrl ? 'Rasm yuklangan (Almashtirish uchun bosing)' : 'Yuklashda xato, rasmni qayta tanlang')}
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <UploadOutlined style={{ fontSize: '20px', color: 'var(--teal)' }} />
                  <span className="upload-title">Rasm tanlang</span>
                </div>
              )}
            </label>
          </div>

          <div className="form-footer">
            <button type="submit" className="save-btn" disabled={isSubmitting || imgUploading}>
              <SaveOutlined /> {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}