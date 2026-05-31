import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  MoreVertical, 
  Filter,
  Download,
  AlertCircle,
  X,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../components/AuthContext';
import { useCurrency } from '../components/CurrencyContext';

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

export default function Medicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();

  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    batchNumber: '',
    expiryDate: '',
    stock: 0,
    minStock: 5,
    purchasePrice: 0,
    salePrice: 0,
    supplierId: ''
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    const res = await fetch('/api/medicines');
    if (res.ok) {
      const data = await res.json();
      setMedicines(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  };

  const handleOpenModal = (med?: Medicine) => {
    if (med) {
      setEditingMed(med);
      setFormData({ ...med });
    } else {
      setEditingMed(null);
      setFormData({
        name: '',
        genericName: '',
        batchNumber: '',
        expiryDate: '',
        stock: 0,
        minStock: 5,
        purchasePrice: 0,
        salePrice: 0,
        supplierId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingMed ? `/api/medicines/${editingMed.id}` : '/api/medicines';
    const method = editingMed ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      toast.success(editingMed ? 'Medicine updated' : 'Medicine added');
      setIsModalOpen(false);
      fetchMedicines();
    } else {
      toast.error('Failed to save medicine');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this medicine?')) {
      const res = await fetch(`/api/medicines/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Medicine deleted');
        fetchMedicines();
      }
    }
  };

  const filteredMedicines = medicines.filter(med => 
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.batchNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medicines Inventory</h1>
          <p className="text-gray-500 text-sm">Manage your stock, prices, and expiry dates.</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={20} />
            <span>Add Medicine</span>
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, generic name or batch..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
            <Filter size={18} />
            <span>Filter</span>
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
            <Download size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Medicine</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch / Expiry</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price (P/S)</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading medicines...</td>
                </tr>
              ) : filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No medicines found</td>
                </tr>
              ) : (
                filteredMedicines.map(med => (
                  <tr key={med.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{med.name}</div>
                      <div className="text-xs text-gray-500">{med.genericName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-700">{med.batchNumber}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-2 h-2 rounded-full ${new Date(med.expiryDate) < new Date() ? 'bg-red-500' : 'bg-green-500'}`} />
                        <span className="text-xs text-gray-500">{new Date(med.expiryDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${med.stock <= med.minStock ? 'text-red-600' : 'text-gray-900'}`}>
                          {med.stock}
                        </span>
                        {med.stock <= med.minStock && (
                          <AlertCircle size={14} className="text-orange-500" />
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium">Min: {med.minStock}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500">P: <span className="font-medium text-gray-900">{formatCurrency(med.purchasePrice)}</span></div>
                      <div className="text-xs text-gray-500">S: <span className="font-medium text-blue-600">{formatCurrency(med.salePrice)}</span></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {user?.role === 'admin' && (
                          <>
                            <button 
                              onClick={() => handleOpenModal(med)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(med.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">{editingMed ? 'Edit Medicine' : 'Add New Medicine'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField label="Medicine Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} placeholder="e.g. Paracetamol" required />
                  <FormField label="Generic Name" value={formData.genericName} onChange={v => setFormData({...formData, genericName: v})} placeholder="e.g. Acetaminophen" required />
                  <FormField label="Batch Number" value={formData.batchNumber} onChange={v => setFormData({...formData, batchNumber: v})} placeholder="e.g. BAT-2023-01" required />
                  <FormField label="Expiry Date" type="date" value={formData.expiryDate} onChange={v => setFormData({...formData, expiryDate: v})} required />
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Stock" type="number" value={formData.stock} onChange={v => setFormData({...formData, stock: parseInt(v)})} required />
                    <FormField label="Min Stock" type="number" value={formData.minStock} onChange={v => setFormData({...formData, minStock: parseInt(v)})} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Purchase Price" type="number" value={formData.purchasePrice} onChange={v => setFormData({...formData, purchasePrice: parseFloat(v)})} required />
                    <FormField label="Sale Price" type="number" value={formData.salePrice} onChange={v => setFormData({...formData, salePrice: parseFloat(v)})} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier</label>
                    <select 
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition"
                      value={formData.supplierId}
                      onChange={e => setFormData({...formData, supplierId: e.target.value})}
                    >
                      <option value="">Select Supplier</option>
                      <option value="1">Primary Pharma Corp</option>
                      <option value="2">Global Meds Ltd</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 border border-gray-200 rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-md flex items-center gap-2"
                >
                  <Check size={20} />
                  <span>{editingMed ? 'Update Medicine' : 'Save Medicine'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', placeholder, required }: any) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
      <input 
        type={type}
        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
