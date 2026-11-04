import React, { useEffect, useState } from "react";
import { UploadOutlined, SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { message } from "antd";
import TextEditor from "../../components/TextEditor";
import api, { fileUrl } from "../../api";

import '../Xodimlar/add-employee.css';
import Loader from "../../components/Loader/loader";

const LANGS = ["en", "ru", "uz"];

const mapNews = (item) => {
  const pick = (field) =>
    LANGS.reduce((acc, l) => ({ ...acc, [l]: item?.[field]?.[l] || "" }), {});
  return {
    values: {
      title: pick("title"),
      content: pick("content"),
    },
    image: item?.images?.[0]?.url || "",
  };
};

const getErrorText = (err) => {
  const res = err.response;
  if (!res) {
    return "Serverga ulanib bo'lmadi (tarmoq yoki CORS xatosi).";
  }
  const data = res.data;
  const raw = data?.message ?? data?.error ?? data?.errors ?? data;
  let text = "";
  if (typeof raw === "string") text = raw;
  else if (Array.isArray(raw)) {
    text = raw.map((x) => (typeof x === "string" ? x : x?.message || JSON.stringify(x))).join("; ");
  } else if (raw && typeof raw === "object") {
    text = Object.values(raw).flat().map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join("; ");
  }
  return `${res.status}: ${text || "Xatolik yuz berdi!"}`;
};

export default function NewsAdd() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();
  const isEdit = Boolean(id);

  const passed =
    isEdit && state?.newsItem && String(state.newsItem.id) === String(id)
      ? mapNews(state.newsItem)
      : null;

  const [activeLangN, setActiveLangN] = useState("uz");
  const [activeLangC, setActiveLangC] = useState("uz");

  const [imgUrl, setImgUrl] = useState(passed?.image || "");
  const [imagePreview, setImagePreview] = useState(passed?.image ? fileUrl(passed.image) : "");
  const [imgUploading, setImgUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit && !passed);

  const { register, handleSubmit, reset, getValues, setValue, control } = useForm({
    defaultValues: passed?.values || {
      title: { en: "", ru: "", uz: "" },
      content: { en: "", ru: "", uz: "" },
    },
  });

  useEffect(() => {
    if (isEdit && id) {
      const loadNews = async () => {
        try {
          const res = await api.get(`/api/admin/news/${id}`);
          let item = res.data?.data || res.data;
          if (Array.isArray(item)) item = item.find((x) => String(x.id) === String(id));

          if (item) {
            const mapped = mapNews(item);
            const current = getValues();
            const merged = {};
            ["title", "content"].forEach((field) => {
              merged[field] = {};
              LANGS.forEach((l) => {
                merged[field][l] = mapped.values[field][l] || current[field]?.[l] || "";
              });
            });
            reset(merged);
            if (mapped.image) {
              setImgUrl(mapped.image);
              setImagePreview(fileUrl(mapped.image));
            }
          }
        } catch (err) {
          console.error(err);
          if (!passed) message.error("Yangilik ma'lumotlarini yuklab bo'lmadi!");
        } finally {
          setPageLoading(false);
        }
      };
      loadNews();
    }
  }, [id, isEdit, reset]);

  const copyToAllLanguages = () => {
    const values = getValues();
    let copied = 0;
    let hasSource = false;

    ["title", "content"].forEach((field) => {
      const source = values[field]?.uz || "";
      if (!source.replace(/<[^>]*>/g, "").trim()) return;
      hasSource = true;

      ["ru", "en"].forEach((l) => {
        const target = (values[field]?.[l] || "").replace(/<[^>]*>/g, "").trim();
        if (!target) {
          setValue(`${field}.${l}`, source, { shouldDirty: true });
          copied += 1;
        }
      });
    });

    if (!hasSource) {
      message.warning("Avval UZ tilida sarlavha yoki maqola yozing!");
    } else if (copied === 0) {
      message.info("RU va EN maydonlari allaqachon to'ldirilgan.");
    } else {
      message.success("UZ matni RU va EN tillariga ko'chirildi. Endi ularni tarjima qilib tahrirlang.");
    }
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

      const uploadedUrl = res.data?.files?.[0]?.url || res.data?.url || res.data?.data?.url || '';

      if (uploadedUrl) {
        setImgUrl(uploadedUrl);
        message.success("Rasm serverga yuklandi!");
      } else {
        message.error("Serverdan rasm manzili kelmadi!");
        setImgUrl("");
      }
    } catch (err) {
      console.error("Rasm yuklashda xato:", err.response?.status, err.response?.data);
      message.error("Rasm yuklashda xato: " + getErrorText(err));
      setImgUrl("");
    } finally {
      setImgUploading(false);
    }
  };

  const onSubmit = async (values) => {
    const langs = ["uz", "ru", "en"];
    const missing = (field) => langs.filter((l) => !values[field]?.[l]?.trim());
    const noTitle = missing("title");
    if (noTitle.length) {
      message.error(`Yangilik sarlavhasini kiriting: ${noTitle.join(", ").toUpperCase()}`);
      return;
    }
    if (!imgUrl) {
      message.error("Iltimos, yangilik rasmini yuklang!");
      return;
    }

    const payload = {
      title: values.title,
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
        await api.patch(`/api/admin/news/${id}`, payload);
        message.success("Yangilik muvaffaqiyatli tahrirlandi");
      } else {
        await api.post('/api/admin/news', payload);
        message.success("Yangilik yaratildi");
      }
      navigate("/news");
    } catch (err) {
      console.error("Server javobi:", err.response?.status, err.response?.data);
      message.error(getErrorText(err), 8);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageLoading) return <Loader />;

  return (
    <div className="add-employee-page">
      <div className="back-btn" onClick={() => navigate("/news")}>
        <ArrowLeftOutlined /> Qaytish
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit(onSubmit)}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div className="input-group">
              <div className="label-with-langs">
                <label>Yangilik sarlavhasi</label>
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
                placeholder={`${activeLangN.toUpperCase()} tilida sarlavhani kiriting`}
                {...register(`title.${activeLangN}`)}
              />
            </div>

          </div>

          <div className="input-group">
            <div className="label-with-langs">
              <label>Maqola matni</label>
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
            <label>Asosiy rasm</label>
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