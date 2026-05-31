import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Pill, 
  ShoppingCart, 
  Truck, 
  Users, 
  AlertTriangle, 
  BarChart3, 
  Settings, 
  Plus
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { cn } from '@/src/lib/utils';

interface SidebarItemProps {
  to: string;
  icon: any;
  label: string;
}

function SidebarItem({ to, icon: Icon, label }: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
          isActive 
            ? "bg-blue-50 text-blue-600 font-medium" 
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        )
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
            <Plus className="bg-blue-600 text-white rounded-md p-1" size={28} strokeWidth={3} />
            <span>PharmaFlow</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem to="/medicines" icon={Pill} label="Medicines" />
          <SidebarItem to="/expiry" icon={AlertTriangle} label="Expiry Alerts" />
          <SidebarItem to="/sales" icon={ShoppingCart} label="Sales" />
          <SidebarItem to="/purchases" icon={Truck} label="Purchases" />
          <SidebarItem to="/suppliers" icon={Users} label="Suppliers" />
          <SidebarItem to="/reports" icon={BarChart3} label="Reports" />
          <SidebarItem to="/settings" icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="px-4 py-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">User</p>
            <p className="text-sm font-medium text-gray-900 leading-tight mt-1">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
