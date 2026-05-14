"use client";
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Loader2, Printer, Eye, X } from 'lucide-react';
import { generateInventoryPdf } from '@/services/api';

export default function InventoryTable({ data, loading, progress = 0 }) {
  const [localStatusFilter, setLocalStatusFilter] = useState('All');
  const [isFiltering, setIsFiltering] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(null);

  const handleStatusChange = (e) => {
    const val = e.target.value;
    if (val === localStatusFilter) return;
    setIsFiltering(true);
    setTimeout(() => {
      setLocalStatusFilter(val);
      setIsFiltering(false);
    }, 400); // Artificial delay to show smooth visual loading state
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'var(--text-muted)' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
        <span>Loading inventory data... {progress}%</span>
        {/* Visual Progress Bar */}
        <div style={{ width: '200px', height: '6px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '10px', overflow: 'hidden', marginTop: '8px' }}>
          <div style={{ height: '100%', background: 'var(--primary)', width: `${progress}%`, transition: 'width 0.3s ease-out' }} />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No inventory data found for the selected filters.
      </div>
    );
  }

  const filteredData = data.filter(item => {
    if (localStatusFilter === 'All') return true;
    if (localStatusFilter === 'In') return item.status?.toLowerCase() === 'in';
    if (localStatusFilter === 'Out') return item.status?.toLowerCase() === 'out';
    return true;
  });

  const printColumns = ['regNo', 'borrower', 'agreementNo', 'model', 'engineNo', 'chasisNo'];

  const printToPDF = async () => {
    if (filteredData.length === 0) return;

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      const tableColumn = printColumns.map(col => col.replace(/([A-Z])/g, ' $1').trim().toUpperCase());
      const tableRows = [];

      filteredData.forEach(item => {
        const rowData = printColumns.map(col => {
          let val = item[col];
          return val === null || val === undefined || val === '' ? 'N/A' : String(val);
        });
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [15, 23, 42] }
      });

      doc.save(`Inventory_Print_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("Failed to generate PDF. Check console for details.");
    }
  };

  const sortedKeys = ['regNo', 'borrower', 'agreementNo', 'engineNo', 'chasisNo'];

  const formatCellData = (key, val) => {
    if (val === null || val === undefined || val === '') return 'N/A';

    let strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);

    // Keep only the date part
    if ((key === 'entryDate' || key === 'exitDate') && strVal !== 'N/A') {
      return strVal.split(/[\sT]/)[0];
    }

    // Format time to 12hr AM/PM
    if ((key === 'entryTime' || key === 'exitTime') && strVal !== 'N/A') {
      const parts = strVal.split(':');
      if (parts.length >= 2) {
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        if (!isNaN(hours)) {
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12;
          hours = hours ? hours : 12; // 0 becomes 12
          return `${hours}:${minutes} ${ampm}`;
        }
      }
    }

    return strVal;
  };

  const handlePdfAction = async (item, actionType) => {
    const loadingKey = `${item._id}-${actionType}`;
    setPdfLoading(loadingKey);
    try {
      const remotePdfUrl = await generateInventoryPdf(item.regNo, item._id);

      if (actionType === 'view') {
        window.open(remotePdfUrl, '_blank');
      } else if (actionType === 'download' || actionType === 'print') {
        const response = await fetch(remotePdfUrl);
        const blob = await response.blob();
        const localUrl = URL.createObjectURL(blob);

        if (actionType === 'download') {
          const link = document.createElement('a');
          link.href = localUrl;
          link.setAttribute('download', `Inventory_${item.regNo}.pdf`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else if (actionType === 'print') {
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = localUrl;
          document.body.appendChild(iframe);
          iframe.onload = () => {
            iframe.contentWindow.print();
          };
        }
      }
    } catch (err) {
      alert(`Failed to ${actionType} PDF`);
    } finally {
      setPdfLoading(null);
    }
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;
    setIsExporting(true);

    setTimeout(() => {
      const headers = sortedKeys.map(k => k.replace(/([A-Z])/g, ' $1').trim().toUpperCase()).join(',');

      const rows = filteredData.map(item => {
        return sortedKeys.map(key => {
          let val = formatCellData(key, item[key]);

          // Escape quotes to prevent CSV breakage
          val = val.replace(/"/g, '""');
          return `"${val}"`;
        }).join(',');
      });

      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Inventory_Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExporting(false);
    }, 500); // Artificial delay to show visual loading state
  };

  return (
    <>
      <div className="glass-panel" style={{ overflowX: 'auto', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 8px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Inventory Records ({filteredData.length})</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Local Status Filter:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={localStatusFilter}
                  onChange={handleStatusChange}
                  disabled={isFiltering}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--glass-border-color)', background: 'rgba(15, 23, 42, 0.4)', color: 'var(--text-color)', fontSize: '13px', outline: 'none', opacity: isFiltering ? 0.7 : 1, cursor: isFiltering ? 'not-allowed' : 'pointer' }}
                >
                  <option value="All">All Statuses</option>
                  <option value="In">Status: In</option>
                  <option value="Out">Status: Out</option>
                </select>
                {isFiltering && <Loader2 size={16} className="animate-spin" style={{ color: 'var(--primary)' }} />}
              </div>
            </div>
            {/* <button 
            onClick={() => setShowPreview(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#3b82f6', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', transition: 'background 0.2s', cursor: 'pointer', border: 'none' }}
          >
            <Eye size={16} />
            Preview
          </button>
          <button 
            onClick={printToPDF}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#8b5cf6', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', transition: 'background 0.2s', cursor: 'pointer', border: 'none' }}
          >
            <Printer size={16} />
            Print
          </button> */}
            <button
              onClick={exportToCSV}
              disabled={isExporting}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#10b981', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', transition: 'background 0.2s', cursor: isExporting ? 'not-allowed' : 'pointer', border: 'none', opacity: isExporting ? 0.7 : 1 }}
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {isExporting ? 'Exporting...' : 'Export Data'}
            </button>
          </div>
        </div>
        <table style={{ borderCollapse: 'collapse', textAlign: 'left', minWidth: 'max-content', width: '100%' }}>
          <thead>
            <tr style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
              {sortedKeys.map(key => (
                <th key={key} style={{ padding: '12px 16px', fontWeight: '600', fontSize: '13px', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border-color)', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                  {key === 'chasisNo' ? 'Chassis No' : key.replace(/([A-Z])/g, ' $1').trim()}
                </th>
              ))}
              <th style={{ padding: '12px 16px', fontWeight: '600', fontSize: '13px', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border-color)', whiteSpace: 'nowrap', textAlign: 'center' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <tr key={item._id || index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                {sortedKeys.map(key => {
                  let displayValue = formatCellData(key, item[key]);

                  // Special styling for specific columns
                  if (key === 'status') {
                    return (
                      <td key={key} style={{ padding: '16px', fontSize: '14px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          background: displayValue.toLowerCase() === 'in' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: displayValue.toLowerCase() === 'in' ? '#4ade80' : '#f87171',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {displayValue}
                        </span>
                      </td>
                    );
                  }

                  if (key === 'regNo') {
                    return (
                      <td key={key} style={{ padding: '16px', fontSize: '14px', whiteSpace: 'nowrap' }}>
                        <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          {displayValue}
                        </span>
                      </td>
                    );
                  }

                  return (
                    <td key={key} style={{ padding: '16px', fontSize: '14px', whiteSpace: 'nowrap', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {displayValue}
                    </td>
                  );
                })}
                <td style={{ padding: '16px', fontSize: '14px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => handlePdfAction(item, 'view')}
                      disabled={pdfLoading === `${item._id}-view`}
                      style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold', opacity: pdfLoading === `${item._id}-view` ? 0.7 : 1 }}
                      title="View PDF"
                    >
                      {pdfLoading === `${item._id}-view` ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                      View
                    </button>
                    <button
                      onClick={() => handlePdfAction(item, 'download')}
                      disabled={pdfLoading === `${item._id}-download`}
                      style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold', opacity: pdfLoading === `${item._id}-download` ? 0.7 : 1 }}
                      title="Download PDF"
                    >
                      {pdfLoading === `${item._id}-download` ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      Download
                    </button>
                    <button
                      onClick={() => handlePdfAction(item, 'print')}
                      disabled={pdfLoading === `${item._id}-print`}
                      style={{ padding: '6px 12px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold', opacity: pdfLoading === `${item._id}-print` ? 0.7 : 1 }}
                      title="Print PDF"
                    >
                      {pdfLoading === `${item._id}-print` ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                      Print
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPreview && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
          <div className="glass-panel" style={{ background: '#1e293b', width: '100%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>Data Preview</h3>
              <button onClick={() => setShowPreview(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: '0', overflowY: 'auto', flex: 1 }}>
              <table style={{ borderCollapse: 'collapse', textAlign: 'left', minWidth: '100%', width: '100%' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#0f172a', zIndex: 10 }}>
                  <tr>
                    {printColumns.map(key => (
                      <th key={key} style={{ padding: '12px 16px', fontWeight: '600', fontSize: '13px', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border-color)', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <tr key={item._id || index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      {printColumns.map(key => {
                        let displayValue = item[key] === null || item[key] === undefined || item[key] === '' ? 'N/A' : String(item[key]);
                        return (
                          <td key={key} style={{ padding: '16px', fontSize: '14px', whiteSpace: 'nowrap', color: 'var(--text-color)' }}>
                            {displayValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={printColumns.length} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyItems: 'flex-end', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowPreview(false)}
                style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', border: 'none' }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  printToPDF();
                  setShowPreview(false);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#8b5cf6', color: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', border: 'none' }}
              >
                <Printer size={16} />
                Print PDF
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
