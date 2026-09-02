const MOBILE_BREAKPOINT = 800
const DRAWER_DISTANCE = 60
const DRAWER_FLICK_VELOCITY = 0.55
const TAG_PAGE_SIZE = 10
const STATE_TTL_MS = 24 * 60 * 60 * 1000
const SORT_STATE_KEY = "wan:tag-page:sort:v1"
const TAG_STATE_PREFIX = "wan:tag-page:state:v1:"

const titleCollator = new Intl.Collator(["ko-KR", "en-US"], {
  numeric: true,
  sensitivity: "variant",
  caseFirst: "upper",
})

const MOBILE_CSS = String.raw`
.wan-mobile-header,
.wan-drawer-overlay,
.wan-drawer-head,
.wan-tag-toggle,
.wan-tag-route,
.wan-open-graph,
.wan-mobile-graph-modal,
.wan-mobile-tag-meta {
  display: none;
}

.wan-tag-toolbar {
  display: flex;
  align-items: center;
  gap: .65rem;
  width: 100%;
  margin: 1.1rem 0 .9rem;
}

.wan-tag-search {
  flex: 1 1 auto;
  min-width: 0;
  height: 40px;
  box-sizing: border-box;
  padding: 0 .95rem;
  border: 1px solid var(--gray);
  border-radius: 999px;
  background: transparent;
  color: var(--dark);
  font: inherit;
}

.wan-tag-search:focus,
.wan-tag-sort:focus {
  outline: none;
  border-color: var(--darkgray);
}

.wan-tag-sort {
  flex: 0 0 auto;
  height: 40px;
  min-width: 106px;
  box-sizing: border-box;
  padding: 0 2rem 0 .85rem;
  border: 1px solid var(--gray);
  border-radius: 999px;
  background: var(--light);
  color: var(--dark);
  font: inherit;
  cursor: pointer;
}

.wan-tag-pagination {
  position: relative;
  display: block;
  width: 100%;
  height: 40px;
  min-height: 40px;
  margin-top: 1rem;
}

.wan-tag-pagination.is-hidden {
  visibility: hidden;
  pointer-events: none;
}

.wan-tag-nav-side {
  position: absolute;
  top: 0;
  width: 120px;
  height: 38px;
}

.wan-tag-nav-side.is-left {
  left: 0;
  text-align: left;
}

.wan-tag-nav-side.is-right {
  right: 0;
  text-align: right;
}

.wan-tag-page-numbers {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: .4rem;
  width: min(52%, 480px);
  height: 38px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.wan-tag-page-numbers::-webkit-scrollbar {
  display: none;
}

.wan-tag-prev,
.wan-tag-next,
.wan-tag-page-number {
  min-width: 36px;
  height: 36px;
  padding: 0 .8rem;
  border: 1px solid var(--gray);
  border-radius: 999px;
  background: transparent;
  color: var(--darkgray);
  font: inherit;
  cursor: pointer;
}

.wan-tag-page-number {
  flex: 0 0 36px;
  padding: 0 .55rem;
}

.wan-tag-page-number.is-active {
  border-color: var(--dark);
  color: var(--dark);
  font-weight: 700;
}

.wan-tag-prev:disabled,
.wan-tag-next:disabled {
  opacity: .4;
  cursor: default;
}

.wan-recent-marker {
  position: relative;
  display: inline-block;
  margin-left: .22rem;
  color: var(--secondary);
  font-size: .62em;
  font-weight: 700;
  line-height: 1;
  vertical-align: super;
  cursor: default;
  user-select: none;
}

@media (hover: hover) and (pointer: fine) {
  .wan-recent-marker {
    cursor: help;
  }

  .wan-recent-marker:hover::after,
  .wan-recent-marker:focus-visible::after {
    content: "New or updated within 24 hours";
    position: absolute;
    left: 50%;
    bottom: calc(100% + .55rem);
    z-index: 50;
    transform: translateX(-50%);
    width: max-content;
    max-width: 240px;
    padding: .4rem .55rem;
    border: 1px solid var(--lightgray);
    border-radius: .45rem;
    background: var(--light);
    color: var(--dark);
    box-shadow: 0 6px 20px rgba(0, 0, 0, .12);
    font-size: .72rem;
    font-weight: 500;
    line-height: 1.3;
    white-space: nowrap;
  }
}

@media (max-width: 800px) {
  .wan-mobile-header {
    position: sticky;
    top: 0;
    z-index: 10000;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) 40px;
    align-items: center;
    gap: .25rem;
    width: 100%;
    min-height: calc(52px + env(safe-area-inset-top));
    box-sizing: border-box;
    padding: env(safe-area-inset-top) .65rem 0;
    border-bottom: 1px solid var(--lightgray);
    background: color-mix(in srgb, var(--light) 94%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .wan-mobile-header-button,
  .wan-mobile-header-title,
  .wan-drawer-close,
  .wan-tag-toggle,
  .wan-tag-route,
  .wan-open-graph,
  .wan-mobile-graph-close {
    -webkit-tap-highlight-color: transparent;
  }

  .wan-mobile-header-button {
    display: inline-flex;
    width: 40px;
    height: 40px;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--dark);
    cursor: pointer;
  }

  .wan-mobile-header-button[hidden] {
    display: block !important;
    visibility: hidden;
    pointer-events: none;
  }

  .wan-mobile-header-button svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .wan-mobile-header-title {
    min-width: 0;
    height: 40px;
    padding: 0 .3rem;
    border: 0;
    background: transparent;
    color: var(--dark);
    font-family: "SUIT", "Noto Sans", sans-serif;
    font-size: .98rem;
    font-weight: 700;
    letter-spacing: -.025em;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
  }

  .page > #quartz-body > .sidebar.left,
  .page > #quartz-body > .sidebar.right {
    position: fixed !important;
    top: 0 !important;
    bottom: 0 !important;
    z-index: 10002 !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 0 !important;
    width: min(84vw, 340px) !important;
    max-width: min(84vw, 340px) !important;
    height: 100vh !important;
    height: 100dvh !important;
    min-height: 0 !important;
    box-sizing: border-box !important;
    margin: 0 !important;
    padding: 0 0 env(safe-area-inset-bottom) !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    overscroll-behavior: contain;
    scrollbar-width: none;
    -ms-overflow-style: none;
    touch-action: pan-y;
    background: var(--light);
    box-shadow: 0 0 30px rgba(0, 0, 0, .14);
    will-change: transform;
    transition: transform 220ms cubic-bezier(.2, .75, .25, 1);
  }

  .page > #quartz-body > .sidebar.left::-webkit-scrollbar,
  .page > #quartz-body > .sidebar.right::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }

  .page > #quartz-body > .sidebar.left {
    left: 0 !important;
    right: auto !important;
    transform: translate3d(-100%, 0, 0);
  }

  .page > #quartz-body > .sidebar.right {
    left: auto !important;
    right: 0 !important;
    transform: translate3d(100%, 0, 0);
  }

  .page > #quartz-body > .sidebar.left.is-open,
  .page > #quartz-body > .sidebar.right.is-open {
    transform: translate3d(0, 0, 0);
  }

  .page > #quartz-body > .sidebar.left > *,
  .page > #quartz-body > .sidebar.right > * {
    flex: 0 0 auto !important;
    width: 100%;
    max-height: none !important;
    box-sizing: border-box;
  }

  .wan-drawer-head {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    order: -100;
    flex: 0 0 auto !important;
    width: 100%;
    min-height: calc(52px + env(safe-area-inset-top));
    box-sizing: border-box;
    align-items: flex-end;
    justify-content: space-between;
    padding: env(safe-area-inset-top) 1rem 9px;
    border-bottom: 1px solid var(--lightgray);
    background: color-mix(in srgb, var(--light) 96%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .wan-drawer-head-title {
    min-width: 0;
    padding-bottom: 2px;
    color: var(--dark);
    font-family: "SUIT", "Noto Sans", sans-serif;
    font-size: 1rem;
    font-weight: 700;
  }

  .wan-drawer-close {
    display: inline-flex;
    width: 34px;
    height: 34px;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--dark);
    font-size: 1.45rem;
    line-height: 1;
    cursor: pointer;
  }

  .wan-drawer-overlay {
    position: fixed;
    inset: 0;
    z-index: 10001;
    display: block;
    background: #000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 180ms ease;
  }

  .wan-drawer-overlay.is-visible {
    opacity: .32;
    pointer-events: auto;
  }

  body.wan-drawer-open,
  body.wan-mobile-graph-open {
    overflow: hidden;
  }

  .left.sidebar .page-title {
    margin: 1rem 1rem .65rem !important;
  }

  .left.sidebar .flex-component {
    box-sizing: border-box;
    padding-inline: 1rem;
  }

  .left.sidebar .tag-explorer {
    height: auto !important;
    max-height: none !important;
    min-height: 0 !important;
    margin: .65rem 0 0 !important;
    padding: 0 1rem 1.5rem !important;
    overflow: visible !important;
  }

  .left.sidebar .tag-explorer-title {
    display: none !important;
  }

  .left.sidebar .tag-explorer-list {
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }

  .left.sidebar .tag-explorer-item {
    display: grid !important;
    grid-template-columns: 30px minmax(0, 1fr) 34px;
    align-items: center;
    margin: 0 !important;
  }

  .wan-tag-toggle,
  .wan-tag-route {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent !important;
    color: var(--dark);
  }

  .wan-tag-toggle {
    width: 30px;
    height: 34px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    font-size: 1.25rem;
    line-height: 1;
    cursor: pointer;
    transform: rotate(0deg);
    transition: transform 160ms ease;
  }

  .tag-explorer-item.is-expanded > .wan-tag-toggle {
    transform: rotate(90deg);
  }

  .wan-tag-route {
    width: 34px;
    height: 34px;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 999px !important;
    font-size: .95rem;
    text-decoration: none;
  }

  .left.sidebar .tag-explorer-tag {
    min-width: 0;
    width: auto !important;
    padding: .3rem .15rem !important;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .left.sidebar .tag-explorer-notes,
  .left.sidebar .tag-explorer-item:hover > .tag-explorer-notes,
  .left.sidebar .tag-explorer-item:focus-within > .tag-explorer-notes {
    display: none !important;
    grid-column: 1 / -1;
    max-height: none !important;
    overflow: visible !important;
    opacity: 1 !important;
    margin: 0 0 .1rem !important;
    padding-left: 1.7rem !important;
    transition: none !important;
  }

  .left.sidebar .tag-explorer-item.is-expanded > .tag-explorer-notes {
    display: block !important;
    margin: .02rem 0 .45rem !important;
  }

  .page > #quartz-body > .sidebar.right > .toc {
    display: block !important;
    order: 1;
  }

  .page > #quartz-body > .sidebar.right > .graph {
    order: 2;
  }

  .page > #quartz-body > .sidebar.right > .backlinks {
    order: 3;
  }

  .page > #quartz-body > .sidebar.right > .graph,
  .page > #quartz-body > .sidebar.right > .toc,
  .page > #quartz-body > .sidebar.right > .backlinks {
    max-height: none !important;
    overflow: visible !important;
    padding: 1rem 1rem .45rem !important;
  }

  .page > #quartz-body > .sidebar.right > .graph > .graph-outer,
  .page > #quartz-body > .sidebar.right > .graph > .global-graph-outer {
    display: none !important;
  }

  .wan-open-graph {
    display: inline-flex;
    min-height: 38px;
    align-items: center;
    justify-content: center;
    margin-top: .65rem;
    padding: .42rem .9rem;
    border: 1px solid var(--gray);
    border-radius: 999px;
    background: transparent;
    color: var(--dark);
    font: inherit;
    font-size: .86rem;
    font-weight: 600;
    cursor: pointer;
  }

  .wan-mobile-graph-modal {
    position: fixed;
    inset: 0;
    z-index: 12000;
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    background: var(--light);
    overflow: hidden;
  }

  .wan-mobile-graph-modal.is-open {
    display: flex;
  }

  .wan-mobile-graph-head {
    display: flex;
    flex: 0 0 auto;
    min-height: calc(52px + env(safe-area-inset-top));
    box-sizing: border-box;
    align-items: flex-end;
    justify-content: space-between;
    padding: env(safe-area-inset-top) 1rem 9px;
    border-bottom: 1px solid var(--lightgray);
    background: var(--light);
  }

  .wan-mobile-graph-title {
    padding-bottom: 2px;
    color: var(--dark);
    font-family: "SUIT", "Noto Sans", sans-serif;
    font-size: 1rem;
    font-weight: 700;
  }

  .wan-mobile-graph-close {
    display: inline-flex;
    width: 34px;
    height: 34px;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--dark);
    font-size: 1.45rem;
    line-height: 1;
    cursor: pointer;
  }

  .wan-mobile-graph-stage {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .wan-mobile-graph-stage > .graph-outer {
    display: block !important;
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-sizing: border-box;
  }

  .wan-mobile-graph-stage > .graph-outer > .global-graph-icon {
    display: none !important;
  }

  body[data-slug^="tags/"] .page-listing .section-ul {
    height: auto !important;
    min-height: 0 !important;
  }

  body[data-slug^="tags/"] .page-listing .section-li > .section {
    display: block !important;
  }

  body[data-slug^="tags/"] .page-listing .section-li > .section > .meta,
  body[data-slug^="tags/"] .page-listing .section-li > .section > .tags {
    display: none !important;
  }

  body[data-slug^="tags/"] .page-listing .section-li > .section > .desc {
    display: block !important;
    width: 100%;
  }

  body[data-slug^="tags/"] .page-listing .section-li > .section > .desc h3 {
    margin: 0 !important;
    line-height: 1.38;
  }

  .wan-mobile-tag-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: .28rem;
    margin-top: .22rem;
    color: var(--darkgray);
    font-size: .8rem;
    line-height: 1.45;
    opacity: .72;
  }

  .wan-mobile-tag-meta time {
    color: inherit;
  }

  .wan-mobile-tag-meta .tag-link {
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    color: inherit !important;
    font-size: inherit !important;
    font-weight: 500;
    line-height: inherit;
  }

  .wan-mobile-tag-separator {
    color: var(--gray);
    user-select: none;
  }

  .wan-tag-toolbar {
    gap: .5rem;
  }

  .wan-tag-sort {
    min-width: 96px;
    padding-left: .72rem;
  }

  .wan-tag-nav-side {
    width: 92px;
  }

  .wan-tag-page-numbers {
    width: calc(100% - 192px);
  }

  .wan-tag-prev,
  .wan-tag-next {
    padding-inline: .5rem;
    font-size: .78rem;
  }

  .center {
    padding-inline: .25rem !important;
  }
}
`

function isMobile() {
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
}

function safeRead(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || typeof data.updatedAt !== "number" || Date.now() - data.updatedAt > STATE_TTL_MS) {
      localStorage.removeItem(key)
      return null
    }
    data.updatedAt = Date.now()
    localStorage.setItem(key, JSON.stringify(data))
    return data
  } catch {
    return null
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify({ ...value, updatedAt: Date.now() }))
  } catch {}
}

function ensureStyles() {
  if (document.getElementById("wan-mobile-ui-styles")) return
  const style = document.createElement("style")
  style.id = "wan-mobile-ui-styles"
  style.setAttribute("data-persist", "true")
  style.textContent = MOBILE_CSS
  document.head.appendChild(style)
}

function currentTitle() {
  const slug = document.body?.dataset?.slug || "index"
  if (slug === "index") return "Wan"

  const articleTitle = document.querySelector(".center .article-title")?.textContent?.trim()
  if (articleTitle) return articleTitle

  if (slug.startsWith("tags/")) {
    try {
      return decodeURIComponent(slug.slice(5)) || "Tags"
    } catch {
      return slug.slice(5) || "Tags"
    }
  }

  const last = slug.split("/").filter(Boolean).pop() || "Wan"
  try {
    return decodeURIComponent(last)
  } catch {
    return last
  }
}

function ensureHeader() {
  let header = document.querySelector(".wan-mobile-header")
  if (!header) {
    header = document.createElement("header")
    header.className = "wan-mobile-header"
    header.innerHTML = `
      <button type="button" class="wan-mobile-header-button wan-mobile-left-button" aria-label="Open list drawer" aria-expanded="false">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>
      </button>
      <button type="button" class="wan-mobile-header-title" aria-label="Scroll to top"></button>
      <button type="button" class="wan-mobile-header-button wan-mobile-right-button" aria-label="Open page drawer" aria-expanded="false">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v14H5zM14 5v14M8 9h3M8 12h3M8 15h3"></path></svg>
      </button>`
    document.body.prepend(header)
  }

  const title = header.querySelector(".wan-mobile-header-title")
  const value = currentTitle()
  if (title) {
    title.textContent = value
    title.title = value
  }
}

function drawer(side) {
  return document.querySelector(
    side === "left"
      ? ".page > #quartz-body > .sidebar.left"
      : ".page > #quartz-body > .sidebar.right",
  )
}

function ensureOverlay() {
  let overlay = document.querySelector(".wan-drawer-overlay")
  if (!overlay) {
    overlay = document.createElement("div")
    overlay.className = "wan-drawer-overlay"
    overlay.setAttribute("aria-hidden", "true")
    document.body.appendChild(overlay)
  }
  return overlay
}

function ensureDrawerHead(target, side) {
  if (!target) return
  let head = target.querySelector(":scope > .wan-drawer-head")
  if (!head) {
    head = document.createElement("div")
    head.className = "wan-drawer-head"
    head.innerHTML = `
      <div class="wan-drawer-head-title">${side === "left" ? "List" : "Page"}</div>
      <button type="button" class="wan-drawer-close" aria-label="Close drawer">×</button>`
    target.prepend(head)
  }
}

function hasDrawerContent(target) {
  if (!target) return false
  return Array.from(target.children).some((child) => {
    if (child.classList.contains("wan-drawer-head")) return false
    if (child.matches(".desktop-only")) return false
    return true
  })
}

function setDrawerInert(target, inert) {
  if (!target) return
  try {
    target.inert = inert
  } catch {}
  target.setAttribute("aria-hidden", inert ? "true" : "false")
}

function syncDrawerState() {
  const left = drawer("left")
  const right = drawer("right")
  const leftButton = document.querySelector(".wan-mobile-left-button")
  const rightButton = document.querySelector(".wan-mobile-right-button")

  if (leftButton) {
    leftButton.hidden = !hasDrawerContent(left)
    leftButton.setAttribute("aria-expanded", left?.classList.contains("is-open") ? "true" : "false")
  }
  if (rightButton) {
    rightButton.hidden = !hasDrawerContent(right)
    rightButton.setAttribute("aria-expanded", right?.classList.contains("is-open") ? "true" : "false")
  }

  if (!isMobile()) {
    for (const target of [left, right]) {
      if (!target) continue
      try {
        target.inert = false
      } catch {}
      target.removeAttribute("aria-hidden")
    }
    return
  }

  setDrawerInert(left, !left?.classList.contains("is-open"))
  setDrawerInert(right, !right?.classList.contains("is-open"))
}

function setOverlay(open) {
  const overlay = ensureOverlay()
  overlay.style.removeProperty("opacity")
  overlay.classList.toggle("is-visible", open)
  document.body.classList.toggle("wan-drawer-open", open)
}

function closeDrawers(immediate = false) {
  for (const target of [drawer("left"), drawer("right")]) {
    if (!target) continue
    if (immediate) target.style.transition = "none"
    target.style.removeProperty("transform")
    target.classList.remove("is-open")
    if (immediate) {
      target.getBoundingClientRect()
      target.style.removeProperty("transition")
    }
  }
  setOverlay(false)
  syncDrawerState()
}

function openDrawer(side) {
  if (!isMobile()) return
  const target = drawer(side)
  if (!target || !hasDrawerContent(target)) return

  const other = drawer(side === "left" ? "right" : "left")
  if (other) {
    other.style.removeProperty("transform")
    other.classList.remove("is-open")
  }

  target.style.removeProperty("transform")
  target.classList.add("is-open")
  target.scrollTop = 0
  setOverlay(true)
  syncDrawerState()
}

function bindSwipe(target, side) {
  if (!target || target.dataset.wanSwipeBound === "true") return
  target.dataset.wanSwipeBound = "true"

  let tracking = false
  let horizontal = false
  let startX = 0
  let startY = 0
  let startTime = 0
  let lastDistance = 0

  target.addEventListener("touchstart", (event) => {
    if (!isMobile() || !target.classList.contains("is-open") || event.touches.length !== 1) return
    const touch = event.touches[0]
    tracking = true
    horizontal = false
    startX = touch.clientX
    startY = touch.clientY
    startTime = performance.now()
    lastDistance = 0
  }, { passive: true })

  target.addEventListener("touchmove", (event) => {
    if (!tracking || event.touches.length !== 1) return
    const touch = event.touches[0]
    const dx = touch.clientX - startX
    const dy = touch.clientY - startY
    const ax = Math.abs(dx)
    const ay = Math.abs(dy)

    if (!horizontal) {
      if (ax < 7 && ay < 7) return
      if (ay > ax) {
        tracking = false
        return
      }
      horizontal = true
    }

    const directionDistance = side === "left" ? Math.max(0, -dx) : Math.max(0, dx)
    if (directionDistance <= 0) return

    event.preventDefault()
    const width = Math.max(1, target.getBoundingClientRect().width)
    const distance = Math.min(width, directionDistance)
    lastDistance = distance

    target.style.transition = "none"
    target.style.transform = side === "left"
      ? `translate3d(${-distance}px, 0, 0)`
      : `translate3d(${distance}px, 0, 0)`

    const progress = Math.min(1, distance / width)
    ensureOverlay().style.opacity = String(.32 * (1 - progress))
  }, { passive: false })

  const finish = (cancelled = false) => {
    const width = Math.max(1, target.getBoundingClientRect().width)
    const elapsed = Math.max(1, performance.now() - startTime)
    const velocity = lastDistance / elapsed
    const shouldClose = !cancelled && horizontal && (
      lastDistance >= DRAWER_DISTANCE ||
      lastDistance >= width * .2 ||
      velocity >= DRAWER_FLICK_VELOCITY
    )

    target.style.removeProperty("transition")
    if (shouldClose) {
      requestAnimationFrame(() => {
        target.style.removeProperty("transform")
        target.classList.remove("is-open")
        setOverlay(false)
        syncDrawerState()
      })
    } else {
      target.style.removeProperty("transform")
      ensureOverlay().style.removeProperty("opacity")
    }

    tracking = false
    horizontal = false
    lastDistance = 0
  }

  target.addEventListener("touchend", () => finish(false), { passive: true })
  target.addEventListener("touchcancel", () => finish(true), { passive: true })
}

function enhanceTagExplorer() {
  document.querySelectorAll(".tag-explorer-item").forEach((item) => {
    const tag = item.querySelector(":scope > .tag-explorer-tag")
    const notes = item.querySelector(":scope > .tag-explorer-notes")
    if (!tag || !notes) return

    if (!item.querySelector(":scope > .wan-tag-toggle")) {
      const toggle = document.createElement("button")
      toggle.type = "button"
      toggle.className = "wan-tag-toggle"
      toggle.textContent = "›"
      toggle.setAttribute("aria-expanded", "false")
      toggle.setAttribute("aria-label", `Toggle ${tag.textContent?.trim() || "tag"}`)
      item.insertBefore(toggle, tag)
    }

    if (!item.querySelector(":scope > .wan-tag-route")) {
      const route = document.createElement("a")
      route.className = "wan-tag-route internal"
      route.href = tag.href
      route.textContent = "→"
      route.setAttribute("aria-label", `Open ${tag.textContent?.trim() || "tag"}`)
      tag.insertAdjacentElement("afterend", route)
    }
  })
}

function ensureGraphButton() {
  const graph = drawer("right")?.querySelector(":scope > .graph")
  if (!graph || graph.querySelector(":scope > .wan-open-graph")) return

  const button = document.createElement("button")
  button.type = "button"
  button.className = "wan-open-graph"
  button.textContent = "Open Graph"
  const heading = graph.querySelector(":scope > h3")
  if (heading) heading.insertAdjacentElement("afterend", button)
  else graph.prepend(button)
}

function ensureGraphModal() {
  let modal = document.querySelector(".wan-mobile-graph-modal")
  if (!modal) {
    modal = document.createElement("div")
    modal.className = "wan-mobile-graph-modal"
    modal.setAttribute("aria-hidden", "true")
    modal.innerHTML = `
      <div class="wan-mobile-graph-head">
        <div class="wan-mobile-graph-title">Graph</div>
        <button type="button" class="wan-mobile-graph-close" aria-label="Close graph">×</button>
      </div>
      <div class="wan-mobile-graph-stage"></div>`
    document.body.appendChild(modal)
  }
  return modal
}

function restoreGraph() {
  const modal = document.querySelector(".wan-mobile-graph-modal")
  const graphOuter = modal?.querySelector(".wan-mobile-graph-stage > .graph-outer")
  const placeholder = window.__wanMobileGraphPlaceholder

  if (graphOuter) {
    if (placeholder?.isConnected && placeholder.parentNode) {
      placeholder.parentNode.insertBefore(graphOuter, placeholder)
    } else {
      graphOuter.remove()
    }
  }
  if (placeholder?.isConnected) placeholder.remove()
  window.__wanMobileGraphPlaceholder = null
}

function requestGraphRender() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.dispatchEvent(new CustomEvent("render", { detail: { url: window.location.pathname } }))
    })
  })
}

function closeGraph() {
  restoreGraph()
  const modal = document.querySelector(".wan-mobile-graph-modal")
  modal?.classList.remove("is-open")
  modal?.setAttribute("aria-hidden", "true")
  document.body.classList.remove("wan-mobile-graph-open")
  requestGraphRender()
}

function openGraph() {
  if (!isMobile()) return
  const graph = drawer("right")?.querySelector(":scope > .graph")
  const graphOuter = graph?.querySelector(":scope > .graph-outer")
  if (!graph || !graphOuter) return

  closeDrawers(true)
  const modal = ensureGraphModal()
  const stage = modal.querySelector(".wan-mobile-graph-stage")
  if (!stage) return

  restoreGraph()
  const placeholder = document.createComment("wan-mobile-graph-placeholder")
  graph.insertBefore(placeholder, graphOuter)
  window.__wanMobileGraphPlaceholder = placeholder
  stage.appendChild(graphOuter)

  modal.classList.add("is-open")
  modal.setAttribute("aria-hidden", "false")
  document.body.classList.add("wan-mobile-graph-open")
  requestGraphRender()
}

function formatDate(time) {
  const visible = time?.textContent?.trim() || ""
  const visibleParts = visible.match(/(\d{4}).*?(\d{1,2}).*?(\d{1,2})/)
  if (visibleParts) {
    return `${visibleParts[1]}.${visibleParts[2].padStart(2, "0")}.${visibleParts[3].padStart(2, "0")}`
  }

  const raw = time?.getAttribute("datetime")
  if (!raw) return visible
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return visible
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`
}

function enhanceMobileTagRows() {
  const slug = document.body?.dataset?.slug || ""
  if (!slug.startsWith("tags/") || slug === "tags/index") return

  document.querySelectorAll(".center .page-listing .section-li > .section").forEach((section) => {
    section.querySelector(":scope > .wan-mobile-tag-meta")?.remove()

    const time = section.querySelector(":scope > .meta time")
    const tags = Array.from(section.querySelectorAll(":scope > .tags > li > a.tag-link"))
    if (!time && tags.length === 0) return

    const line = document.createElement("div")
    line.className = "wan-mobile-tag-meta"
    let hasPart = false

    if (time) {
      const clonedTime = document.createElement("time")
      const datetime = time.getAttribute("datetime")
      if (datetime) clonedTime.setAttribute("datetime", datetime)
      clonedTime.textContent = formatDate(time)
      line.appendChild(clonedTime)
      hasPart = true
    }

    for (const tag of tags) {
      if (hasPart) {
        const separator = document.createElement("span")
        separator.className = "wan-mobile-tag-separator"
        separator.textContent = "·"
        line.appendChild(separator)
      }
      line.appendChild(tag.cloneNode(true))
      hasPart = true
    }

    const desc = section.querySelector(":scope > .desc")
    if (desc) desc.insertAdjacentElement("afterend", line)
    else section.appendChild(line)
  })
}

function itemTitle(item) {
  return item.querySelector(".desc h3 a")?.textContent?.trim() || item.querySelector("h3 a")?.textContent?.trim() || ""
}

function itemModifiedAt(item) {
  const raw = item.querySelector(".meta time")?.getAttribute("datetime") || ""
  const timestamp = Date.parse(raw)
  return Number.isFinite(timestamp) ? timestamp : 0
}

function addRecentMarker(item, modifiedAt) {
  const heading = item.querySelector(".desc h3") || item.querySelector("h3")
  if (!heading) return
  heading.querySelector(":scope > .wan-recent-marker")?.remove()

  const age = Date.now() - modifiedAt
  if (!modifiedAt || age < 0 || age > STATE_TTL_MS) return

  const marker = document.createElement("sup")
  marker.className = "wan-recent-marker"
  marker.textContent = "*"
  marker.tabIndex = 0
  marker.setAttribute("aria-label", "New or updated within 24 hours")
  heading.appendChild(marker)
}

function tagStateKey(slug) {
  return `${TAG_STATE_PREFIX}${slug}`
}

function loadSortState() {
  const saved = safeRead(SORT_STATE_KEY)
  const sort = ["az", "za", "newest", "oldest"].includes(saved?.sort) ? saved.sort : "az"
  safeWrite(SORT_STATE_KEY, { sort })
  return sort
}

function loadTagState(slug) {
  const saved = safeRead(tagStateKey(slug))
  const state = {
    query: typeof saved?.query === "string" ? saved.query : "",
    page: Number.isInteger(saved?.page) && saved.page > 0 ? saved.page : 1,
  }
  safeWrite(tagStateKey(slug), state)
  return state
}

function buildTagPageControls(listing, list, records, slug) {
  listing.querySelector(":scope > .tag-page-controls")?.remove()
  listing.querySelector(":scope > .wan-tag-toolbar")?.remove()
  listing.querySelector(":scope > .wan-tag-pagination")?.remove()
  list.style.removeProperty("height")
  list.style.removeProperty("min-height")

  let sort = loadSortState()
  const restored = loadTagState(slug)
  let query = restored.query
  let page = restored.page

  const toolbar = document.createElement("div")
  toolbar.className = "wan-tag-toolbar"

  const search = document.createElement("input")
  search.type = "search"
  search.className = "wan-tag-search"
  search.placeholder = "Search title"
  search.setAttribute("aria-label", "Search title")
  search.autocomplete = "off"
  search.value = query

  const sortSelect = document.createElement("select")
  sortSelect.className = "wan-tag-sort"
  sortSelect.setAttribute("aria-label", "Sort pages")
  for (const [value, label] of [["az", "A–Z"], ["za", "Z–A"], ["newest", "Newest"], ["oldest", "Oldest"]]) {
    const option = document.createElement("option")
    option.value = value
    option.textContent = label
    sortSelect.appendChild(option)
  }
  sortSelect.value = sort
  toolbar.append(search, sortSelect)

  const pagination = document.createElement("div")
  pagination.className = "wan-tag-pagination"

  const prevWrap = document.createElement("div")
  prevWrap.className = "wan-tag-nav-side is-left"
  const nextWrap = document.createElement("div")
  nextWrap.className = "wan-tag-nav-side is-right"
  const numbers = document.createElement("div")
  numbers.className = "wan-tag-page-numbers"

  const prev = document.createElement("button")
  prev.type = "button"
  prev.className = "wan-tag-prev"
  prev.textContent = "‹ Previous"

  const next = document.createElement("button")
  next.type = "button"
  next.className = "wan-tag-next"
  next.textContent = "Next ›"

  prevWrap.appendChild(prev)
  nextWrap.appendChild(next)
  pagination.append(prevWrap, numbers, nextWrap)

  listing.insertBefore(toolbar, list)
  list.insertAdjacentElement("afterend", pagination)

  const saveTag = () => safeWrite(tagStateKey(slug), { query, page })
  const saveSort = () => safeWrite(SORT_STATE_KEY, { sort })

  const sortedFiltered = () => {
    const needle = query.toLocaleLowerCase().replace(/\s+/g, " ").trim()
    const filtered = needle
      ? records.filter((record) => record.title.toLocaleLowerCase().replace(/\s+/g, " ").trim().includes(needle))
      : [...records]

    filtered.sort((a, b) => {
      if (sort === "newest" || sort === "oldest") {
        const delta = a.modifiedAt - b.modifiedAt
        if (delta !== 0) return sort === "newest" ? -delta : delta
      }
      const titleDelta = titleCollator.compare(a.title, b.title)
      return sort === "za" ? -titleDelta : titleDelta
    })
    return filtered
  }

  const render = () => {
    const filtered = sortedFiltered()
    const pageCount = Math.max(1, Math.ceil(filtered.length / TAG_PAGE_SIZE))
    page = Math.min(Math.max(1, page), pageCount)
    saveTag()
    saveSort()

    for (const record of records) record.item.hidden = true
    for (const record of filtered) list.appendChild(record.item)

    const start = (page - 1) * TAG_PAGE_SIZE
    for (const record of filtered.slice(start, start + TAG_PAGE_SIZE)) record.item.hidden = false

    pagination.classList.toggle("is-hidden", filtered.length <= TAG_PAGE_SIZE)
    prev.disabled = page <= 1
    next.disabled = page >= pageCount
    numbers.replaceChildren()

    for (let index = 1; index <= pageCount; index += 1) {
      const button = document.createElement("button")
      button.type = "button"
      button.className = `wan-tag-page-number${index === page ? " is-active" : ""}`
      button.textContent = String(index)
      if (index === page) button.setAttribute("aria-current", "page")
      button.addEventListener("click", () => {
        page = index
        render()
      })
      numbers.appendChild(button)
    }
  }

  search.addEventListener("input", () => {
    query = search.value
    page = 1
    render()
  })

  sortSelect.addEventListener("change", () => {
    sort = sortSelect.value
    page = 1
    render()
  })

  prev.addEventListener("click", () => {
    if (page <= 1) return
    page -= 1
    render()
  })

  next.addEventListener("click", () => {
    page += 1
    render()
  })

  render()
}

function enhanceTagPage() {
  const slug = document.body?.dataset?.slug || ""
  if (!slug.startsWith("tags/") || slug === "tags/index") return

  const listing = document.querySelector(".center .page-listing")
  const list = listing?.querySelector(":scope > .section-ul")
  if (!listing || !list) return

  const items = Array.from(list.querySelectorAll(":scope > .section-li"))
  if (items.length === 0) return

  const records = items.map((item) => {
    const record = {
      item,
      title: itemTitle(item),
      modifiedAt: itemModifiedAt(item),
    }
    addRecentMarker(item, record.modifiedAt)
    return record
  })

  buildTagPageControls(listing, list, records, slug)
}

function prepareDrawers() {
  const left = drawer("left")
  const right = drawer("right")
  ensureDrawerHead(left, "left")
  ensureDrawerHead(right, "right")
  bindSwipe(left, "left")
  bindSwipe(right, "right")
  syncDrawerState()
}

function resetForNavigation() {
  restoreGraph()
  const modal = document.querySelector(".wan-mobile-graph-modal")
  modal?.classList.remove("is-open")
  modal?.setAttribute("aria-hidden", "true")
  document.body.classList.remove("wan-mobile-graph-open")
  closeDrawers(true)
}

function applyUI() {
  ensureStyles()
  resetForNavigation()
  ensureHeader()
  ensureOverlay()
  prepareDrawers()
  enhanceTagExplorer()
  ensureGraphButton()
  ensureGraphModal()
  enhanceMobileTagRows()
  enhanceTagPage()
  syncDrawerState()
}

function installHandlers() {
  if (window.__wanMobileUiHandlersInstalled) return
  window.__wanMobileUiHandlersInstalled = true

  document.addEventListener("click", (event) => {
    if (!isMobile()) return
    const target = event.target instanceof Element ? event.target : null
    if (!target) return

    if (target.closest(".wan-mobile-left-button")) {
      event.preventDefault()
      openDrawer("left")
      return
    }
    if (target.closest(".wan-mobile-right-button")) {
      event.preventDefault()
      openDrawer("right")
      return
    }
    if (target.closest(".wan-mobile-header-title")) {
      event.preventDefault()
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    if (target.closest(".wan-drawer-overlay, .wan-drawer-close")) {
      event.preventDefault()
      closeDrawers(false)
      return
    }

    const toggle = target.closest(".wan-tag-toggle")
    if (toggle) {
      event.preventDefault()
      const item = toggle.closest(".tag-explorer-item")
      if (!item) return
      const expanded = item.classList.toggle("is-expanded")
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false")
      return
    }

    if (target.closest(".wan-open-graph")) {
      event.preventDefault()
      openGraph()
      return
    }
    if (target.closest(".wan-mobile-graph-close")) {
      event.preventDefault()
      closeGraph()
      return
    }

    if (target.closest(".sidebar.left a, .sidebar.right .toc a, .sidebar.right .backlinks a")) {
      closeDrawers(false)
    }
  })

  window.addEventListener("resize", () => {
    if (!isMobile()) {
      closeDrawers(true)
      if (document.querySelector(".wan-mobile-graph-modal.is-open")) closeGraph()
    }
    syncDrawerState()
  }, { passive: true })

  window.addEventListener("pageshow", () => {
    window.setTimeout(applyUI, 0)
  })
}

ensureStyles()
installHandlers()

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applyUI, { once: true })
} else {
  applyUI()
}

document.addEventListener("nav", applyUI, true)
