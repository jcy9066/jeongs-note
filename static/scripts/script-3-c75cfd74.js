
(function () {
  const PAGE_SIZE = 10;
  const STATE_TTL_MS = 24 * 60 * 60 * 1000;
  const SORT_STATE_KEY = "wan:tag-page:sort:v1";
  const TAG_STATE_PREFIX = "wan:tag-page:state:v1:";
  const VALID_SORTS = new Set(["az", "za", "newest", "oldest"]);
  const MOBILE_BREAKPOINT = 800;
  const DRAWER_DISTANCE = 60;
  const DRAWER_FLICK_VELOCITY = 0.55;
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


  function isMobile() {
    return window.matchMedia("(max-width:" + MOBILE_BREAKPOINT + "px)").matches;
  }

  function currentMobileTitle() {
    const slug = document.body?.dataset?.slug || "index";
    if (slug === "index") return "Wan";
    const title = document.querySelector(".center .article-title")?.textContent?.trim();
    if (title) return title;
    if (slug.startsWith("tags/")) {
      try {
        return decodeURIComponent(slug.slice(5)) || "Tags";
      } catch (_) {
        return slug.slice(5) || "Tags";
      }
    }
    const last = slug.split("/").filter(Boolean).pop() || "Wan";
    try {
      return decodeURIComponent(last);
    } catch (_) {
      return last;
    }
  }

  function ensureMobileHeader() {
    let header = document.querySelector(".wan-mobile-header");
    if (!header) {
      header = document.createElement("header");
      header.className = "wan-mobile-header";
      header.innerHTML =
        '<button type="button" class="wan-mobile-header-button wan-mobile-left-button" aria-label="Open list drawer" aria-expanded="false"><svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"></path></svg></button>' +
        '<button type="button" class="wan-mobile-header-title" aria-label="Scroll to top"></button>' +
        '<button type="button" class="wan-mobile-header-button wan-mobile-right-button" aria-label="Open page drawer" aria-expanded="false"><svg viewBox="0 0 24 24"><path d="M5 5h14v14H5zM14 5v14M8 9h3M8 12h3M8 15h3"></path></svg></button>';
      document.body.prepend(header);
    }
    const title = header.querySelector(".wan-mobile-header-title");
    if (title) title.textContent = currentMobileTitle();
  }

  function mobileDrawer(side) {
    return document.querySelector(
      side === "left"
        ? ".page > #quartz-body > .sidebar.left"
        : ".page > #quartz-body > .sidebar.right",
    );
  }

  function ensureDrawerOverlay() {
    let overlay = document.querySelector(".wan-drawer-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "wan-drawer-overlay";
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  function ensureDrawerHead(target, side) {
    if (!target) return;
    let head = target.querySelector(":scope > .wan-drawer-head");
    if (!head) {
      head = document.createElement("div");
      head.className = "wan-drawer-head";
      head.innerHTML =
        '<div class="wan-drawer-head-title">' + (side === "left" ? "List" : "Page") + '</div>' +
        '<button type="button" class="wan-drawer-close" aria-label="Close drawer">×</button>';
      target.prepend(head);
    }
  }

  function hasDrawerContent(target) {
    return !!target && Array.from(target.children).some((child) =>
      !child.classList.contains("wan-drawer-head") && !child.matches(".desktop-only")
    );
  }

  function syncDrawerState() {
    const left = mobileDrawer("left");
    const right = mobileDrawer("right");
    const leftButton = document.querySelector(".wan-mobile-left-button");
    const rightButton = document.querySelector(".wan-mobile-right-button");

    if (leftButton) {
      leftButton.hidden = !hasDrawerContent(left);
      leftButton.setAttribute("aria-expanded", left?.classList.contains("is-open") ? "true" : "false");
    }
    if (rightButton) {
      rightButton.hidden = !hasDrawerContent(right);
      rightButton.setAttribute("aria-expanded", right?.classList.contains("is-open") ? "true" : "false");
    }

    if (!isMobile()) {
      [left, right].forEach((target) => {
        if (!target) return;
        try { target.inert = false; } catch (_) {}
        target.removeAttribute("aria-hidden");
      });
      return;
    }

    [left, right].forEach((target) => {
      if (!target) return;
      const hidden = !target.classList.contains("is-open");
      try { target.inert = hidden; } catch (_) {}
      target.setAttribute("aria-hidden", hidden ? "true" : "false");
    });
  }

  function setDrawerOverlay(open) {
    const overlay = ensureDrawerOverlay();
    overlay.style.removeProperty("opacity");
    overlay.classList.toggle("is-visible", open);
    document.body.classList.toggle("wan-drawer-open", open);
  }

  function closeDrawers(immediate) {
    [mobileDrawer("left"), mobileDrawer("right")].forEach((target) => {
      if (!target) return;
      if (immediate) target.style.transition = "none";
      target.style.removeProperty("transform");
      target.classList.remove("is-open");
      if (immediate) {
        target.getBoundingClientRect();
        target.style.removeProperty("transition");
      }
    });
    setDrawerOverlay(false);
    syncDrawerState();
  }

  function openDrawer(side) {
    if (!isMobile()) return;
    const target = mobileDrawer(side);
    if (!target || !hasDrawerContent(target)) return;
    const other = mobileDrawer(side === "left" ? "right" : "left");
    if (other) {
      other.style.removeProperty("transform");
      other.classList.remove("is-open");
    }
    target.classList.add("is-open");
    target.scrollTop = 0;
    setDrawerOverlay(true);
    syncDrawerState();
  }

  function bindDrawerSwipe(target, side) {
    if (!target || target.dataset.wanSwipeBound === "true") return;
    target.dataset.wanSwipeBound = "true";

    let active = false;
    let horizontal = false;
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let distance = 0;

    target.addEventListener("touchstart", (event) => {
      if (!isMobile() || !target.classList.contains("is-open") || event.touches.length !== 1) return;
      const touch = event.touches[0];
      active = true;
      horizontal = false;
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = performance.now();
      distance = 0;
    }, { passive: true });

    target.addEventListener("touchmove", (event) => {
      if (!active || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);

      if (!horizontal) {
        if (ax < 7 && ay < 7) return;
        if (ay > ax) {
          active = false;
          return;
        }
        horizontal = true;
      }

      const directionDistance = side === "left" ? Math.max(0, -dx) : Math.max(0, dx);
      if (directionDistance <= 0) return;
      event.preventDefault();

      const width = Math.max(1, target.getBoundingClientRect().width);
      distance = Math.min(width, directionDistance);
      target.style.transition = "none";
      target.style.transform = side === "left"
        ? "translate3d(" + (-distance) + "px,0,0)"
        : "translate3d(" + distance + "px,0,0)";
      ensureDrawerOverlay().style.opacity = String(.32 * (1 - Math.min(1, distance / width)));
    }, { passive: false });

    const finish = (cancelled) => {
      const width = Math.max(1, target.getBoundingClientRect().width);
      const velocity = distance / Math.max(1, performance.now() - startTime);
      const shouldClose = !cancelled && horizontal && (
        distance >= DRAWER_DISTANCE ||
        distance >= width * .2 ||
        velocity >= DRAWER_FLICK_VELOCITY
      );

      target.style.removeProperty("transition");
      target.style.removeProperty("transform");
      if (shouldClose) {
        target.classList.remove("is-open");
        setDrawerOverlay(false);
        syncDrawerState();
      } else {
        ensureDrawerOverlay().style.removeProperty("opacity");
      }
      active = false;
      horizontal = false;
      distance = 0;
    };

    target.addEventListener("touchend", () => finish(false), { passive: true });
    target.addEventListener("touchcancel", () => finish(true), { passive: true });
  }

  function prepareDrawers() {
    const left = mobileDrawer("left");
    const right = mobileDrawer("right");
    ensureDrawerHead(left, "left");
    ensureDrawerHead(right, "right");
    bindDrawerSwipe(left, "left");
    bindDrawerSwipe(right, "right");
    syncDrawerState();
  }

  function enhanceMobileTagExplorer() {
    document.querySelectorAll(".tag-explorer-item").forEach((item) => {
      const tag = item.querySelector(":scope > .tag-explorer-tag");
      const notes = item.querySelector(":scope > .tag-explorer-notes");
      if (!tag || !notes) return;

      if (!item.querySelector(":scope > .wan-tag-toggle")) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "wan-tag-toggle";
        button.textContent = "›";
        button.setAttribute("aria-expanded", "false");
        item.insertBefore(button, tag);
      }

      if (!item.querySelector(":scope > .wan-tag-route")) {
        const route = document.createElement("a");
        route.className = "wan-tag-route internal";
        route.href = tag.href;
        route.textContent = "→";
        tag.insertAdjacentElement("afterend", route);
      }
    });
  }

  function ensureGraphButton() {
    const graph = mobileDrawer("right")?.querySelector(":scope > .graph");
    if (!graph || graph.querySelector(":scope > .wan-open-graph")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "wan-open-graph";
    button.textContent = "Open Graph";
    const heading = graph.querySelector(":scope > h3");
    if (heading) heading.insertAdjacentElement("afterend", button);
    else graph.prepend(button);
  }

  function ensureGraphModal() {
    let modal = document.querySelector(".wan-mobile-graph-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "wan-mobile-graph-modal";
      modal.innerHTML =
        '<div class="wan-mobile-graph-head"><div class="wan-mobile-graph-title">Graph</div><button type="button" class="wan-mobile-graph-close" aria-label="Close graph">×</button></div>' +
        '<div class="wan-mobile-graph-stage"></div>';
      document.body.appendChild(modal);
    }
    return modal;
  }

  function restoreMobileGraph() {
    const stage = document.querySelector(".wan-mobile-graph-stage");
    const outer = stage?.querySelector(":scope > .graph-outer");
    const placeholder = window.__wanMobileGraphPlaceholder;
    if (outer) {
      if (placeholder?.isConnected && placeholder.parentNode) placeholder.parentNode.insertBefore(outer, placeholder);
      else outer.remove();
    }
    if (placeholder?.isConnected) placeholder.remove();
    window.__wanMobileGraphPlaceholder = null;
  }

  function requestGraphRender() {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.dispatchEvent(new CustomEvent("render", { detail: { url: window.location.pathname } }));
    }));
  }

  function closeMobileGraph() {
    restoreMobileGraph();
    document.querySelector(".wan-mobile-graph-modal")?.classList.remove("is-open");
    document.body.classList.remove("wan-mobile-graph-open");
    requestGraphRender();
  }

  function openMobileGraph() {
    if (!isMobile()) return;
    const graph = mobileDrawer("right")?.querySelector(":scope > .graph");
    const outer = graph?.querySelector(":scope > .graph-outer");
    if (!graph || !outer) return;

    closeDrawers(true);
    const modal = ensureGraphModal();
    const stage = modal.querySelector(".wan-mobile-graph-stage");
    restoreMobileGraph();
    const placeholder = document.createComment("wan-mobile-graph-placeholder");
    graph.insertBefore(placeholder, outer);
    window.__wanMobileGraphPlaceholder = placeholder;
    stage.appendChild(outer);
    modal.classList.add("is-open");
    document.body.classList.add("wan-mobile-graph-open");
    requestGraphRender();
  }

  function formatMobileDate(time) {
    const visible = time?.textContent?.trim() || "";
    const match = visible.match(/(\d{4}).*?(\d{1,2}).*?(\d{1,2})/);
    if (match) return match[1] + "." + match[2].padStart(2, "0") + "." + match[3].padStart(2, "0");
    const raw = time?.getAttribute("datetime");
    const date = new Date(raw || "");
    if (Number.isNaN(date.getTime())) return visible;
    return date.getFullYear() + "." + String(date.getMonth() + 1).padStart(2, "0") + "." + String(date.getDate()).padStart(2, "0");
  }

  function enhanceMobileTagRows() {
    const slug = document.body?.dataset?.slug || "";
    if (!slug.startsWith("tags/") || slug === "tags/index") return;

    document.querySelectorAll(".center .page-listing .section-li > .section").forEach((section) => {
      section.querySelector(":scope > .wan-mobile-tag-meta")?.remove();
      const time = section.querySelector(":scope > .meta time");
      const tags = Array.from(section.querySelectorAll(":scope > .tags > li > a.tag-link"));
      if (!time && tags.length === 0) return;

      const line = document.createElement("div");
      line.className = "wan-mobile-tag-meta";
      let hasContent = false;

      if (time) {
        const date = document.createElement("time");
        date.textContent = formatMobileDate(time);
        line.appendChild(date);
        hasContent = true;
      }

      tags.forEach((tag) => {
        if (hasContent) {
          const separator = document.createElement("span");
          separator.className = "wan-mobile-tag-separator";
          separator.textContent = "·";
          line.appendChild(separator);
        }
        line.appendChild(tag.cloneNode(true));
        hasContent = true;
      });

      const desc = section.querySelector(":scope > .desc");
      if (desc) desc.insertAdjacentElement("afterend", line);
      else section.appendChild(line);
    });
  }

  function resetMobileForNavigation() {
    restoreMobileGraph();
    document.querySelector(".wan-mobile-graph-modal")?.classList.remove("is-open");
    document.body.classList.remove("wan-mobile-graph-open");
    closeDrawers(true);
  }

  function installMobileHandlers() {
    if (window.__wanMobileUiHandlersInstalled) return;
    window.__wanMobileUiHandlersInstalled = true;

    document.addEventListener("click", (event) => {
      if (!isMobile()) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      if (target.closest(".wan-mobile-left-button")) {
        event.preventDefault();
        openDrawer("left");
        return;
      }
      if (target.closest(".wan-mobile-right-button")) {
        event.preventDefault();
        openDrawer("right");
        return;
      }
      if (target.closest(".wan-mobile-header-title")) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (target.closest(".wan-drawer-overlay, .wan-drawer-close")) {
        event.preventDefault();
        closeDrawers(false);
        return;
      }

      const toggle = target.closest(".wan-tag-toggle");
      if (toggle) {
        event.preventDefault();
        const item = toggle.closest(".tag-explorer-item");
        const expanded = item?.classList.toggle("is-expanded");
        toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
        return;
      }

      if (target.closest(".wan-open-graph")) {
        event.preventDefault();
        openMobileGraph();
        return;
      }
      if (target.closest(".wan-mobile-graph-close")) {
        event.preventDefault();
        closeMobileGraph();
        return;
      }
      if (target.closest(".sidebar.left a, .sidebar.right .toc a, .sidebar.right .backlinks a")) {
        closeDrawers(false);
      }
    });

    window.addEventListener("resize", () => {
      if (!isMobile()) {
        closeDrawers(true);
        if (document.querySelector(".wan-mobile-graph-modal.is-open")) closeMobileGraph();
      }
      syncDrawerState();
    }, { passive: true });
  }

  function apply() {
    renameSidebarLabels();
    fixHomepageTopicLinks();
    configureHomepageGraph();
    installTagExplorerResizeHandler();
    sizeTagExplorer();
    installSpaModeControls();
    installTagStorageSync();
    installMobileHandlers();
    ensureMobileHeader();
    ensureDrawerOverlay();
    prepareDrawers();
    enhanceMobileTagExplorer();
    ensureGraphButton();
    ensureGraphModal();
    setupTagPage();
    enhanceMobileTagRows();
    syncDrawerState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply, { once: true });
  } else {
    apply();
  }

  document.addEventListener("nav", () => {
    window.__wanTagPageController = null;
    resetMobileForNavigation();
    apply();
  }, true);

  window.addEventListener("pageshow", () => {
    window.setTimeout(apply, 0);
  });
})();
