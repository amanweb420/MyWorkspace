
"use strict";

const MW = {
  open(name) {
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    const panel = document.getElementById("panel-" + name);
    if (panel) {
      panel.classList.add("active");
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
};

const $ = id => document.getElementById(id);

function cleanName(value, fallback) {
  return (value || fallback)
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\.pdf$/i, "") || fallback;
}

function sizeText(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function readDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("फाइल पढ़ी नहीं जा सकी।"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("फोटो खुल नहीं सकी।"));
    img.src = src;
  });
}

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error("फोटो तैयार नहीं हो सकी।"));
    }, type, quality);
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();

  // लिंक को तुरंत revoke नहीं करते, ताकि मोबाइल ब्राउज़र को
  // डाउनलोड शुरू करने का समय मिले।
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function showImageResult(container, blob, filename, originalSize) {
  const url = URL.createObjectURL(blob);
  const box = document.createElement("div");
  box.className = "result";

  const img = document.createElement("img");
  img.src = url;
  img.alt = filename;
  box.appendChild(img);

  const info = document.createElement("p");
  info.textContent = "नया साइज़: " + sizeText(blob.size) +
    (originalSize != null
      ? " | पहले: " + sizeText(originalSize) +
        (blob.size < originalSize
          ? " | बचत: " + Math.round((originalSize - blob.size) / originalSize * 100) + "%"
          : " | साइज़ कम नहीं हुआ")
      : "");
  box.appendChild(info);

  const link = document.createElement("a");
  link.className = "download";
  link.href = url;
  link.download = filename;
  link.textContent = "फोटो सेव करें";
  box.appendChild(link);

  container.appendChild(box);
}

// 1. Images to PDF
const pdfInput = $("pdf-photos");
const pdfPreview = $("pdf-preview");

pdfInput.addEventListener("change", () => {
  pdfPreview.innerHTML = "";
  const files = Array.from(pdfInput.files || []);

  files.forEach(file => {
    const url = URL.createObjectURL(file);
    const img = document.createElement("img");
    img.src = url;
    img.alt = file.name;
    img.title = file.name;
    pdfPreview.appendChild(img);
  });

  $("pdf-status").textContent = files.length
    ? files.length + " फोटो चुनी गईं।"
    : "पहले फोटो चुनें।";
});

$("pdf-btn").addEventListener("click", async () => {
  const files = Array.from(pdfInput.files || []);
  const status = $("pdf-status");
  const button = $("pdf-btn");

  if (!files.length) {
    status.textContent = "पहले एक या अधिक फोटो चुनें।";
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    status.textContent = "PDF लाइब्रेरी नहीं मिली। इंटरनेट चालू करके Chrome में पेज फिर खोलें।";
    return;
  }

  button.disabled = true;

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    for (let i = 0; i < files.length; i++) {
      status.textContent = "PDF तैयार हो रही है: " + (i + 1) + "/" + files.length;

      const data = await readDataURL(files[i]);
      const image = await loadImage(data);

      let format = "JPEG";
      let imageData = data;

      if (files[i].type === "image/png") {
        format = "PNG";
      } else if (files[i].type !== "image/jpeg") {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        canvas.getContext("2d").drawImage(image, 0, 0);
        imageData = canvas.toDataURL("image/jpeg", 0.92);
      }

      if (i > 0) pdf.addPage();

      const scale = Math.min(190 / image.naturalWidth, 277 / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;

      pdf.addImage(imageData, format, (210 - width) / 2, (297 - height) / 2, width, height);
    }

    const filename = cleanName($("pdf-name").value, "MyWorkspace-Photos") + ".pdf";
    pdf.save(filename);
    status.textContent = "PDF तैयार है! डाउनलोड में फाइल जाँचें।";
  } catch (error) {
    status.textContent = "PDF नहीं बन सकी: " + error.message;
  } finally {
    button.disabled = false;
  }
});

// 2. Image Compressor
$("quality").addEventListener("input", () => {
  $("quality-label").textContent = $("quality").value + "%";
});

$("compress-btn").addEventListener("click", async () => {
  const files = Array.from($("compress-photos").files || []);
  const results = $("compress-results");
  const status = $("compress-status");
  const button = $("compress-btn");

  results.innerHTML = "";

  if (!files.length) {
    status.textContent = "पहले फोटो चुनें।";
    return;
  }

  button.disabled = true;

  try {
    const type = $("compress-format").value;
    const quality = Number($("quality").value) / 100;
    const ext = type === "image/webp" ? "webp" : "jpg";

    for (let i = 0; i < files.length; i++) {
      status.textContent = "कम्प्रेस हो रहा है: " + (i + 1) + "/" + files.length;

      const data = await readDataURL(files[i]);
      const image = await loadImage(data);
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (type === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(image, 0, 0);

      let blob = await canvasBlob(canvas, type, quality);

      // अगर WebP समर्थित नहीं है, तो JPEG में बदलें।
      let actualExt = ext;
      if (blob.type !== type) {
        blob = await canvasBlob(canvas, "image/jpeg", quality);
        actualExt = "jpg";
      }

      const filename = files[i].name.replace(/\.[^.]+$/, "") +
        "-compressed." + actualExt;

      showImageResult(results, blob, filename, files[i].size);
      canvas.width = 0;
      canvas.height = 0;
    }

    status.textContent = "पूरा हुआ। हर फोटो के नीचे सेव बटन है।";
  } catch (error) {
    status.textContent = "समस्या: " + error.message;
  } finally {
    button.disabled = false;
  }
});

// 3. Passport Photo Maker
$("passport-btn").addEventListener("click", async () => {
  const file = $("passport-input").files[0];
  const status = $("passport-status");
  const results = $("passport-result");
  const button = $("passport-btn");

  results.innerHTML = "";

  if (!file) {
    status.textContent = "पहले अपनी फोटो चुनें।";
    return;
  }

  button.disabled = true;

  try {
    status.textContent = "पासपोर्ट फोटो तैयार हो रही है…";

    const data = await readDataURL(file);
    const image = await loadImage(data);
    const [w, h] = $("passport-size").value.split(",").map(Number);
    const mode = $("passport-fit").value;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    let scale;
    if (mode === "cover") {
      scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
    } else {
      scale = Math.min(w / image.naturalWidth, h / image.naturalHeight);
    }

    const dw = image.naturalWidth * scale;
    const dh = image.naturalHeight * scale;

    ctx.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh);

    const blob = await canvasBlob(canvas, "image/jpeg", 0.95);
    showImageResult(results, blob, "passport-photo.jpg", file.size);

    status.textContent =
      "तैयार! फोटो का आकार बदल गया है। जमा करने से पहले संबंधित पोर्टल की फोटो शर्तें जाँचें।";

    canvas.width = 0;
    canvas.height = 0;
  } catch (error) {
    status.textContent = "फोटो नहीं बन सकी: " + error.message;
  } finally {
    button.disabled = false;
  }
});

// 4. Image Resizer
$("resize-input").addEventListener("change", async () => {
  const file = $("resize-input").files[0];
  if (!file) return;

  try {
    const image = await loadImage(await readDataURL(file));
    $("resize-width").value = image.naturalWidth;
    $("resize-height").value = image.naturalHeight;
  } catch (error) {
    $("resize-status").textContent = error.message;
  }
});

$("resize-width").addEventListener("input", () => {
  const file = $("resize-input").files[0];
  if (!file || !$("resize-lock").checked) return;

  loadImageFromFile(file).then(image => {
    const w = Number($("resize-width").value);
    if (w > 0) $("resize-height").value =
      Math.max(1, Math.round(w * image.naturalHeight / image.naturalWidth));
  }).catch(() => {});
});

$("resize-height").addEventListener("input", () => {
  const file = $("resize-input").files[0];
  if (!file || !$("resize-lock").checked) return;

  loadImageFromFile(file).then(image => {
    const h = Number($("resize-height").value);
    if (h > 0) $("resize-width").value =
      Math.max(1, Math.round(h * image.naturalWidth / image.naturalHeight));
  }).catch(() => {});
});

async function loadImageFromFile(file) {
  return loadImage(await readDataURL(file));
}

$("resize-btn").addEventListener("click", async () => {
  const file = $("resize-input").files[0];
  const status = $("resize-status");
  const results = $("resize-result");
  results.innerHTML = "";

  if (!file) {
    status.textContent = "पहले फोटो चुनें।";
    return;
  }

  const w = Number($("resize-width").value);
  const h = Number($("resize-height").value);

  if (!Number.isInteger(w) || !Number.isInteger(h) ||
      w < 1 || h < 1 || w > 6000 || h > 6000) {
    status.textContent = "चौड़ाई और ऊँचाई 1 से 6000 पिक्सेल के बीच दें।";
    return;
  }

  const button = $("resize-btn");
  button.disabled = true;

  try {
    status.textContent = "फोटो तैयार हो रही है…";
    const image = await loadImageFromFile(file);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    const type = $("resize-format").value;
    if (type === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }

    ctx.drawImage(image, 0, 0, w, h);
    const blob = await canvasBlob(canvas, type, 0.92);
    const ext = type === "image/png" ? "png" : "jpg";

    showImageResult(
      results, blob,
      file.name.replace(/\.[^.]+$/, "") + "-resized." + ext,
      file.size
    );

    status.textContent = "आकार बदल गया। फोटो सेव करें दबाएँ।";
    canvas.width = 0;
    canvas.height = 0;
  } catch (error) {
    status.textContent = "समस्या: " + error.message;
  } finally {
    button.disabled = false;
  }
});

// 5. PDF Merger
$("merge-input").addEventListener("change", () => {
  const files = Array.from($("merge-input").files || []);
  $("merge-count").textContent = files.length + " PDF चुनी गईं।";
});

$("merge-btn").addEventListener("click", async () => {
  const files = Array.from($("merge-input").files || []);
  const status = $("merge-status");
  const button = $("merge-btn");

  if (files.length < 2) {
    status.textContent = "कम से कम दो PDF चुनें।";
    return;
  }

  if (!window.PDFLib || !window.PDFLib.PDFDocument) {
    status.textContent = "PDF लाइब्रेरी लोड नहीं हुई। इंटरनेट चालू करके Chrome में फिर खोलें।";
    return;
  }

  button.disabled = true;

  try {
    const merged = await PDFLib.PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      status.textContent = "PDF जोड़ी जा रही है: " + (i + 1) + "/" + files.length;

      const bytes = await files[i].arrayBuffer();
      const source = await PDFLib.PDFDocument.load(bytes);
      const pages = await merged.copyPages(source, source.getPageIndices());

      pages.forEach(page => merged.addPage(page));
    }

    const bytes = await merged.save();
    const blob = new Blob([bytes], { type: "application/pdf" });
    const filename = cleanName($("merge-name").value, "MyWorkspace-Merged") + ".pdf";

    downloadBlob(blob, filename);
    status.textContent = "PDF जुड़ गई। डाउनलोड फोल्डर में फाइल जाँचें।";
  } catch (error) {
    status.textContent = "PDF नहीं जुड़ सकी। फाइल पासवर्ड-सुरक्षित या खराब हो सकती है। विवरण: " + error.message;
  } finally {
    button.disabled = false;
  }
});
