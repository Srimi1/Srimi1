const root = document.documentElement;
const themeToggle = document.querySelector(".theme-toggle");
const scheme = matchMedia("(prefers-color-scheme: dark)");
let savedTheme;
try {
  savedTheme = localStorage.getItem("srijan-theme");
} catch {}
if (savedTheme === "light" || savedTheme === "dark")
  root.dataset.theme = savedTheme;
function updateThemeLabel() {
  const dark = root.dataset.theme
    ? root.dataset.theme === "dark"
    : scheme.matches;
  themeToggle.setAttribute("aria-pressed", String(dark));
  themeToggle.setAttribute(
    "aria-label",
    `Switch to ${dark ? "light" : "dark"} theme`,
  );
  document.querySelector('meta[name="theme-color"]').content = dark
    ? "#141b1a"
    : "#f6f5f0";
}
themeToggle.hidden = false;
updateThemeLabel();
scheme.addEventListener("change", updateThemeLabel);
themeToggle.addEventListener("click", () => {
  root.dataset.theme =
    themeToggle.getAttribute("aria-pressed") === "true" ? "light" : "dark";
  try {
    localStorage.setItem("srijan-theme", root.dataset.theme);
  } catch {}
  updateThemeLabel();
});

const filters = document.querySelector(".project-filters");
const projects = [...document.querySelectorAll(".project-row")];
filters.hidden = false;
filters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (!button) return;
  const category = button.dataset.filter;
  for (const filter of filters.querySelectorAll("button"))
    filter.setAttribute("aria-pressed", String(filter === button));
  for (const project of projects)
    project.hidden =
      category !== "all" && project.dataset.category !== category;
  const count = projects.filter((project) => !project.hidden).length;
  document.querySelector("#filter-status").textContent =
    category === "all"
      ? "Showing all 4 projects."
      : `Showing ${count} ${category === "apps" ? "app projects" : "agent project"}.`;
});

const palette = document.querySelector(".command-palette");
const trigger = document.querySelector(".command-trigger");
const search = document.querySelector("#command-search");
const links = [...palette.querySelectorAll("[data-command]")];
let returnFocus;
function visibleLinks() {
  return links.filter((link) => !link.hidden);
}
function filterCommands() {
  const query = search.value.trim().toLowerCase();
  for (const link of links)
    link.hidden = !`${link.dataset.command} ${link.textContent}`
      .toLowerCase()
      .includes(query);
  palette.querySelector(".command-empty").hidden = visibleLinks().length > 0;
}
function openPalette() {
  if (palette.open) return;
  returnFocus = document.activeElement;
  search.value = "";
  filterCommands();
  palette.showModal();
  search.focus();
}
if (typeof palette.showModal === "function") {
  trigger.hidden = false;
  trigger.addEventListener("click", openPalette);
  document.addEventListener("keydown", (event) => {
    const editing =
      event.target instanceof HTMLElement &&
      (event.target.matches("input, textarea, select") ||
        event.target.isContentEditable);
    if (
      ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") ||
      (event.key === "/" &&
        !editing &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey)
    ) {
      event.preventDefault();
      if (palette.open) palette.close();
      else openPalette();
    }
  });
  palette
    .querySelector(".command-close")
    .addEventListener("click", () => palette.close());
  palette.addEventListener("click", (event) => {
    if (event.target !== palette) return;
    const bounds = palette.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      palette.close();
  });
  palette.addEventListener("close", () =>
    returnFocus?.focus({ preventScroll: true }),
  );
  palette.addEventListener("keydown", (event) => {
    const visible = visibleLinks();
    if (!visible.length) return;
    const index = visible.indexOf(document.activeElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next =
        event.key === "ArrowDown"
          ? (index + 1) % visible.length
          : index < 0
            ? visible.length - 1
            : (index - 1 + visible.length) % visible.length;
      visible[next].focus();
    } else if (event.key === "Enter" && document.activeElement === search) {
      event.preventDefault();
      visible[0].click();
    }
  });
  search.addEventListener("input", filterCommands);
  for (const link of links)
    link.addEventListener("click", () => {
      const href = link.getAttribute("href");
      if (href === "#sarah-note") {
        document.querySelector(href).open = true;
        returnFocus = document.querySelector("#sarah-note summary");
      }
      if (href === "#work") {
        filters.querySelector('[data-filter="all"]').click();
        returnFocus = document.querySelector("#work-title");
      }
      palette.close();
    });
}

function revealSarah() {
  if (location.hash === "#sarah-note" || location.hash === "#sarah")
    document.querySelector("#sarah-note").open = true;
}
addEventListener("hashchange", revealSarah);
revealSarah();
