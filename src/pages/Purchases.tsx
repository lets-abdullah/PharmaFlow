import React, { useState, useEffect } from 'react';
import { Truck, Plus, Package, Calendar, DollarSign, User, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '../components/CurrencyContext';

interface Purchase {
  id: string;
  medicineId: string;
  quantity: number;
  purchasePrice: number;
  totalPrice: number;
  date: string;
  supplierId: string;
}

interface Medicine {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { formatCurrency } = useCurrency();

  const [formData, setFormData] = useState({
    medicineId: '',
    quantity: 0,
    purchasePrice: 0,
    supplierId: ''
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/purchases').then(res => res.json()),
      fetch('/api/medicines').then(res => res.json()),
      fetch('/api/suppliers').then(res => res.json())
    ]).then(([p, m, s]) => {
      setPurchases(Array.isArray(p) ? p : []);
      setMedicines(Array.isArray(m) ? m : []);
      setSuppliers(Array.isArray(s) ? s : []);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      toast.success('Purchase recorded and stock updated');
      setIsModalOpen(false);
      // Refresh
      fetch('/api/purchases')
        .then(res => res.json())
        .then(data => setPurchases(Array.isArray(data) ? data : []));
    } else {
      toast.error('Failed to record purchase');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchases & Inward</h1>
          <p className="text-gray-500 text-sm">Add new inventory and manage supplier invoices.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          <span>New Purchase</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Medicine</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit Price</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No purchases recorded yet</td>
              </tr>
            ) : (
              purchases.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(p.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{medicines.find(m => m.id === p.medicineId)?.name}</td>
                  <td className="px-6 py-4 text-sm">{p.quantity}</td>
                  <td className="px-6 py-4 text-sm">{formatCurrency(p.purchasePrice)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-blue-600">{formatCurrency(p.totalPrice)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{suppliers.find(s => s.id === p.supplierId)?.name || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Record New Purchase</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Medicine</label>
                <select 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.medicineId}
                  onChange={e => setFormData({...formData, medicineId: e.target.value})}
                  required
                >
                  <option value="">Choose medicine...</option>
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quantity</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Unit Purchase Price</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.purchasePrice}
                    onChange={e => setFormData({...formData, purchasePrice: parseFloat(e.target.value)})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Supplier</label>
                <select 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.supplierId}
                  onChange={e => setFormData({...formData, supplierId: e.target.value})}
                  required
                >
                  <option value="">Choose supplier...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">Save Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
