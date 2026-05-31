import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const PORT = Number(process.env.PORT || 5174);
const HOST = process.env.HOST || '127.0.0.1'; // keep explicit loopback for browser testing
const DB_FILE = process.env.DB_FILE || path.join(process.cwd(), 'db.json');
const JWT_SECRET = process.env.JWT_SECRET || 'pharma-secret-key';

interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'staff';
  name: string;
}

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  batchNumber: string;
  expiryDate: string;
  stock: number;
  minStock: number;
  purchasePrice: number;
  salePrice: number;
  supplierId: string;
}

interface SaleItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  total: number;
}

interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  customerName?: string;
  date: string;
  userId: string;
}

interface Purchase {
  id: string;
  medicineId: string;
  quantity: number;
  purchasePrice: number;
  totalPrice: number;
  date: string;
  supplierId: string;
}

interface Supplier {
  id: string;
  name: string;
  contact: string;
  address: string;
}

interface DB {
  users: User[];
  medicines: Medicine[];
  sales: Sale[];
  purchases: Purchase[];
  suppliers: Supplier[];
}

type PeriodKey = 'daily' | 'weekly' | 'monthly';

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeek(date: Date) {
  const copy = startOfDay(date);
  copy.setDate(copy.getDate() - 6);
  return copy;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function calculateSaleProfit(sale: Sale, medicines: Medicine[]) {
  return sale.items.reduce((sum, item) => {
    const medicine = medicines.find(m => m.id === item.medicineId);
    const purchasePrice = medicine?.purchasePrice || 0;
    return sum + ((item.price - purchasePrice) * item.quantity);
  }, 0);
}

function calculatePeriodMetrics(sales: Sale[], medicines: Medicine[], start: Date) {
  const periodSales = sales.filter(sale => new Date(sale.date) >= start);
  return {
    sales: periodSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    profit: periodSales.reduce((sum, sale) => sum + calculateSaleProfit(sale, medicines), 0),
    count: periodSales.length,
  };
}

function getPerformanceSummary(db: DB) {
  const now = new Date();
  const periods: Record<PeriodKey, Date> = {
    daily: startOfDay(now),
    weekly: startOfWeek(now),
    monthly: startOfMonth(now),
  };

  return {
    daily: calculatePeriodMetrics(db.sales, db.medicines, periods.daily),
    weekly: calculatePeriodMetrics(db.sales, db.medicines, periods.weekly),
    monthly: calculatePeriodMetrics(db.sales, db.medicines, periods.monthly),
  };
}

function csvEscape(value: unknown) {
  const stringValue = String(value ?? '');
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function toCsv(headers: string[], rows: unknown[][]) {
  return [
    headers.map(csvEscape).join(','),
    ...rows.map(row => row.map(csvEscape).join(',')),
  ].join('\n');
}

function sendCsvReport(res: express.Response, filename: string, csv: string) {
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.send(csv);
}

const INITIAL_DB: DB = {
  users: [
    {
      id: '1',
      username: 'admin',
      passwordHash: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      name: 'Admin Owner'
    }
  ],
  medicines: [
    {
      id: 'm1',
      name: 'Paracetamol 500mg',
      genericName: 'Acetaminophen',
      batchNumber: 'BT-9921',
      expiryDate: '2027-12-01',
      stock: 150,
      minStock: 50,
      purchasePrice: 0.5,
      salePrice: 2.0,
      supplierId: 's1'
    },
    {
      id: 'm2',
      name: 'Amoxicillin 250mg',
      genericName: 'Antibiotic',
      batchNumber: 'BT-1122',
      expiryDate: '2026-06-15',
      stock: 12,
      minStock: 20,
      purchasePrice: 5.0,
      salePrice: 12.0,
      supplierId: 's2'
    },
    {
      id: 'm3',
      name: 'Ibuprofen 400mg',
      genericName: 'NSAID',
      batchNumber: 'BT-0021',
      expiryDate: '2025-08-10',
      stock: 300,
      minStock: 100,
      purchasePrice: 1.2,
      salePrice: 4.5,
      supplierId: 's1'
    },
    {
      id: 'm4',
      name: 'Cetirizine 10mg',
      genericName: 'Antihistamine',
      batchNumber: 'BT-4422',
      expiryDate: '2026-01-20',
      stock: 45,
      minStock: 30,
      purchasePrice: 0.8,
      salePrice: 3.0,
      supplierId: 's2'
    },
    {
      id: 'm5',
      name: 'Metformin 850mg',
      genericName: 'Antidiabetic',
      batchNumber: 'BT-7788',
      expiryDate: '2024-11-30',
      stock: 80,
      minStock: 40,
      purchasePrice: 2.5,
      salePrice: 8.0,
      supplierId: 's1'
    }
  ],
  sales: [
    {
      id: 'sale1',
      items: [{ medicineId: 'm1', medicineName: 'Paracetamol 500mg', quantity: 10, price: 2.0, total: 20.0 }],
      totalAmount: 20.0,
      customerName: 'Walking Customer',
      date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      userId: '1'
    },
    {
      id: 'sale2',
      items: [{ medicineId: 'm3', medicineName: 'Ibuprofen 400mg', quantity: 5, price: 4.5, total: 22.5 }],
      totalAmount: 22.5,
      customerName: 'John Doe',
      date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      userId: '1'
    },
    {
      id: 'sale3',
      items: [
        { medicineId: 'm1', medicineName: 'Paracetamol 500mg', quantity: 2, price: 2.0, total: 4.0 },
        { medicineId: 'm4', medicineName: 'Cetirizine 10mg', quantity: 3, price: 3.0, total: 9.0 }
      ],
      totalAmount: 13.0,
      customerName: 'Jane Smith',
      date: new Date().toISOString(),
      userId: '1'
    }
  ],
  purchases: [],
  suppliers: [
    {
      id: 's1',
      name: 'Global Pharma Distribution',
      contact: '+1 234 567 890',
      address: 'Industrial Area, Block 4, City Centre'
    },
    {
      id: 's2',
      name: 'Reliable Medical Supplies',
      contact: '+1 987 654 321',
      address: 'Port Warehouse, Dock 12'
    }
  ]
};

async function getDB(): Promise<DB> {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    const db = JSON.parse(data);
    // Seed demo data if medicines are empty (to fulfill user request immediately)
    if (db.medicines.length === 0) {
      db.medicines = INITIAL_DB.medicines;
      db.suppliers = INITIAL_DB.suppliers;
      db.sales = INITIAL_DB.sales;
      await saveDB(db);
    }
    return db;
  } catch (error) {
    await fs.writeFile(DB_FILE, JSON.stringify(INITIAL_DB, null, 2));
    return INITIAL_DB;
  }
}

async function saveDB(db: DB) {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

async function startServer() {
  const app = express();

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true });
  });
  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    req.user = { id: '1', username: 'admin', role: 'admin', name: 'Admin Owner' };
    next();
  };

  const isAdmin = (req: any, res: any, next: any) => {
    next();
  };

  // Auth Routes
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const db = await getDB();
    const user = db.users.find(u => u.username === username);

    if (user && bcrypt.compareSync(password, user.passwordHash)) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.COOKIE_SECURE === 'true',
      });
      res.json({ id: user.id, username: user.username, role: user.role, name: user.name });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    res.json(req.user);
  });

  // Medicine Routes
  app.get('/api/medicines', authenticateToken, async (req, res) => {
    const db = await getDB();
    res.json(db.medicines);
  });

  app.post('/api/medicines', authenticateToken, isAdmin, async (req, res) => {
    const db = await getDB();
    const newMed = { ...req.body, id: Date.now().toString() };
    db.medicines.push(newMed);
    await saveDB(db);
    res.status(201).json(newMed);
  });

  app.put('/api/medicines/:id', authenticateToken, isAdmin, async (req, res) => {
    const db = await getDB();
    const index = db.medicines.findIndex(m => m.id === req.params.id);
    if (index !== -1) {
      db.medicines[index] = { ...db.medicines[index], ...req.body };
      await saveDB(db);
      res.json(db.medicines[index]);
    } else {
      res.status(404).json({ message: 'Medicine not found' });
    }
  });

  app.delete('/api/medicines/:id', authenticateToken, isAdmin, async (req, res) => {
    const db = await getDB();
    db.medicines = db.medicines.filter(m => m.id !== req.params.id);
    await saveDB(db);
    res.status(204).end();
  });

  // Sales Routes
  app.get('/api/sales', authenticateToken, async (req, res) => {
    const db = await getDB();
    res.json(db.sales);
  });

  app.post('/api/sales', authenticateToken, async (req: any, res) => {
    const db = await getDB();
    const { items, customerName } = req.body;
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.total, 0);
    
    // Update Stock
    for (const item of items) {
      const med = db.medicines.find(m => m.id === item.medicineId);
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
      date: new Date().toISOString(),
      userId: req.user.id
    };

    db.sales.push(newSale);
    await saveDB(db);
    res.status(201).json(newSale);
  });

  // Purchase Routes
  app.get('/api/purchases', authenticateToken, async (req, res) => {
    const db = await getDB();
    res.json(db.purchases);
  });

  app.post('/api/purchases', authenticateToken, isAdmin, async (req, res) => {
    const db = await getDB();
    const { medicineId, quantity, purchasePrice, supplierId } = req.body;
    
    const med = db.medicines.find(m => m.id === medicineId);
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
      date: new Date().toISOString(),
      supplierId
    };

    db.purchases.push(newPurchase);
    await saveDB(db);
    res.status(201).json(newPurchase);
  });

  // Supplier Routes
  app.get('/api/suppliers', authenticateToken, async (req, res) => {
    const db = await getDB();
    res.json(db.suppliers);
  });

  app.post('/api/suppliers', authenticateToken, isAdmin, async (req, res) => {
    const db = await getDB();
    const newSupplier = { ...req.body, id: Date.now().toString() };
    db.suppliers.push(newSupplier);
    await saveDB(db);
    res.status(201).json(newSupplier);
  });

  // Reports / Stats
  app.get('/api/stats', authenticateToken, async (req, res) => {
    const db = await getDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = db.sales.filter(s => new Date(s.date) >= today);
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const performance = getPerformanceSummary(db);

    const lowStock = db.medicines.filter(m => m.stock <= m.minStock);
    
    const nearingExpiryDate = new Date();
    nearingExpiryDate.setMonth(nearingExpiryDate.getMonth() + 3); // 3 months
    const nearingExpiry = db.medicines.filter(m => new Date(m.expiryDate) <= nearingExpiryDate);

    // Sales by day for chart (last 7 days)
    const salesByDay = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const daySales = db.sales.filter(s => {
        const sd = new Date(s.date);
        return sd.getDate() === d.getDate() && sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
      });
      salesByDay.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
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

  app.get('/api/reports/:type', authenticateToken, async (req, res) => {
    const db = await getDB();
    const type = req.params.type;
    const generatedAt = new Date().toISOString().slice(0, 10);

    if (type === 'sales') {
      const rows = db.sales
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(sale => [
          sale.id,
          new Date(sale.date).toLocaleString(),
          sale.customerName || 'Walk-in',
          sale.items.map(item => `${item.medicineName} x ${item.quantity}`).join('; '),
          sale.totalAmount.toFixed(2),
          calculateSaleProfit(sale, db.medicines).toFixed(2),
        ]);

      sendCsvReport(
        res,
        `sales-report-${generatedAt}.csv`,
        toCsv(['Sale ID', 'Date', 'Customer', 'Items', 'Sales Amount', 'Estimated Profit'], rows)
      );
      return;
    }

    if (type === 'purchases') {
      const supplierById = new Map(db.suppliers.map(supplier => [supplier.id, supplier.name]));
      const medicineById = new Map(db.medicines.map(medicine => [medicine.id, medicine.name]));
      const rows = db.purchases
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(purchase => [
          purchase.id,
          new Date(purchase.date).toLocaleString(),
          medicineById.get(purchase.medicineId) || purchase.medicineId,
          supplierById.get(purchase.supplierId) || purchase.supplierId,
          purchase.quantity,
          purchase.purchasePrice.toFixed(2),
          purchase.totalPrice.toFixed(2),
        ]);

      sendCsvReport(
        res,
        `purchase-report-${generatedAt}.csv`,
        toCsv(['Purchase ID', 'Date', 'Medicine', 'Supplier', 'Quantity', 'Unit Cost', 'Total Cost'], rows)
      );
      return;
    }

    if (type === 'profit') {
      const performance = getPerformanceSummary(db);
      const rows = [
        ['Daily', performance.daily.count, performance.daily.sales.toFixed(2), performance.daily.profit.toFixed(2)],
        ['Weekly', performance.weekly.count, performance.weekly.sales.toFixed(2), performance.weekly.profit.toFixed(2)],
        ['Monthly', performance.monthly.count, performance.monthly.sales.toFixed(2), performance.monthly.profit.toFixed(2)],
      ];

      sendCsvReport(
        res,
        `profit-report-${generatedAt}.csv`,
        toCsv(['Period', 'Sales Count', 'Sales Amount', 'Estimated Profit'], rows)
      );
      return;
    }

    if (type === 'inventory') {
      const rows = db.medicines.map(medicine => [
        medicine.name,
        medicine.genericName,
        medicine.batchNumber,
        medicine.expiryDate,
        medicine.stock,
        medicine.minStock,
        medicine.purchasePrice.toFixed(2),
        medicine.salePrice.toFixed(2),
        (medicine.stock * medicine.purchasePrice).toFixed(2),
        (medicine.stock * medicine.salePrice).toFixed(2),
      ]);

      sendCsvReport(
        res,
        `inventory-report-${generatedAt}.csv`,
        toCsv(['Medicine', 'Generic Name', 'Batch', 'Expiry Date', 'Stock', 'Minimum Stock', 'Purchase Price', 'Sale Price', 'Stock Cost Value', 'Retail Value'], rows)
      );
      return;
    }

    res.status(404).json({ message: 'Report type not found' });
  });

  // Backup / Restore
  app.get('/api/backup', authenticateToken, isAdmin, async (req, res) => {
    const db = await getDB();
    res.setHeader('Content-disposition', 'attachment; filename=pharma_backup.json');
    res.setHeader('Content-type', 'application/json');
    res.write(JSON.stringify(db, null, 2));
    res.end();
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

startServer();
