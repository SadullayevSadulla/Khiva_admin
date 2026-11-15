import { useCallback, useEffect, useState } from "react";
import api from "../api";

export function useAuthImage(url) {
  const [blob, setBlob] = useState({ for: "", src: "" });
  const [failedUrl, setFailedUrl] = useState("");

  // Eski blob manzilni bo'shatish
  useEffect(() => {
    const current = blob.src;
    return () => {
      if (current) URL.revokeObjectURL(current);
    };
  }, [blob.src]);

  const onError = useCallback(async () => {
    if (!url) return;
    const alreadyProxied = blob.for === url;
    if (alreadyProxied || /^(blob:|data:)/i.test(url)) {
      setFailedUrl(url);
      return;
    }
    try {
      const res = await api.get(url, { responseType: "blob" });
      if (!res.data?.type?.startsWith("image/")) throw new Error("Rasm emas");
      setBlob({ for: url, src: URL.createObjectURL(res.data) });
    } catch (error) {
      console.warn("Rasmni yuklab bo'lmadi:", url, error.response?.status || error.message);
      setFailedUrl(url);
    }
  }, [url, blob.for]);

  if (!url || failedUrl === url) return { src: "", onError };
  return { src: blob.for === url ? blob.src : url, onError };
}