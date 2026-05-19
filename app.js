const STORAGE_KEY = "honey-ledger-profiles";
const OLD_STORAGE_KEY = "honey-ledger-state";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const today = new Date();
const todayIso = today.toISOString().slice(0, 10);
const SAVINGS_CATEGORY = "Savings";
const defaultCategories = ["Pay", "Bills", "Food", "Home", "Fun", "Other"];
let idCounter = 0;
let memoryState = null;

const categoryColors = {
  Pay: "#a8d8b9",
  Bills: "#f7d58b",
  Food: "#f5a9b8",
  Home: "#a9d4f2",
  Fun: "#cdb4db",
  Savings: "#b8e0d2",
  Other: "#c9c4d3",
};

const customCategoryPalette = ["#a8d8b9", "#f5a9b8", "#f7d58b", "#a9d4f2", "#cdb4db", "#b8e0d2", "#f0b7a4"];

const els = {
  currentMonth: document.querySelector("#currentMonth"),
  themeToggle: document.querySelector("#themeToggle"),
  calendarToggle: document.querySelector("#calendarToggle"),
  calendarPanel: document.querySelector("#calendarPanel"),
  calendarGrid: document.querySelector("#calendarGrid"),
  calendarMonthLabel: document.querySelector("#calendarMonthLabel"),
  calendarBillTotal: document.querySelector("#calendarBillTotal"),
  previousMonth: document.querySelector("#previousMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  closeCalendar: document.querySelector("#closeCalendar"),
  profileSelect: document.querySelector("#profileSelect"),
  profileList: document.querySelector("#profileList"),
  newProfileForm: document.querySelector("#newProfileForm"),
  newProfileName: document.querySelector("#newProfileName"),
  profileForm: document.querySelector("#profileForm"),
  profileName: document.querySelector("#profileName"),
  exportData: document.querySelector("#exportData"),
  importData: document.querySelector("#importData"),
  downloadBackupLink: document.querySelector("#downloadBackupLink"),
  backupText: document.querySelector("#backupText"),
  storageNotice: document.querySelector("#storageNotice"),
  categoryForm: document.querySelector("#categoryForm"),
  categoryName: document.querySelector("#categoryName"),
  categoryList: document.querySelector("#categoryList"),
  transactionCategory: document.querySelector("#transactionCategory"),
  incomeTotal: document.querySelector("#incomeTotal"),
  expenseTotal: document.querySelector("#expenseTotal"),
  billTotal: document.querySelector("#billTotal"),
  balanceTotal: document.querySelector("#balanceTotal"),
  savingsTotal: document.querySelector("#savingsTotal"),
  transactionList: document.querySelector("#transactionList"),
  billList: document.querySelector("#billList"),
  flowChartTitle: document.querySelector("#flowChartTitle"),
  trendChartButton: document.querySelector("#trendChartButton"),
  barChartButton: document.querySelector("#barChartButton"),
  flowChart: document.querySelector("#flowChart"),
  categoryChart: document.querySelector("#categoryChart"),
  categoryBreakdown: document.querySelector("#categoryBreakdown"),
  transactionForm: document.querySelector("#transactionPanel"),
  billForm: document.querySelector("#billPanel"),
  categoryManager: document.querySelector(".category-manager"),
  editTransactionPanel: document.querySelector("#editTransactionPanel"),
  editTransactionForm: document.querySelector("#editTransactionForm"),
  editTransactionType: document.querySelector("#editTransactionType"),
  editTransactionName: document.querySelector("#editTransactionName"),
  editTransactionCategory: document.querySelector("#editTransactionCategory"),
  editTransactionAmount: document.querySelector("#editTransactionAmount"),
  editTransactionDate: document.querySelector("#editTransactionDate"),
  cancelTransactionEdit: document.querySelector("#cancelTransactionEdit"),
  editBillPanel: document.querySelector("#editBillPanel"),
  editBillForm: document.querySelector("#editBillForm"),
  editBillName: document.querySelector("#editBillName"),
  editBillOrganization: document.querySelector("#editBillOrganization"),
  editBillAmount: document.querySelector("#editBillAmount"),
  editBillDueDate: document.querySelector("#editBillDueDate"),
  editBillRepeat: document.querySelector("#editBillRepeat"),
  cancelBillEdit: document.querySelector("#cancelBillEdit"),
  clearDemo: document.querySelector("#clearDemo"),
};

let appState = loadAppState();
let editingTransactionId = null;
let editingBillId = null;
let calendarDate = new Date(today.getFullYear(), today.getMonth(), 1);
let flowChartMode = "trend";

document.querySelector("#transactionDate").value = todayIso;
document.querySelector("#billDueDate").value = todayIso;
els.currentMonth.textContent = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });
applyTheme();

els.themeToggle.addEventListener("click", () => {
  appState.theme = appState.theme === "dark" ? "light" : "dark";
  applyTheme();
  writeStorage(STORAGE_KEY, JSON.stringify(appState));
  render();
});

els.calendarToggle.addEventListener("click", () => {
  els.calendarPanel.hidden = !els.calendarPanel.hidden;
  if (!els.calendarPanel.hidden) {
    renderCalendar(currentProfile());
  }
});

els.previousMonth.addEventListener("click", () => {
  calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
  renderCalendar(currentProfile());
});

els.nextMonth.addEventListener("click", () => {
  calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
  renderCalendar(currentProfile());
});

els.closeCalendar.addEventListener("click", () => {
  els.calendarPanel.hidden = true;
});

els.trendChartButton.addEventListener("click", (event) => {
  event.preventDefault();
  setFlowChartMode("trend");
});

els.barChartButton.addEventListener("click", (event) => {
  event.preventDefault();
  setFlowChartMode("bars");
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((button) => button.classList.remove("active"));
    document.querySelectorAll(".entry-form").forEach((form) => form.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector(`#${tab.dataset.panel}`).classList.add("active");
    syncEntryMode();
  });
});

els.profileSelect.addEventListener("change", () => {
  appState.activeProfileId = els.profileSelect.value;
  saveAndRender();
});

els.newProfileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const fallbackName = `Profile ${appState.profiles.length + 1}`;
  const name = els.newProfileName.value.trim() || fallbackName;

  const profile = createProfile({ name, withSamples: false });
  appState.profiles.push(profile);
  appState.activeProfileId = profile.id;
  els.newProfileForm.reset();
  saveAndRender();
});

els.profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const profile = currentProfile();
  profile.name = els.profileName.value.trim() || "My budget";
  saveAndRender();
});

els.exportData.addEventListener("click", () => {
  exportData();
});
els.importData.addEventListener("change", importData);

els.categoryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const profile = currentProfile();
  const name = cleanCategoryName(els.categoryName.value);
  if (!name) return;
  if (isSavingsCategory(name, profile)) {
    els.categoryForm.reset();
    return;
  }

  if (!profile.categories.some((category) => category.toLowerCase() === name.toLowerCase())) {
    profile.categories.push(name);
    profile.categoryColors[name] = colorForCategory(name);
  }

  els.categoryForm.reset();
  saveAndRender();
  els.transactionCategory.value = name;
});

els.categoryList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-category-delete]");
  if (!deleteButton) return;

  event.preventDefault();
  event.stopPropagation();
  deleteCategory(deleteButton.dataset.categoryDelete);
});

els.editTransactionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const profile = currentProfile();
  const transaction = profile.transactions.find((item) => item.id === editingTransactionId);
  if (!transaction) return;

  transaction.type = els.editTransactionType.value;
  transaction.name = els.editTransactionName.value.trim() || transaction.name;
  transaction.category = transaction.type === "savings" ? SAVINGS_CATEGORY : els.editTransactionCategory.value;
  transaction.amount = Number(els.editTransactionAmount.value) || transaction.amount;
  transaction.date = els.editTransactionDate.value || transaction.date;

  closeTransactionEditor();
  saveAndRender();
});

els.cancelTransactionEdit.addEventListener("click", closeTransactionEditor);

els.editTransactionType.addEventListener("change", () => {
  els.editTransactionCategory.disabled = els.editTransactionType.value === "savings";
  if (els.editTransactionType.value === "savings") {
    els.editTransactionCategory.value = "";
  }
});

els.editBillForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const profile = currentProfile();
  const bill = profile.bills.find((item) => item.id === editingBillId);
  if (!bill) return;

  bill.name = els.editBillName.value.trim() || bill.name;
  bill.organization = els.editBillOrganization.value.trim() || bill.organization;
  bill.amount = Number(els.editBillAmount.value) || bill.amount;
  bill.dueDate = els.editBillDueDate.value || bill.dueDate;
  bill.repeat = normalizeRepeat(els.editBillRepeat.value);

  closeBillEditor();
  saveAndRender();
});

els.cancelBillEdit.addEventListener("click", closeBillEditor);

els.transactionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const amount = Number(document.querySelector("#transactionAmount").value);
  if (!amount) return;

  currentProfile().transactions.unshift({
    id: makeId(),
    type: document.querySelector("#transactionType").value,
    name: document.querySelector("#transactionName").value.trim(),
    category:
      document.querySelector("#transactionType").value === "savings" ? SAVINGS_CATEGORY : els.transactionCategory.value,
    amount,
    date: document.querySelector("#transactionDate").value,
  });

  els.transactionForm.reset();
  document.querySelector("#transactionDate").value = todayIso;
  saveAndRender();
});

els.billForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const amount = Number(document.querySelector("#billAmount").value);
  if (!amount) return;

  currentProfile().bills.push({
    id: makeId(),
    name: document.querySelector("#billName").value.trim(),
    organization: document.querySelector("#billOrganization").value.trim(),
    amount,
    dueDate: document.querySelector("#billDueDate").value,
    repeat: document.querySelector("#billRepeat").value,
  });

  els.billForm.reset();
  document.querySelector("#billDueDate").value = todayIso;
  saveAndRender();
});

els.clearDemo.addEventListener("click", () => {
  const profile = currentProfile();
  const sample = createProfile({ name: profile.name, withSamples: true });
  profile.transactions = sample.transactions;
  profile.bills = sample.bills;
  saveAndRender();
});

document.addEventListener("click", (event) => {
  const categoryEditButton = event.target.closest("[data-category-edit]");
  if (categoryEditButton) {
    editCategory(categoryEditButton.dataset.categoryEdit);
    return;
  }

  const editButton = event.target.closest("[data-edit]");
  if (editButton) {
    editEntry(editButton.dataset.edit, editButton.dataset.id);
    return;
  }

  const categoryButton = event.target.closest("[data-category-delete]");
  if (categoryButton) {
    deleteCategory(categoryButton.dataset.categoryDelete);
    return;
  }

  const profileButton = event.target.closest("[data-profile-id]");
  if (profileButton) {
    appState.activeProfileId = profileButton.dataset.profileId;
    saveAndRender();
    return;
  }

  const deleteButton = event.target.closest("[data-delete]");
  if (!deleteButton) return;

  const profile = currentProfile();
  const { delete: kind, id } = deleteButton.dataset;
  profile[kind] = profile[kind].filter((item) => item.id !== id);
  saveAndRender();
});

document.addEventListener("change", (event) => {
  const colorInput = event.target.closest("[data-category-color]");
  if (!colorInput) return;

  const profile = currentProfile();
  profile.categoryColors[colorInput.dataset.categoryColor] = colorInput.value;
  saveAndRender();
});

function createProfile({ name = "My budget", withSamples = true } = {}) {
  const monthDate = (monthOffset, day) => {
    const date = new Date(today.getFullYear(), today.getMonth() + monthOffset, day);
    return date.toISOString().slice(0, 10);
  };

  return {
    id: makeId(),
    name,
    categories: [...defaultCategories],
    categoryColors: { ...categoryColors },
    savingsCategory: SAVINGS_CATEGORY,
    transactions: withSamples
      ? [
          { id: makeId(), type: "income", name: "March paycheck", category: "Pay", amount: 1740, date: monthDate(-2, 5) },
          { id: makeId(), type: "expense", name: "March groceries", category: "Food", amount: 310.2, date: monthDate(-2, 9) },
          { id: makeId(), type: "savings", name: "March savings", category: SAVINGS_CATEGORY, amount: 180, date: monthDate(-2, 12) },
          { id: makeId(), type: "expense", name: "March fun", category: "Fun", amount: 64.5, date: monthDate(-2, 20) },
          { id: makeId(), type: "income", name: "April paycheck", category: "Pay", amount: 1810, date: monthDate(-1, 5) },
          { id: makeId(), type: "expense", name: "April groceries", category: "Food", amount: 274.86, date: monthDate(-1, 10) },
          { id: makeId(), type: "savings", name: "April savings", category: SAVINGS_CATEGORY, amount: 220, date: monthDate(-1, 15) },
          { id: makeId(), type: "expense", name: "April home supplies", category: "Home", amount: 88.4, date: monthDate(-1, 21) },
          { id: makeId(), type: "income", name: "Paycheck", category: "Pay", amount: 1850, date: todayIso },
          { id: makeId(), type: "expense", name: "Groceries", category: "Food", amount: 92.44, date: todayIso },
          { id: makeId(), type: "savings", name: "Savings transfer", category: SAVINGS_CATEGORY, amount: 250, date: todayIso },
          { id: makeId(), type: "expense", name: "Movie night", category: "Fun", amount: 36.5, date: todayIso },
          { id: makeId(), type: "income", name: "June paycheck", category: "Pay", amount: 1900, date: monthDate(1, 5) },
          { id: makeId(), type: "expense", name: "June groceries", category: "Food", amount: 260.15, date: monthDate(1, 9) },
          { id: makeId(), type: "savings", name: "June savings", category: SAVINGS_CATEGORY, amount: 300, date: monthDate(1, 14) },
          { id: makeId(), type: "expense", name: "June weekend", category: "Fun", amount: 72.35, date: monthDate(1, 22) },
          { id: makeId(), type: "income", name: "July paycheck", category: "Pay", amount: 1950, date: monthDate(2, 5) },
          { id: makeId(), type: "expense", name: "July groceries", category: "Food", amount: 240.95, date: monthDate(2, 12) },
          { id: makeId(), type: "savings", name: "July savings", category: SAVINGS_CATEGORY, amount: 340, date: monthDate(2, 18) },
        ]
      : [],
    bills: withSamples
      ? [
          { id: makeId(), name: "Rent", organization: "Apartment", amount: 1225, dueDate: monthDate(-2, 1), repeat: "monthly" },
          { id: makeId(), name: "Phone", organization: "Carrier", amount: 68, dueDate: monthDate(-2, 18), repeat: "monthly" },
          { id: makeId(), name: "Electric", organization: "Utilities", amount: 104.76, dueDate: todayIso, repeat: "monthly" },
          { id: makeId(), name: "Car insurance", organization: "Insurance", amount: 126.5, dueDate: monthDate(1, 7), repeat: "monthly" },
          { id: makeId(), name: "Streaming", organization: "Entertainment", amount: 15.99, dueDate: monthDate(2, 12), repeat: "monthly" },
        ]
      : [],
  };
}

function loadAppState() {
  const saved = readStorage(STORAGE_KEY);
  if (saved) {
    try {
      return normalizeAppState(JSON.parse(saved));
    } catch {
      return makeDefaultAppState();
    }
  }

  const oldSaved = readStorage(OLD_STORAGE_KEY);
  if (oldSaved) {
    try {
      const oldState = JSON.parse(oldSaved);
      const profile = createProfile({ name: "My budget", withSamples: false });
      profile.transactions = Array.isArray(oldState.transactions) ? oldState.transactions : [];
      profile.bills = Array.isArray(oldState.bills) ? oldState.bills : [];
      ensureProfileCategories(profile);
      return { activeProfileId: profile.id, profiles: [profile] };
    } catch {
      return makeDefaultAppState();
    }
  }

  return makeDefaultAppState();
}

function normalizeAppState(value) {
  if (!value || !Array.isArray(value.profiles) || !value.profiles.length) {
    return makeDefaultAppState();
  }

  const profiles = value.profiles.map((profile) => ({
    id: profile.id || makeId(),
    name: profile.name || "My budget",
    categories: Array.isArray(profile.categories) ? profile.categories : [],
    categoryColors: profile.categoryColors && typeof profile.categoryColors === "object" ? profile.categoryColors : {},
    savingsCategory: profile.savingsCategory || SAVINGS_CATEGORY,
    transactions: Array.isArray(profile.transactions) ? profile.transactions : [],
    bills: Array.isArray(profile.bills) ? profile.bills : [],
  }));

  profiles.forEach(ensureProfileCategories);

  return {
    activeProfileId: profiles.some((profile) => profile.id === value.activeProfileId)
      ? value.activeProfileId
      : profiles[0].id,
    theme: value.theme === "dark" ? "dark" : "light",
    profiles,
  };
}

function makeDefaultAppState() {
  const profile = createProfile({ name: "My budget", withSamples: true });
  return { activeProfileId: profile.id, theme: "light", profiles: [profile] };
}

function currentProfile() {
  if (!appState.profiles.length) {
    const profile = createProfile({ name: "My budget", withSamples: true });
    appState.profiles.push(profile);
    appState.activeProfileId = profile.id;
  }

  return appState.profiles.find((profile) => profile.id === appState.activeProfileId) || appState.profiles[0];
}

function applyTheme() {
  const isDark = appState.theme === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  els.themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
}

async function exportData() {
  const backup = {
    app: "Penny Petal",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: appState,
  };
  const backupJson = JSON.stringify(backup, null, 2);
  const fileName = `penny-petal-backup-${todayIso}.json`;
  const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(backupJson)}`;

  els.downloadBackupLink.href = dataUrl;
  els.downloadBackupLink.download = fileName;
  els.downloadBackupLink.hidden = false;

  els.backupText.hidden = false;
  els.backupText.value = backupJson;
  els.backupText.focus();
  els.backupText.select();

  try {
    const blob = new Blob([backupJson], { type: "application/json;charset=utf-8" });

    if ("showSaveFilePicker" in window) {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "JSON backup",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    }

    if (window.navigator && typeof window.navigator.msSaveOrOpenBlob === "function") {
      window.navigator.msSaveOrOpenBlob(blob, fileName);
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.append(link);
    link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    alert("The browser blocked auto-download. Use the Download backup file link that appeared.");
  }
}

function importData(event) {
  const [file] = event.target.files;
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(reader.result);
      const importedState = parsed.data && parsed.app ? parsed.data : parsed;
      appState = normalizeAppState(importedState);
      closeTransactionEditor();
      closeBillEditor();
      saveAndRender();
      alert("Data imported successfully.");
    } catch {
      alert("That file could not be imported. Please choose a Penny Petal JSON backup.");
    } finally {
      els.importData.value = "";
    }
  });
  reader.readAsText(file);
}

function setFlowChartMode(mode) {
  flowChartMode = mode === "bars" ? "bars" : "trend";
  els.trendChartButton.classList.toggle("active", flowChartMode === "trend");
  els.barChartButton.classList.toggle("active", flowChartMode === "bars");
  drawFlowChart(getTotals(), currentProfile());
}

function saveAndRender() {
  writeStorage(STORAGE_KEY, JSON.stringify(appState));
  render();
}

function getTotals() {
  const profile = currentProfile();
  const monthlyTransactions = profile.transactions.filter((transaction) => isInCurrentMonth(transaction.date));
  const monthlyBills = profile.bills.filter((bill) => isInCurrentMonth(bill.dueDate));
  const income = monthlyTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const spendableIncome = monthlyTransactions
    .filter((transaction) => transaction.type === "income" && !isSavingsCategory(transaction.category, profile))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = monthlyTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const bills = monthlyBills.reduce((sum, bill) => sum + bill.amount, 0);
  const savings = monthlyTransactions
    .filter((transaction) => transaction.type === "savings" || isSavingsCategory(transaction.category, profile))
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    income,
    expenses,
    bills,
    savings,
    balance: spendableIncome - bills,
  };
}

function render() {
  const profile = currentProfile();
  const totals = getTotals();

  applyTheme();
  renderProfiles(profile);
  renderCategories(profile);
  els.incomeTotal.textContent = money.format(totals.income);
  els.expenseTotal.textContent = money.format(totals.expenses);
  els.billTotal.textContent = money.format(totals.bills);
  els.balanceTotal.textContent = money.format(totals.balance);
  els.savingsTotal.textContent = money.format(totals.savings);

  renderTransactions(profile);
  renderBills(profile);
  renderCalendar(profile);
  drawFlowChart(totals, profile);
  drawCategoryChart(profile);
  syncEntryMode();
}

function renderProfiles(profile) {
  els.profileSelect.innerHTML = appState.profiles
    .map(
      (item) => `
        <option value="${item.id}" ${item.id === profile.id ? "selected" : ""}>${escapeHtml(item.name)}</option>
      `,
    )
    .join("");

  els.profileList.innerHTML = appState.profiles
    .map(
      (item) => `
        <button class="profile-button ${item.id === profile.id ? "active" : ""}" type="button" data-profile-id="${item.id}">
          ${escapeHtml(item.name)}
        </button>
      `,
    )
    .join("");
  els.profileName.value = profile.name;
}

function renderCategories(profile) {
  ensureProfileCategories(profile);
  const selectedCategory = els.transactionCategory.value;
  fillCategorySelect(els.transactionCategory, profile, selectedCategory);

  if (profile.categories.includes(selectedCategory)) {
    els.transactionCategory.value = selectedCategory;
  } else {
    els.transactionCategory.value = profile.categories[0] || "Other";
  }

  if (!els.editTransactionPanel.hidden) {
    fillCategorySelect(els.editTransactionCategory, profile, els.editTransactionCategory.value);
  }

  els.categoryList.innerHTML = editableCategories(profile)
    .map((category) => {
      return `
        <div class="category-chip">
          <input type="color" value="${escapeHtml(colorForCategory(category, profile))}" data-category-color="${escapeHtml(category)}" aria-label="Choose color for ${escapeHtml(category)}" />
          <span>${escapeHtml(category)}</span>
          <button type="button" data-category-edit="${escapeHtml(category)}" aria-label="Edit ${escapeHtml(category)}">Edit</button>
          <button type="button" data-category-delete="${escapeHtml(category)}" aria-label="Delete ${escapeHtml(category)}">&times;</button>
        </div>
      `;
    })
    .join("");
}

function renderTransactions(profile) {
  if (!profile.transactions.length) {
    els.transactionList.innerHTML = `<div class="empty-state">Add a paycheck or payment to start this profile.</div>`;
    return;
  }

  els.transactionList.innerHTML = profile.transactions
    .map((transaction) => {
      const sign = transaction.type === "income" ? "+" : "-";
      return `
        <article class="transaction-item">
          <div>
            <div class="item-title">${escapeHtml(transaction.name)}</div>
            <div class="item-meta">${escapeHtml(transaction.category)} &middot; ${formatDate(transaction.date)}</div>
          </div>
          <div class="amount ${transaction.type}">${sign}${money.format(transaction.amount)}</div>
          <button class="edit-button" type="button" data-edit="transactions" data-id="${transaction.id}" aria-label="Edit ${escapeHtml(transaction.name)}">Edit</button>
          <button class="delete-button" type="button" data-delete="transactions" data-id="${transaction.id}" aria-label="Delete ${escapeHtml(transaction.name)}">&times;</button>
        </article>
      `;
    })
    .join("");
}

function renderBills(profile) {
  const sortedBills = [...profile.bills].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (!sortedBills.length) {
    els.billList.innerHTML = `<div class="empty-state">Add bills here to organize this profile.</div>`;
    return;
  }

  els.billList.innerHTML = sortedBills
    .map(
      (bill) => `
        <article class="bill-item">
          <div>
            <div class="item-title">${escapeHtml(bill.name)}</div>
            <div class="item-meta">${escapeHtml(bill.organization)} &middot; due ${formatDate(bill.dueDate)} &middot; ${formatRepeat(bill.repeat)}</div>
          </div>
          <div class="amount">${money.format(bill.amount)}</div>
          <button class="edit-button" type="button" data-edit="bills" data-id="${bill.id}" aria-label="Edit ${escapeHtml(bill.name)}">Edit</button>
          <button class="delete-button" type="button" data-delete="bills" data-id="${bill.id}" aria-label="Delete ${escapeHtml(bill.name)}">&times;</button>
        </article>
      `,
    )
    .join("");
}

function renderCalendar(profile) {
  if (els.calendarPanel.hidden) return;

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingDays = firstDay.getDay();
  const calendarItems = getBillOccurrences(profile, year, month);
  const cells = [];

  els.calendarMonthLabel.textContent = calendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  els.calendarBillTotal.textContent = money.format(calendarItems.reduce((sum, bill) => sum + bill.amount, 0));

  for (let index = 0; index < leadingDays; index += 1) {
    cells.push(`<div class="calendar-day empty"></div>`);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayBills = calendarItems.filter((item) => item.day === day);
    cells.push(`
      <article class="calendar-day">
        <span class="calendar-date">${day}</span>
        ${dayBills
          .map(
            (bill) => `
              <span class="calendar-bill">${escapeHtml(bill.name)} ${money.format(bill.amount)}</span>
            `,
          )
          .join("")}
      </article>
    `);
  }

  els.calendarGrid.innerHTML = cells.join("");
}

function drawFlowChart(totals, profile) {
  els.flowChartTitle.textContent = flowChartMode === "trend" ? "Monthly progress over time" : "Current month comparison";
  if (flowChartMode === "bars") {
    drawFlowBarChart(totals);
    return;
  }

  const canvas = els.flowChart;
  const ctx = setupCanvas(canvas);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const chartTop = 30;
  const chartBottom = height - 54;
  const chartLeft = width < 560 ? 34 : 48;
  const chartRight = width - 18;
  const months = getTrendMonths(profile);
  const max = Math.max(...months.flatMap((month) => [month.income, month.expenses, month.bills, month.savings]), 1);
  const series = [
    { key: "income", label: "Income", color: "#a8d8b9" },
    { key: "expenses", label: "Spending", color: "#f5a9b8" },
    { key: "bills", label: "Bills", color: "#f7d58b" },
    { key: "savings", label: "Savings", color: "#b8e0d2" },
  ];

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = cssColor("--panel");
  ctx.fillRect(0, 0, width, height);
  drawGrid(ctx, width, height, chartTop, chartBottom);

  series.forEach((line) => {
    ctx.beginPath();
    months.forEach((month, index) => {
      const x = chartLeft + (index / Math.max(months.length - 1, 1)) * (chartRight - chartLeft);
      const y = chartBottom - (month[line.key] / max) * (chartBottom - chartTop);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    months.forEach((month, index) => {
      const x = chartLeft + (index / Math.max(months.length - 1, 1)) * (chartRight - chartLeft);
      const y = chartBottom - (month[line.key] / max) * (chartBottom - chartTop);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = line.color;
      ctx.fill();
    });
  });

  ctx.fillStyle = cssColor("--muted");
  ctx.font = "800 12px Inter, sans-serif";
  ctx.textAlign = "center";
  months.forEach((month, index) => {
    const x = chartLeft + (index / Math.max(months.length - 1, 1)) * (chartRight - chartLeft);
    ctx.fillText(month.label, x, chartBottom + 24);
  });

  const legendY = height - 18;
  let legendX = chartLeft;
  series.forEach((line) => {
    roundedRect(ctx, legendX, legendY - 10, 14, 14, 4, line.color);
    ctx.fillStyle = cssColor("--ink");
    ctx.font = "800 12px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(line.label, legendX + 20, legendY + 1);
    legendX += ctx.measureText(line.label).width + 54;
  });
}

function drawFlowBarChart(totals) {
  const canvas = els.flowChart;
  const ctx = setupCanvas(canvas);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const chartTop = 42;
  const chartBottom = height - 42;
  const max = Math.max(totals.income, totals.expenses, totals.bills, totals.savings, 1);
  const bars = [
    { label: "Income", value: totals.income, color: "#a8d8b9" },
    { label: "Spending", value: totals.expenses, color: "#f5a9b8" },
    { label: "Bills", value: totals.bills, color: "#f7d58b" },
    { label: "Savings", value: totals.savings, color: "#b8e0d2" },
  ];

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = cssColor("--panel");
  ctx.fillRect(0, 0, width, height);
  drawGrid(ctx, width, height, chartTop, chartBottom);

  const gap = width < 560 ? 18 : 38;
  const barWidth = Math.max(34, (width - gap * (bars.length + 1)) / bars.length);

  bars.forEach((bar, index) => {
    const x = gap + index * (barWidth + gap);
    const barHeight = (bar.value / max) * (chartBottom - chartTop);
    const y = chartBottom - barHeight;
    roundedRect(ctx, x, y, barWidth, barHeight || 4, 8, bar.color);

    ctx.fillStyle = cssColor("--ink");
    ctx.font = "800 13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(bar.label, x + barWidth / 2, chartBottom + 24);
    ctx.fillStyle = cssColor("--muted");
    ctx.font = "800 12px Inter, sans-serif";
    ctx.fillText(money.format(bar.value), x + barWidth / 2, Math.max(24, y - 12));
  });
}

function drawCategoryChart(profile) {
  const canvas = els.categoryChart;
  const ctx = setupCanvas(canvas);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const expenses = [
    ...profile.transactions.filter((transaction) => transaction.type === "expense" && isInCurrentMonth(transaction.date)),
    ...profile.bills.filter((bill) => isInCurrentMonth(bill.dueDate)).map((bill) => ({ category: "Bills", amount: bill.amount })),
  ];
  const byCategory = expenses.reduce((map, transaction) => {
    map[transaction.category] = (map[transaction.category] || 0) + transaction.amount;
    return map;
  }, {});
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = cssColor("--panel");
  ctx.fillRect(0, 0, width, height);

  if (!total) {
    els.categoryBreakdown.innerHTML = `<div class="empty-state">No spending yet</div>`;
    ctx.fillStyle = cssColor("--muted");
    ctx.font = "800 15px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No spending yet", width / 2, height / 2);
    return;
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(86, height * 0.36);
  let start = -Math.PI / 2;

  entries.forEach(([category, value]) => {
    const slice = (value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = colorForCategory(category, profile);
    ctx.fill();
    start += slice;
  });

  ctx.beginPath();
  ctx.fillStyle = cssColor("--panel");
  ctx.arc(centerX, centerY, radius * 0.54, 0, Math.PI * 2);
  ctx.fill();

  els.categoryBreakdown.innerHTML = entries
    .map(
      ([category, value]) => `
        <div class="category-breakdown-item">
          <span class="category-swatch" style="background:${escapeHtml(colorForCategory(category, profile))}"></span>
          <span class="category-breakdown-name">${escapeHtml(category)}</span>
          <span class="category-breakdown-total">${money.format(value)}</span>
        </div>
      `,
    )
    .join("");
}

function setupCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ctx;
}

function drawGrid(ctx, width, height, top, bottom) {
  ctx.strokeStyle = cssColor("--line");
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    const y = top + ((bottom - top) / 3) * i;
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(width - 10, y);
    ctx.stroke();
  }
}

function roundedRect(ctx, x, y, width, height, radius, color) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.fill();
}

function cssColor(variable) {
  return getComputedStyle(document.body).getPropertyValue(variable).trim();
}

function formatDate(value) {
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getBillOccurrences(profile, year, month) {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const occurrences = [];

  profile.bills.forEach((bill) => {
    const dueDate = new Date(`${bill.dueDate}T12:00:00`);
    const repeat = normalizeRepeat(bill.repeat || "once");

    if (repeat === "once" && dueDate >= monthStart && dueDate <= monthEnd) {
      occurrences.push({ ...bill, day: dueDate.getDate() });
    }

    if (repeat === "monthly" && dueDate <= monthEnd) {
      occurrences.push({ ...bill, day: Math.min(dueDate.getDate(), monthEnd.getDate()) });
    }

    if (repeat === "yearly" && dueDate <= monthEnd && dueDate.getMonth() === month) {
      occurrences.push({ ...bill, day: Math.min(dueDate.getDate(), monthEnd.getDate()) });
    }

    if (repeat === "weekly" && dueDate <= monthEnd) {
      const cursor = new Date(Math.max(dueDate.getTime(), monthStart.getTime()));
      while (cursor.getDay() !== dueDate.getDay()) {
        cursor.setDate(cursor.getDate() + 1);
      }
      while (cursor <= monthEnd) {
        occurrences.push({ ...bill, day: cursor.getDate() });
        cursor.setDate(cursor.getDate() + 7);
      }
    }
  });

  return occurrences.sort((a, b) => a.day - b.day || a.name.localeCompare(b.name));
}

function getTrendMonths(profile) {
  const months = [];
  const start = new Date(today.getFullYear(), today.getMonth() - 5, 1);

  for (let index = 0; index < 6; index += 1) {
    const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthTransactions = profile.transactions.filter((transaction) => isInMonth(transaction.date, year, month));
    const billTotal = getBillOccurrences(profile, year, month).reduce((sum, bill) => sum + bill.amount, 0);

    months.push({
      label: date.toLocaleDateString("en-US", { month: "short" }),
      income: monthTransactions
        .filter((transaction) => transaction.type === "income")
        .reduce((sum, transaction) => sum + transaction.amount, 0),
      expenses: monthTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((sum, transaction) => sum + transaction.amount, 0),
      savings: monthTransactions
        .filter((transaction) => transaction.type === "savings" || isSavingsCategory(transaction.category, profile))
        .reduce((sum, transaction) => sum + transaction.amount, 0),
      bills: billTotal,
    });
  }

  return months;
}

function isInCurrentMonth(value) {
  return isInMonth(value, today.getFullYear(), today.getMonth());
}

function isInMonth(value, year, month) {
  const date = new Date(`${value}T12:00:00`);
  return date.getMonth() === month && date.getFullYear() === year;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char];
  });
}

function cleanCategoryName(value) {
  return value.trim().replace(/\s+/g, " ").slice(0, 32);
}

function fillCategorySelect(select, profile, selectedCategory) {
  const categories = editableCategories(profile);
  select.innerHTML = categories
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");
  select.value = categories.includes(selectedCategory) ? selectedCategory : categories[0] || "";
}

function openTransactionEditor(transaction, profile) {
  editingTransactionId = transaction.id;
  fillCategorySelect(els.editTransactionCategory, profile, transaction.category);
  const transactionType = isSavingsCategory(transaction.category, profile) ? "savings" : transaction.type;
  els.editTransactionType.value = transactionType;
  els.editTransactionCategory.disabled = transactionType === "savings";
  els.editTransactionName.value = transaction.name;
  els.editTransactionAmount.value = transaction.amount;
  els.editTransactionDate.value = transaction.date;
  els.editTransactionPanel.hidden = false;
  els.editTransactionPanel.scrollIntoView({ behavior: "smooth", block: "center" });
}

function closeTransactionEditor() {
  editingTransactionId = null;
  els.editTransactionForm.reset();
  els.editTransactionCategory.disabled = false;
  els.editTransactionPanel.hidden = true;
}

function openBillEditor(bill) {
  editingBillId = bill.id;
  els.editBillName.value = bill.name;
  els.editBillOrganization.value = bill.organization;
  els.editBillAmount.value = bill.amount;
  els.editBillDueDate.value = bill.dueDate;
  els.editBillRepeat.value = normalizeRepeat(bill.repeat || "once");
  els.editBillPanel.hidden = false;
  els.editBillPanel.scrollIntoView({ behavior: "smooth", block: "center" });
}

function closeBillEditor() {
  editingBillId = null;
  els.editBillForm.reset();
  els.editBillPanel.hidden = true;
}

function deleteCategory(category) {
  const profile = currentProfile();
  const oldLength = profile.categories.length;
  profile.categories = profile.categories.filter((item) => item !== category);
  if (profile.categories.length === oldLength) return;

  if (!profile.categories.length) {
    profile.categories.push("Uncategorized");
  }

  const replacementCategory = profile.categories[0];
  delete profile.categoryColors[category];
  profile.transactions.forEach((transaction) => {
    if (transaction.category === category) {
      transaction.category = replacementCategory;
    }
  });

  if (profile.savingsCategory === category) {
    profile.savingsCategory = SAVINGS_CATEGORY;
  }

  ensureProfileCategories(profile);
  saveAndRender();
}

function editCategory(oldCategory) {
  const profile = currentProfile();
  const nextCategory = cleanCategoryName(prompt("Category name", oldCategory) || "");
  if (!nextCategory || nextCategory === oldCategory) return;

  const categoryExists = profile.categories.some(
    (category) => category.toLowerCase() === nextCategory.toLowerCase() && category !== oldCategory,
  );
  if (categoryExists) {
    alert("That category already exists.");
    return;
  }

  profile.categories = profile.categories.map((category) => (category === oldCategory ? nextCategory : category));
  if (profile.savingsCategory === oldCategory) {
    return;
  }
  profile.transactions.forEach((transaction) => {
    if (transaction.category === oldCategory) {
      transaction.category = nextCategory;
    }
  });

  if (profile.categoryColors[oldCategory]) {
    profile.categoryColors[nextCategory] = profile.categoryColors[oldCategory];
    delete profile.categoryColors[oldCategory];
  }

  ensureProfileCategories(profile);
  saveAndRender();
  els.transactionCategory.value = nextCategory;
}

function editEntry(kind, id) {
  const profile = currentProfile();

  if (kind === "transactions") {
    const transaction = profile.transactions.find((item) => item.id === id);
    if (!transaction) return;
    openTransactionEditor(transaction, profile);
    return;
  }

  if (kind === "bills") {
    const bill = profile.bills.find((item) => item.id === id);
    if (!bill) return;
    openBillEditor(bill);
    return;
  }

  ensureProfileCategories(profile);
  saveAndRender();
}

function colorForCategory(category, profile = currentProfile()) {
  if (profile.categoryColors && profile.categoryColors[category]) return profile.categoryColors[category];
  if (categoryColors[category]) return categoryColors[category];
  const index = [...category].reduce((sum, char) => sum + char.charCodeAt(0), 0) % customCategoryPalette.length;
  return customCategoryPalette[index];
}

function isSavingsCategory(category, profile) {
  return category === profile.savingsCategory || category.toLowerCase() === SAVINGS_CATEGORY.toLowerCase();
}

function editableCategories(profile) {
  return profile.categories.filter((category) => !isSavingsCategory(category, profile));
}

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  idCounter += 1;
  return `id-${Date.now()}-${idCounter}-${Math.random().toString(16).slice(2)}`;
}

function formatRepeat(value) {
  const labels = {
    once: "one time",
    weekly: "weekly",
    monthly: "monthly",
    yearly: "yearly",
  };
  return labels[value] || labels.once;
}

function normalizeRepeat(value) {
  return ["once", "weekly", "monthly", "yearly"].includes(value) ? value : "once";
}

function syncEntryMode() {
  const billMode = document.querySelector("#billPanel").classList.contains("active");
  document.body.classList.toggle("bill-tab-active", billMode);
  if (els.categoryManager) {
    els.categoryManager.hidden = billMode;
  }
}

function readStorage(key) {
  if (memoryState && key === STORAGE_KEY) {
    return JSON.stringify(memoryState);
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
    memoryState = null;
    if (els.storageNotice) {
      els.storageNotice.hidden = true;
    }
  } catch {
    if (key === STORAGE_KEY) {
      memoryState = JSON.parse(value);
      if (els.storageNotice) {
        els.storageNotice.hidden = false;
      }
    }
  }
}

function ensureProfileCategories(profile) {
  if (!profile.categoryColors || typeof profile.categoryColors !== "object") {
    profile.categoryColors = {};
  }
  if (!Array.isArray(profile.categories) || !profile.categories.length) {
    profile.categories = [...defaultCategories];
  }
  if (!profile.savingsCategory) {
    profile.savingsCategory = SAVINGS_CATEGORY;
  }
  const allCategories = profile.categories.map(cleanCategoryName).filter((category) => !isSavingsCategory(category, profile));
  profile.categories = [...new Set(allCategories)].filter(Boolean);
  profile.categories.forEach((category) => {
    if (!profile.categoryColors[category]) {
      profile.categoryColors[category] = categoryColors[category] || colorForCategory(category, profile);
    }
  });
  profile.bills.forEach((bill) => {
    bill.repeat = normalizeRepeat(bill.repeat || "once");
  });
}

window.addEventListener("resize", render);
saveAndRender();
