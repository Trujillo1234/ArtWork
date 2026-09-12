const grid = document.querySelector("#artGrid");
const stats = document.querySelector("#stats");
const schoolStrip = document.querySelector("#schoolStrip");
const resultTitle = document.querySelector("#resultTitle");
const searchInput = document.querySelector("#search");
const schoolFilter = document.querySelector("#schoolFilter");
const artistFilter = document.querySelector("#artistFilter");
const typeFilter = document.querySelector("#typeFilter");
const themeFilter = document.querySelector("#themeFilter");
const clearFilters = document.querySelector("#clearFilters");
const toggleRoom = document.querySelector("#toggleRoom");
const roomShortcut = document.querySelector("#roomShortcut");
const roomView = document.querySelector("#roomView");
const curatorStrip = document.querySelector("#curatorStrip");
const storyView = document.querySelector("#storyView");
const labView = document.querySelector("#labView");
const viewButtons = [...document.querySelectorAll(".view-switcher button")];
const dialog = document.querySelector("#detailDialog");
const detailPanel = document.querySelector("#detailPanel");
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

let activeTheme = "all";
let roomOpen = false;
let activeView = "collection";

const schools = [...new Set(artworks.map((item) => item.school))].sort();
const artists = [...new Set(artworks.map((item) => item.artist))].sort();
const types = [...new Set(artworks.map((item) => item.type))].sort();
const themes = [...new Set(artworks.flatMap((item) => item.themes))].sort();
const featuredThemes = ["family", "hearts", "animals", "writing", "schoolwork", "painting", "collage", "keepsake"];
const curatedPaths = [
  { label: "Penelope", theme: "all", artist: "Penelope Trujillo", note: "A long arc from early marks to schoolwork, characters, notes, and keepsakes." },
  { label: "Emmy", theme: "all", artist: "Emmy Trujillo", note: "Preschool work, classroom identity pieces, certificates, and family fragments." },
  { label: "Family Evidence", theme: "family", artist: "all", note: "Cards, letters, travel traces, photo boards, and objects with context attached." },
  { label: "Needs Review", theme: "all", artist: "Needs Review", note: "The honest workbench: good records whose artist or grouping still needs memory." }
];

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
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function primaryImageMeta(item) {
  const file = item.images[0];
  return { file, shape: "standard" };
}

function wireImageShape(img) {
  const apply = () => {
    if (!img.naturalWidth || !img.naturalHeight) return;
    const ratio = img.naturalWidth / img.naturalHeight;
    const card = img.closest(".art-card, .room-art");
    if (!card) return;
    card.classList.toggle("is-wide-image", ratio > 1.42);
    card.classList.toggle("is-tall-image", ratio < 0.72);
  };

  if (img.complete) apply();
  else img.addEventListener("load", apply, { once: true });
}

function confidenceLabel(item) {
  if (item.artist === "Needs Review") return "Needs label review";
  if (item.artist === "Unknown") return "Received keepsake";
  if (item.images.length > 6) return "Packet";
  return "";
}

function itemScore(item) {
  let score = item.images.length > 1 ? 2 : 0;
  if (item.artist !== "Needs Review") score += 1;
  if (item.themes.some((theme) => ["family", "mom", "dad", "writing", "schoolwork", "keepsake"].includes(theme))) score += 1;
  return score;
}

function groupedBy(items, key) {
  return items.reduce((groups, item) => {
    const value = item[key] || "Unsorted";
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(item);
    return groups;
  }, new Map());
}

function themeList() {
  const counts = artworks
    .flatMap((item) => item.themes)
    .reduce((totals, theme) => totals.set(theme, (totals.get(theme) || 0) + 1), new Map());
  const curated = featuredThemes.filter((theme) => themes.includes(theme));
  const rest = themes
    .filter((theme) => !curated.includes(theme) && (counts.get(theme) || 0) >= 3)
    .sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0) || a.localeCompare(b))
    .slice(0, 22);
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
      <span>${escapeHtml(link.name)}</span>
      <small>${escapeHtml(link.note)}</small>
      <div class="school-actions">
        <a href="${escapeHtml(link.liveUrl)}" target="_blank" rel="noreferrer">Live site</a>
      </div>
    </article>
  `).join("");
}

function renderCuratorStrip() {
  curatorStrip.innerHTML = curatedPaths.map((path) => `
    <button class="curator-card" type="button" data-theme="${escapeHtml(path.theme)}" data-artist="${escapeHtml(path.artist)}">
      <span>${escapeHtml(path.label)}</span>
      <small>${escapeHtml(path.note)}</small>
    </button>
  `).join("");

  curatorStrip.querySelectorAll(".curator-card").forEach((button) => {
    button.addEventListener("click", () => {
      searchInput.value = "";
      schoolFilter.value = "all";
      typeFilter.value = "all";
      activeTheme = button.dataset.theme;
      themeFilter.value = activeTheme;
      artistFilter.value = button.dataset.artist;
      render();
    });
  });
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
    const matchesArtist = artistFilter.value === "all" || item.artist === artistFilter.value;
    const matchesType = typeFilter.value === "all" || item.type === typeFilter.value;
    const matchesTheme = activeTheme === "all" || item.themes.includes(activeTheme);
    return matchesSearch && matchesSchool && matchesArtist && matchesType && matchesTheme;
  });
}

function renderStats(items) {
  const imageCount = artworks.reduce((sum, item) => sum + item.images.length, 0);
  const groupedCount = artworks.filter((item) => item.images.length > 1).length;
  const needsReview = artworks.filter((item) => item.artist === "Needs Review").length;
  stats.innerHTML = `
    <div><strong>${artworks.length}</strong><span>records</span></div>
    <div><strong>${imageCount}</strong><span>photos</span></div>
    <div><strong>${groupedCount}</strong><span>packets / multi-view</span></div>
    <div><strong>${needsReview}</strong><span>need label review</span></div>
    <div><strong>${items.length}</strong><span>currently visible</span></div>
  `;
}

function renderGrid(items) {
  grid.innerHTML = "";
  if (!items.length) {
    grid.innerHTML = `<p class="empty">No works match the current filters.</p>`;
    return;
  }

  const grouped = items.reduce((periods, item) => {
    const key = item.period || "Collection";
    if (!periods.has(key)) periods.set(key, []);
    periods.get(key).push(item);
    return periods;
  }, new Map());

  const periodOrder = ["Early Childhood", "Elementary Years", "Family Archive"];
  const orderedGroups = [...grouped.entries()].sort((a, b) => {
    const ai = periodOrder.indexOf(a[0]);
    const bi = periodOrder.indexOf(b[0]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a[0].localeCompare(b[0]);
  });

  orderedGroups.forEach(([period, periodItems]) => {
    const section = document.createElement("section");
    section.className = "period-section";
    section.innerHTML = `
      <div class="period-head">
        <h3>${escapeHtml(period)}</h3>
        <span>${periodItems.length} ${periodItems.length === 1 ? "record" : "records"}</span>
      </div>
      <div class="period-grid"></div>
    `;
    const periodGrid = section.querySelector(".period-grid");

    periodItems.forEach((item) => {
    const meta = primaryImageMeta(item);
    const badge = confidenceLabel(item);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `art-card art-card-${meta.shape}`;
    card.innerHTML = `
      <span class="card-image"><img src="${imagePath(meta.file)}" alt="${escapeHtml(item.title)}" loading="lazy"></span>
      <span class="card-body">
        <span class="card-title">${escapeHtml(item.title)}</span>
        <span class="card-meta">${escapeHtml(item.artist)} &middot; ${escapeHtml(item.school)}</span>
        <span class="view-count">${item.images.length} ${item.images.length === 1 ? "view" : "views"}${badge ? ` &middot; ${escapeHtml(badge)}` : ""}</span>
      </span>
    `;
    card.addEventListener("click", () => openDetail(item.id));
    wireTilt(card);
    wireImageShape(card.querySelector("img"));
    periodGrid.append(card);
    });

    grid.append(section);
  });
}

function renderRoom(items) {
  const roomItems = [...items].sort((a, b) => itemScore(b) - itemScore(a)).slice(0, 48);
  if (!roomItems.length) {
    roomView.innerHTML = `<div class="room-stage empty-room"><p class="empty">No works match the current filters.</p></div>`;
    return;
  }

  roomView.innerHTML = `
    <div class="room-controls" aria-label="Gallery wall scrolling">
      <button class="room-scroll" type="button" data-dir="-1" aria-label="Scroll gallery wall left">&lsaquo;</button>
      <span>Wide wall for headset browsers: larger targets, fewer controls, horizontal movement.</span>
      <button class="room-scroll" type="button" data-dir="1" aria-label="Scroll gallery wall right">&rsaquo;</button>
    </div>
    <div class="room-stage" tabindex="0">
      <div class="room-fragments" aria-hidden="true">
        <img class="artifact-sprite gallery-green" src="assets/generated/fragments/green-torn-paper.png" alt="" data-depth="8">
        <img class="artifact-sprite gallery-note" src="assets/generated/fragments/small-note.png" alt="" data-depth="-10">
        <img class="artifact-sprite gallery-corner" src="assets/generated/fragments/black-paper-corner.png" alt="" data-depth="12">
      </div>
      <div class="room-surface" aria-hidden="true"></div>
      <div class="gallery-track">
        ${roomItems.map((item, index) => {
          const hang = index % 6 === 0 ? "0px" : index % 6 === 1 ? "56px" : index % 6 === 2 ? "22px" : index % 6 === 3 ? "78px" : index % 6 === 4 ? "34px" : "96px";
          const width = item.images.length > 4 ? "310px" : index % 4 === 0 ? "270px" : "240px";
          const tilt = index % 2 === 0 ? "-0.7deg" : "0.7deg";
          return `
            <button class="room-art" style="--hang:${hang}; --frame-width:${width}; --tilt:${tilt};" type="button" data-id="${item.id}">
              <img src="${imagePath(item.images[0])}" alt="${escapeHtml(item.title)}" loading="lazy">
              <span>${escapeHtml(item.title)}</span>
            </button>
          `;
        }).join("")}
      </div>
    </div>
  `;

  syncRoomSurface();

  roomView.querySelectorAll(".room-art").forEach((button) => {
    button.addEventListener("click", () => openDetail(button.dataset.id));
    wireTilt(button);
    wireImageShape(button.querySelector("img"));
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

function renderStory(items) {
  const periods = groupedBy(items, "period");
  const order = ["Early Childhood", "Elementary Years", "Family Archive"];
  storyView.innerHTML = order
    .filter((period) => periods.has(period))
    .map((period) => {
      const periodItems = periods.get(period);
      const featured = [...periodItems].sort((a, b) => itemScore(b) - itemScore(a)).slice(0, 5);
      const artists = [...new Set(periodItems.map((item) => item.artist).filter((artist) => artist !== "Needs Review"))];
      return `
        <section class="story-chapter">
          <div class="chapter-copy">
            <span class="label">${escapeHtml(period)}</span>
            <h3>${escapeHtml(period === "Early Childhood" ? "First marks, classroom rituals, and family gifts" : period === "Elementary Years" ? "Reading, writing, reports, characters, and confidence" : "Home evidence, inherited artifacts, and the wider family shelf")}</h3>
            <p>${periodItems.length} records, ${periodItems.reduce((sum, item) => sum + item.images.length, 0)} photos, ${artists.length || 1} cataloged ${artists.length === 1 ? "artist" : "artists"}.</p>
          </div>
          <div class="chapter-strip">
            ${featured.map((item) => `
              <button type="button" class="chapter-piece" data-id="${escapeHtml(item.id)}">
                <img src="${imagePath(item.images[0])}" alt="${escapeHtml(item.title)}" loading="lazy">
                <span>${escapeHtml(item.title)}</span>
              </button>
            `).join("")}
          </div>
        </section>
      `;
    }).join("");

  storyView.querySelectorAll(".chapter-piece").forEach((button) => {
    button.addEventListener("click", () => openDetail(button.dataset.id));
    wireImageShape(button.querySelector("img"));
  });
}

function renderLab(items) {
  const reviewItems = items.filter((item) => item.artist === "Needs Review");
  const packets = items.filter((item) => item.images.length > 4).sort((a, b) => b.images.length - a.images.length);
  const titleReviewIds = new Set([
    "intake-batch-31",
    "intake-batch-74",
    "intake-batch-79",
    "intake-batch-117",
    "intake-batch-149"
  ]);
  const orientationFiles = new Set([
    "PXL_20260508_190249325.jpg",
    "1000001840.jpg",
    "1000001623.jpg",
    "PXL_20260509_144012616.jpg",
    "PXL_20260509_144029935.jpg",
    "PXL_20260509_144050060.jpg",
    "PXL_20260509_144141430.jpg",
    "PXL_20260509_144149450.jpg"
  ]);
  const backsideWords = ["back", "backing", "reverse"];
  const titleReviewItems = items.filter((item) => titleReviewIds.has(item.id) || /certificate|diploma|report/i.test(`${item.title} ${item.note}`));
  const orientationItems = items.filter((item) => item.images.some((file) => orientationFiles.has(file)));
  const contextItems = items.filter((item) => backsideWords.some((word) => `${item.title} ${item.note}`.toLowerCase().includes(word)));
  const possibleRepeats = [
    { kept: "Bird Branch Card", hidden: "duplicate intake scan", reason: "Exact duplicate photo removed while keeping the separate teacher note record." },
    { kept: "Planet Research: Earth", hidden: "Early Worksheet Page", reason: "Exact duplicate photo removed from the visible intake sequence." }
  ];

  const issueList = (list, emptyText) => `
    <div class="lab-list">
      ${list.map((item) => `
        <button type="button" data-id="${escapeHtml(item.id)}">
          <span>${escapeHtml(item.title)}</span>
          <small>${escapeHtml(item.school)} / ${escapeHtml(item.type)} / ${item.images.length} ${item.images.length === 1 ? "view" : "views"}</small>
        </button>
      `).join("") || `<p class="empty">${emptyText}</p>`}
    </div>
  `;

  labView.innerHTML = `
    <section class="lab-panel">
      <h3>Help Fix the Archive</h3>
      <p>This is the honest workbench: records that may need a human memory check, a better title, a front-first grouping, or a fresh photo rather than a forced browser rotation.</p>
      <div class="lab-metrics">
        <div><strong>${reviewItems.length}</strong><span>records needing artist review</span></div>
        <div><strong>${titleReviewItems.length}</strong><span>title / certificate checks</span></div>
        <div><strong>${orientationItems.length}</strong><span>orientation checks</span></div>
        <div><strong>${contextItems.length}</strong><span>front / back context checks</span></div>
        <div><strong>${possibleRepeats.length}</strong><span>exact duplicates suppressed</span></div>
      </div>
    </section>
    <section class="lab-panel">
      <h3>Title and Certificate Checks</h3>
      ${issueList(titleReviewItems.slice(0, 20), "No visible records are flagged for title review.")}
    </section>
    <section class="lab-panel">
      <h3>Orientation Checks</h3>
      ${issueList(orientationItems.slice(0, 20), "No visible records are flagged for orientation review.")}
    </section>
    <section class="lab-panel">
      <h3>Front and Back Context</h3>
      ${issueList(contextItems.slice(0, 20), "No visible records mention reverse or backing context.")}
    </section>
    <section class="lab-panel">
      <h3>Large Packets to Split</h3>
      ${issueList(packets.slice(0, 12), "No visible packets are large enough to split.")}
    </section>
    <section class="lab-panel">
      <h3>Duplicate Decisions</h3>
      <p>${possibleRepeats.length} exact duplicate scans are suppressed from the visible collection.</p>
      <div class="decision-list">
        ${possibleRepeats.map((repeat) => `
          <div>
            <strong>${escapeHtml(repeat.kept)}</strong>
            <span>Folded in: ${escapeHtml(repeat.hidden)}</span>
            <small>${escapeHtml(repeat.reason)}</small>
          </div>
        `).join("")}
      </div>
    </section>
  `;

  labView.querySelectorAll(".lab-list button").forEach((button) => {
    button.addEventListener("click", () => openDetail(button.dataset.id));
  });
}

function syncRoomSurface() {
  const stage = roomView.querySelector(".room-stage");
  const track = roomView.querySelector(".gallery-track");
  if (!stage || !track) return;

  const setWidth = () => {
    stage.style.setProperty("--gallery-width", `${Math.max(stage.clientWidth, track.scrollWidth)}px`);
  };

  setWidth();
  requestAnimationFrame(setWidth);
}

function wireAmbientArtifacts() {
  if (motionQuery.matches) return;

  window.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5).toFixed(4);
    const y = (event.clientY / window.innerHeight - 0.5).toFixed(4);
    document.documentElement.style.setProperty("--mx", x);
    document.documentElement.style.setProperty("--my", y);
  }, { passive: true });

  window.addEventListener("scroll", () => {
    document.documentElement.style.setProperty("--scroll-depth", String(Math.min(1, window.scrollY / 900).toFixed(4)));
  }, { passive: true });
}

function wireTilt(element) {
  if (motionQuery.matches) return;

  element.addEventListener("pointermove", (event) => {
    const rect = element.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    element.style.setProperty("--tilt-x", `${(-y * 8).toFixed(2)}deg`);
    element.style.setProperty("--tilt-y", `${(x * 10).toFixed(2)}deg`);
    element.style.setProperty("--pointer-x", `${((x + 1) * 50).toFixed(2)}%`);
    element.style.setProperty("--pointer-y", `${((y + 1) * 50).toFixed(2)}%`);
  });

  element.addEventListener("pointerleave", () => {
    element.style.removeProperty("--tilt-x");
    element.style.removeProperty("--tilt-y");
    element.style.removeProperty("--pointer-x");
    element.style.removeProperty("--pointer-y");
  });
}

function openDetail(id) {
  const item = artworks.find((artwork) => artwork.id === id);
  if (!item) return;

  detailPanel.innerHTML = `
    <div class="detail-media">
      <div class="detail-main-image">
        <img id="mainDetailImage" src="${imagePath(item.images[0])}" alt="${escapeHtml(item.title)}">
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
        <span class="label">${escapeHtml(item.period)}${confidenceLabel(item) ? ` / ${escapeHtml(confidenceLabel(item))}` : ""}</span>
        <button class="icon-button" id="closeDetail" type="button" aria-label="Close">&times;</button>
      </div>
      <h2>${escapeHtml(item.title)}</h2>
      <dl class="metadata">
        <div><dt>Artist</dt><dd>${escapeHtml(item.artist || "Needs Review")}</dd></div>
        <div><dt>School</dt><dd>${escapeHtml(item.school)}</dd></div>
        <div><dt>Stage</dt><dd>${escapeHtml(item.grade)}</dd></div>
        <div><dt>Medium</dt><dd>${escapeHtml(item.type)}</dd></div>
      </dl>
      <p class="record-note">${escapeHtml(item.note)}</p>
      <div class="tag-row">${item.themes.map((tag) => `<span>${escapeHtml(formatTheme(tag))}</span>`).join("")}</div>

      <section class="comments">
        <h3>Archive Notes</h3>
        <p class="review-help">Use the title, artist, school, and tags above as the working catalog record for this piece.</p>
      </section>
    </div>
  `;

  detailPanel.querySelector("#closeDetail").addEventListener("click", () => dialog.close());
  detailPanel.querySelectorAll(".thumb-row button").forEach((button) => {
    button.addEventListener("click", () => {
      const img = detailPanel.querySelector("#mainDetailImage");
      img.src = imagePath(button.dataset.file);
      detailPanel.querySelectorAll(".thumb-row button").forEach((thumb) => thumb.classList.remove("active"));
      button.classList.add("active");
    });
  });

  if (!dialog.open) {
    dialog.showModal();
  }
}

function syncRoomButtons() {
  roomView.classList.toggle("open", roomOpen);
  roomView.setAttribute("aria-hidden", String(!roomOpen));
  syncViewVisibility();
  toggleRoom.textContent = roomOpen ? "Return to Collection" : "Walk Mode";
  roomShortcut.textContent = roomOpen ? "Return to Collection" : "Walk Mode";
  toggleRoom.setAttribute("aria-expanded", String(roomOpen));
  roomShortcut.setAttribute("aria-expanded", String(roomOpen));
}

function syncViewVisibility() {
  grid.classList.toggle("is-hidden", roomOpen || activeView !== "collection");
  storyView.classList.toggle("open", !roomOpen && activeView === "story");
  labView.classList.toggle("open", !roomOpen && activeView === "lab");
  grid.setAttribute("aria-hidden", String(roomOpen || activeView !== "collection"));
  storyView.setAttribute("aria-hidden", String(roomOpen || activeView !== "story"));
  labView.setAttribute("aria-hidden", String(roomOpen || activeView !== "lab"));
  viewButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === activeView));
}

function render() {
  buildThemeOptions();
  const items = filteredItems();
  const titleParts = [];
  if (artistFilter.value !== "all") titleParts.push(artistFilter.value);
  if (schoolFilter.value !== "all") titleParts.push(schoolFilter.value);
  if (typeFilter.value !== "all") titleParts.push(typeFilter.value);
  if (activeTheme !== "all") titleParts.push(`${formatTheme(activeTheme)} works`);
  resultTitle.textContent = titleParts.length ? titleParts.join(" / ") : "All pieces";
  renderStats(items);
  renderGrid(items);
  renderRoom(items);
  renderStory(items);
  renderLab(items);
  syncRoomButtons();
}

function resetFilters() {
  searchInput.value = "";
  schoolFilter.value = "all";
  artistFilter.value = "all";
  typeFilter.value = "all";
  activeTheme = "all";
  themeFilter.value = "all";
  render();
}

function toggleRoomView() {
  roomOpen = !roomOpen;
  if (roomOpen) activeView = "collection";
  syncRoomButtons();
  syncRoomSurface();
  document.querySelector("#collection").scrollIntoView({ behavior: "smooth", block: "start" });
}

schools.forEach((school) => schoolFilter.append(option(school)));
artists.forEach((artist) => artistFilter.append(option(artist)));
types.forEach((type) => typeFilter.append(option(type)));

schoolMarkup();
renderCuratorStrip();

[searchInput, schoolFilter, artistFilter, typeFilter].forEach((control) => {
  control.addEventListener("input", render);
  control.addEventListener("change", render);
});

themeFilter.addEventListener("change", () => {
  activeTheme = themeFilter.value;
  render();
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeView = button.dataset.view;
    roomOpen = false;
    syncViewVisibility();
    syncRoomButtons();
  });
});

clearFilters.addEventListener("click", resetFilters);
window.addEventListener("resize", syncRoomSurface);
toggleRoom.addEventListener("click", toggleRoomView);
roomShortcut.addEventListener("click", toggleRoomView);
wireAmbientArtifacts();

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
