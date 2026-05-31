import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Minus, 
  CreditCard, 
  Printer, 
  User,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '../components/CurrencyContext';

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  stock: number;
  salePrice: number;
}

interface CartItem {
  medicineId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  maxStock: number;
}

export default function Sales() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    fetch('/api/medicines')
      .then(res => res.json())
      .then(data => setMedicines(Array.isArray(data) ? data : []));
  }, []);

  const addToCart = (med: Medicine) => {
    const existing = cart.find(item => item.medicineId === med.id);
    if (existing) {
      if (existing.quantity >= med.stock) {
        toast.error('Insufficient stock');
        return;
      }
      setCart(cart.map(item => 
        item.medicineId === med.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      if (med.stock < 1) {
        toast.error('Out of stock');
        return;
      }
      setCart([...cart, {
        medicineId: med.id,
        name: med.name,
        quantity: 1,
        price: med.salePrice,
        total: med.salePrice,
        maxStock: med.stock
      }]);
    }
    setSearchQuery('');
    toast.success(`${med.name} added to cart`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.medicineId === id) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        if (newQty > item.maxStock) {
          toast.error('Insufficient stock');
          return item;
        }
        return { ...item, quantity: newQty, total: newQty * item.price };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.medicineId !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, customerName })
      });

      if (res.ok) {
        toast.success('Sale completed successfully');
        setCart([]);
        setCustomerName('');
        // Refresh medicines for stock updates
        fetch('/api/medicines')
          .then(res => res.json())
          .then(data => setMedicines(Array.isArray(data) ? data : []));
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to complete sale');
      }
    } catch (err) {
      toast.error('Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const searchResults = searchQuery.length > 1 
    ? medicines.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-160px)]">
      {/* Left Column: Product Search */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search size={20} className="text-blue-600" />
            <span>Search Medicines</span>
          </h2>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search by medicine name..."
              className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition text-lg"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 border border-gray-300 rounded bg-white text-[10px] font-mono">F1</kbd>
            </div>
          </div>

          {/* Results List */}
          {searchQuery.length > 1 && (
            <div className="mt-4 border border-gray-100 rounded-xl overflow-hidden shadow-lg animate-in slide-in-from-top-2 duration-200">
              {searchResults.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {searchResults.map(med => (
                    <button
                      key={med.id}
                      onClick={() => addToCart(med)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition flex justify-between items-center group"
                    >
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition">{med.name}</div>
                        <div className="text-xs text-gray-500">{med.genericName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-blue-600">{formatCurrency(med.salePrice)}</div>
                        <div className={`text-[10px] font-medium ${med.stock < 10 ? 'text-red-500' : 'text-gray-400'}`}>
                          Stock: {med.stock}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400 bg-gray-50">
                  No medicines matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart List */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ShoppingBag size={20} className="text-blue-600" />
              <span>Current Invoice</span>
            </h2>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase">
              {cart.length} Items
            </span>
          </div>
          
          <div className="flex-1 overflow-auto">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                <ShoppingBag size={48} strokeWidth={1} className="mb-4 opacity-20" />
                <p className="font-medium">Your cart is empty</p>
                <p className="text-xs mt-1 text-gray-300">Search and add medicines above to start billing</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="text-xs font-semibold text-gray-400 uppercase tracking-wider sticky top-0 bg-white">
                  <tr>
                    <th className="px-6 py-3">Medicine</th>
                    <th className="px-6 py-3 text-center">Quantity</th>
                    <th className="px-6 py-3">Price</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cart.map(item => (
                    <tr key={item.medicineId} className="group hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={() => updateQuantity(item.medicineId, -1)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.medicineId, 1)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatCurrency(item.price)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatCurrency(item.total)}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => removeFromCart(item.medicineId)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Checkout */}
      <div className="flex flex-col gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Checkout Details</h2>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customer Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Walking Customer"
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 space-y-3">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tax (0%)</span>
              <span>{formatCurrency(0)}</span>
            </div>
            <div className="flex justify-between items-end pt-2">
              <span className="text-gray-900 font-medium">Grand Total</span>
              <span className="text-3xl font-bold text-blue-600">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="space-y-3 pt-6">
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
            >
              <CreditCard size={20} />
              <span>Complete Payment</span>
              <ArrowRight size={20} />
            </button>
            <button 
              type="button"
              className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-gray-50 transition"
              disabled={cart.length === 0}
            >
              <Printer size={18} />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-4">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg h-fit">
            <Printer size={20} />
          </div>
          <div>
            <p className="text-orange-900 text-sm font-bold">Printer Setup</p>
            <p className="text-orange-700 text-xs mt-0.5 leading-relaxed">Default thermal printer (80mm) is connected and ready for invoice printing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
