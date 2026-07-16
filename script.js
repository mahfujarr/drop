const NEXTCLOUD_URL = "https://cloud.mahfujarr.me";

const apps = [
  {
    name: "Youtube Experimental",
    tagline: "AD free youtube",
    version: "21.26.360",
    color: "linear-gradient(135deg, #2b3dda, #420177)",
    initial: "Y",
    shareToken: "youtubeExp",
  },
  {
    name: "Yt-Music Experimental",
    tagline: "AD free youtube music",
    version: "9.26.51",
    color: "linear-gradient(135deg, #ff7b00, #ffd900)",
    initial: "YtM",
    shareToken: "ytmusicExp",
  },
];

const grid = document.getElementById("appsGrid");
grid.innerHTML = apps
  .map(
    (app, i) => `
    <div class="app-card">
      <div class="app-top">
        <div class="app-icon" style="background:${app.color}">${app.initial}</div>
        <div class="app-meta">
          <h3>${app.name}</h3>
          <p>${app.tagline}</p>
        </div>
      </div>
      <div class="tag-row">
        <span class="tag">v${app.version}</span>
        <span class="tag" id="size-${i}">loading…</span>
        <span class="tag" id="updated-${i}">loading…</span>
      </div>
      <a class="download-btn" href="${NEXTCLOUD_URL}/s/${app.shareToken}/download" download>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 20h16"/></svg>
        Download APK
      </a>
    </div>
  `,
  )
  .join("");

function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return "—";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? mb.toFixed(1) + " MB" : (bytes / 1024).toFixed(0) + " KB";
}

function formatDate(httpDateStr) {
  const d = new Date(httpDateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

async function fetchShareMeta(app, index) {
  const sizeEl = document.getElementById(`size-${index}`);
  const updatedEl = document.getElementById(`updated-${index}`);
  try {
    const res = await fetch(`${NEXTCLOUD_URL}/public.php/webdav/`, {
      method: "PROPFIND",
      headers: {
        Authorization: "Basic " + btoa(app.shareToken + ":"),
        "Content-Type": "application/xml",
        Depth: "0",
      },
      body: `<?xml version="1.0"?>
          <d:propfind xmlns:d="DAV:">
            <d:prop>
              <d:getcontentlength/>
              <d:getlastmodified/>
            </d:prop>
          </d:propfind>`,
    });
    if (!res.ok) throw new Error("propfind failed");
    const xmlText = await res.text();
    const xml = new DOMParser().parseFromString(xmlText, "application/xml");
    const size = xml.getElementsByTagNameNS("DAV:", "getcontentlength")[0]
      ?.textContent;
    const modified = xml.getElementsByTagNameNS("DAV:", "getlastmodified")[0]
      ?.textContent;

    sizeEl.textContent = formatBytes(Number(size));
    updatedEl.textContent = formatDate(modified);
  } catch (err) {
    sizeEl.textContent = "—";
    updatedEl.textContent = "—";
  }
}

apps.forEach((app, i) => fetchShareMeta(app, i));

// ---- Theme toggle ----
const root = document.documentElement;
const toggle = document.getElementById("themeToggle");
const sun = document.getElementById("iconSun");
const moon = document.getElementById("iconMoon");
toggle.addEventListener("click", () => {
  const isDark = root.getAttribute("data-theme") === "dark";
  root.setAttribute("data-theme", isDark ? "light" : "dark");
  sun.style.display = isDark ? "block" : "none";
  moon.style.display = isDark ? "none" : "block";
});

const STATUS_URL = "https://cloud.mahfujarr.me/status.php";

const dot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const dotMini = document.getElementById("statusDotMini");
const statusTextMini = document.getElementById("statusTextMini");
const pingVal = document.getElementById("pingVal");
const clockVal = document.getElementById("clockVal");

function setStatus(online, label, color, pulse) {
  [dot, dotMini].forEach((d) => {
    d.style.background = color;
    d.classList.toggle("online", pulse);
  });
  statusText.textContent = label;
  statusTextMini.textContent = label;
}

async function checkServer() {
  const start = performance.now();
  try {
    const res = await fetch(STATUS_URL, { cache: "no-store", mode: "cors" });
    const elapsed = Math.round(performance.now() - start);
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();

    pingVal.textContent = elapsed + "ms";
    clockVal.textContent = new Date().toLocaleTimeString();

    if (data.maintenance) {
      setStatus(true, "Server in maintenance mode", "#ff7b00", false);
    } else if (data.installed) {
      setStatus(true, "Server online", "#22c55e", true);
    } else {
      setStatus(false, "Server reachable, not fully set up", "#ff7b00", false);
    }
  } catch (err) {
    pingVal.textContent = "—";
    clockVal.textContent = new Date().toLocaleTimeString();
    setStatus(
      false,
      "Can't reach server (offline or blocked by CORS)",
      "rgb(148, 8, 8)",
      false,
    );
  }
}

checkServer();
setInterval(checkServer, 15000);

// ---- Reveal the compact status pill once the hero has scrolled out of view ----
const heroEl = document.querySelector(".hero");
const navStatus = document.getElementById("navStatus");
function onScroll() {
  const threshold = heroEl.offsetHeight - 80;
  navStatus.classList.toggle("show", window.scrollY > threshold);
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

document.getElementById("year").textContent = new Date().getFullYear();
