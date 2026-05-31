import React, { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Pill, Search, Filter } from 'lucide-react';

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  batchNumber: string;
  expiryDate: string;
  stock: number;
}

export default function Expiry() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'expired' | 'soon'>('all');

  useEffect(() => {
    fetch('/api/medicines')
      .then(res => res.json())
      .then(data => {
        setMedicines(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const getStatus = (date: string) => {
    const expiry = new Date(date);
    const now = new Date();
    const threeMonths = new Date();
    threeMonths.setMonth(threeMonths.getMonth() + 3);

    if (expiry < now) return 'expired';
    if (expiry < threeMonths) return 'soon';
    return 'safe';
  };

  const filteredMedicines = medicines.filter(med => {
    const status = getStatus(med.expiryDate);
    if (filter === 'expired') return status === 'expired';
    if (filter === 'soon') return status === 'soon';
    return status === 'expired' || status === 'soon';
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expiry Management</h1>
          <p className="text-gray-500 text-sm">Monitor medicines that are expired or expiring in the next 3 months.</p>
        </div>
        <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All Alerts</FilterButton>
          <FilterButton active={filter === 'expired'} onClick={() => setFilter('expired')}>Expired</FilterButton>
          <FilterButton active={filter === 'soon'} onClick={() => setFilter('soon')}>Expiring Soon</FilterButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-xl border border-gray-100 animate-pulse" />
          ))
        ) : filteredMedicines.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-200">
            <div className="p-4 bg-green-50 text-green-600 rounded-full w-fit mx-auto mb-4">
              <Calendar size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">All Good!</h3>
            <p className="text-gray-500 mt-1">No medicines are currently expired or nearing expiry based on your filters.</p>
          </div>
        ) : (
          filteredMedicines.map(med => (
            <div key={med.id}>
              <ExpiryCard medicine={med} status={getStatus(med.expiryDate)} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ExpiryCard({ medicine, status }: { medicine: Medicine, status: string }) {
  const isExpired = status === 'expired';
  
  return (
    <div className={cn(
      "bg-white p-6 rounded-xl border shadow-sm transition-all hover:shadow-md",
      isExpired ? "border-red-100 bg-red-50/10" : "border-orange-100 bg-orange-50/10"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "p-3 rounded-xl",
          isExpired ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
        )}>
          <AlertTriangle size={24} />
        </div>
        <div className={cn(
          "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
          isExpired ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
        )}>
          {isExpired ? 'Expired' : 'Expiring Soon'}
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-gray-900">{medicine.name}</h3>
      <p className="text-xs text-gray-500 mt-1">{medicine.genericName}</p>
      
      <div className="mt-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Batch Number</span>
          <span className="font-semibold text-gray-900">{medicine.batchNumber}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Expiry Date</span>
          <span className={cn("font-bold", isExpired ? "text-red-600" : "text-orange-600")}>
            {new Date(medicine.expiryDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric', day: 'numeric' })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Current Stock</span>
          <span className="font-semibold text-gray-900">{medicine.stock} units</span>
        </div>
      </div>
      
      <button className={cn(
        "mt-6 w-full py-2.5 rounded-lg font-bold text-sm transition-colors",
        isExpired 
          ? "bg-red-600 text-white hover:bg-red-700" 
          : "bg-orange-600 text-white hover:bg-orange-700"
      )}>
        {isExpired ? 'Remove from Stock' : 'Discount for Sale'}
      </button>
    </div>
  );
}

function FilterButton({ children, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
        active ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
      )}
    >
      {children}
    </button>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
