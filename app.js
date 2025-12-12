// --- Service Worker ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .then((reg) => console.log("SW registered:", reg.scope))
      .catch((err) => console.error("SW registration failed:", err));
  });
}

// --- État de l'app ---
let docxFile = null;

// --- Éléments DOM ---
const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const titleInput = document.getElementById("titleInput");
const authorInput = document.getElementById("authorInput");
const convertBtn = document.getElementById("convertBtn");
const statusEl = document.getElementById("status");
const downloadLink = document.getElementById("downloadLink");

// --- Gestion du fichier ---
dropArea.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

["dragenter", "dragover"].forEach((eventName) => {
  dropArea.addEventListener(eventName, highlight, false);
});

["dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight() {
  dropArea.classList.add("active");
}

function unhighlight() {
  dropArea.classList.remove("active");
}

dropArea.addEventListener("drop", handleDrop, false);

function handleDrop(e) {
  const dt = e.dataTransfer;
  const file = dt.files[0];
  if (file) handleFile(file);
}

function handleFile(file) {
  if (!file.name.endsWith(".docx")) {
    showStatus("Veuillez sélectionner un fichier .docx", "error");
    return;
  }

  docxFile = file;

  // Pré-remplir titre/auteur par défaut
  const baseName = file.name.replace(/\.docx$/, "");
  titleInput.value = titleInput.value || baseName;
  authorInput.value = authorInput.value || "Inconnu";

  showStatus(`Fichier sélectionné : ${file.name}`, "success");
}

// --- Conversion avec Mammoth.js ---
convertBtn.addEventListener("click", convertDocxToEpub);

async function convertDocxToEpub() {
  if (!docxFile) {
    showStatus("Veuillez d'abord sélectionner un fichier .docx", "error");
    return;
  }

  const title = titleInput.value.trim();
  const author = authorInput.value.trim();

  if (!title || !author) {
    showStatus("Titre et auteur sont requis", "error");
    return;
  }

  showStatus("Conversion en cours...", "success");

  try {
    // Étape 1: Convertir .docx → HTML avec Mammoth
    const result = await mammoth.convertToHtml({ arrayBuffer: await readFileAsArrayBuffer(docxFile) });
    const htmlContent = result.value; // HTML principal

    // Étape 2: Préparer les données pour epub-gen
    const epubOptions = {
      title: title,
      author: author,
      publisher: "Docx2Epub PWA",
      language: "fr",
      content: [
        {
          title: "Chapitre 1",
          data: `<h1>${title}</h1>` + htmlContent,
        },
      ],
    };

    // Étape 3: Générer l'EPUB
    const epubBlob = await new Promise((resolve, reject) => {
      window.EpubGen(epubOptions, (err, epubContent) => {
        if (err) reject(err);
        else resolve(epubContent);
      });
    });

    // Étape 4: Créer un lien de téléchargement
    const blob = new Blob([epubBlob], { type: "application/epub+zip" });
    const url = URL.createObjectURL(blob);
    const fileName = `${title.replace(/\s+/g, "_")}.epub`;

    downloadLink.href = url;
    downloadLink.download = fileName;
    downloadLink.style.display = "block";

    showStatus("Conversion terminée !", "success");
  } catch (error) {
    console.error("Conversion error:", error);
    showStatus("Erreur lors de la conversion: " + error.message, "error");
  }
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
}

// --- Status ---
function showStatus(message, type = "success") {
  statusEl.textContent = message;
  statusEl.className = "status " + type;
}
