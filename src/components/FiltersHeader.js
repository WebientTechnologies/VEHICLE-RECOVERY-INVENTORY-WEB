"use client";
import { useEffect, useState } from 'react';
import { fetchYards, fetchBanks } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function FiltersHeader({ onFilter, loading }) {
  const { user } = useAuth();
  const [yards, setYards] = useState([]);
  const [banks, setBanks] = useState([]);
  
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedYard, setSelectedYard] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [regNo, setRegNo] = useState('');
  const [chasisNo, setChasisNo] = useState('');

  const isYardDisabled = user?.role === 'yard-staff';

  useEffect(() => {
    const loadData = async () => {
      try {
        const [yardsData, banksData] = await Promise.all([fetchYards(), fetchBanks()]);
        setYards(yardsData);
        setBanks(banksData);

        let initialYard = '';
        if (user?.role === 'yard-staff' && user?.yardId) {
          initialYard = user.yardId;
          setSelectedYard(initialYard);
        }

        // Set default dates if needed, e.g., last 30 days
        const today = new Date();
        const prevMonth = new Date();
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        
        const formatYMD = (d) => d.toISOString().split('T')[0];
        const defaultFrom = formatYMD(prevMonth);
        const defaultTo = formatYMD(today);

        setFromDate(defaultFrom);
        setToDate(defaultTo);

        // trigger initial load
        if (onFilter) {
          onFilter({
            fromDate: defaultFrom,
            toDate: defaultTo,
            yardObjectId: initialYard,
            bankObjectId: '',
            regNo: '',
            chasisNo: ''
          });
        }
      } catch (err) {
        console.error("Failed to load filters", err);
      }
    };
    if (user) {
      loadData();
    }
  }, [user]);

  const handleFilter = () => {
    if (onFilter) {
      onFilter({
        fromDate,
        toDate,
        yardObjectId: selectedYard,
        bankObjectId: selectedBank,
        regNo,
        chasisNo
      });
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '150px' }}>
        <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>From Date</label>
        <input 
          type="date" 
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--glass-border-color)', background: 'rgba(15, 23, 42, 0.4)', color: 'var(--text-color)', fontSize: '14px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '150px' }}>
        <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>To Date</label>
        <input 
          type="date" 
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--glass-border-color)', background: 'rgba(15, 23, 42, 0.4)', color: 'var(--text-color)', fontSize: '14px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1.5', minWidth: '200px' }}>
        <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Select Yard</label>
        <select 
          value={selectedYard}
          onChange={(e) => setSelectedYard(e.target.value)}
          disabled={isYardDisabled}
          style={{ 
            width: '100%', 
            padding: '10px 14px', 
            borderRadius: '10px', 
            border: '1px solid var(--glass-border-color)', 
            background: isYardDisabled ? 'rgba(15, 23, 42, 0.2)' : 'rgba(15, 23, 42, 0.4)', 
            color: isYardDisabled ? 'var(--text-muted)' : 'var(--text-color)', 
            fontSize: '14px',
            cursor: isYardDisabled ? 'not-allowed' : 'pointer'
          }}
        >
          <option value="">-- All Yards --</option>
          {yards.map(yard => (
            <option key={yard._id} value={yard._id}>{yard.yardName} ({yard.yardId})</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1.5', minWidth: '200px' }}>
        <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Select Bank</label>
        <select 
          value={selectedBank}
          onChange={(e) => setSelectedBank(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--glass-border-color)', background: 'rgba(15, 23, 42, 0.4)', color: 'var(--text-color)', fontSize: '14px' }}
        >
          <option value="">-- All Banks --</option>
          {banks.map(bank => (
            <option key={bank._id} value={bank._id}>{bank.bankName}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '150px' }}>
        <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Reg No</label>
        <input 
          type="text" 
          value={regNo}
          onChange={(e) => setRegNo(e.target.value)}
          placeholder="e.g. HR36J5944"
          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--glass-border-color)', background: 'rgba(15, 23, 42, 0.4)', color: 'var(--text-color)', fontSize: '14px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '150px' }}>
        <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Chassis No</label>
        <input 
          type="text" 
          value={chasisNo}
          onChange={(e) => setChasisNo(e.target.value)}
          placeholder="Enter Chassis No"
          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--glass-border-color)', background: 'rgba(15, 23, 42, 0.4)', color: 'var(--text-color)', fontSize: '14px' }}
        />
      </div>

      <div style={{ alignSelf: 'flex-end', marginLeft: 'auto' }}>
        <button 
          onClick={handleFilter}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: 'var(--primary)', color: 'white', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', transition: 'background 0.2s', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Filter Data
        </button>
      </div>
    </div>
  );
}
