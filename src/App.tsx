import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { AuthProvider, useAuth } from './components/AuthContext';
import { CurrencyProvider, useCurrency } from './components/CurrencyContext';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Medicines from './pages/Medicines';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Suppliers from './pages/Suppliers';
import Expiry from './pages/Expiry';
import Login from './pages/Login';
import Reports from './pages/Reports';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium font-sans">Syncing PharmaFlow...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function SettingSection({ title, children }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-3 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function InputGroup({ label, placeholder }: any) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-gray-400 uppercase">{label}</label>
      <input 
        disabled
        value={placeholder}
        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed" 
      />
    </div>
  );
}

function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-gray-400 uppercase">System Currency</label>
      <select 
        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition"
        value={currency}
        onChange={(e) => setCurrency(e.target.value as any)}
      >
        <option value="USD">USD ($)</option>
        <option value="PKR">PKR (Rs)</option>
      </select>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <Router>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/medicines" 
            element={
              <ProtectedRoute>
                <Medicines />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/expiry" 
            element={
              <ProtectedRoute>
                <Expiry />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sales" 
            element={
              <ProtectedRoute>
                <Sales />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/purchases" 
            element={
              <ProtectedRoute>
                <Purchases />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/suppliers" 
            element={
              <ProtectedRoute>
                <Suppliers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <div className="max-w-xl space-y-8">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                    <p className="text-gray-500">Manage your pharmacy profile and system preferences.</p>
                  </div>
                  <div className="space-y-6">
                    <SettingSection title="Store Information">
                      <div className="space-y-4 pt-4">
                        <InputGroup label="Pharmacy Name" placeholder="PharmaFlow Demo Store" />
                        <InputGroup label="Address" placeholder="123 Medical Plaza, Health City" />
                        <CurrencySelector />
                      </div>
                    </SettingSection>
                    <SettingSection title="Data Management">
                      <div className="pt-4 flex flex-col gap-3">
                        <button 
                          onClick={() => window.open('/api/backup')}
                          className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition text-sm flex justify-between items-center"
                        >
                          <span>Generate Monthly Backup</span>
                          <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">JSON</span>
                        </button>
                        
                        <div className="relative">
                           <input 
                             type="file" 
                             className="hidden" 
                             id="restore-upload" 
                             accept=".json"
                             onChange={async (e) => {
                               const file = e.target.files?.[0];
                               if (!file) return;
                               if (confirm('Restoring will overwrite current data. Continue?')) {
                                 const reader = new FileReader();
                                 reader.onload = async (event) => {
                                   const content = event.target?.result;
                                   // In a real app, I'd POST this to an /api/restore endpoint
                                   toast.info('Restore initiated (Simulation)');
                                   console.log('Restoring data:', content);
                                 };
                                 reader.readAsText(file);
                               }
                             }}
                           />
                           <label 
                             htmlFor="restore-upload"
                             className="w-full py-2.5 px-4 bg-blue-50 border border-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 transition text-sm flex justify-between items-center cursor-pointer"
                           >
                             <span>Restore from Backup</span>
                             <span className="text-[10px] font-bold">IMPORT</span>
                           </label>
                        </div>

                        <button className="w-full py-2.5 px-4 bg-red-50 border border-red-100 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition text-sm flex justify-between items-center">
                          <span>Reset Inventory</span>
                          <span className="text-[10px] font-bold uppercase">Danger Zone</span>
                        </button>
                      </div>
                    </SettingSection>
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        <Toaster position="bottom-right" richColors />
      </CurrencyProvider>
    </AuthProvider>
  );
}
