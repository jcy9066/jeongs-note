
(function () {
  const PAGE_SIZE = 10;
  const STATE_TTL_MS = 24 * 60 * 60 * 1000;
  const SORT_STATE_KEY = "wan:tag-page:sort:v1";
  const TAG_STATE_PREFIX = "wan:tag-page:state:v1:";
  const VALID_SORTS = new Set(["az", "za", "newest", "oldest"]);
  const titleCollator = new Intl.Collator(["ko-KR", "en-US"], {
    numeric: true,
    sensitivity: "variant",
    caseFirst: "upper",
  });
  let homepageGraphRefreshScheduled = false;

  function normalizeText(value) {
    return (value || "").toLocaleLowerCase().replace(/\s+/g, " ").trim();
  }

  function setText(selector, text) {
    document.querySelectorAll(selector).forEach((el) => {
      if (el) el.textContent = text;
    });
  }

  function renameSidebarLabels() {
    setText(".toc h3", "Contents");
    setText(".graph h3", "Graph");
    setText(".backlinks h3", "Backlink");
    document.querySelectorAll(".page-title a").forEach((el) => {
      el.textContent = "Wan";
    });
  }

  function fixHomepageTopicLinks() {
    const slug = document.body?.dataset?.slug || "";
    if (slug !== "index") return;

    const heading =
      document.querySelector("h2#topics") ||
      Array.from(document.querySelectorAll("h2")).find(
        (el) => (el.textContent || "").trim() === "Topics",
      );
    const topicBlock = heading?.nextElementSibling;
    if (!topicBlock) return;

    const basePath = document.body?.dataset?.basepath || "";
    topicBlock.querySelectorAll("a").forEach((anchor) => {
      const tag = (anchor.textContent || "").trim();
      if (!tag) return;
      const encodedTag = tag
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");
      anchor.setAttribute("href", basePath + "/tags/" + encodedTag);
    });
  }

  function configureHomepageGraph() {
    const slug = document.body?.dataset?.slug || "";
    if (slug !== "index") return;

    const containers = Array.from(document.querySelectorAll(".graph-container"));
    let changed = false;

    for (const container of containers) {
      if (container.dataset.wanGlobalized === "true") continue;
      try {
        const cfg = JSON.parse(container.dataset.cfg || "{}");
        cfg.depth = -1;
        cfg.scale = .9;
        cfg.centerForce = .2;
        cfg.showTags = true;
        cfg.focusOnHover = true;
        cfg.enableRadial = true;
        container.dataset.cfg = JSON.stringify(cfg);
        container.dataset.wanGlobalized = "true";
        changed = true;
      } catch (_) {}
    }

    if (changed && !homepageGraphRefreshScheduled) {
      homepageGraphRefreshScheduled = true;
      window.setTimeout(() => {
        homepageGraphRefreshScheduled = false;
        document.dispatchEvent(
          new CustomEvent("render", { detail: { url: window.location.pathname } }),
        );
      }, 80);
    }
  }

  function sizeTagExplorer() {
    document.querySelectorAll(".tag-explorer").forEach((explorer) => {
      const top = explorer.getBoundingClientRect().top;
      const available = Math.max(140, window.innerHeight - top - 12);
      explorer.style.height = available + "px";
      explorer.style.maxHeight = available + "px";
    });
  }

  function installTagExplorerResizeHandler() {
    if (window.__wanTagExplorerResizeInstalled) return;
    window.__wanTagExplorerResizeInstalled = true;
    window.addEventListener("resize", sizeTagExplorer, { passive: true });
  }

  function emitThemeChange(theme) {
    document.dispatchEvent(
      new CustomEvent("themechange", { detail: { theme } }),
    );
  }

  function emitReaderModeChange(mode) {
    document.dispatchEvent(
      new CustomEvent("readermodechange", { detail: { mode } }),
    );
  }

  function installSpaModeControls() {
    if (window.__wanSpaModeControlsInstalled) return;
    window.__wanSpaModeControlsInstalled = true;

    document.addEventListener("click", (event) => {
      const rawTarget = event.target;
      const target = rawTarget instanceof Element
        ? rawTarget.closest(".darkmode, .readermode")
        : null;
      if (!target) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      if (target.classList.contains("darkmode")) {
        const root = document.documentElement;
        const newTheme = root.getAttribute("saved-theme") === "dark" ? "light" : "dark";
        root.setAttribute("saved-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        document.body?.classList.remove("theme-dark", "theme-light");
        document.body?.classList.add("theme-" + newTheme);
        emitThemeChange(newTheme);
        return;
      }

      if (target.classList.contains("readermode")) {
        const root = document.documentElement;
        const newMode = root.getAttribute("reader-mode") === "on" ? "off" : "on";
        root.setAttribute("reader-mode", newMode);
        emitReaderModeChange(newMode);
      }
    }, true);
  }

  function tagStateKey(slug) {
    return TAG_STATE_PREFIX + slug;
  }

  function parseStoredValue(raw) {
    try {
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || typeof data.updatedAt !== "number") return null;
      const age = Date.now() - data.updatedAt;
      if (age < 0 || age > STATE_TTL_MS) return null;
      return data;
    } catch (_) {
      return null;
    }
  }

  function safeRead(key, refresh) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data = parseStoredValue(raw);
      if (!data) {
        localStorage.removeItem(key);
        return null;
      }
      if (refresh !== false) {
        data.updatedAt = Date.now();
        localStorage.setItem(key, JSON.stringify(data));
      }
      return data;
    } catch (_) {
      return null;
    }
  }

  function safeWrite(key, value) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(Object.assign({}, value, { updatedAt: Date.now() })),
      );
    } catch (_) {}
  }

  function loadSort(refresh) {
    const saved = safeRead(SORT_STATE_KEY, refresh);
    return VALID_SORTS.has(saved?.sort) ? saved.sort : "az";
  }

  function loadTagState(slug, refresh) {
    const saved = safeRead(tagStateKey(slug), refresh);
    return {
      query: typeof saved?.query === "string" ? saved.query : "",
      page: Number.isInteger(saved?.page) && saved.page > 0 ? saved.page : 1,
    };
  }

  function itemTitle(item) {
    return (
      item.querySelector(".desc h3 a")?.textContent?.trim() ||
      item.querySelector("h3 a")?.textContent?.trim() ||
      ""
    );
  }

  function itemModifiedAt(item) {
    const raw = item.querySelector(".meta time")?.getAttribute("datetime") || "";
    const timestamp = Date.parse(raw);
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function addRecentMarker(item, modifiedAt) {
    const heading = item.querySelector(".desc h3") || item.querySelector("h3");
    if (!heading) return;

    heading.querySelector(":scope > .wan-recent-marker")?.remove();
    const age = Date.now() - modifiedAt;
    if (!modifiedAt || age < 0 || age > STATE_TTL_MS) return;

    const marker = document.createElement("sup");
    marker.className = "wan-recent-marker";
    marker.textContent = "*";
    marker.tabIndex = 0;
    marker.setAttribute("aria-label", "New or updated within 24 hours");
    heading.appendChild(marker);
  }

  function installTagStorageSync() {
    if (window.__wanTagStorageSyncInstalled) return;
    window.__wanTagStorageSyncInstalled = true;

    window.addEventListener("storage", (event) => {
      const controller = window.__wanTagPageController;
      if (!controller) return;

      if (event.key === SORT_STATE_KEY) {
        const state = parseStoredValue(event.newValue);
        const sort = VALID_SORTS.has(state?.sort) ? state.sort : "az";
        controller.applyRemoteSort(sort);
        return;
      }

      if (event.key === tagStateKey(controller.slug)) {
        const state = parseStoredValue(event.newValue);
        controller.applyRemoteTagState({
          query: typeof state?.query === "string" ? state.query : "",
          page: Number.isInteger(state?.page) && state.page > 0 ? state.page : 1,
        });
      }
    });
  }

  function setupTagPage() {
    const slug = document.body?.dataset?.slug || "";
    if (!slug.startsWith("tags/") || slug === "tags/index") {
      window.__wanTagPageController = null;
      return;
    }

    const listing = document.querySelector(".center .page-listing");
    const list = listing?.querySelector(".section-ul");
    if (!listing || !list) {
      window.__wanTagPageController = null;
      return;
    }

    const existing = window.__wanTagPageController;
    if (
      listing.dataset.wanTagEnhanced === "true" &&
      existing &&
      existing.listing === listing &&
      existing.slug === slug
    ) {
      existing.refresh();
      return;
    }

    listing.querySelector(":scope > .tag-page-controls")?.remove();
    listing.querySelector(":scope > .tag-page-toolbar")?.remove();
    listing.querySelector(":scope > .tag-page-pagination-row")?.remove();
    list.style.removeProperty("height");
    list.style.removeProperty("min-height");

    const items = Array.from(list.querySelectorAll(":scope > .section-li"));
    if (items.length === 0) {
      window.__wanTagPageController = null;
      return;
    }

    listing.dataset.enhanced = "true";
    listing.dataset.wanTagEnhanced = "true";

    const records = items.map((item) => {
      const record = {
        item,
        title: itemTitle(item),
        modifiedAt: itemModifiedAt(item),
      };
      addRecentMarker(item, record.modifiedAt);
      return record;
    });

    let sort = loadSort(true);
    const restored = loadTagState(slug, true);
    let query = restored.query;
    let page = restored.page;

    const toolbar = document.createElement("div");
    toolbar.className = "tag-page-toolbar";

    const search = document.createElement("input");
    search.type = "search";
    search.className = "tag-page-title-search";
    search.placeholder = "Search title";
    search.setAttribute("aria-label", "Search title");
    search.autocomplete = "off";
    search.value = query;

    const sortSelect = document.createElement("select");
    sortSelect.className = "tag-page-sort";
    sortSelect.setAttribute("aria-label", "Sort pages");

    [
      ["az", "A–Z"],
      ["za", "Z–A"],
      ["newest", "Newest"],
      ["oldest", "Oldest"],
    ].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      sortSelect.appendChild(option);
    });
    sortSelect.value = sort;
    toolbar.append(search, sortSelect);

    const paginationRow = document.createElement("div");
    paginationRow.className = "tag-page-pagination-row";

    const prevWrap = document.createElement("div");
    prevWrap.className = "tag-page-nav-side is-left";
    const nextWrap = document.createElement("div");
    nextWrap.className = "tag-page-nav-side is-right";
    const pageNumbers = document.createElement("div");
    pageNumbers.className = "tag-page-number-group";

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "tag-page-prev";
    prev.textContent = "‹ Previous";

    const next = document.createElement("button");
    next.type = "button";
    next.className = "tag-page-next";
    next.textContent = "Next ›";

    prevWrap.appendChild(prev);
    nextWrap.appendChild(next);
    paginationRow.append(prevWrap, pageNumbers, nextWrap);

    const listHost = list.parentElement || list;
    listing.insertBefore(toolbar, listHost);
    listHost.insertAdjacentElement("afterend", paginationRow);

    function sortedFiltered() {
      const needle = normalizeText(query);
      const filtered = needle
        ? records.filter((record) => normalizeText(record.title).includes(needle))
        : records.slice();

      filtered.sort((a, b) => {
        if (sort === "newest" || sort === "oldest") {
          const delta = a.modifiedAt - b.modifiedAt;
          if (delta !== 0) return sort === "newest" ? -delta : delta;
        }

        const titleDelta = titleCollator.compare(a.title, b.title);
        return sort === "za" ? -titleDelta : titleDelta;
      });

      return filtered;
    }

    function persistState() {
      safeWrite(SORT_STATE_KEY, { sort });
      safeWrite(tagStateKey(slug), { query, page });
    }

    function render(persist) {
      const filtered = sortedFiltered();
      const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      page = Math.min(Math.max(1, page), pageCount);

      if (persist !== false) persistState();

      records.forEach((record) => {
        record.item.hidden = true;
      });

      filtered.forEach((record) => {
        list.appendChild(record.item);
      });

      const start = (page - 1) * PAGE_SIZE;
      filtered.slice(start, start + PAGE_SIZE).forEach((record) => {
        record.item.hidden = false;
      });

      paginationRow.classList.toggle("is-hidden", filtered.length <= PAGE_SIZE);
      prev.disabled = page <= 1;
      next.disabled = page >= pageCount;
      pageNumbers.replaceChildren();

      for (let i = 1; i <= pageCount; i++) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tag-page-number" + (i === page ? " is-active" : "");
        button.textContent = String(i);
        button.setAttribute("aria-current", i === page ? "page" : "false");
        button.addEventListener("click", () => {
          page = i;
          render(true);
        });
        pageNumbers.appendChild(button);
      }
    }

    const controller = {
      slug,
      listing,
      refresh() {
        sort = loadSort(true);
        const state = loadTagState(slug, true);
        query = state.query;
        page = state.page;
        search.value = query;
        sortSelect.value = sort;
        records.forEach((record) => addRecentMarker(record.item, record.modifiedAt));
        render(false);
      },
      applyRemoteSort(nextSort) {
        sort = VALID_SORTS.has(nextSort) ? nextSort : "az";
        sortSelect.value = sort;
        page = 1;
        render(false);
      },
      applyRemoteTagState(state) {
        query = typeof state?.query === "string" ? state.query : "";
        page = Number.isInteger(state?.page) && state.page > 0 ? state.page : 1;
        search.value = query;
        render(false);
      },
    };

    window.__wanTagPageController = controller;

    search.addEventListener("input", () => {
      query = search.value;
      page = 1;
      render(true);
    });

    sortSelect.addEventListener("change", () => {
      sort = VALID_SORTS.has(sortSelect.value) ? sortSelect.value : "az";
      page = 1;
      render(true);
    });

    prev.addEventListener("click", () => {
      if (page > 1) {
        page -= 1;
        render(true);
      }
    });

    next.addEventListener("click", () => {
      const pageCount = Math.max(1, Math.ceil(sortedFiltered().length / PAGE_SIZE));
      if (page < pageCount) {
        page += 1;
        render(true);
      }
    });

    render(true);
  }

  function apply() {
    renameSidebarLabels();
    fixHomepageTopicLinks();
    configureHomepageGraph();
    installTagExplorerResizeHandler();
    sizeTagExplorer();
    installSpaModeControls();
    installTagStorageSync();
    setupTagPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply, { once: true });
  } else {
    apply();
  }

  document.addEventListener("nav", () => {
    window.__wanTagPageController = null;
    apply();
  }, true);

  window.addEventListener("pageshow", () => {
    window.setTimeout(() => {
      const controller = window.__wanTagPageController;
      if (controller && typeof controller.refresh === "function") {
        controller.refresh();
      } else {
        apply();
      }
    }, 0);
  });
})();
