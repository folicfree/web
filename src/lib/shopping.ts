"use client";

// Shopping list — localStorage only (no accounts, Section 1 philosophy).
// A custom event lets every card's basket icon stay in sync instantly.

export const LIST_KEY = "ff_shopping_list";
export const LIST_EVENT = "ff-list-change";

export function getList(): string[] {
  try { return JSON.parse(localStorage.getItem(LIST_KEY) || "[]") as string[]; } catch { return []; }
}

export function setList(slugs: string[]) {
  localStorage.setItem(LIST_KEY, JSON.stringify(slugs));
  window.dispatchEvent(new Event(LIST_EVENT));
}

export function toggleListItem(slug: string): boolean {
  const list = getList();
  const i = list.indexOf(slug);
  if (i >= 0) list.splice(i, 1); else list.push(slug);
  setList(list);
  return i < 0; // true = now on the list
}