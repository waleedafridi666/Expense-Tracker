const STORAGE_KEY = "expenses";

const CATS = {
  Food: { dot: "#f97316", bg: "#ffedd5", fg: "#9a3412" },
  Transport: { dot: "#60a5fa", bg: "#dbeafe", fg: "#1e40af" },
  Bills: { dot: "#a78bfa", bg: "#ede9fe", fg: "#5b21b6" },
  Shopping: { dot: "#f472b6", bg: "#fce7f3", fg: "#9d174d" },
  Other: { dot: "#9ca3af", bg: "#f3f4f6", fg: "#374151" },
};

const ICON_EDIT = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>`;
const ICON_DELETE = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/></svg>`;
const $ = (id) => document.getElementById(id);

let expenses = loadExpenses();
let editingId = null;

function loadExpenses() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}
function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}
function formatMoney(n) {
  return "$" + Number(n).toFixed(2);
}
function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function escapeHTML(text) {
  const replacements = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(text).replace(/[&<>"']/g, (ch) => replacements[ch]);
}
function sumAmounts(list) {
  return list.reduce((sum, e) => sum + Number(e.amount || 0), 0);
}
function getVisibleExpenses() {
  const filter = $("filter").value;
  return expenses.filter((e) => filter === "All" || e.category === filter).sort((a, b) => b.date.localeCompare(a.date));
}

function renderSummary(list) {
  $("total").textContent = formatMoney(sumAmounts(list));
  $("count").textContent = `${list.length} expense${list.length === 1 ? "" : "s"}`;
  $("cat-grid").innerHTML = Object.keys(CATS).map((name) => {
    const sum = sumAmounts(list.filter((e) => e.category === name));
    const c = CATS[name];
    return `<div class="min-w-0 rounded-lg bg-[#23252b] px-[10px] py-2">
      <div class="flex items-center gap-[5px] text-[0.62rem] text-gray-300 min-[601px]:text-[0.62rem]">
        <span class="h-[6px] w-[6px] shrink-0 rounded-full" style="background:${c.dot}"></span>${name}
      </div>
      <div class="mt-px text-[0.78rem] font-bold text-white">${formatMoney(sum)}</div>
    </div>`;
  }).join("");
}

function renderRow(e) {
  const c = CATS[e.category] || CATS.Other;
  const [day, month, year] = formatDate(e.date).split(" ");
  const title = escapeHTML(e.title);
  const category = escapeHTML(e.category);
  return `<tr class="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] [grid-template-areas:'title_title_amount_actions'_'cat_date_amount_actions'] items-center gap-x-[10px] gap-y-2 rounded-[14px] border border-gray-200 bg-white p-[18px] mb-3 min-[601px]:table-row min-[601px]:rounded-none min-[601px]:border-0 min-[601px]:border-b min-[601px]:border-gray-100 min-[601px]:p-0 min-[601px]:mb-0 min-[601px]:gap-0 hover:bg-gray-50">
    <td class=" min-w-0 break-words text-base font-semibold [grid-area:title] min-[601px]:table-cell min-[601px]:px-5 min-[601px]:py-4 min-[601px]:text-[0.76rem]">${title}</td>
    <td class="[grid-area:cat] min-[601px]:table-cell min-[601px]:px-0 min-[601px]:py-4"><span class="inline-block rounded-full px-[9px] py-0.5 text-[0.65rem] font-semibold" style="background:${c.bg};color:${c.fg}">${category}</span></td>
    <td class="[grid-area:date] whitespace-nowrap text-[0.8rem] text-gray-500 min-[601px]:table-cell min-[601px]:px-0 min-[601px]:py-4 min-[601px]:text-[0.76rem]">${day} ${month}<span class="hidden min-[601px]:inline"> ${year}</span></td>
    <td class="[grid-area:amount] whitespace-nowrap px-[14px] text-right text-base font-bold min-[601px]:table-cell min-[601px]:px-3 min-[601px]:py-4 min-[601px]:text-[0.76rem]">${formatMoney(e.amount)}</td>
    <td class="flex flex-col gap-1.5 text-right [grid-area:actions] min-[601px]:table-cell min-[601px]:whitespace-nowrap min-[601px]:px-5 min-[601px]:py-4">
      <button type="button" class="inline-flex cursor-pointer items-center justify-center bg-transparent p-1 text-gray-700 hover:opacity-60 min-[601px]:ml-[10px]" data-edit="${e.id}" aria-label="Edit ${title}" title="Edit">${ICON_EDIT}</button>
      <button type="button" class="inline-flex cursor-pointer items-center justify-center bg-transparent p-1 text-red-600 hover:opacity-60 min-[601px]:ml-[10px]" data-delete="${e.id}" aria-label="Delete ${title}" title="Delete">${ICON_DELETE}</button>
    </td>
  </tr>`;
}

function render() {
  const visible = getVisibleExpenses();
  renderSummary(visible);
  $("expense-list").innerHTML = visible.map(renderRow).join("");
  $("empty").hidden = visible.length > 0;
}

function showError(message, fieldId) {
  clearError();
  $("error-text").textContent = message;
  $("error").hidden = false;
  if (fieldId) $(fieldId).classList.add("invalid");
}
function clearError() {
  $("error").hidden = true;
  ["title", "amount", "date", "category"].forEach((id) => $(id).classList.remove("invalid"));
}
function resetForm() {
  editingId = null;
  $("expense-form").reset();
  $("date").value = todayISO();
  $("form-title").textContent = "Add Expense";
  $("submit-btn").textContent = "Add Expense";
  $("cancel-btn").hidden = true;
  clearError();
}
function startEdit(id) {
  const expense = expenses.find((e) => e.id === id);
  if (!expense) return;
  editingId = id;
  $("title").value = expense.title;
  $("amount").value = expense.amount;
  $("category").value = expense.category;
  $("date").value = expense.date;
  $("form-title").textContent = "Edit Expense";
  $("submit-btn").textContent = "Update Expense";
  $("cancel-btn").hidden = false;
  clearError();
  $("title").focus();
}
function validateForm() {
  if ($("title").value.trim() === "") return { message: "Title is required.", field: "title" };
  const raw = $("amount").value.trim();
  const amount = Number(raw);
  if (raw === "" || !Number.isFinite(amount) || amount <= 0) return { message: "Amount must be a number greater than 0.", field: "amount" };
  if (!$("date").value) return { message: "Date is required.", field: "date" };
  return null;
}
function readForm() {
  return { title: $("title").value.trim(), amount: Math.round(Number($("amount").value) * 100) / 100, category: $("category").value, date: $("date").value };
}
function addExpense(data) {
  expenses.push({ id: Date.now(), ...data });
}
function updateExpense(id, data) {
  const index = expenses.findIndex((e) => e.id === id);
  if (index !== -1) expenses[index] = { ...expenses[index], ...data };
}
function deleteExpense(id) {
  if (!confirm("Are you sure?")) return;
  expenses = expenses.filter((e) => e.id !== id);
  if (editingId === id) resetForm();
  saveExpenses();
  render();
}

$("expense-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const problem = validateForm();
  if (problem) {
    showError(problem.message, problem.field);
    return;
  }
  const data = readForm();
  if (editingId !== null) updateExpense(editingId, data);
  else addExpense(data);
  saveExpenses();
  resetForm();
  render();
});
["title", "amount", "date", "category"].forEach((id) => {
  $(id).addEventListener("input", clearError);
  $(id).addEventListener("change", clearError);
});
$("cancel-btn").addEventListener("click", resetForm);
$("filter").addEventListener("change", render);
$("expense-list").addEventListener("click", (event) => {
  const editBtn = event.target.closest("[data-edit]");
  const deleteBtn = event.target.closest("[data-delete]");
  if (editBtn) startEdit(Number(editBtn.dataset.edit));
  if (deleteBtn) deleteExpense(Number(deleteBtn.dataset.delete));
});
$("month-label").textContent = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
$("date").value = todayISO();
render();
