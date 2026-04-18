"use client";
import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import FiltersHeader from '@/components/FiltersHeader';
import InventoryTable from '@/components/InventoryTable';
import { useAuth } from '@/context/AuthContext';
import { LogOut } from 'lucide-react';
import { fetchInventory } from '@/services/api';

export default function YardStaffDashboard() {
  const { user, logout } = useAuth();
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFilter = async (filters) => {
    setLoading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.floor(Math.random() * 15) + 5;
        return next > 90 ? 90 : next;
      });
    }, 200);

    try {
      const data = await fetchInventory(filters);
      clearInterval(interval);
      setProgress(100);
      setInventoryData(data);
    } catch (err) {
      clearInterval(interval);
      setProgress(0);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 400);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['yard-staff']}>
      <div style={{ minHeight: '100vh', padding: '24px' }}>
        <header className="glass-panel" style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Yard Staff Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Welcome back, {user?.name}</p>
          </div>
          <button
            onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--danger)', color: 'white', borderRadius: '8px', fontWeight: '500' }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </header>

        <FiltersHeader onFilter={handleFilter} loading={loading} />

        <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <InventoryTable data={inventoryData} loading={loading} progress={progress} />
        </main>
      </div>
    </ProtectedRoute>
  );
}
