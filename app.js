/*
  Video Me - Static HTML/CSS/JS template
  Important: username/password below are visible to anyone in the browser source.
  Use a backend/server for a real public website.
*/

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "videome123";
const STORAGE_KEY = "videome.videos.v1";
const THEME_KEY = "videome.theme";
const SESSION_KEY = "videome.admin.session";
const AGE_KEY = "videome.age.ok";

const fallbackThumb = svgThumb("Video Me", "#ff7a00", "#111111");

const seedVideos = [
  {
    id: cryptoId(),
    title: "Sample Sri Lanka Movie",
    category: "Sri Lanka",
    description: "මෙය demo video card එකකි. Admin panel එකෙන් ඔබේ DoodStream embed link එක දාන්න.",
    embed: "https://doodstream.com/e/demo",
    thumbnail: svgThumb("Sri Lanka", "#ff7a00", "#1a1a1a"),
    createdAt: new Date().toISOString()
  },
  {
    id: cryptoId(),
    title: "Sample India Movie",
    category: "India",
    description: "ඔබට title, category, thumbnail සහ DoodStream iframe link එක upload කළ හැක.",
    embed: "https://doodstream.com/e/demo2",
    thumbnail: svgThumb("India", "#ff8c1a", "#202020"),
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: cryptoId(),
    title: "New Release Demo",
    category: "new",
    description: "Latest videos section එකට අලුත්ම items මුලින් පෙන්වයි.",
    embed: "https://doodstream.com/e/demo3",
    thumbnail: svgThumb("New", "#ff7a00", "#252525"),
    createdAt: new Date(Date.now() - 172800000).toISOString()
  }
];

let videos = loadVideos();
let currentCategory = "All";
let currentQuery = "";
let pendingAgeAction = null;
let selectedThumbData = "";

const $ = (id) => document.getElementById(id);

const app = $("app");
const playerView = $("playerView");
const videoGrid = $("videoGrid");
const emptyState = $("emptyState");
const searchForm = $("searchForm");
const searchInput = $("searchInput");
const gridTitle = $("gridTitle");
const videoCount = $("videoCount");
const themeToggle = $("themeToggle");
const adminModal = $("adminModal");
const ageModal = $("ageModal");

init();

function init() {
  document.documentElement.dataset.theme = localStorage.getItem(THEME_KEY) || "dark";
  updateThemeButton();
  renderGrid();
  $("year").textContent = new Date().getFullYear();

  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    currentQuery = searchInput.value.trim().toLowerCase();
    renderGrid();
  });

  searchInput.addEventListener("input", () => {
    currentQuery = searchInput.value.trim().toLowerCase();
    renderGrid();
  });

  document.querySelectorAll(".cat").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.category;
      if (cat === "18+" && !ageAccepted()) {
        requestAgeConfirm(() => setCategory(cat));
        return;
      }
      setCategory(cat);
    });
  });

  themeToggle.addEventListener("click", toggleTheme);
  $("adminOpenBtn").addEventListener("click", openAdmin);
  $("heroAdminBtn").addEventListener("click", openAdmin);
  $("closeAdmin").addEventListener("click", closeAdmin);
  $("backBtn").addEventListener("click", showHome);
  $("ageCancel").addEventListener("click", () => closeAge(false));
  $("ageConfirm").addEventListener("click", () => closeAge(true));

  initAdmin();
}

function loadVideos() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedVideos));
    return seedVideos;
  }
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : seedVideos;
  } catch {
    return seedVideos;
  }
}

function saveVideos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
}

function setCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll(".cat").forEach((btn) => btn.classList.toggle("active", btn.dataset.category === cat));
  renderGrid();
}

function filteredVideos() {
  return videos
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter((video) => currentCategory === "All" || video.category === currentCategory)
    .filter((video) => {
      if (!currentQuery) return true;
      return [video.title, video.category, video.description].join(" ").toLowerCase().includes(currentQuery);
    });
}

function renderGrid() {
  const list = filteredVideos();
  gridTitle.textContent = currentQuery ? `Search: ${searchInput.value}` : `${currentCategory === "All" ? "All Videos" : currentCategory}`;
  videoCount.textContent = `${list.length} video${list.length === 1 ? "" : "s"}`;
  videoGrid.innerHTML = "";
  emptyState.classList.toggle("hidden", list.length > 0);

  list.forEach((video) => {
    const card = document.createElement("button");
    card.className = "video-card";
    card.type = "button";
    card.innerHTML = `
      <div class="thumb-wrap"><img src="${escapeAttr(video.thumbnail || fallbackThumb)}" alt="${escapeAttr(video.title)} thumbnail" loading="lazy"></div>
      <div class="video-info">
        <h3>${escapeHtml(video.title)}</h3>
        <div class="video-meta">
          <span class="badge">${escapeHtml(video.category)}</span>
          <span>${formatDate(video.createdAt)}</span>
        </div>
      </div>
    `;
    card.addEventListener("click", () => openVideo(video.id));
    videoGrid.appendChild(card);
  });
}

function openVideo(id) {
  const video = videos.find((item) => item.id === id);
  if (!video) return;
  if (video.category === "18+" && !ageAccepted()) {
    requestAgeConfirm(() => openVideo(id));
    return;
  }

  app.classList.add("hidden");
  playerView.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });

  $("watchTitle").textContent = video.title;
  $("watchCategory").innerHTML = `<span class="badge">${escapeHtml(video.category)}</span>`;
  $("watchDate").textContent = formatDate(video.createdAt);
  $("watchDesc").textContent = video.description || "No description added.";
  renderEmbed(video.embed);
  renderRelated(id);
}

function renderEmbed(embedInput) {
  const embedBox = $("embedBox");
  const src = extractEmbedSrc(embedInput);

  if (!src) {
    embedBox.innerHTML = `<div class="embed-placeholder">Invalid embed link. Please add a valid DoodStream embed URL or iframe code.</div>`;
    return;
  }

  embedBox.innerHTML = `
    <iframe
      src="${escapeAttr(src)}"
      allowfullscreen
      scrolling="no"
      allow="autoplay; fullscreen; picture-in-picture"
      referrerpolicy="no-referrer">
    </iframe>`;
}

function extractEmbedSrc(input = "") {
  const value = input.trim();
  if (!value) return "";
  const iframeSrc = value.match(/src=["']([^"']+)["']/i);
  if (iframeSrc && iframeSrc[1]) return iframeSrc[1];
  return value;
}

function renderRelated(currentId) {
  const related = videos
    .filter((video) => video.id !== currentId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  const relatedList = $("relatedList");
  relatedList.innerHTML = "";
  related.forEach((video) => {
    const item = document.createElement("button");
    item.className = "related-item";
    item.type = "button";
    item.innerHTML = `
      <img src="${escapeAttr(video.thumbnail || fallbackThumb)}" alt="${escapeAttr(video.title)} thumbnail">
      <div>
        <h4>${escapeHtml(video.title)}</h4>
        <small>${escapeHtml(video.category)}</small>
      </div>`;
    item.addEventListener("click", () => openVideo(video.id));
    relatedList.appendChild(item);
  });
}

function showHome() {
  playerView.classList.add("hidden");
  app.classList.remove("hidden");
  $("embedBox").innerHTML = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
  updateThemeButton();
}

function updateThemeButton() {
  themeToggle.textContent = document.documentElement.dataset.theme === "dark" ? "☀️" : "🌙";
}

function requestAgeConfirm(action) {
  pendingAgeAction = action;
  ageModal.classList.remove("hidden");
}

function closeAge(accepted) {
  ageModal.classList.add("hidden");
  if (accepted) {
    sessionStorage.setItem(AGE_KEY, "yes");
    if (typeof pendingAgeAction === "function") pendingAgeAction();
  }
  pendingAgeAction = null;
}

function ageAccepted() {
  return sessionStorage.getItem(AGE_KEY) === "yes";
}

function openAdmin() {
  adminModal.classList.remove("hidden");
  renderAdminState();
}

function closeAdmin() {
  adminModal.classList.add("hidden");
}

function initAdmin() {
  $("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const user = $("username").value.trim();
    const pass = $("password").value;
    if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "yes");
      $("loginForm").reset();
      renderAdminState();
    } else {
      alert("Username or password incorrect.");
    }
  });

  $("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    renderAdminState();
  });

  $("newVideoBtn").addEventListener("click", clearForm);
  $("clearFormBtn").addEventListener("click", clearForm);
  $("thumbnailFile").addEventListener("change", handleThumbFile);
  $("thumbnailUrl").addEventListener("input", handleThumbUrl);
  $("videoForm").addEventListener("submit", saveVideoFromForm);
  $("exportBtn").addEventListener("click", exportBackup);
  $("importInput").addEventListener("change", importBackup);
}

function renderAdminState() {
  const logged = sessionStorage.getItem(SESSION_KEY) === "yes";
  $("loginForm").classList.toggle("hidden", logged);
  $("adminPanel").classList.toggle("hidden", !logged);
  if (logged) {
    renderAdminList();
    clearForm(false);
  }
}

function handleThumbFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    selectedThumbData = reader.result;
    $("thumbnailUrl").value = "";
    updateThumbPreview(selectedThumbData);
  };
  reader.readAsDataURL(file);
}

function handleThumbUrl(event) {
  const url = event.target.value.trim();
  if (!url) return;
  selectedThumbData = url;
  $("thumbnailFile").value = "";
  updateThumbPreview(url);
}

function updateThumbPreview(src) {
  const img = $("thumbPreview");
  img.src = src || fallbackThumb;
}

function saveVideoFromForm(e) {
  e.preventDefault();
  const id = $("videoId").value || cryptoId();
  const existing = videos.find((video) => video.id === id);
  const item = {
    id,
    title: $("title").value.trim(),
    category: $("category").value,
    description: $("description").value.trim(),
    embed: $("embed").value.trim(),
    thumbnail: selectedThumbData || existing?.thumbnail || fallbackThumb,
    createdAt: existing?.createdAt || new Date().toISOString()
  };

  if (!item.title || !item.embed) {
    alert("Title and embed link are required.");
    return;
  }

  if (existing) videos = videos.map((video) => video.id === id ? item : video);
  else videos.unshift(item);

  saveVideos();
  renderGrid();
  renderAdminList();
  clearForm();
  alert("Video saved successfully.");
}

function renderAdminList() {
  const list = $("adminVideoList");
  list.innerHTML = "";
  $("adminCount").textContent = `${videos.length}`;

  videos
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach((video) => {
      const row = document.createElement("div");
      row.className = "admin-row";
      row.innerHTML = `
        <img src="${escapeAttr(video.thumbnail || fallbackThumb)}" alt="${escapeAttr(video.title)} thumbnail">
        <div>
          <h4>${escapeHtml(video.title)}</h4>
          <p>${escapeHtml(video.category)} • ${formatDate(video.createdAt)}</p>
        </div>
        <div class="row-actions">
          <button class="btn ghost" type="button" data-action="edit">Edit</button>
          <button class="btn danger" type="button" data-action="delete">Delete</button>
        </div>`;
      row.querySelector('[data-action="edit"]').addEventListener("click", () => fillForm(video));
      row.querySelector('[data-action="delete"]').addEventListener("click", () => deleteVideo(video.id));
      list.appendChild(row);
    });
}

function fillForm(video) {
  $("videoId").value = video.id;
  $("title").value = video.title;
  $("category").value = video.category;
  $("description").value = video.description || "";
  $("embed").value = video.embed || "";
  $("thumbnailUrl").value = video.thumbnail?.startsWith("http") ? video.thumbnail : "";
  $("thumbnailFile").value = "";
  selectedThumbData = video.thumbnail || fallbackThumb;
  updateThumbPreview(selectedThumbData);
  $("title").focus();
}

function deleteVideo(id) {
  if (!confirm("Delete this video?")) return;
  videos = videos.filter((video) => video.id !== id);
  saveVideos();
  renderGrid();
  renderAdminList();
}

function clearForm(focus = true) {
  $("videoForm").reset();
  $("videoId").value = "";
  selectedThumbData = "";
  updateThumbPreview(fallbackThumb);
  if (focus) $("title").focus();
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(videos, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `videome-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data)) throw new Error("Invalid file");
      videos = data.map((video) => ({
        id: video.id || cryptoId(),
        title: String(video.title || "Untitled"),
        category: ["Sri Lanka", "India", "18+", "new"].includes(video.category) ? video.category : "new",
        description: String(video.description || ""),
        embed: String(video.embed || ""),
        thumbnail: String(video.thumbnail || fallbackThumb),
        createdAt: video.createdAt || new Date().toISOString()
      }));
      saveVideos();
      renderGrid();
      renderAdminList();
      alert("Backup imported successfully.");
    } catch {
      alert("Invalid backup JSON file.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function formatDate(dateString) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "Latest";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function cryptoId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value = "") {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function svgThumb(text, color, bg) {
  const safeText = encodeURIComponent(text);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1280' height='720' viewBox='0 0 1280 720'>
    <defs><linearGradient id='g' x1='0' x2='1'><stop stop-color='${bg}'/><stop offset='1' stop-color='#000'/></linearGradient></defs>
    <rect width='1280' height='720' fill='url(#g)'/>
    <circle cx='640' cy='360' r='110' fill='${color}' opacity='.95'/>
    <polygon points='615,305 615,415 715,360' fill='white'/>
    <text x='640' y='565' text-anchor='middle' fill='white' font-family='Arial, sans-serif' font-size='76' font-weight='800'>${safeText}</text>
    <text x='640' y='630' text-anchor='middle' fill='${color}' font-family='Arial, sans-serif' font-size='34' font-weight='700'>Video Me</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
