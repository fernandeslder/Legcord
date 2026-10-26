import { addStyle } from "../../common/dom.js";

const { ipcRenderer } = require("electron");

const COLLAPSED_CLASS = "legcord-sidebar-collapsed";
const BUTTON_ID = "legcord-sidebar-toggle";
const RAIL_SELECTOR = 'nav[aria-label="Servers sidebar"]';
const LIST_SELECTOR = '[class*="sidebarList"]';
const RESIZE_HANDLE_SELECTOR = '[aria-label="Resize Sidebar"]';
const SIDEBAR_ATTR = "data-legcord-sidebar";
const LIST_ATTR = "data-legcord-sidebar-list";
const HANDLE_ATTR = "data-legcord-sidebar-handle";

const ICON_COLLAPSE = `<svg class="legcord-sidebar-toggle-icon-collapse" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 6.5 9 12l5.5 5.5"/></svg>`;
const ICON_EXPAND = `<svg class="legcord-sidebar-toggle-icon-expand" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 6.5 15 12l-5.5 5.5"/></svg>`;

let collapsed = ipcRenderer.sendSync("getConfig", "sidebarCollapsed") === true;
let scheduled = false;

function findRail(): HTMLElement | null {
    return document.querySelector<HTMLElement>(RAIL_SELECTOR);
}

/** Walks up from the server rail to the layout element that also holds the channel list. */
function findSidebar(rail: HTMLElement): HTMLElement | null {
    let node = rail.parentElement;
    while (node && node !== document.documentElement) {
        if (node.querySelector(LIST_SELECTOR)) return node;
        node = node.parentElement;
    }
    return null;
}

function label(): string {
    return collapsed ? "Expand channel sidebar" : "Collapse channel sidebar";
}

function syncButton(button: HTMLElement): void {
    const text = label();
    button.setAttribute("aria-label", text);
    button.setAttribute("title", text);
    button.setAttribute("aria-expanded", String(!collapsed));
    button.setAttribute("data-collapsed", String(collapsed));
}

function createButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.innerHTML = `<div class="legcord-sidebar-toggle-ball">${ICON_COLLAPSE}${ICON_EXPAND}</div>`;
    button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setCollapsed(!collapsed);
    });
    syncButton(button);
    return button;
}

function ensureButton(rail: HTMLElement): void {
    const existing = document.getElementById(BUTTON_ID);
    if (existing?.parentElement === rail) {
        syncButton(existing);
        return;
    }
    existing?.remove();
    const button = createButton();
    rail.append(button);
    syncButton(button);
}

function applyState(): void {
    document.documentElement.classList.toggle(COLLAPSED_CLASS, collapsed);

    const rail = findRail();
    const sidebar = rail ? findSidebar(rail) : null;
    if (!rail || !sidebar) return;

    sidebar.setAttribute(SIDEBAR_ATTR, "");
    sidebar.style.setProperty("--legcord-rail-width", `${Math.round(rail.getBoundingClientRect().width)}px`);
    sidebar.querySelector(LIST_SELECTOR)?.setAttribute(LIST_ATTR, "");
    sidebar.querySelector(RESIZE_HANDLE_SELECTOR)?.setAttribute(HANDLE_ATTR, "");

    ensureButton(rail);
}

function setCollapsed(value: boolean): void {
    collapsed = value;
    ipcRenderer.send("setConfig", "sidebarCollapsed", value);
    applyState();
}

function needsApply(): boolean {
    if (!document.getElementById(BUTTON_ID)) return true;
    if (document.documentElement.classList.contains(COLLAPSED_CLASS) !== collapsed) return true;
    if (!document.querySelector(`[${SIDEBAR_ATTR}]`)) return true;
    const list = document.querySelector(LIST_SELECTOR);
    return !!list && !list.hasAttribute(LIST_ATTR);
}

function scheduleApply(): void {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
        scheduled = false;
        if (needsApply()) applyState();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    addStyle("legcord://assets/css/sidebarCollapse.css");
    applyState();
    new MutationObserver(scheduleApply).observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", scheduleApply);
});
