var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_promises = __toESM(require("fs/promises"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_cookie_parser = __toESM(require("cookie-parser"), 1);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var PORT = Number(process.env.PORT || 5174);
var HOST = process.env.HOST || "127.0.0.1";
var DB_FILE = process.env.DB_FILE || import_path.default.join(process.cwd(), "db.json");
var JWT_SECRET = process.env.JWT_SECRET || "pharma-secret-key";
function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
function startOfWeek(date) {
  const copy = startOfDay(date);
  copy.setDate(copy.getDate() - 6);
  return copy;
}
function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function calculateSaleProfit(sale, medicines) {
  return sale.items.reduce((sum, item) => {
    const medicine = medicines.find((m) => m.id === item.medicineId);
    const purchasePrice = medicine?.purchasePrice || 0;
    return sum + (item.price - purchasePrice) * item.quantity;
  }, 0);
}
function calculatePeriodMetrics(sales, medicines, start) {
  const periodSales = sales.filter((sale) => new Date(sale.date) >= start);
  return {
    sales: periodSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    profit: periodSales.reduce((sum, sale) => sum + calculateSaleProfit(sale, medicines), 0),
    count: periodSales.length
  };
}
function getPerformanceSummary(db) {
  const now = /* @__PURE__ */ new Date();
  const periods = {
    daily: startOfDay(now),
    weekly: startOfWeek(now),
    monthly: startOfMonth(now)
  };
  return {
    daily: calculatePeriodMetrics(db.sales, db.medicines, periods.daily),
    weekly: calculatePeriodMetrics(db.sales, db.medicines, periods.weekly),
    monthly: calculatePeriodMetrics(db.sales, db.medicines, periods.monthly)
  };
}
function csvEscape(value) {
  const stringValue = String(value ?? "");
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}
function toCsv(headers, rows) {
  return [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(","))
  ].join("\n");
}
function sendCsvReport(res, filename, csv) {
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.send(csv);
}
var INITIAL_DB = {
  users: [
    {
      id: "1",
      username: "admin",
      passwordHash: import_bcryptjs.default.hashSync("admin123", 10),
      role: "admin",
      name: "Admin Owner"
    }
  ],
  medicines: [
    {
      id: "m1",
      name: "Paracetamol 500mg",
      genericName: "Acetaminophen",
      batchNumber: "BT-9921",
      expiryDate: "2027-12-01",
      stock: 150,
      minStock: 50,
      purchasePrice: 0.5,
      salePrice: 2,
      supplierId: "s1"
    },
    {
      id: "m2",
      name: "Amoxicillin 250mg",
      genericName: "Antibiotic",
      batchNumber: "BT-1122",
      expiryDate: "2026-06-15",
      stock: 12,
      minStock: 20,
      purchasePrice: 5,
      salePrice: 12,
      supplierId: "s2"
    },
    {
      id: "m3",
      name: "Ibuprofen 400mg",
      genericName: "NSAID",
      batchNumber: "BT-0021",
      expiryDate: "2025-08-10",
      stock: 300,
      minStock: 100,
      purchasePrice: 1.2,
      salePrice: 4.5,
      supplierId: "s1"
    },
    {
      id: "m4",
      name: "Cetirizine 10mg",
      genericName: "Antihistamine",
      batchNumber: "BT-4422",
      expiryDate: "2026-01-20",
      stock: 45,
      minStock: 30,
      purchasePrice: 0.8,
      salePrice: 3,
      supplierId: "s2"
    },
    {
      id: "m5",
      name: "Metformin 850mg",
      genericName: "Antidiabetic",
      batchNumber: "BT-7788",
      expiryDate: "2024-11-30",
      stock: 80,
      minStock: 40,
      purchasePrice: 2.5,
      salePrice: 8,
      supplierId: "s1"
    }
  ],
  sales: [
    {
      id: "sale1",
      items: [{ medicineId: "m1", medicineName: "Paracetamol 500mg", quantity: 10, price: 2, total: 20 }],
      totalAmount: 20,
      customerName: "Walking Customer",
      date: new Date(Date.now() - 864e5 * 2).toISOString(),
      // 2 days ago
      userId: "1"
    },
    {
      id: "sale2",
      items: [{ medicineId: "m3", medicineName: "Ibuprofen 400mg", quantity: 5, price: 4.5, total: 22.5 }],
      totalAmount: 22.5,
      customerName: "John Doe",
      date: new Date(Date.now() - 864e5).toISOString(),
      // 1 day ago
      userId: "1"
    },
    {
      id: "sale3",
      items: [
        { medicineId: "m1", medicineName: "Paracetamol 500mg", quantity: 2, price: 2, total: 4 },
        { medicineId: "m4", medicineName: "Cetirizine 10mg", quantity: 3, price: 3, total: 9 }
      ],
      totalAmount: 13,
      customerName: "Jane Smith",
      date: (/* @__PURE__ */ new Date()).toISOString(),
      userId: "1"
    }
  ],
  purchases: [],
  suppliers: [
    {
      id: "s1",
      name: "Global Pharma Distribution",
      contact: "+1 234 567 890",
      address: "Industrial Area, Block 4, City Centre"
    },
    {
      id: "s2",
      name: "Reliable Medical Supplies",
      contact: "+1 987 654 321",
      address: "Port Warehouse, Dock 12"
    }
  ]
};
async function getDB() {
  try {
    const data = await import_promises.default.readFile(DB_FILE, "utf-8");
    const db = JSON.parse(data);
    if (db.medicines.length === 0) {
      db.medicines = INITIAL_DB.medicines;
      db.suppliers = INITIAL_DB.suppliers;
      db.sales = INITIAL_DB.sales;
      await saveDB(db);
    }
    return db;
  } catch (error) {
    await import_promises.default.writeFile(DB_FILE, JSON.stringify(INITIAL_DB, null, 2));
    return INITIAL_DB;
  }
}
async function saveDB(db) {
  await import_promises.default.writeFile(DB_FILE, JSON.stringify(db, null, 2));
}
async function startServer() {
  const app = (0, import_express.default)();
  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });
  app.use((0, import_cors.default)());
  app.use(import_express.default.json());
  app.use((0, import_cookie_parser.default)());
  const authenticateToken = (req, res, next) => {
    req.user = { id: "1", username: "admin", role: "admin", name: "Admin Owner" };
    next();
  };
  const isAdmin = (req, res, next) => {
    next();
  };
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const db = await getDB();
    const user = db.users.find((u) => u.username === username);
    if (user && import_bcryptjs.default.compareSync(password, user.passwordHash)) {
      const token = import_jsonwebtoken.default.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "24h" });
      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.COOKIE_SECURE === "true"
      });
      res.json({ id: user.id, username: user.username, role: user.role, name: user.name });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
  });
  app.get("/api/auth/me", authenticateToken, (req, res) => {
    res.json(req.user);
  });
  app.get("/api/medicines", authenticateToken, async (req, res) => {
    const db = await getDB();
    res.json(db.medicines);
  });
  app.post("/api/medicines", authenticateToken, isAdmin, async (req, res) => {
    const db = await getDB();
    const newMed = { ...req.body, id: Date.now().toString() };
    db.medicines.push(newMed);
    await saveDB(db);
    res.status(201).json(newMed);
  });
  app.put("/api/medicines/:id", authenticateToken, isAdmin, async (req, res) => {
    const db = await getDB();
    const index = db.medicines.findIndex((m) => m.id === req.params.id);
    if (index !== -1) {
      db.medicines[index] = { ...db.medicines[index], ...req.body };
      await saveDB(db);
      res.json(db.medicines[index]);
    } else {
      res.status(404).json({ message: "Medicine not found" });
    }
  });
  app.delete("/api/medicines/:id", authenticateToken, isAdmin, async (req, res) => {
    const db = await getDB();
    db.medicines = db.medicines.filter((m) => m.id !== req.params.id);
    await saveDB(db);
    res.status(204).end();
  });
  app.get("/api/sales", authenticateToken, async (req, res) => {
    const db = await getDB();
    res.json(db.sales);
  });
  app.post("/api/sales", authenticateToken, async (req, res) => {
    const db = await getDB();
    const { items, customerName } = req.body;
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
    for (const item of items) {
      const med = db.medicines.find((m) => m.id === item.medicineId);
      if (med) {
        if (med.stock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${med.name}` });
        }
        med.stock -= item.quantity;
      }
    }
    const newSale = {
      id: Date.now().toString(),
      items,
      totalAmount,
      customerName,
      date: (/* @__PURE__ */ new Date()).toISOString(),
      userId: req.user.id
    };
    db.sales.push(newSale);
    await saveDB(db);
    res.status(201).json(newSale);
  });
  app.get("/api/purchases", authenticateToken, async (req, res) => {
    const db = await getDB();
    res.json(db.purchases);
  });
  app.post("/api/purchases", authenticateToken, isAdmin, async (req, res) => {
    const db = await getDB();
    const { medicineId, quantity, purchasePrice, supplierId } = req.body;
    const med = db.medicines.find((m) => m.id === medicineId);
    if (med) {
      med.stock += quantity;
      med.purchasePrice = purchasePrice;
    }
    const newPurchase = {
      id: Date.now().toString(),
      medicineId,
      quantity,
      purchasePrice,
      totalPrice: quantity * purchasePrice,
      date: (/* @__PURE__ */ new Date()).toISOString(),
      supplierId
    };
    db.purchases.push(newPurchase);
    await saveDB(db);
    res.status(201).json(newPurchase);
  });
  app.get("/api/suppliers", authenticateToken, async (req, res) => {
    const db = await getDB();
    res.json(db.suppliers);
  });
  app.post("/api/suppliers", authenticateToken, isAdmin, async (req, res) => {
    const db = await getDB();
    const newSupplier = { ...req.body, id: Date.now().toString() };
    db.suppliers.push(newSupplier);
    await saveDB(db);
    res.status(201).json(newSupplier);
  });
  app.get("/api/stats", authenticateToken, async (req, res) => {
    const db = await getDB();
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const todaySales = db.sales.filter((s) => new Date(s.date) >= today);
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const performance = getPerformanceSummary(db);
    const lowStock = db.medicines.filter((m) => m.stock <= m.minStock);
    const nearingExpiryDate = /* @__PURE__ */ new Date();
    nearingExpiryDate.setMonth(nearingExpiryDate.getMonth() + 3);
    const nearingExpiry = db.medicines.filter((m) => new Date(m.expiryDate) <= nearingExpiryDate);
    const salesByDay = [];
    for (let i = 6; i >= 0; i--) {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const daySales = db.sales.filter((s) => {
        const sd = new Date(s.date);
        return sd.getDate() === d.getDate() && sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
      });
      salesByDay.push({
        date: d.toLocaleDateString("en-US", { weekday: "short" }),
        amount: daySales.reduce((sum, s) => sum + s.totalAmount, 0)
      });
    }
    res.json({
      todayRevenue,
      todaySalesCount: todaySales.length,
      lowStockCount: lowStock.length,
      nearingExpiryCount: nearingExpiry.length,
      performance,
      salesByDay,
      medicinesCount: db.medicines.length,
      recentSales: db.sales.slice(-5).reverse(),
      lowStockMedicines: lowStock.slice(0, 5)
    });
  });
  app.get("/api/reports/:type", authenticateToken, async (req, res) => {
    const db = await getDB();
    const type = req.params.type;
    const generatedAt = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    if (type === "sales") {
      const rows = db.sales.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((sale) => [
        sale.id,
        new Date(sale.date).toLocaleString(),
        sale.customerName || "Walk-in",
        sale.items.map((item) => `${item.medicineName} x ${item.quantity}`).join("; "),
        sale.totalAmount.toFixed(2),
        calculateSaleProfit(sale, db.medicines).toFixed(2)
      ]);
      sendCsvReport(
        res,
        `sales-report-${generatedAt}.csv`,
        toCsv(["Sale ID", "Date", "Customer", "Items", "Sales Amount", "Estimated Profit"], rows)
      );
      return;
    }
    if (type === "purchases") {
      const supplierById = new Map(db.suppliers.map((supplier) => [supplier.id, supplier.name]));
      const medicineById = new Map(db.medicines.map((medicine) => [medicine.id, medicine.name]));
      const rows = db.purchases.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((purchase) => [
        purchase.id,
        new Date(purchase.date).toLocaleString(),
        medicineById.get(purchase.medicineId) || purchase.medicineId,
        supplierById.get(purchase.supplierId) || purchase.supplierId,
        purchase.quantity,
        purchase.purchasePrice.toFixed(2),
        purchase.totalPrice.toFixed(2)
      ]);
      sendCsvReport(
        res,
        `purchase-report-${generatedAt}.csv`,
        toCsv(["Purchase ID", "Date", "Medicine", "Supplier", "Quantity", "Unit Cost", "Total Cost"], rows)
      );
      return;
    }
    if (type === "profit") {
      const performance = getPerformanceSummary(db);
      const rows = [
        ["Daily", performance.daily.count, performance.daily.sales.toFixed(2), performance.daily.profit.toFixed(2)],
        ["Weekly", performance.weekly.count, performance.weekly.sales.toFixed(2), performance.weekly.profit.toFixed(2)],
        ["Monthly", performance.monthly.count, performance.monthly.sales.toFixed(2), performance.monthly.profit.toFixed(2)]
      ];
      sendCsvReport(
        res,
        `profit-report-${generatedAt}.csv`,
        toCsv(["Period", "Sales Count", "Sales Amount", "Estimated Profit"], rows)
      );
      return;
    }
    if (type === "inventory") {
      const rows = db.medicines.map((medicine) => [
        medicine.name,
        medicine.genericName,
        medicine.batchNumber,
        medicine.expiryDate,
        medicine.stock,
        medicine.minStock,
        medicine.purchasePrice.toFixed(2),
        medicine.salePrice.toFixed(2),
        (medicine.stock * medicine.purchasePrice).toFixed(2),
        (medicine.stock * medicine.salePrice).toFixed(2)
      ]);
      sendCsvReport(
        res,
        `inventory-report-${generatedAt}.csv`,
        toCsv(["Medicine", "Generic Name", "Batch", "Expiry Date", "Stock", "Minimum Stock", "Purchase Price", "Sale Price", "Stock Cost Value", "Retail Value"], rows)
      );
      return;
    }
    res.status(404).json({ message: "Report type not found" });
  });
  app.get("/api/backup", authenticateToken, isAdmin, async (req, res) => {
    const db = await getDB();
    res.setHeader("Content-disposition", "attachment; filename=pharma_backup.json");
    res.setHeader("Content-type", "application/json");
    res.write(JSON.stringify(db, null, 2));
    res.end();
  });
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
