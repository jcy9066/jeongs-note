
(function () {
  const PAGE_SIZE = 10;
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

  function setupTagPage() {
    const slug = document.body?.dataset?.slug || "";
    if (!slug.startsWith("tags/") || slug === "tags/index") return;

    const listing = document.querySelector(".center .page-listing");
    if (!listing || listing.dataset.enhanced === "true") return;

    const list = listing.querySelector(".section-ul");
    if (!list) return;

    listing.dataset.enhanced = "true";
    const items = Array.from(list.querySelectorAll(":scope > .section-li"));
    if (items.length === 0) return;

    items.sort((a, b) => {
      const at = a.querySelector("time")?.getAttribute("datetime") || "";
      const bt = b.querySelector("time")?.getAttribute("datetime") || "";
      return bt.localeCompare(at);
    });
    items.forEach((item) => list.appendChild(item));

    const outerHeight = (element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const mt = Number.parseFloat(style.marginTop) || 0;
      const mb = Number.parseFloat(style.marginBottom) || 0;
      return rect.height + mt + mb;
    };

    const pageHeights = [];
    for (let start = 0; start < items.length; start += PAGE_SIZE) {
      const pageItems = items.slice(start, start + PAGE_SIZE);
      pageHeights.push(pageItems.reduce((sum, item) => sum + outerHeight(item), 0));
    }
    const reservedListHeight = Math.ceil(Math.max(...pageHeights, 0));
    if (reservedListHeight > 0) {
      list.style.height = reservedListHeight + "px";
      list.style.minHeight = reservedListHeight + "px";
    }

    const controls = document.createElement("div");
    controls.className = "tag-page-controls";

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

    const searchRow = document.createElement("div");
    searchRow.className = "tag-page-search-row";
    const search = document.createElement("input");
    search.type = "search";
    search.className = "tag-page-title-search";
    search.placeholder = "Search title";
    search.setAttribute("aria-label", "Search title");
    search.autocomplete = "off";
    searchRow.appendChild(search);

    controls.append(paginationRow, searchRow);
    listing.appendChild(controls);

    const paginationEnabled = items.length >= 11;
    paginationRow.classList.toggle("is-hidden", !paginationEnabled);

    let page = 1;

    function filteredItems() {
      const q = normalizeText(search.value);
      if (!q) return items;
      return items.filter((item) => {
        const title = normalizeText(
          item.querySelector(".desc h3 a")?.textContent ||
          item.querySelector("h3 a")?.textContent ||
          "",
        );
        return title.includes(q);
      });
    }

    function render() {
      const filtered = filteredItems();

      if (!paginationEnabled) {
        items.forEach((item) => {
          item.hidden = !filtered.includes(item);
        });
        return;
      }

      const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      page = Math.min(page, pageCount);
      const start = (page - 1) * PAGE_SIZE;
      const visible = new Set(filtered.slice(start, start + PAGE_SIZE));

      items.forEach((item) => {
        item.hidden = !visible.has(item);
      });

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
          render();
        });
        pageNumbers.appendChild(button);
      }
    }

    prev.addEventListener("click", () => {
      if (page > 1) {
        page -= 1;
        render();
      }
    });

    next.addEventListener("click", () => {
      const count = Math.max(1, Math.ceil(filteredItems().length / PAGE_SIZE));
      if (page < count) {
        page += 1;
        render();
      }
    });

    search.addEventListener("input", () => {
      page = 1;
      render();
    });

    render();
  }

  function apply() {
    renameSidebarLabels();
    configureHomepageGraph();
    setupTagPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply, { once: true });
  } else {
    apply();
  }

  document.addEventListener("nav", apply, true);
})();
