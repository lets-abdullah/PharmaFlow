export type MockUser = {
  id: string;
  username: string;
  role: 'admin' | 'staff';
  name: string;
};

export type MockMedicine = {
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
};

export type MockSupplier = {
  id: string;
  name: string;
  contact: string;
  address: string;
};

export type MockSaleItem = {
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  total: number;
};

export type MockSale = {
  id: string;
  items: MockSaleItem[];
  totalAmount: number;
  customerName?: string;
  date: string;
  userId: string;
};

export type MockPurchase = {
  id: string;
  medicineId: string;
  quantity: number;
  purchasePrice: number;
  totalPrice: number;
  date: string;
  supplierId: string;
};

export type MockStats = {
  todayRevenue: number;
  todaySalesCount: number;
  lowStockCount: number;
  nearingExpiryCount: number;
  performance?: {
    daily: { sales: number; profit: number; count: number };
    weekly: { sales: number; profit: number; count: number };
    monthly: { sales: number; profit: number; count: number };
  };
  salesByDay: { date: string; amount: number }[];
  medicinesCount: number;
  recentSales: MockSale[];
  lowStockMedicines: MockMedicine[];
};

const now = new Date();
const iso = (d: Date) => d.toISOString();

const DEMO_USER: MockUser = {
  id: '1',
  username: 'admin',
  role: 'admin',
  name: 'Admin Owner',
};

let medicines: MockMedicine[] = [
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
    supplierId: 's1',
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
    supplierId: 's2',
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
    supplierId: 's1',
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
    supplierId: 's2',
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
    supplierId: 's1',
  },
];

const suppliers: MockSupplier[] = [
  {
    id: 's1',
    name: 'Global Pharma Distribution',
    contact: '+1 234 567 890',
    address: 'Industrial Area, Block 4, City Centre',
  },
  {
    id: 's2',
    name: 'Reliable Medical Supplies',
    contact: '+1 987 654 321',
    address: 'Port Warehouse, Dock 12',
  },
];

let sales: MockSale[] = [
  {
    id: 'sale1',
    items: [{ medicineId: 'm1', medicineName: 'Paracetamol 500mg', quantity: 10, price: 2.0, total: 20.0 }],
    totalAmount: 20.0,
    customerName: 'Walking Customer',
    date: iso(new Date(Date.now() - 86400000 * 2)),
    userId: '1',
  },
  {
    id: 'sale2',
    items: [{ medicineId: 'm3', medicineName: 'Ibuprofen 400mg', quantity: 5, price: 4.5, total: 22.5 }],
    totalAmount: 22.5,
    customerName: 'John Doe',
    date: iso(new Date(Date.now() - 86400000 * 1)),
    userId: '1',
  },
  {
    id: 'sale3',
    items: [
      { medicineId: 'm1', medicineName: 'Paracetamol 500mg', quantity: 2, price: 2.0, total: 4.0 },
      { medicineId: 'm4', medicineName: 'Cetirizine 10mg', quantity: 3, price: 3.0, total: 9.0 },
    ],
    totalAmount: 13.0,
    customerName: 'Jane Smith',
    date: iso(new Date()),
    userId: '1',
  },
];

let purchases: MockPurchase[] = [];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function calcSaleProfit(sale: MockSale) {
  return sale.items.reduce((sum, item) => {
    const med = medicines.find((m) => m.id === item.medicineId);
    const purchasePrice = med?.purchasePrice ?? 0;
    return sum + (item.price - purchasePrice) * item.quantity;
  }, 0);
}

function getPerformanceSummary(): MockStats['performance'] {
  const today = startOfDay(now);
  const weekly = new Date(today);
  weekly.setDate(weekly.getDate() - 6);
  const monthly = new Date(today.getFullYear(), today.getMonth(), 1);

  const calc = (start: Date) => {
    const periodSales = sales.filter((s) => new Date(s.date) >= start);
    return {
      sales: periodSales.reduce((sum, s) => sum + s.totalAmount, 0),
      profit: periodSales.reduce((sum, s) => sum + calcSaleProfit(s), 0),
      count: periodSales.length,
    };
  };

  return {
    daily: calc(today),
    weekly: calc(weekly),
    monthly: calc(monthly),
  };
}

export function isMockEnabled() {
  // Works when Vercel sets runtime env via VITE_MOCK_API at build time.
  // Fallback to VITE_PUBLIC_MOCK_API for safety.
  const envAny = (import.meta as any)?.env ?? {};
  const v = envAny.VITE_MOCK_API ?? envAny.VITE_PUBLIC_MOCK_API;
  return String(v) === 'true' || String(v) === '1';
}



export async function mockFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === 'string' ? input : input.toString();
  const method = (init?.method ?? 'GET').toUpperCase();

  // Only intercept /api/*
  if (!url.includes('/api/')) {
    return fetch(input, init);
  }

  const resJson = (body: any, ok = true, code?: number) => {
    const statusCode = ok ? (code ?? 200) : (code ?? 500);
    return new Response(JSON.stringify(body), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  };


  const notFound = () => new Response(JSON.stringify({ message: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

  try {
    if (method === 'GET' && url.endsWith('/api/auth/me')) {
      return resJson(DEMO_USER);
    }

    if (method === 'POST' && url.endsWith('/api/auth/login')) {
      return resJson(DEMO_USER);
    }

    if (method === 'POST' && url.endsWith('/api/auth/logout')) {
      return resJson({ message: 'Logged out' });
    }

    if (method === 'GET' && url.endsWith('/api/medicines')) {
      return resJson(medicines);
    }

    if (method === 'POST' && url.endsWith('/api/medicines')) {
      const body = JSON.parse(String(init?.body ?? '{}'));
      const newMed: MockMedicine = { ...body, id: Date.now().toString() };
      medicines = [newMed, ...medicines];
      return resJson(newMed, true, 201);
    }

    const medIdMatch = url.match(/\/api\/medicines\/(.+)$/);
    if (medIdMatch) {
      const id = medIdMatch[1];
      const idx = medicines.findIndex((m) => m.id === id);

      if (method === 'PUT') {
        const body = JSON.parse(String(init?.body ?? '{}'));
        if (idx === -1) return notFound();
        medicines[idx] = { ...medicines[idx], ...body };
        return resJson(medicines[idx]);
      }

      if (method === 'DELETE') {
        if (idx === -1) return notFound();
        medicines = medicines.filter((m) => m.id !== id);
        return new Response(null, { status: 204 });
      }
    }

    if (method === 'GET' && url.endsWith('/api/sales')) {
      return resJson(sales);
    }

    if (method === 'POST' && url.endsWith('/api/sales')) {
      const body = JSON.parse(String(init?.body ?? '{}'));
      const { items, customerName } = body;
      const totalAmount = (items as any[]).reduce((sum, it) => sum + it.total, 0);

      // naive stock decrement
      for (const item of items as any[]) {
        const med = medicines.find((m) => m.id === item.medicineId);
        if (med) {
          med.stock = Math.max(0, med.stock - item.quantity);
        }
      }

      const newSale: MockSale = {
        id: Date.now().toString(),
        items: items.map((it: any) => ({
          medicineId: it.medicineId,
          medicineName: it.medicineName,
          quantity: it.quantity,
          price: it.price,
          total: it.total,
        })),
        totalAmount,
        customerName,
        date: iso(new Date()),
        userId: DEMO_USER.id,
      };

      sales = [newSale, ...sales];
      return resJson(newSale, true, 201);
    }

    if (method === 'GET' && url.endsWith('/api/purchases')) {
      return resJson(purchases);
    }

    if (method === 'POST' && url.endsWith('/api/purchases')) {
      const body = JSON.parse(String(init?.body ?? '{}'));
      const { medicineId, quantity, purchasePrice, supplierId } = body;
      const med = medicines.find((m) => m.id === medicineId);
      if (med) {
        med.stock += quantity;
        med.purchasePrice = purchasePrice;
      }
      const newPurchase: MockPurchase = {
        id: Date.now().toString(),
        medicineId,
        quantity,
        purchasePrice,
        totalPrice: quantity * purchasePrice,
        date: iso(new Date()),
        supplierId,
      };
      purchases = [newPurchase, ...purchases];
      return resJson(newPurchase, true, 201);
    }

    if (method === 'GET' && url.endsWith('/api/suppliers')) {
      return resJson(suppliers);
    }

    if (method === 'GET' && url.endsWith('/api/stats')) {
      const today = startOfDay(new Date());
      const todaySales = sales.filter((s) => new Date(s.date) >= today);
      const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);

      const lowStock = medicines.filter((m) => m.stock <= m.minStock);
      const nearingExpiryDate = new Date();
      nearingExpiryDate.setMonth(nearingExpiryDate.getMonth() + 3);
      const nearingExpiry = medicines.filter((m) => new Date(m.expiryDate) <= nearingExpiryDate);

      const salesByDay: MockStats['salesByDay'] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const daySales = sales.filter((s) => {
          const sd = new Date(s.date);
          return sd.getDate() === d.getDate() && sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
        });
        salesByDay.push({
          date: d.toLocaleDateString('en-US', { weekday: 'short' }),
          amount: daySales.reduce((sum, s) => sum + s.totalAmount, 0),
        });
      }

      const performance = getPerformanceSummary();

      const out: MockStats = {
        todayRevenue,
        todaySalesCount: todaySales.length,
        lowStockCount: lowStock.length,
        nearingExpiryCount: nearingExpiry.length,
        performance,
        salesByDay,
        medicinesCount: medicines.length,
        recentSales: sales.slice(0, 5),
        lowStockMedicines: lowStock.slice(0, 5),
      };
      return resJson(out);
    }

    const reportMatch = url.match(/\/api\/reports\/(.+)$/);
    if (method === 'GET' && reportMatch) {
      const type = reportMatch[1];
      const csv = `type,generatedAt\n${type},${new Date().toISOString()}`;
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${type}-report.csv"`,
        },
      });
    }

    return notFound();
  } catch {
    return new Response(JSON.stringify({ message: 'Mock API error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

