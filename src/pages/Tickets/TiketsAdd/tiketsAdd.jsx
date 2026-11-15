import React, { useEffect, useState } from "react";
import { SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { Plus, X } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { message } from "antd";
import TextEditor from "../../../components/TextEditor";
import Loader from "../../../components/Loader/loader";
import {
  CATEGORIES,
  LANGS,
  fetchTicket,
  createTicket,
  updateTicket,
  getErrorText,
  dateOnly,
} from "../ticketsApi";

import "../../Xodimlar/add-employee.css";
import "../tickets.css";
import "./tiketsAdd.css";

const emptyLangs = () => ({ uz: "", ru: "", en: "" });

const pickLangs = (value) =>
  LANGS.reduce((acc, lang) => {
    acc[lang] = (typeof value === "string" ? (lang === "uz" ? value : "") : value?.[lang]) || "";
    return acc;
  }, {});

const mapTicket = (item) => ({
  values: {
    title: pickLangs(item?.title),
    rules: pickLangs(item?.rules),
    price: item?.price ?? "",
    category: item?.category || "ADULT",
    personCount: item?.personCount ?? 1,
    validDays: item?.validDays ?? 1,
    validFrom: dateOnly(item?.validFrom),
    validTo: dateOnly(item?.validTo),
    visitingHours: item?.visitingHours || "",
    ageRestriction: item?.ageRestriction || "",
    isActive: item?.isActive ?? true,
  },
  services: Array.isArray(item?.includedServices) ? item.includedServices : [],
});

function LangSwitch({ value, onChange }) {
  return (
    <div className="lang-switcher">
      {LANGS.map((lang) => (
        <span key={lang} onClick={() => onChange(lang)} className={value === lang ? "active" : ""}>
          {lang}
        </span>
      ))}
    </div>
  );
}

export default function TiketsAdd() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();
  const isEdit = Boolean(id);

  const passed =
    isEdit && state?.ticket && String(state.ticket.id) === String(id) ? mapTicket(state.ticket) : null;

  const [activeLangT, setActiveLangT] = useState("uz");
  const [activeLangR, setActiveLangR] = useState("uz");
  const [services, setServices] = useState(passed?.services || []);
  const [serviceInput, setServiceInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit && !passed);

  const { register, handleSubmit, reset, control } = useForm({
    defaultValues: passed?.values || {
      title: emptyLangs(),
      rules: emptyLangs(),
      price: "",
      category: CATEGORIES[0].value,
      personCount: 1,
      validDays: 1,
      validFrom: "",
      validTo: "",
      visitingHours: "",
      ageRestriction: "",
      isActive: true,
    },
  });

  const [extraCategory, setExtraCategory] = useState(
    passed?.values.category && !CATEGORIES.some((c) => c.value === passed.values.category)
      ? passed.values.category
      : ""
  );

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const item = await fetchTicket(id);
        if (item) {
          const mapped = mapTicket(item);
          if (!CATEGORIES.some((c) => c.value === mapped.values.category)) {
            setExtraCategory(mapped.values.category);
          }
          reset(mapped.values);
          setServices(mapped.services);
        }
      } catch (err) {
        console.error(err);
        if (!passed) message.error("Tarif ma'lumotlarini yuklab bo'lmadi: " + getErrorText(err));
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [id, isEdit, reset]);

  const addService = () => {
    const value = serviceInput.trim();
    if (!value) return;
    if (services.includes(value)) {
      message.info("Bu xizmat allaqachon qo'shilgan.");
      return;
    }
    setServices((prev) => [...prev, value]);
    setServiceInput("");
  };

  const onSubmit = async (values) => {
    const price = Number(values.price);
    const personCount = Number(values.personCount);
    const validDays = Number(values.validDays);

    if (!values.title?.uz?.trim()) return message.error("Tarif nomini (UZ) kiriting!");
    if (!Number.isFinite(price) || price <= 0) return message.error("Narxni to'g'ri kiriting!");
    if (!Number.isInteger(personCount) || personCount < 1) return message.error("Kishi soni kamida 1 bo'lishi kerak!");
    if (!Number.isInteger(validDays) || validDays < 1) return message.error("Amal qilish kunlari kamida 1 bo'lishi kerak!");
    if (!values.validFrom || !values.validTo) return message.error("Amal qilish sanalarini tanlang!");
    if (values.validFrom > values.validTo) return message.error("Boshlanish sanasi tugash sanasidan keyin bo'lmasligi kerak!");

    const payload = {
      title: values.title,
      price,
      category: values.category,
      personCount,
      validDays,
      validFrom: values.validFrom,
      validTo: values.validTo,
      visitingHours: values.visitingHours.trim(),
      ageRestriction: values.ageRestriction.trim(),
      includedServices: services,
      rules: values.rules,
      isActive: Boolean(values.isActive),
    };

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateTicket(id, payload);
        message.success("Tarif muvaffaqiyatli yangilandi");
      } else {
        await createTicket(payload);
        message.success("Tarif yaratildi");
      }
      navigate("/chipta-tariflari");
    } catch (err) {
      console.error("Server javobi:", err.response?.status, err.response?.data);
      message.error(getErrorText(err), 8);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageLoading) return <Loader />;

  return (
    <div className="add-employee-page tkt-form">
      <div className="back-btn" onClick={() => navigate("/chipta-tariflari")}>
        <ArrowLeftOutlined /> Qaytish
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="input-group">
            <div className="label-with-langs">
              <label>Tarif nomi</label>
              <LangSwitch value={activeLangT} onChange={setActiveLangT} />
            </div>
            <input
              key={`title-${activeLangT}`}
              type="text"
              placeholder={`${activeLangT.toUpperCase()} tilida tarif nomini kiriting`}
              {...register(`title.${activeLangT}`)}
            />
          </div>

          <div>
            <h3 className="tkt-section-title">Narx va kategoriya</h3>
            <div className="form-grid-4">
              <div className="input-group">
                <label>Narxi (so'm)</label>
                <input type="number" min="0" step="1000" placeholder="50000" {...register("price")} />
              </div>
              <div className="input-group">
                <label>Kategoriya</label>
                <select {...register("category")}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                  {extraCategory && <option value={extraCategory}>{extraCategory}</option>}
                </select>
              </div>
              <div className="input-group">
                <label>Kishi soni</label>
                <input type="number" min="1" step="1" {...register("personCount")} />
              </div>
              <div className="input-group">
                <label>Amal qilish (kun)</label>
                <input type="number" min="1" step="1" {...register("validDays")} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="tkt-section-title">Muddat va tashrif vaqti</h3>
            <div className="form-grid-4">
              <div className="input-group">
                <label>Boshlanish sanasi</label>
                <input type="date" {...register("validFrom")} />
              </div>
              <div className="input-group">
                <label>Tugash sanasi</label>
                <input type="date" {...register("validTo")} />
              </div>
              <div className="input-group">
                <label>Tashrif vaqti</label>
                <input type="text" placeholder="09:00 - 18:00" {...register("visitingHours")} />
              </div>
              <div className="input-group">
                <label>Yosh cheklovi</label>
                <input type="text" placeholder="16 yoshdan yuqori" {...register("ageRestriction")} />
              </div>
            </div>
          </div>

          <div className="input-group">
            <label>Tarifga kiruvchi xizmatlar</label>
            <div className="tkt-services-input">
              <input
                type="text"
                value={serviceInput}
                placeholder="Masalan: Ko'hna Ark saroyi"
                onChange={(e) => setServiceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addService();
                  }
                }}
              />
              <button type="button" className="btn btn-ghost" onClick={addService}>
                <Plus size={16} /> Qo'shish
              </button>
            </div>
            {services.length > 0 && (
              <div className="tkt-services-list">
                {services.map((service) => (
                  <span key={service} className="tkt-service">
                    {service}
                    <button
                      type="button"
                      aria-label={`${service} ni olib tashlash`}
                      onClick={() => setServices((prev) => prev.filter((s) => s !== service))}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <span className="field-hint">Enter bosib ham qo'shishingiz mumkin.</span>
          </div>

          <div className="input-group">
            <div className="label-with-langs">
              <label>Qoidalar va shartlar</label>
              <LangSwitch value={activeLangR} onChange={setActiveLangR} />
            </div>
            <div className="editor-box">
              <Controller
                name={`rules.${activeLangR}`}
                control={control}
                render={({ field }) => <TextEditor value={field.value || ""} onChange={field.onChange} />}
              />
            </div>
          </div>

          <label className="tkt-switch">
            <input type="checkbox" {...register("isActive")} />
            <span className="tkt-switch-track" />
            <span className="tkt-switch-label">Tarif faol (saytda sotuvda ko'rinadi)</span>
          </label>

          <div className="form-footer">
            <button type="submit" className="save-btn" disabled={isSubmitting}>
              <SaveOutlined /> {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}