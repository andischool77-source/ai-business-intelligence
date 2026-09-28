const STORAGE_KEY = "ai_business_intelligence_v1";

let state = {
  products: [],
  sales: [],
  expenses: [],
  customers: []
};

let editingProductId = null;

const pageTitles = {
  dashboard: ["Dashboard", "Ringkasan kondisi bisnis"],
  sales: ["Penjualan", "Catat dan pantau transaksi"],
  products: ["Produk", "Kelola produk dan persediaan"],
  expenses: ["Pengeluaran", "Pantau biaya operasional"],
  customers: ["Pelanggan", "Analisis perilaku pelanggan"],
  intelligence: ["AI Intelligence", "Data → Analisis → Insight → Tindakan"],
  analytics: ["Analytics", "Visualisasi performa bisnis"],
  settings: ["Pengaturan", "Konfigurasi dan penyimpanan sistem"]
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  loadState();
  setupDates();
  setupEvents();
  renderAll();
  updateCurrentDate();
}

/* =========================
   STORAGE
========================= */

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      state = {
        products: Array.isArray(parsed.products) ? parsed.products : [],
        sales: Array.isArray(parsed.sales) ? parsed.sales : [],
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        customers: Array.isArray(parsed.customers) ? parsed.customers : []
      };
    }
  } catch (error) {
    console.error(error);

    state = {
      products: [],
      sales: [],
      expenses: [],
      customers: []
    };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* =========================
   EVENTS
========================= */

function setupEvents() {

  document.addEventListener("click", function(e) {

    const pageButton = e.target.closest("[data-page]");

    if (pageButton) {
      const page = pageButton.dataset.page;
      showPage(page);
      return;
    }

    const actionButton = e.target.closest("[data-action]");

    if (actionButton) {
      const action = actionButton.dataset.action;
      const id = actionButton.dataset.id;

      if (action === "delete-sale") deleteSale(id);
      if (action === "edit-product") editProduct(id);
      if (action === "delete-product") deleteProduct(id);
      if (action === "delete-expense") deleteExpense(id);
      if (action === "delete-customer") deleteCustomer(id);
    }
  });

  document
    .getElementById("menuToggle")
    .addEventListener("click", function() {
      document.getElementById("sidebar").classList.toggle("open");
    });

  document
    .getElementById("refreshBtn")
    .addEventListener("click", function() {
      renderAll();
      showToast("Data berhasil diperbarui");
    });

  document
    .getElementById("runAI")
    .addEventListener("click", function() {
      renderIntelligence();
      showToast("Analisis AI selesai");
    });

  document
    .getElementById("salesProduct")
    .addEventListener("change", updateSalesPrice);

  document
    .getElementById("salesQty")
    .addEventListener("input", updateSalesTotal);

  document
    .getElementById("salesDiscount")
    .addEventListener("input", updateSalesTotal);

  document
    .getElementById("salesForm")
    .addEventListener("submit", handleSalesSubmit);

  document
    .getElementById("salesForm")
    .addEventListener("reset", function() {
      setTimeout(() => {
        setDefaultDate("salesDate");
        updateSalesPrice();
      }, 0);
    });

  document
    .getElementById("productForm")
    .addEventListener("submit", handleProductSubmit);

  document
    .getElementById("cancelProductEdit")
    .addEventListener("click", cancelProductEdit);

  document
    .getElementById("expenseForm")
    .addEventListener("submit", handleExpenseSubmit);

  document
    .getElementById("customerForm")
    .addEventListener("submit", handleCustomerSubmit);

  document
    .getElementById("resetAll")
    .addEventListener("click", resetAllData);
}

/* =========================
   NAVIGATION
========================= */

function showPage(page) {

  document.querySelectorAll(".page").forEach(el => {
    el.classList.remove("active");
  });

  const target = document.getElementById(page + "Page");

  if (!target) return;

  target.classList.add("active");

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.page === page
    );
  });

  const title = pageTitles[page];

  if (title) {
    document.getElementById("pageTitle").textContent = title[0];
    document.getElementById("pageSubtitle").textContent = title[1];
  }

  document.getElementById("sidebar").classList.remove("open");

  if (page === "intelligence") {
    renderIntelligence();
  }

  if (page === "analytics") {
    renderAnalytics();
  }
}

/* =========================
   DATES
========================= */

function setupDates() {
  setDefaultDate("salesDate");
  setDefaultDate("expenseDate");
}

function setDefaultDate(id) {
  const element = document.getElementById(id);

  if (element) {
    element.value = todayKey();
  }
}

function todayKey() {
  const d = new Date();

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

function updateCurrentDate() {
  const element = document.getElementById("currentDate");

  const d = new Date();

  element.textContent = d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

/* =========================
   HELPERS
========================= */

function uid(prefix) {
  return (
    prefix +
    "_" +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7)
  );
}

function money(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

function number(value) {
  return Number(value || 0).toLocaleString("id-ID");
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(date) {

  if (!date) return "-";

  const d = new Date(date + "T00:00:00");

  if (Number.isNaN(d.getTime())) {
    return date;
  }

  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function dateFromDaysAgo(days) {
  const d = new Date();

  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);

  return d;
}

function parseDate(value) {
  if (!value) return null;

  const parts = value.split("-");

  if (parts.length !== 3) return null;

  return new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  );
}

function isDateBetween(value, start, end) {

  const d = parseDate(value);

  if (!d) return false;

  d.setHours(0, 0, 0, 0);

  return d >= start && d <= end;
}

function percentChange(current, previous) {

  current = Number(current || 0);
  previous = Number(previous || 0);

  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }

  return ((current - previous) / previous) * 100;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getProduct(id) {
  return state.products.find(p => p.id === id);
}

function getCustomer(id) {
  return state.customers.find(c => c.id === id);
}

/* =========================
   RENDER ALL
========================= */

function renderAll() {
  renderDashboard();
  renderProducts();
  renderSales();
  renderExpenses();
  renderCustomers();
  renderProductSelect();
  renderCustomerSelect();
  renderIntelligence();
  renderAnalytics();
}

/* =========================
   DASHBOARD
========================= */

function getSalesInLastDays(days) {

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = dateFromDaysAgo(days - 1);

  return state.sales.filter(s =>
    isDateBetween(s.date, start, end)
  );
}

function getExpensesInLastDays(days) {

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = dateFromDaysAgo(days - 1);

  return state.expenses.filter(e =>
    isDateBetween(e.date, start, end)
  );
}

function calculateSalesStats(sales) {

  const revenue = sales.reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0
  );

  const cogs = sales.reduce(
    (sum, sale) =>
      sum +
      Number(sale.quantity || 0) *
      Number(sale.costAtSale || 0),
    0
  );

  return {
    revenue,
    cogs,
    grossProfit: revenue - cogs,
    transactions: sales.length
  };
}

function calculateBusinessStats(days = 30) {

  const sales = getSalesInLastDays(days);
  const expenses = getExpensesInLastDays(days);

  const salesStats = calculateSalesStats(sales);

  const expenseTotal = expenses.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );

  const profit = salesStats.revenue -
    salesStats.cogs -
    expenseTotal;

  const margin =
    salesStats.revenue > 0
      ? (profit / salesStats.revenue) * 100
      : 0;

  return {
    revenue: salesStats.revenue,
    cogs: salesStats.cogs,
    grossProfit: salesStats.grossProfit,
    expenses: expenseTotal,
    profit,
    margin,
    transactions: salesStats.transactions
  };
}

function renderDashboard() {

  const stats = calculateBusinessStats(30);

  document.getElementById("dashRevenue").textContent =
    money(stats.revenue);

  document.getElementById("dashProfit").textContent =
    money(stats.profit);

  document.getElementById("dashExpense").textContent =
    money(stats.expenses);

  document.getElementById("dashMargin").textContent =
    stats.margin.toFixed(1) + "%";

  document.getElementById("dashTransactions").textContent =
    number(stats.transactions);

  const activeCustomers = getActiveCustomers(30);

  document.getElementById("dashCustomers").textContent =
    number(activeCustomers);

  renderDashboardChart();
  renderDashboardInsights();
}

function renderDashboardChart() {

  const container = document.getElementById("dashboardChart");

  const days = [];

  for (let i = 29; i >= 0; i--) {

    const d = dateFromDaysAgo(i);

    const key = toDateKey(d);

    const revenue = state.sales
      .filter(s => s.date === key)
      .reduce((sum, s) => sum + Number(s.total || 0), 0);

    days.push({
      key,
      revenue
    });
  }

  const max = Math.max(...days.map(x => x.revenue), 1);

  container.innerHTML = days.map(item => {

    const height =
      item.revenue > 0
        ? Math.max(5, (item.revenue / max) * 100)
        : 2;

    return `
      <div
        class="mini-bar"
        style="height:${height}%"
        title="${formatDate(item.key)} — ${money(item.revenue)}">
      </div>
    `;

  }).join("");
}

function renderDashboardInsights() {

  const container = document.getElementById("dashboardInsights");

  const insights = getQuickInsights();

  if (!insights.length) {

    container.innerHTML = `
      <div class="compact-insight">
        <strong>Belum ada insight</strong>
        <p>
          Masukkan data penjualan, produk, pengeluaran,
          dan pelanggan untuk memulai analisis.
        </p>
      </div>
    `;

    return;
  }

  container.innerHTML = insights
    .slice(0, 4)
    .map(item => `
      <div class="compact-insight">
        <strong>${escapeHTML(item.title)}</strong>
        <p>${escapeHTML(item.insight)}</p>
      </div>
    `)
    .join("");
}

/* =========================
   PRODUCTS
========================= */

function handleProductSubmit(e) {

  e.preventDefault();

  const id = document.getElementById("productId").value;
  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const cost = Number(document.getElementById("productCost").value);
  const stock = Number(document.getElementById("productStock").value);
  const minStock = Number(document.getElementById("productMinStock").value);

  if (!name || !category) {
    showToast("Lengkapi data produk");
    return;
  }

  if (price < 0 || cost < 0 || stock < 0 || minStock < 0) {
    showToast("Nilai produk tidak valid");
    return;
  }

  if (id) {

    const product = getProduct(id);

    if (product) {

      product.name = name;
      product.category = category;
      product.price = price;
      product.cost = cost;
      product.stock = stock;
      product.minStock = minStock;
    }

    showToast("Produk berhasil diperbarui");

  } else {

    const product = {
      id: uid("PRD"),
      name,
      category,
      price,
      cost,
      stock,
      minStock,
      createdAt: todayKey()
    };

    state.products.push(product);

    showToast("Produk berhasil disimpan");
  }

  saveState();

  cancelProductEdit();
  renderAll();
}

function renderProducts() {

  const tbody = document.getElementById("productsTable");

  document.getElementById("productsCount").textContent =
    `${state.products.length} produk`;

  if (!state.products.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-row">
          Belum ada produk.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = state.products.map(product => {

    const margin =
      product.price > 0
        ? ((product.price - product.cost) / product.price) * 100
        : 0;

    let status = "Aman";
    let badge = "success";

    if (product.stock <= 0) {
      status = "Habis";
      badge = "danger";
    } else if (product.stock <= product.minStock) {
      status = "Menipis";
      badge = "warning";
    }

    return `
      <tr>

        <td>
          <strong>${escapeHTML(product.name)}</strong>
        </td>

        <td>${escapeHTML(product.category)}</td>

        <td>${money(product.price)}</td>

        <td>${money(product.cost)}</td>

        <td>${number(product.stock)}</td>

        <td>${margin.toFixed(1)}%</td>

        <td>
          <span class="status-badge ${badge}">
            ${status}
          </span>
        </td>

        <td>
          <div class="action-group">

            <button
              class="table-btn"
              data-action="edit-product"
              data-id="${product.id}">
              Edit
            </button>

            <button
              class="table-btn delete"
              data-action="delete-product"
              data-id="${product.id}">
              Hapus
            </button>

          </div>
        </td>

      </tr>
    `;

  }).join("");
}

function editProduct(id) {

  const product = getProduct(id);

  if (!product) return;

  editingProductId = id;

  document.getElementById("productId").value = product.id;
  document.getElementById("productName").value = product.name;
  document.getElementById("productCategory").value = product.category;
  document.getElementById("productPrice").value = product.price;
  document.getElementById("productCost").value = product.cost;
  document.getElementById("productStock").value = product.stock;
  document.getElementById("productMinStock").value = product.minStock;

  document.getElementById("productFormTitle").textContent =
    "Edit Produk";

  document.getElementById("productSubmitBtn").textContent =
    "Simpan Perubahan";

  document
    .getElementById("cancelProductEdit")
    .classList.remove("hidden");

  showPage("products");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function cancelProductEdit() {

  editingProductId = null;

  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";

  document.getElementById("productFormTitle").textContent =
    "Tambah Produk";

  document.getElementById("productSubmitBtn").textContent =
    "+ Simpan Produk";

  document
    .getElementById("cancelProductEdit")
    .classList.add("hidden");
}

function deleteProduct(id) {

  const product = getProduct(id);

  if (!product) return;

  const confirmed = confirm(
    `Hapus produk "${product.name}"?`
  );

  if (!confirmed) return;

  state.products = state.products.filter(
    p => p.id !== id
  );

  saveState();
  renderAll();

  showToast("Produk berhasil dihapus");
}

/* =========================
   SALES
========================= */

function renderProductSelect() {

  const select = document.getElementById("salesProduct");

  const current = select.value;

  select.innerHTML = `
    <option value="">Pilih produk</option>
    ${state.products.map(product => `
      <option value="${product.id}">
        ${escapeHTML(product.name)} — Stok ${number(product.stock)}
      </option>
    `).join("")}
  `;

  if (state.products.some(p => p.id === current)) {
    select.value = current;
  }

  updateSalesPrice();
}

function renderCustomerSelect() {

  const select = document.getElementById("salesCustomer");

  const current = select.value;

  select.innerHTML = `
    <option value="">Pelanggan umum</option>
    ${state.customers.map(customer => `
      <option value="${customer.id}">
        ${escapeHTML(customer.name)}
      </option>
    `).join("")}
  `;

  if (state.customers.some(c => c.id === current)) {
    select.value = current;
  }
}

function updateSalesPrice() {

  const productId =
    document.getElementById("salesProduct").value;

  const product = getProduct(productId);

  document.getElementById("salesPrice").value =
    product ? product.price : "";

  updateSalesTotal();
}

function updateSalesTotal() {

  const qty =
    Number(document.getElementById("salesQty").value) || 0;

  const price =
    Number(document.getElementById("salesPrice").value) || 0;

  const discount =
    Number(document.getElementById("salesDiscount").value) || 0;

  const subtotal = qty * price;

  const total = Math.max(
    0,
    subtotal - discount
  );

  document.getElementById("salesTotalDisplay").value =
    money(total);
}

function handleSalesSubmit(e) {

  e.preventDefault();

  const date =
    document.getElementById("salesDate").value;

  const productId =
    document.getElementById("salesProduct").value;

  const quantity =
    Number(document.getElementById("salesQty").value);

  const discount =
    Number(document.getElementById("salesDiscount").value) || 0;

  const customerId =
    document.getElementById("salesCustomer").value;

  const product = getProduct(productId);

  if (!date || !product) {
    showToast("Pilih produk terlebih dahulu");
    return;
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    showToast("Jumlah penjualan tidak valid");
    return;
  }

  if (quantity > product.stock) {
    showToast(
      `Stok ${product.name} hanya ${number(product.stock)}`
    );
    return;
  }

  const price = Number(product.price);
  const costAtSale = Number(product.cost);

  const subtotal = quantity * price;

  if (discount < 0 || discount > subtotal) {
    showToast("Diskon tidak valid");
    return;
  }

  const total = subtotal - discount;

  const customer = getCustomer(customerId);

  const sale = {
    id: uid("SAL"),
    date,
    productId: product.id,
    productName: product.name,
    quantity,
    price,
    costAtSale,
    discount,
    total,
    customerId: customer ? customer.id : "",
    customerName: customer ? customer.name : "Pelanggan umum",
    createdAt: new Date().toISOString()
  };

  state.sales.push(sale);

  product.stock -= quantity;

  saveState();

  document.getElementById("salesForm").reset();
  setDefaultDate("salesDate");

  renderAll();

  showToast("Penjualan berhasil disimpan");
}

function renderSales() {

  const tbody = document.getElementById("salesTable");

  document.getElementById("salesCount").textContent =
    `${state.sales.length} transaksi`;

  if (!state.sales.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-row">
          Belum ada transaksi penjualan.
        </td>
      </tr>
    `;

    return;
  }

  const sorted = [...state.sales].sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  tbody.innerHTML = sorted.map(sale => `
    <tr>

      <td>${formatDate(sale.date)}</td>

      <td>
        <strong>${escapeHTML(sale.productName)}</strong>
      </td>

      <td>${number(sale.quantity)}</td>

      <td>${money(sale.price)}</td>

      <td>${money(sale.discount)}</td>

      <td>
        <strong>${money(sale.total)}</strong>
      </td>

      <td>${escapeHTML(sale.customerName)}</td>

      <td>
        <button
          class="table-btn delete"
          data-action="delete-sale"
          data-id="${sale.id}">
          Hapus
        </button>
      </td>

    </tr>
  `).join("");
}

function deleteSale(id) {

  const sale = state.sales.find(
    item => item.id === id
  );

  if (!sale) return;

  const confirmed = confirm(
    "Hapus transaksi penjualan ini?"
  );

  if (!confirmed) return;

  const product = getProduct(sale.productId);

  if (product) {
    product.stock += Number(sale.quantity || 0);
  }

  state.sales = state.sales.filter(
    item => item.id !== id
  );

  saveState();
  renderAll();

  showToast("Penjualan dihapus dan stok dikembalikan");
}

/* =========================
   EXPENSES
========================= */

function handleExpenseSubmit(e) {

  e.preventDefault();

  const date =
    document.getElementById("expenseDate").value;

  const category =
    document.getElementById("expenseCategory").value;

  const description =
    document.getElementById("expenseDescription").value.trim();

  const amount =
    Number(document.getElementById("expenseAmount").value);

  if (!date || !category || !description) {
    showToast("Lengkapi data pengeluaran");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    showToast("Nominal tidak valid");
    return;
  }

  state.expenses.push({
    id: uid("EXP"),
    date,
    category,
    description,
    amount,
    createdAt: new Date().toISOString()
  });

  saveState();

  document.getElementById("expenseForm").reset();
  setDefaultDate("expenseDate");

  renderAll();

  showToast("Pengeluaran berhasil disimpan");
}

function renderExpenses() {

  const tbody = document.getElementById("expensesTable");

  document.getElementById("expensesCount").textContent =
    `${state.expenses.length} pengeluaran`;

  if (!state.expenses.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-row">
          Belum ada pengeluaran.
        </td>
      </tr>
    `;

    return;
  }

  const sorted = [...state.expenses].sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  tbody.innerHTML = sorted.map(expense => `
    <tr>

      <td>${formatDate(expense.date)}</td>

      <td>
        <span class="status-badge info">
          ${escapeHTML(expense.category)}
        </span>
      </td>

      <td>${escapeHTML(expense.description)}</td>

      <td>
        <strong>${money(expense.amount)}</strong>
      </td>

      <td>
        <button
          class="table-btn delete"
          data-action="delete-expense"
          data-id="${expense.id}">
          Hapus
        </button>
      </td>

    </tr>
  `).join("");
}

function deleteExpense(id) {

  const expense = state.expenses.find(
    item => item.id === id
  );

  if (!expense) return;

  if (!confirm("Hapus pengeluaran ini?")) return;

  state.expenses = state.expenses.filter(
    item => item.id !== id
  );

  saveState();
  renderAll();

  showToast("Pengeluaran berhasil dihapus");
}

/* =========================
   CUSTOMERS
========================= */

function handleCustomerSubmit(e) {

  e.preventDefault();

  const name =
    document.getElementById("customerName").value.trim();

  const contact =
    document.getElementById("customerContact").value.trim();

  if (!name) {
    showToast("Nama pelanggan wajib diisi");
    return;
  }

  state.customers.push({
    id: uid("CUS"),
    name,
    contact,
    createdAt: todayKey()
  });

  saveState();

  document.getElementById("customerForm").reset();

  renderAll();

  showToast("Pelanggan berhasil disimpan");
}

function renderCustomers() {

  const tbody = document.getElementById("customersTable");

  document.getElementById("customersCount").textContent =
    `${state.customers.length} pelanggan`;

  if (!state.customers.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-row">
          Belum ada pelanggan.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = state.customers.map(customer => {

    const customerSales = state.sales.filter(
      sale => sale.customerId === customer.id
    );

    const total = customerSales.reduce(
      (sum, sale) => sum + Number(sale.total || 0),
      0
    );

    const status =
      customerSales.length >= 2
        ? "Aktif"
        : customerSales.length === 1
          ? "Baru"
          : "Belum Transaksi";

    const badge =
      customerSales.length >= 2
        ? "success"
        : customerSales.length === 1
          ? "info"
          : "warning";

    return `
      <tr>

        <td>
          <strong>${escapeHTML(customer.name)}</strong>
        </td>

        <td>${escapeHTML(customer.contact || "-")}</td>

        <td>${number(customerSales.length)}</td>

        <td>${money(total)}</td>

        <td>
          <span class="status-badge ${badge}">
            ${status}
          </span>
        </td>

        <td>
          <button
            class="table-btn delete"
            data-action="delete-customer"
            data-id="${customer.id}">
            Hapus
          </button>
        </td>

      </tr>
    `;

  }).join("");
}

function deleteCustomer(id) {

  const customer = getCustomer(id);

  if (!customer) return;

  if (!confirm(`Hapus pelanggan "${customer.name}"?`)) {
    return;
  }

  state.customers = state.customers.filter(
    c => c.id !== id
  );

  saveState();
  renderAll();

  showToast("Pelanggan berhasil dihapus");
}

/* =========================
   INTELLIGENCE ENGINE
========================= */

function renderIntelligence() {

  const summary = document.getElementById("aiSummary");
  const grid = document.getElementById("intelligenceGrid");

  const insights = generateInsights();

  const stats = calculateBusinessStats(30);

  if (
    state.sales.length === 0 &&
    state.expenses.length === 0 &&
    state.products.length === 0
  ) {

    summary.innerHTML = `
      <div class="summary-box">
        <h3>Belum ada data bisnis</h3>
        <p>
          AI Business Intelligence siap bekerja.
          Tambahkan produk, penjualan, pengeluaran,
          dan pelanggan agar sistem dapat menemukan
          tren, anomali, perubahan performa, peluang,
          dan risiko bisnis.
        </p>
      </div>
    `;

    grid.innerHTML = "";

    return;
  }

  let overallText =
    `Dalam 30 hari terakhir, omzet tercatat ${money(stats.revenue)}, ` +
    `pengeluaran ${money(stats.expenses)}, dan laba bersih ${money(stats.profit)} ` +
    `dengan margin ${stats.margin.toFixed(1)}%.`;

  if (stats.revenue === 0) {
    overallText +=
      " Belum terdapat omzet pada periode analisis.";
  }

  summary.innerHTML = `
    <div class="summary-box">
      <h3>Ringkasan AI Business Intelligence</h3>
      <p>${escapeHTML(overallText)}</p>
    </div>
  `;

  grid.innerHTML = insights.map(renderInsightCard).join("");
}

function generateInsights() {

  const insights = [];

  addSalesTrendInsight(insights);
  addExpenseTrendInsight(insights);
  addProductInsights(insights);
  addStockInsights(insights);
  addCustomerInsights(insights);
  addAnomalyInsights(insights);
  addProfitInsight(insights);

  if (!insights.length) {

    insights.push({
      type: "info",
      title: "Data belum cukup",
      analysis:
        "Jumlah data yang tersedia belum cukup untuk menemukan pola yang berarti.",
      insight:
        "Tambahkan lebih banyak aktivitas bisnis agar perbandingan periode dapat dilakukan.",
      actions: [
        "Catat transaksi secara rutin",
        "Catat pengeluaran bisnis",
        "Lengkapi data produk dan pelanggan"
      ]
    });

  }

  return insights;
}

function renderInsightCard(item) {

  const label =
    item.type === "opportunity"
      ? "PELUANG"
      : item.type === "danger"
        ? "RISIKO"
        : item.type === "warning"
          ? "PERHATIAN"
          : "INSIGHT";

  return `
    <article class="intelligence-card ${item.type}">

      <div class="ai-card-title">
        <h3>${escapeHTML(item.title)}</h3>
        <span class="status-badge ${badgeForType(item.type)}">
          ${label}
        </span>
      </div>

      <div class="ai-card-section">
        <label>DATA</label>
        <p>${escapeHTML(item.data || "Data bisnis tersedia")}</p>
      </div>

      <div class="ai-card-section">
        <label>ANALISIS</label>
        <p>${escapeHTML(item.analysis)}</p>
      </div>

      <div class="ai-card-section">
        <label>INSIGHT</label>
        <p>${escapeHTML(item.insight)}</p>
      </div>

      <div class="ai-card-section">
        <label>OPSI TINDAKAN</label>
        <ul>
          ${item.actions.map(action =>
            `<li>${escapeHTML(action)}</li>`
          ).join("")}
        </ul>
      </div>

    </article>
  `;
}

function badgeForType(type) {

  if (type === "opportunity") return "success";
  if (type === "danger") return "danger";
  if (type === "warning") return "warning";

  return "info";
}

/* SALES TREND */

function addSalesTrendInsight(insights) {

  const current = periodSalesStats(7, 0);
  const previous = periodSalesStats(7, 7);

  if (
    current.sales.length === 0 &&
    previous.sales.length === 0
  ) {
    return;
  }

  const change = percentChange(
    current.stats.revenue,
    previous.stats.revenue
  );

  if (previous.stats.revenue === 0 && current.stats.revenue > 0) {

    insights.push({
      type: "opportunity",
      title: "Penjualan mulai terbentuk",
      data:
        `Omzet 7 hari terakhir: ${money(current.stats.revenue)}.`,
      analysis:
        "Periode sebelumnya belum memiliki omzet, sedangkan periode terbaru sudah memiliki transaksi.",
      insight:
        "Aktivitas penjualan mulai terbentuk dan perlu dipantau konsistensinya.",
      actions: [
        "Pertahankan pencatatan transaksi harian",
        "Pantau produk yang menghasilkan omzet",
        "Bandingkan performa pada periode berikutnya"
      ]
    });

    return;
  }

  if (change >= 10) {

    insights.push({
      type: "opportunity",
      title: "Tren omzet meningkat",
      data:
        `Omzet naik ${change.toFixed(1)}% dibanding 7 hari sebelumnya.`,
      analysis:
        `Omzet periode terbaru ${money(current.stats.revenue)} dibanding ${money(previous.stats.revenue)} pada periode sebelumnya.`,
      insight:
        "Ada pertumbuhan aktivitas penjualan pada periode terbaru.",
      actions: [
        "Pertahankan produk yang sedang tumbuh",
        "Pastikan stok produk dengan permintaan tinggi",
        "Pantau apakah pertumbuhan berlanjut"
      ]
    });

  } else if (change <= -10) {

    insights.push({
      type: "warning",
      title: "Tren omzet menurun",
      data:
        `Omzet turun ${Math.abs(change).toFixed(1)}%.`,
      analysis:
        `Omzet terbaru ${money(current.stats.revenue)} dibanding ${money(previous.stats.revenue)} sebelumnya.`,
      insight:
        "Aktivitas penjualan mengalami penurunan dibanding periode pembanding.",
      actions: [
        "Periksa produk dengan penurunan penjualan",
        "Periksa perubahan jumlah transaksi",
        "Evaluasi penyebab penurunan sebelum mengambil tindakan"
      ]
    });

  } else {

    insights.push({
      type: "info",
      title: "Tren omzet relatif stabil",
      data:
        `Perubahan omzet ${change.toFixed(1)}% dibanding periode sebelumnya.`,
      analysis:
        "Perubahan masih berada dalam rentang yang relatif kecil.",
      insight:
        "Belum terlihat perubahan besar pada omzet mingguan.",
      actions: [
        "Lanjutkan pemantauan mingguan",
        "Bandingkan performa produk",
        "Pantau perubahan biaya"
      ]
    });
  }
}

/* EXPENSE TREND */

function addExpenseTrendInsight(insights) {

  const current = periodExpenseTotal(30, 0);
  const previous = periodExpenseTotal(30, 30);

  if (current === 0 && previous === 0) return;

  const change = percentChange(current, previous);

  if (previous === 0 && current > 0) {

    insights.push({
      type: "warning",
      title: "Pengeluaran baru terdeteksi",
      data:
        `Pengeluaran 30 hari terakhir ${money(current)}.`,
      analysis:
        "Tidak terdapat pengeluaran pada periode pembanding.",
      insight:
        "Biaya mulai tercatat dan perlu dibandingkan dengan pertumbuhan omzet.",
      actions: [
        "Kelompokkan pengeluaran berdasarkan kategori",
        "Bandingkan biaya dengan omzet",
        "Pantau biaya berulang"
      ]
    });

    return;
  }

  if (change >= 15) {

    insights.push({
      type: "warning",
      title: "Biaya operasional meningkat",
      data:
        `Pengeluaran meningkat ${change.toFixed(1)}%.`,
      analysis:
        `Pengeluaran terbaru ${money(current)} dibanding ${money(previous)}.`,
      insight:
        "Pertumbuhan biaya lebih tinggi dibanding periode sebelumnya.",
      actions: [
        "Periksa kategori biaya yang meningkat",
        "Identifikasi biaya berulang",
        "Bandingkan kenaikan biaya dengan kenaikan omzet"
      ]
    });

  } else if (change <= -15) {

    insights.push({
      type: "opportunity",
      title: "Pengeluaran menurun",
      data:
        `Pengeluaran turun ${Math.abs(change).toFixed(1)}%.`,
      analysis:
        `Biaya terbaru ${money(current)} dibanding ${money(previous)}.`,
      insight:
        "Total pengeluaran lebih rendah dibanding periode pembanding.",
      actions: [
        "Identifikasi sumber efisiensi",
        "Pastikan penurunan biaya tidak mengganggu operasional",
        "Pertahankan biaya yang efisien"
      ]
    });
  }
}

/* PRODUCT */

function addProductInsights(insights) {

  if (!state.products.length) return;

  const productResults = state.products
    .map(product => {

      const current = productSales(product.id, 14, 0);
      const previous = productSales(product.id, 14, 14);

      const currentQty = current.reduce(
        (sum, s) => sum + Number(s.quantity || 0),
        0
      );

      const previousQty = previous.reduce(
        (sum, s) => sum + Number(s.quantity || 0),
        0
      );

      const change = percentChange(
        currentQty,
        previousQty
      );

      return {
        product,
        currentQty,
        previousQty,
        change
      };

    })
    .filter(item =>
      item.currentQty > 0 ||
      item.previousQty > 0
    );

  if (!productResults.length) return;

  const growing = [...productResults]
    .sort((a, b) => b.change - a.change)[0];

  if (
    growing &&
    growing.currentQty > 0 &&
    growing.change >= 20
  ) {

    insights.push({
      type: "opportunity",
      title: "Produk mengalami pertumbuhan",
      data:
        `${growing.product.name} terjual ${number(growing.currentQty)} unit dalam 14 hari terakhir.`,
      analysis:
        `Volume penjualan berubah ${growing.change.toFixed(1)}% dibanding 14 hari sebelumnya.`,
      insight:
        `${growing.product.name} menunjukkan perubahan performa positif.`,
      actions: [
        `Pantau stok ${growing.product.name}`,
        "Pertahankan ketersediaan produk",
        "Bandingkan tren selama beberapa periode"
      ]
    });
  }

  const declining = [...productResults]
    .sort((a, b) => a.change - b.change)[0];

  if (
    declining &&
    declining.previousQty > 0 &&
    declining.change <= -20
  ) {

    insights.push({
      type: "warning",
      title: "Produk mengalami penurunan",
      data:
        `${declining.product.name} turun ${Math.abs(declining.change).toFixed(1)}% dalam volume penjualan.`,
      analysis:
        `Penjualan berubah dari ${number(declining.previousQty)} menjadi ${number(declining.currentQty)} unit.`,
      insight:
        "Produk menunjukkan perubahan performa negatif dibanding periode sebelumnya.",
      actions: [
        `Periksa penjualan ${declining.product.name}`,
        "Periksa perubahan harga atau permintaan",
        "Bandingkan dengan produk sejenis"
      ]
    });
  }
}

/* STOCK */

function addStockInsights(insights) {

  const lowStock = state.products.filter(
    product =>
      product.stock <= product.minStock
  );

  if (!lowStock.length) return;

  const names = lowStock
    .slice(0, 4)
    .map(product =>
      `${product.name} (${number(product.stock)})`
    )
    .join(", ");

  insights.push({
    type: "danger",
    title: "Risiko stok rendah",
    data:
      `${lowStock.length} produk berada pada atau di bawah minimum stok.`,
    analysis:
      `Produk yang perlu diperhatikan: ${names}.`,
    insight:
      "Stok rendah dapat membatasi kemampuan memenuhi permintaan jika penjualan meningkat.",
    actions: [
      "Periksa kebutuhan restock",
      "Prioritaskan produk yang memiliki penjualan tinggi",
      "Tetapkan batas minimum stok yang sesuai"
    ]
  });
}

/* CUSTOMER */

function addCustomerInsights(insights) {

  if (!state.customers.length || !state.sales.length) return;

  const currentStart = dateFromDaysAgo(29);
  const previousStart = dateFromDaysAgo(59);
  const previousEnd = dateFromDaysAgo(30);

  let changedCustomer = null;

  state.customers.forEach(customer => {

    const currentSales = state.sales.filter(sale =>
      sale.customerId === customer.id &&
      isDateBetween(
        sale.date,
        currentStart,
        new Date()
      )
    );

    const previousSales = state.sales.filter(sale =>
      sale.customerId === customer.id &&
      isDateBetween(
        sale.date,
        previousStart,
        previousEnd
      )
    );

    const currentSpend = currentSales.reduce(
      (sum, sale) => sum + Number(sale.total || 0),
      0
    );

    const previousSpend = previousSales.reduce(
      (sum, sale) => sum + Number(sale.total || 0),
      0
    );

    const change = percentChange(
      currentSpend,
      previousSpend
    );

    if (
      previousSpend > 0 &&
      change <= -40 &&
      (
        !changedCustomer ||
        change < changedCustomer.change
      )
    ) {

      changedCustomer = {
        customer,
        change,
        currentSpend,
        previousSpend
      };
    }
  });

  if (!changedCustomer) return;

  insights.push({
    type: "warning",
    title: "Perubahan perilaku pelanggan",
    data:
      `${changedCustomer.customer.name} mengalami perubahan belanja ${changedCustomer.change.toFixed(1)}%.`,
    analysis:
      `Belanja berubah dari ${money(changedCustomer.previousSpend)} menjadi ${money(changedCustomer.currentSpend)} dalam perbandingan periode 30 hari.`,
    insight:
      "Aktivitas pelanggan tersebut menurun secara signifikan dibanding periode sebelumnya.",
    actions: [
      `Periksa riwayat transaksi ${changedCustomer.customer.name}`,
      "Pertimbangkan komunikasi langsung dengan pelanggan",
      "Periksa apakah perubahan berkaitan dengan produk atau harga"
    ]
  });
}

/* ANOMALY */

function addAnomalyInsights(insights) {

  const salesDaily = getDailyValues(
    state.sales,
    30,
    item => Number(item.total || 0)
  );

  const expenseDaily = getDailyValues(
    state.expenses,
    30,
    item => Number(item.amount || 0)
  );

  const salesAnomaly = findAnomaly(salesDaily);
  const expenseAnomaly = findAnomaly(expenseDaily);

  if (salesAnomaly) {

    insights.push({
      type: "info",
      title: "Anomali aktivitas penjualan",
      data:
        `${formatDate(salesAnomaly.date)} memiliki omzet ${money(salesAnomaly.value)}.`,
      analysis:
        "Nilai harian tersebut berbeda jauh dari pola rata-rata periode analisis.",
      insight:
        "Hari tersebut layak diperiksa untuk mengetahui transaksi atau kejadian bisnis yang tidak biasa.",
      actions: [
        "Periksa transaksi pada tanggal tersebut",
        "Identifikasi produk yang menyumbang perubahan",
        "Catat penyebab jika merupakan kejadian khusus"
      ]
    });
  }

  if (expenseAnomaly) {

    insights.push({
      type: "warning",
      title: "Anomali pengeluaran",
      data:
        `${formatDate(expenseAnomaly.date)} memiliki pengeluaran ${money(expenseAnomaly.value)}.`,
      analysis:
        "Nilai pengeluaran harian tersebut berada jauh dari pola rata-rata.",
      insight:
        "Tanggal tersebut perlu diperiksa untuk memastikan sumber biaya.",
      actions: [
        "Periksa transaksi pengeluaran pada tanggal tersebut",
        "Periksa kategori biaya",
        "Pastikan nominal tercatat dengan benar"
      ]
    });
  }
}

function getDailyValues(items, days, valueFn) {

  const result = [];

  for (let i = days - 1; i >= 0; i--) {

    const date = dateFromDaysAgo(i);
    const key = toDateKey(date);

    const value = items
      .filter(item => item.date === key)
      .reduce(
        (sum, item) => sum + valueFn(item),
        0
      );

    result.push({
      date: key,
      value
    });
  }

  return result;
}

function findAnomaly(values) {

  const active = values.filter(v => v.value > 0);

  if (active.length < 5) return null;

  const mean =
    active.reduce((sum, v) => sum + v.value, 0) /
    active.length;

  const variance =
    active.reduce(
      (sum, v) => sum + Math.pow(v.value - mean, 2),
      0
    ) / active.length;

  const std =
    Math.sqrt(variance);

  if (std === 0) return null;

  let strongest = null;
  let strongestZ = 0;

  active.forEach(item => {

    const z =
      Math.abs(item.value - mean) / std;

    if (z >= 2 && z > strongestZ) {
      strongest = item;
      strongestZ = z;
    }
  });

  return strongest;
}

/* PROFIT */

function addProfitInsight(insights) {

  const stats = calculateBusinessStats(30);

  if (stats.revenue <= 0) return;

  if (stats.profit < 0) {

    insights.push({
      type: "danger",
      title: "Laba bersih negatif",
      data:
        `Omzet ${money(stats.revenue)} dan laba bersih ${money(stats.profit)}.`,
      analysis:
        "Total HPP dan pengeluaran lebih besar daripada omzet pada periode 30 hari.",
      insight:
        "Struktur biaya perlu diperiksa karena periode tersebut menghasilkan laba bersih negatif.",
      actions: [
        "Periksa harga jual dan margin produk",
        "Periksa HPP produk",
        "Identifikasi pengeluaran terbesar"
      ]
    });

  } else if (stats.margin < 10) {

    insights.push({
      type: "warning",
      title: "Margin laba relatif rendah",
      data:
        `Margin laba bersih berada di ${stats.margin.toFixed(1)}%.`,
      analysis:
        `Omzet ${money(stats.revenue)} menghasilkan laba bersih ${money(stats.profit)}.`,
      insight:
        "Ruang laba terhadap omzet relatif terbatas pada periode analisis.",
      actions: [
        "Periksa margin setiap produk",
        "Evaluasi HPP",
        "Pantau pengeluaran operasional"
      ]
    });
  }
}

/* QUICK INSIGHTS */

function getQuickInsights() {

  const all = generateInsights();

  return all.map(item => ({
    title: item.title,
    insight: item.insight
  }));
}

/* =========================
   PERIOD HELPERS
========================= */

function periodSalesStats(days, offset) {

  const end = dateFromDaysAgo(offset);
  end.setHours(23, 59, 59, 999);

  const start = dateFromDaysAgo(
    offset + days - 1
  );

  const sales = state.sales.filter(s =>
    isDateBetween(s.date, start, end)
  );

  return {
    sales,
    stats: calculateSalesStats(sales)
  };
}

function periodExpenseTotal(days, offset) {

  const end = dateFromDaysAgo(offset);
  end.setHours(23, 59, 59, 999);

  const start = dateFromDaysAgo(
    offset + days - 1
  );

  return state.expenses
    .filter(e =>
      isDateBetween(e.date, start, end)
    )
    .reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0
    );
}

function productSales(productId, days, offset) {

  const end = dateFromDaysAgo(offset);
  end.setHours(23, 59, 59, 999);

  const start = dateFromDaysAgo(
    offset + days - 1
  );

  return state.sales.filter(s =>
    s.productId === productId &&
    isDateBetween(s.date, start, end)
  );
}

function getActiveCustomers(days) {

  const sales = getSalesInLastDays(days);

  return new Set(
    sales
      .filter(s => s.customerId)
      .map(s => s.customerId)
  ).size;
}

/* =========================
   ANALYTICS
========================= */

function renderAnalytics() {

  renderRevenueChart();
  renderTopProducts();
  renderExpenseCategories();
  renderProductPerformance();
}

function renderRevenueChart() {

  const container =
    document.getElementById("revenueChart");

  const values = [];

  for (let i = 29; i >= 0; i--) {

    const d = dateFromDaysAgo(i);
    const key = toDateKey(d);

    const revenue = state.sales
      .filter(s => s.date === key)
      .reduce(
        (sum, s) => sum + Number(s.total || 0),
        0
      );

    values.push({
      date: key,
      revenue
    });
  }

  const max =
    Math.max(...values.map(v => v.revenue), 1);

  container.innerHTML = values.map(item => {

    const height =
      item.revenue > 0
        ? Math.max(2, (item.revenue / max) * 100)
        : 1;

    return `
      <div class="chart-column">

        <div
          class="chart-value"
          style="height:${height}%"
          title="${formatDate(item.date)} — ${money(item.revenue)}">
        </div>

        <span class="chart-label">
          ${item.date.slice(8)}
        </span>

      </div>
    `;

  }).join("");
}

function renderTopProducts() {

  const container =
    document.getElementById("topProducts");

  const sales = getSalesInLastDays(30);

  const map = {};

  sales.forEach(sale => {

    if (!map[sale.productId]) {
      map[sale.productId] = {
        name: sale.productName,
        revenue: 0,
        quantity: 0
      };
    }

    map[sale.productId].revenue +=
      Number(sale.total || 0);

    map[sale.productId].quantity +=
      Number(sale.quantity || 0);
  });

  const products = Object.values(map)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  if (!products.length) {

    container.innerHTML = `
      <div class="empty-row">
        Belum ada data penjualan.
      </div>
    `;

    return;
  }

  const max = products[0].revenue || 1;

  container.innerHTML = products.map(item => {

    const width =
      (item.revenue / max) * 100;

    return `
      <div class="list-item">

        <div class="list-item-top">
          <strong>${escapeHTML(item.name)}</strong>
          <span>${money(item.revenue)}</span>
        </div>

        <small>${number(item.quantity)} unit</small>

        <div class="progress">
          <div style="width:${width}%"></div>
        </div>

      </div>
    `;

  }).join("");
}

function renderExpenseCategories() {

  const container =
    document.getElementById("expenseCategories");

  const expenses = getExpensesInLastDays(30);

  const map = {};

  expenses.forEach(expense => {

    map[expense.category] =
      (map[expense.category] || 0) +
      Number(expense.amount || 0);
  });

  const categories = Object.entries(map)
    .map(([name, amount]) => ({
      name,
      amount
    }))
    .sort((a, b) => b.amount - a.amount);

  if (!categories.length) {

    container.innerHTML = `
      <div class="empty-row">
        Belum ada data pengeluaran.
      </div>
    `;

    return;
  }

  const max = categories[0].amount || 1;

  container.innerHTML = categories
    .slice(0, 6)
    .map(item => {

      const width =
        (item.amount / max) * 100;

      return `
        <div class="list-item">

          <div class="list-item-top">
            <strong>${escapeHTML(item.name)}</strong>
            <span>${money(item.amount)}</span>
          </div>

          <div class="progress">
            <div style="width:${width}%"></div>
          </div>

        </div>
      `;

    }).join("");
}

function renderProductPerformance() {

  const container =
    document.getElementById("productPerformance");

  const sales = getSalesInLastDays(30);

  const map = {};

  sales.forEach(sale => {

    if (!map[sale.productId]) {

      map[sale.productId] = {
        name: sale.productName,
        quantity: 0,
        revenue: 0
      };
    }

    map[sale.productId].quantity +=
      Number(sale.quantity || 0);

    map[sale.productId].revenue +=
      Number(sale.total || 0);
  });

  const products = Object.values(map)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 6);

  if (!products.length) {

    container.innerHTML = `
      <div class="empty-row">
        Belum ada data produk.
      </div>
    `;

    return;
  }

  const max =
    products[0].quantity || 1;

  container.innerHTML = products.map(item => {

    const width =
      (item.quantity / max) * 100;

    return `
      <div class="list-item">

        <div class="list-item-top">
          <strong>${escapeHTML(item.name)}</strong>
          <span>${number(item.quantity)} unit</span>
        </div>

        <small>${money(item.revenue)}</small>

        <div class="progress">
          <div style="width:${width}%"></div>
        </div>

      </div>
    `;

  }).join("");
}

/* =========================
   DATE KEY
========================= */

function toDateKey(date) {

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

/* =========================
   RESET
========================= */

function resetAllData() {

  const confirmed = confirm(
    "Yakin ingin menghapus SEMUA data bisnis?"
  );

  if (!confirmed) return;

  const confirmedAgain = confirm(
    "Semua produk, penjualan, pengeluaran, dan pelanggan akan dihapus. Lanjutkan?"
  );

  if (!confirmedAgain) return;

  state = {
    products: [],
    sales: [],
    expenses: [],
    customers: []
  };

  localStorage.removeItem(STORAGE_KEY);

  cancelProductEdit();

  document.getElementById("salesForm").reset();
  document.getElementById("expenseForm").reset();
  document.getElementById("customerForm").reset();

  setDefaultDate("salesDate");
  setDefaultDate("expenseDate");

  renderAll();

  showToast("Semua data berhasil dihapus");
}

/* =========================
   TOAST
========================= */

let toastTimer;

function showToast(message) {

  const toast =
    document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}