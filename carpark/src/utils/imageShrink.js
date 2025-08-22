export async function shrinkImageFile(
  file,
  {
    maxW = 1600,
    maxH = 1600,
    quality = 0.82, // 0~1
    targetBytes = 900 * 1024, // 900KB 목표
  } = {}
) {
  if (!(file instanceof File)) return file;
  if (file.size <= targetBytes) return file;

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const el = new Image();
      el.onload = () => res(el);
      el.onerror = rej;
      el.src = url;
    });

    const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = Math.max(1, Math.round(img.width * ratio));
    const h = Math.max(1, Math.round(img.height * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);

    let q = quality;
    let blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", q));
    while (blob && blob.size > targetBytes && q > 0.55) {
      q -= 0.07;
      // eslint-disable-next-line no-await-in-loop
      blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", q));
    }
    if (!blob) {
      const dataUrl = canvas.toDataURL("image/jpeg", q);
      const bin = atob(dataUrl.split(",")[1]);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      blob = new Blob([arr], { type: "image/jpeg" });
    }

    const name = (file.name || "upload").replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}
