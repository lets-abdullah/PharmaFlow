import React, { useState, useEffect } from 'react';
import { Users, Plus, Phone, MapPin, Mail, MoreHorizontal, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Supplier {
  id: string;
  name: string;
  contact: string;
  address: string;
  email?: string;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    address: '',
    email: ''
  });

  useEffect(() => {
    fetch('/api/suppliers')
      .then(res => res.json())
      .then(data => setSuppliers(Array.isArray(data) ? data : []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      toast.success('Supplier added successfully');
      setIsModalOpen(false);
      setFormData({ name: '', contact: '', address: '', email: '' });
      fetch('/api/suppliers')
        .then(res => res.json())
        .then(data => setSuppliers(Array.isArray(data) ? data : []));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers Directory</h1>
          <p className="text-gray-500 text-sm">Manage contacts and addresses of your medical distributors.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          <span>Add Supplier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map(s => (
          <div key={s.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users size={24} />
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={20} />
              </button>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{s.name}</h3>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} className="text-gray-400" />
                <span>{s.contact}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={14} className="text-gray-400" />
                <span>{s.address}</span>
              </div>
              {s.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={14} className="text-gray-400" />
                  <span>{s.email}</span>
                </div>
              )}
            </div>
            <button className="mt-6 w-full flex items-center justify-center gap-2 py-2 border border-blue-100 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition text-sm">
              <span>View History</span>
              <ExternalLink size={14} />
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Add New Supplier</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Company Name</label>
                <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact No</label>
                  <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email (Optional)</label>
                  <input type="email" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Address</label>
                <textarea rows={3} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-100">Add Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
