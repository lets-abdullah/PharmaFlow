import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../components/CurrencyContext';
import { 
  TrendingUp, 
  Package, 
  AlertCircle, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ShoppingCart,
  Truck,
  FileText,
  Wallet
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface Stats {
  todayRevenue: number;
  todaySalesCount: number;
  lowStockCount: number;
  nearingExpiryCount: number;
  performance?: {
    daily: PeriodMetric;
    weekly: PeriodMetric;
    monthly: PeriodMetric;
  };
  salesByDay: { date: string; amount: number }[];
  medicinesCount: number;
  recentSales?: any[];
  lowStockMedicines?: any[];
}

interface PeriodMetric {
  sales: number;
  profit: number;
  count: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setStats({
            ...data,
            salesByDay: Array.isArray(data.salesByDay) ? data.salesByDay : [],
            recentSales: Array.isArray(data.recentSales) ? data.recentSales : [],
            lowStockMedicines: Array.isArray(data.lowStockMedicines) ? data.lowStockMedicines : []
          });
        } else {
          setStats(null);
        }
        setLoading(false);
      });
  }, []);

  if (loading || !stats || !('todayRevenue' in stats)) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-xl border border-gray-100" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-[400px] bg-white rounded-xl border border-gray-100" />
          <div className="h-[400px] bg-white rounded-xl border border-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500">Real-time performance and inventory alerts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/sales')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={18} />
            <span>New Sale</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Today's Revenue" 
          value={formatCurrency(stats.todayRevenue || 0)} 
          icon={TrendingUp} 
          trend="+12%" 
          trendType="up"
          color="blue"
        />
        <StatCard 
          title="Total Medicines" 
          value={(stats.medicinesCount || 0).toString()} 
          icon={Package} 
          trend="+3 new" 
          trendType="up"
          color="green"
        />
        <StatCard 
          title="Low Stock" 
          value={(stats.lowStockCount || 0).toString()} 
          icon={AlertCircle} 
          trend={(stats.lowStockCount || 0) > 0 ? "Needs attention" : "Everything ok"} 
          trendType={(stats.lowStockCount || 0) > 0 ? "down" : "up"}
          color="orange"
        />
        <StatCard 
          title="Expiring Soon" 
          value={(stats.nearingExpiryCount || 0).toString()} 
          icon={Calendar} 
          trend="Next 3 months" 
          trendType="neutral"
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PeriodSummaryCard title="Daily" metric={stats.performance?.daily} formatCurrency={formatCurrency} />
        <PeriodSummaryCard title="Weekly" metric={stats.performance?.weekly} formatCurrency={formatCurrency} />
        <PeriodSummaryCard title="Monthly" metric={stats.performance?.monthly} formatCurrency={formatCurrency} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Sales Trend</h2>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span>Weekly Revenue</span>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.salesByDay}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Sales Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              <button onClick={() => navigate('/sales')} className="text-sm font-bold text-blue-600 hover:text-blue-700">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.recentSales?.map((sale: any) => (
                    <tr key={sale.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 text-sm text-gray-500">#{sale.id.slice(-4)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{sale.customerName || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{sale.items.length} items</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatCurrency(sale.totalAmount)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(sale.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {(!stats.recentSales || stats.recentSales.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No recent sales found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-3">
              <QuickActionItem icon={ShoppingCart} label="New Sale" color="blue" onClick={() => navigate('/sales')} />
              <QuickActionItem icon={Plus} label="Add Medicine" color="green" onClick={() => navigate('/medicines')} />
              <QuickActionItem icon={Truck} label="Purchase Order" color="indigo" onClick={() => navigate('/purchases')} />
              <QuickActionItem icon={FileText} label="View Reports" color="orange" onClick={() => navigate('/reports')} />
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Low Stock</h2>
              <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Alert</span>
            </div>
            <div className="space-y-4">
              {stats.lowStockMedicines?.map((med: any) => (
                <div key={med.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-gray-50 animate-in fade-in duration-500">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{med.name}</p>
                    <p className="text-xs text-gray-500">Stock: <span className="font-bold text-red-500">{med.stock}</span> / {med.minStock}</p>
                  </div>
                  <button 
                    onClick={() => navigate('/purchases')}
                    className="p-1.5 text-blue-600 hover:bg-white rounded-md transition shadow-sm border border-transparent hover:border-gray-100"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
              {(!stats.lowStockMedicines || stats.lowStockMedicines.length === 0) && (
                <div className="text-center py-6">
                  <Package className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-sm text-gray-400 italic">Inventory is healthy</p>
                </div>
              )}
            </div>
            {stats.lowStockMedicines && stats.lowStockMedicines.length > 0 && (
              <button 
                onClick={() => navigate('/medicines')}
                className="w-full mt-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition flex items-center justify-center gap-2 border-t border-gray-50"
              >
                View Full Inventory
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PeriodSummaryCard({ title, metric, formatCurrency }: { title: string; metric?: PeriodMetric; formatCurrency: (value: number) => string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-lg font-bold text-gray-900">Sales and Profit</h3>
        </div>
        <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
          <Wallet size={20} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-500">Sales</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(metric?.sales || 0)}</p>
        </div>
        <div className="rounded-lg bg-green-50 p-3">
          <p className="text-xs font-semibold text-green-700">Profit</p>
          <p className="mt-1 text-xl font-bold text-green-700">{formatCurrency(metric?.profit || 0)}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-400">{metric?.count || 0} sales recorded</p>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendType, color }: any) {
  const colorClasses: any = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    orange: "bg-orange-600",
    red: "bg-red-600",
    indigo: "bg-indigo-600",
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group">
      <div className={cn("absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.05] transition-opacity", colorClasses[color])} />
      <div className="flex justify-between items-start">
        <div className={cn("p-3 rounded-xl text-white shadow-lg", colorClasses[color])}>
          <Icon size={24} />
        </div>
        <div className={cn(
          "flex items-center text-xs font-bold px-2 py-1 rounded-lg",
          trendType === 'up' ? "bg-green-50 text-green-700" : 
          trendType === 'down' ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-700"
        )}>
          {trendType === 'up' && <ArrowUpRight size={14} className="mr-1" />}
          {trendType === 'down' && <ArrowDownRight size={14} className="mr-1" />}
          {trend}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  );
}

function QuickActionItem({ icon: Icon, label, color, onClick }: any) {
  const colorClasses: any = {
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    green: "bg-green-50 text-green-700 hover:bg-green-100",
    indigo: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
    orange: "bg-orange-50 text-orange-700 hover:bg-orange-100",
  };

  return (
    <button 
      onClick={onClick}
      className={cn("flex items-center gap-3 p-4 rounded-xl font-bold text-sm transition-all text-left", colorClasses[color])}
    >
      <div className="p-2 bg-white rounded-lg shadow-sm">
        <Icon size={18} />
      </div>
      <span>{label}</span>
    </button>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
