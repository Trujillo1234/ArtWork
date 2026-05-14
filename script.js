const grid = document.querySelector("#artGrid");
const stats = document.querySelector("#stats");
const schoolStrip = document.querySelector("#schoolStrip");
const resultTitle = document.querySelector("#resultTitle");
const searchInput = document.querySelector("#search");
const schoolFilter = document.querySelector("#schoolFilter");
const typeFilter = document.querySelector("#typeFilter");
const themeFilter = document.querySelector("#themeFilter");
const clearFilters = document.querySelector("#clearFilters");
const toggleRoom = document.querySelector("#toggleRoom");
const roomShortcut = document.querySelector("#roomShortcut");
const roomView = document.querySelector("#roomView");
const dialog = document.querySelector("#detailDialog");
const detailPanel = document.querySelector("#detailPanel");

let activeTheme = "all";
let roomOpen = false;

const schools = [...new Set(artworks.map((item) => item.school))].sort();
const types = [...new Set(artworks.map((item) => item.type))].sort();
const themes = [...new Set(artworks.flatMap((item) => item.themes))].sort();
const featuredThemes = ["family", "hearts", "animals", "writing", "schoolwork", "painting", "collage", "keepsake"];
const commentKey = (id) => `trujillo-archive-comments-${id}`;
const reviewRepo = "Trujillo1234/ArtWork";

function option(value) {
  const el = document.createElement("option");
  el.value = value;
  el.textContent = value;
  return el;
}

function imagePath(file) {
  return `assets/artwork/${file}`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function commentsFor(id) {
  try {
    return JSON.parse(localStorage.getItem(commentKey(id)) || "[]");
  } catch {
    return [];
  }
}

function saveComments(id, comments) {
  localStorage.setItem(commentKey(id), JSON.stringify(comments));
}

function reviewIssueUrl(item) {
  const title = `Review note: ${item.title}`;
  const body = [
    "## Artwork",
    `- ID: ${item.id}`,
    `- Current title: ${item.title}`,
    `- Artist: ${item.artist || "Penelope Trujillo"}`,
    `- School: ${item.school}`,
    `- Stage: ${item.grade}`,
    `- Medium: ${item.type}`,
    `- Image files: ${item.images.join(", ")}`,
    "",
    "## Requested correction or memory",
    "",
    "<!-- Write the note here. Examples: rotate the second photo 90 degrees clockwise; change the school to Esprit; title should mention Mother's Day; these two photos are not the same artwork. -->",
    "",
    "## Checklist",
    "- [ ] Fix title",
    "- [ ] Fix description",
    "- [ ] Fix school/stage/medium",
    "- [ ] Split or regroup photos",
    "- [ ] Rotate/crop image",
    "- [ ] Add memory/context",
    "- [ ] Other"
  ].join("\n");
  const params = new URLSearchParams({
    title,
    body,
    labels: "archive-review"
  });
  return `https://github.com/${reviewRepo}/issues/new?${params.toString()}`;
}

function renderPublicComments(item) {
  const container = detailPanel.querySelector("#publicComments");
  if (!container) return;
  container.innerHTML = "";

  const script = document.createElement("script");
  script.src = "https://utteranc.es/client.js";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.setAttribute("repo", reviewRepo);
  script.setAttribute("issue-term", `artwork:${item.id}`);
  script.setAttribute("label", "archive-comment");
  script.setAttribute("theme", "github-light");
  container.append(script);
}

function themeList() {
  const curated = featuredThemes.filter((theme) => themes.includes(theme));
  const rest = themes.filter((theme) => !curated.includes(theme));
  return [...curated, ...rest];
}

function formatTheme(theme) {
  return theme
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildThemeOptions() {
  themeFilter.innerHTML = "";
  [{ label: "All themes", value: "all" }, ...themeList().map((theme) => ({ label: formatTheme(theme), value: theme }))].forEach((theme) => {
    const optionEl = option(theme.value);
    optionEl.textContent = theme.label;
    themeFilter.append(optionEl);
  });
  themeFilter.value = activeTheme;
}

function schoolMarkup() {
  schoolStrip.innerHTML = schoolLinks.map((link) => `
    <article class="school-link">
      <span>${link.name}</span>
      <small>${link.note}</small>
      <div class="school-actions">
        <a href="${link.url}" target="_blank" rel="noreferrer">Archived copy</a>
        <a href="${link.liveUrl}" target="_blank" rel="noreferrer">Live site</a>
      </div>
    </article>
  `).join("");
}

function filteredItems() {
  const query = searchInput.value.trim().toLowerCase();
  return artworks.filter((item) => {
    const searchText = [
      item.title,
      item.artist,
      item.school,
      item.grade,
      item.type,
      item.period,
      item.note,
      ...item.themes
    ].join(" ").toLowerCase();

    const matchesSearch = !query || searchText.includes(query);
    const matchesSchool = schoolFilter.value === "all" || item.school === schoolFilter.value;
    const matchesType = typeFilter.value === "all" || item.type === typeFilter.value;
    const matchesTheme = activeTheme === "all" || item.themes.includes(activeTheme);
    return matchesSearch && matchesSchool && matchesType && matchesTheme;
  });
}

function renderStats(items) {
  const imageCount = artworks.reduce((sum, item) => sum + item.images.length, 0);
  const groupedCount = artworks.filter((item) => item.images.length > 1).length;
  const periods = new Set(artworks.map((item) => item.period)).size;
  stats.innerHTML = `
    <div><strong>${artworks.length}</strong><span>records</span></div>
    <div><strong>${imageCount}</strong><span>photos</span></div>
    <div><strong>${groupedCount}</strong><span>multi-view works</span></div>
    <div><strong>${items.length}</strong><span>currently visible</span></div>
  `;
  stats.dataset.periods = periods;
}

function renderGrid(items) {
  grid.innerHTML = "";
  if (!items.length) {
    grid.innerHTML = `<p class="empty">No works match the current filters.</p>`;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "art-card";
    card.innerHTML = `
      <span class="card-image"><img src="${imagePath(item.images[0])}" alt="${item.title}" loading="lazy"></span>
      <span class="card-body">
        <span class="card-title">${item.title}</span>
        <span class="card-meta">${item.school}</span>
        <span class="view-count">${item.period} &middot; ${item.images.length} ${item.images.length === 1 ? "view" : "views"}</span>
      </span>
    `;
    card.addEventListener("click", () => openDetail(item.id));
    grid.append(card);
  });
}

function renderRoom(items) {
  const roomItems = items.slice(0, 28);
  if (!roomItems.length) {
    roomView.innerHTML = `<div class="room-stage empty-room"><p class="empty">No works match the current filters.</p></div>`;
    return;
  }

  roomView.innerHTML = `
    <div class="room-controls" aria-label="Gallery wall scrolling">
      <button class="room-scroll" type="button" data-dir="-1" aria-label="Scroll gallery wall left">&lsaquo;</button>
      <button class="room-scroll" type="button" data-dir="1" aria-label="Scroll gallery wall right">&rsaquo;</button>
    </div>
    <div class="room-stage" tabindex="0">
      <div class="gallery-track">
        ${roomItems.map((item, index) => {
          const hang = index % 5 === 0 ? "0px" : index % 5 === 1 ? "34px" : index % 5 === 2 ? "14px" : index % 5 === 3 ? "52px" : "24px";
          const width = index % 6 === 0 ? "230px" : index % 4 === 0 ? "188px" : "210px";
          const tilt = index % 2 === 0 ? "-0.9deg" : "0.8deg";
          return `
            <button class="room-art" style="--hang:${hang}; --frame-width:${width}; --tilt:${tilt};" type="button" data-id="${item.id}">
              <img src="${imagePath(item.images[0])}" alt="${item.title}" loading="lazy">
              <span>${item.title}</span>
            </button>
          `;
        }).join("")}
      </div>
    </div>
  `;

  roomView.querySelectorAll(".room-art").forEach((button) => {
    button.addEventListener("click", () => openDetail(button.dataset.id));
  });

  roomView.querySelectorAll(".room-scroll").forEach((button) => {
    button.addEventListener("click", () => {
      const stage = roomView.querySelector(".room-stage");
      stage.scrollBy({
        left: Number(button.dataset.dir) * Math.max(360, stage.clientWidth * 0.75),
        behavior: "smooth"
      });
    });
  });
}

function commentMarkup(item) {
  const comments = commentsFor(item.id);
  if (!comments.length) return `<p class="no-comments">No notes yet.</p>`;
  return comments.map((comment) => `
    <div class="comment">
      <p>${escapeHtml(comment.text)}</p>
      <time>${comment.created}</time>
    </div>
  `).join("");
}

function openDetail(id) {
  const item = artworks.find((artwork) => artwork.id === id);
  if (!item) return;

  detailPanel.innerHTML = `
    <div class="detail-media">
      <div class="detail-main-image">
        <img id="mainDetailImage" src="${imagePath(item.images[0])}" alt="${item.title}">
      </div>
      <div class="thumb-row">
        ${item.images.map((file, index) => `
          <button class="${index === 0 ? "active" : ""}" type="button" data-file="${file}" aria-label="View ${index + 1}">
            <img src="${imagePath(file)}" alt="">
          </button>
        `).join("")}
      </div>
    </div>
    <div class="detail-copy">
      <div class="detail-actions">
        <span class="label">${item.period}</span>
        <button class="icon-button" id="closeDetail" type="button" aria-label="Close">&times;</button>
      </div>
      <h2>${item.title}</h2>
      <dl class="metadata">
        <div><dt>Artist</dt><dd>${item.artist || "Penelope Trujillo"}</dd></div>
        <div><dt>School</dt><dd>${item.school}</dd></div>
        <div><dt>Stage</dt><dd>${item.grade}</dd></div>
        <div><dt>Medium</dt><dd>${item.type}</dd></div>
      </dl>
      <p class="record-note">${item.note}</p>
      <div class="tag-row">${item.themes.map((tag) => `<span>${tag}</span>`).join("")}</div>

      <section class="comments">
        <h3>Review Notes</h3>
        <p class="review-help">Public comments are saved in GitHub and visible to everyone. Use the review issue for specific cleanup requests.</p>
        <a class="review-link" href="${reviewIssueUrl(item)}" target="_blank" rel="noreferrer">Open review issue</a>
        <div class="public-comments" id="publicComments"></div>
        <div id="commentList">${commentMarkup(item)}</div>
        <form id="commentForm">
          <label for="commentText">Private browser scratch note</label>
          <textarea id="commentText" rows="4" placeholder="Temporary note on this device only"></textarea>
          <button type="submit">Save local note</button>
        </form>
      </section>
    </div>
  `;

  detailPanel.querySelector("#closeDetail").addEventListener("click", () => dialog.close());
  detailPanel.querySelectorAll(".thumb-row button").forEach((button) => {
    button.addEventListener("click", () => {
      detailPanel.querySelector("#mainDetailImage").src = imagePath(button.dataset.file);
      detailPanel.querySelectorAll(".thumb-row button").forEach((thumb) => thumb.classList.remove("active"));
      button.classList.add("active");
    });
  });

  detailPanel.querySelector("#commentForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const textarea = detailPanel.querySelector("#commentText");
    const text = textarea.value.trim();
    if (!text) return;

    const comments = commentsFor(item.id);
    comments.unshift({
      text,
      created: new Date().toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      })
    });
    saveComments(item.id, comments);
    openDetail(item.id);
  });

  renderPublicComments(item);

  if (!dialog.open) {
    dialog.showModal();
  }
}

function syncRoomButtons() {
  roomView.classList.toggle("open", roomOpen);
  roomView.setAttribute("aria-hidden", String(!roomOpen));
  grid.classList.toggle("is-hidden", roomOpen);
  grid.setAttribute("aria-hidden", String(roomOpen));
  toggleRoom.textContent = roomOpen ? "Return to Grid" : "Gallery Wall";
  roomShortcut.textContent = roomOpen ? "Return to Grid" : "Gallery Wall";
  toggleRoom.setAttribute("aria-expanded", String(roomOpen));
  roomShortcut.setAttribute("aria-expanded", String(roomOpen));
}

function render() {
  buildThemeOptions();
  const items = filteredItems();
  resultTitle.textContent = activeTheme === "all" ? "All pieces" : `${formatTheme(activeTheme)} works`;
  renderStats(items);
  renderGrid(items);
  renderRoom(items);
  syncRoomButtons();
}

function resetFilters() {
  searchInput.value = "";
  schoolFilter.value = "all";
  typeFilter.value = "all";
  activeTheme = "all";
  themeFilter.value = "all";
  render();
}

function toggleRoomView() {
  roomOpen = !roomOpen;
  syncRoomButtons();
  document.querySelector("#collection").scrollIntoView({ behavior: "smooth", block: "start" });
}

schools.forEach((school) => schoolFilter.append(option(school)));
types.forEach((type) => typeFilter.append(option(type)));

schoolMarkup();

[searchInput, schoolFilter, typeFilter].forEach((control) => {
  control.addEventListener("input", render);
  control.addEventListener("change", render);
});

themeFilter.addEventListener("change", () => {
  activeTheme = themeFilter.value;
  render();
});

clearFilters.addEventListener("click", resetFilters);
toggleRoom.addEventListener("click", toggleRoomView);
roomShortcut.addEventListener("click", toggleRoomView);

dialog.addEventListener("click", (event) => {
  const rect = dialog.getBoundingClientRect();
  const withinDialog = (
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  );
  if (!withinDialog) dialog.close();
});

render();
