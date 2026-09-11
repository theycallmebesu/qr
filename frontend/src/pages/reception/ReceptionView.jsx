import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  Receipt,
  Search,
  Download,
  Printer,
  CheckCircle,
  CreditCard,
  Banknote,
  QrCode,
  Smartphone,
  Calendar,
  Clock,
  Users,
  X,
  ArrowRight,
  RefreshCw,
  FileText
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import StaffHeader from '../../components/StaffHeader';
import { SocketContext } from '../../context/SocketContext';
import { formatNPR } from '../../utils/currency';
import api from '../../api';

const ReceptionView = () => {
  const { socket } = useContext(SocketContext);

  // Main navigation tabs
  const [activeTab, setActiveTab] = useState('tables'); // 'tables' | 'invoices'

  // Data states
  const [tables, setTables] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Checkout modal state
  const [selectedTable, setSelectedTable] = useState(null);
  const [orderToBill, setOrderToBill] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [includeVAT, setIncludeVAT] = useState(true);
  const [includeServiceCharge, setIncludeServiceCharge] = useState(true);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null); // Receipt modal

  // Invoices Search & Filter states
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState('');
  const [searchDate, setSearchDate] = useState('');

  // Fetch occupied tables and active data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [tblRes, payRes] = await Promise.all([
        api.get('/tables'),
        api.get('/payments')
      ]);
      setTables(tblRes.data);
      setInvoices(payRes.data);
    } catch (err) {
      console.error('Failed to load reception data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      api.get('/tables').then(res => setTables(res.data)).catch(() => {});
      api.get('/payments').then(res => setInvoices(res.data)).catch(() => {});
    };

    socket.on('table:update', handleUpdate);
    socket.on('order:new', handleUpdate);
    socket.on('order:status_update', handleUpdate);
    socket.on('payment:completed', handleUpdate);

    return () => {
      socket.off('table:update', handleUpdate);
      socket.off('order:new', handleUpdate);
      socket.off('order:status_update', handleUpdate);
      socket.off('payment:completed', handleUpdate);
    };
  }, [socket]);

  // Handle opening bill for table
  const handleOpenBilling = async (tbl) => {
    setSelectedTable(tbl);
    setDiscountAmount(0);
    setPaymentMethod('Cash');
    setOrderToBill(null);

    // If table has a current order attached, fetch details
    if (tbl.currentOrder) {
      try {
        const orderId = tbl.currentOrder._id || tbl.currentOrder;
        const res = await api.get(`/orders/${orderId}`);
        setOrderToBill(res.data);
      } catch (e) {
        console.error('Failed to fetch order details for billing', e);
      }
    }
  };

  // Bill Calculations
  const billItems = useMemo(() => {
    return orderToBill?.items || [];
  }, [orderToBill]);

  const subtotal = useMemo(() => {
    return billItems.reduce((acc, it) => acc + it.price * it.qty, 0);
  }, [billItems]);

  const taxAmount = useMemo(() => {
    return includeVAT ? Number((subtotal * 0.13).toFixed(2)) : 0;
  }, [subtotal, includeVAT]);

  const serviceChargeAmount = useMemo(() => {
    return includeServiceCharge ? Number((subtotal * 0.10).toFixed(2)) : 0;
  }, [subtotal, includeServiceCharge]);

  const finalTotal = useMemo(() => {
    const discount = Number(discountAmount) || 0;
    return Math.max(0, Number((subtotal + taxAmount + serviceChargeAmount - discount).toFixed(2)));
  }, [subtotal, taxAmount, serviceChargeAmount, discountAmount]);

  // Process Checkout
  const handleProcessCheckout = async () => {
    if (!selectedTable) return;
    try {
      setProcessingCheckout(true);
      const payload = {
        tableId: selectedTable._id,
        orderId: orderToBill?._id,
        paymentMethod,
        discountAmount: Number(discountAmount) || 0,
        taxRate: includeVAT ? 0.13 : 0,
        serviceChargeRate: includeServiceCharge ? 0.10 : 0
      };

      const res = await api.post('/payments/checkout', payload);

      // Show thermal receipt modal
      setCompletedInvoice(res.data);
      setSelectedTable(null);
      setOrderToBill(null);

      // Refresh data
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete checkout');
    } finally {
      setProcessingCheckout(false);
    }
  };

  // Search filter for past invoices directly
  const handleSearchInvoices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchInvoiceNumber.trim()) params.invoiceNumber = searchInvoiceNumber.trim();
      if (searchDate) params.date = searchDate;

      const res = await api.get('/payments', { params });
      setInvoices(res.data);
    } catch (err) {
      console.error('Search invoices failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Export invoices as downloadable JSON file
  const handleExportJSON = () => {
    const query = searchDate ? `?date=${searchDate}` : '';
    const token = localStorage.getItem('token');
    // Trigger download via blob
    api.get(`/payments/export${query}`, { responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoices-backup-${searchDate || 'all'}-${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(err => alert('Failed to export invoices.'));
  };

  // Occupied tables count
  const occupiedTables = tables.filter(t => t.status !== 'empty');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16">
      <StaffHeader />

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1">
        {/* Top Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 self-start">
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'tables'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Occupied Tables</span>
              <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 text-[10px] font-black flex items-center justify-center">
                {occupiedTables.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'invoices'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Past Invoices ({invoices.length})</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 hover:text-amber-300 text-xs font-bold transition active:scale-95"
              title="Download offline JSON backup of completed payments"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Day's Invoices (JSON)</span>
            </button>

            <button
              onClick={fetchData}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* TAB 1: OCCUPIED TABLES FOR CHECKOUT */}
        {activeTab === 'tables' && (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-black text-white tracking-tight">
                Billing & Checkout Terminal
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate and settle bills for <strong>any</strong> table at any time once items have been ordered.
              </p>
            </div>

            {loading ? (
              <div className="text-center py-20 text-slate-500 text-sm">
                Loading dining tables...
              </div>
            ) : occupiedTables.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 max-w-md mx-auto">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">No Occupied Tables</h3>
                <p className="text-xs text-slate-400 mt-1">
                  All dining tables are currently free. When a waiter opens a table and sends an order, it will appear here for checkout.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {occupiedTables.map((tbl) => {
                  const waiterName = tbl.currentWaiterName || tbl.currentWaiter?.name || tbl.currentOrder?.waiterName || 'Staff';

                  return (
                    <div
                      key={tbl._id}
                      className="rounded-3xl border border-amber-500/30 bg-slate-900 overflow-hidden shadow-xl hover:border-amber-500 transition flex flex-col justify-between"
                    >
                      {/* Photo & Table Top */}
                      <div className="h-32 w-full relative overflow-hidden bg-slate-800">
                        <img
                          src={tbl.photo}
                          alt={tbl.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow">
                          {tbl.status}
                        </div>

                        <div className="absolute bottom-2.5 left-3">
                          <h3 className="text-base font-black text-white drop-shadow">
                            {tbl.name}
                          </h3>
                          <p className="text-[11px] text-slate-300">
                            {tbl.section} • {tbl.capacity} Seats
                          </p>
                        </div>
                      </div>

                      {/* Waiter Details & Current Bill Preview */}
                      <div className="p-4 space-y-3 flex-1">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-amber-400" />
                            <span>Served by <strong className="text-white">{waiterName}</strong></span>
                          </div>
                        </div>

                        {tbl.currentOrder ? (
                          <div className="bg-slate-950 p-3 rounded-xl space-y-1.5 text-xs">
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Order #{tbl.currentOrder.orderNumber}</span>
                              <span className="font-bold text-amber-400 text-sm">
                                {formatNPR(tbl.currentOrder.totalPrice)}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {tbl.currentOrder.items?.length || 0} dishes ordered
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic p-2">
                            Table occupied without order ticket.
                          </div>
                        )}
                      </div>

                      {/* Generate / Settle Bill Button */}
                      <div className="p-4 bg-slate-950 border-t border-slate-800">
                        <button
                          onClick={() => handleOpenBilling(tbl)}
                          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 hover:from-amber-500 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-95 transition"
                        >
                          <Receipt className="w-4 h-4" />
                          <span>Generate & Settle Bill</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PAST INVOICES & HISTORY SEARCH */}
        {activeTab === 'invoices' && (
          <div className="space-y-5">
            {/* Search Bar: Date + Invoice # */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by Invoice # (e.g. INV-2026-0001)..."
                  value={searchInvoiceNumber}
                  onChange={(e) => setSearchInvoiceNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchInvoices()}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="relative w-full md:w-56">
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                onClick={handleSearchInvoices}
                className="w-full md:w-auto px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition active:scale-95"
              >
                Search Database
              </button>

              {(searchInvoiceNumber || searchDate) && (
                <button
                  onClick={() => {
                    setSearchInvoiceNumber('');
                    setSearchDate('');
                    fetchData();
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Invoices List */}
            {invoices.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-sm">
                No past invoices found matching your criteria.
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-4">Invoice #</th>
                        <th className="p-4">Date & Time</th>
                        <th className="p-4">Table</th>
                        <th className="p-4">Served By</th>
                        <th className="p-4">Method</th>
                        <th className="p-4 text-right">Total (NPR)</th>
                        <th className="p-4 text-center">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {invoices.map((inv) => (
                        <tr key={inv._id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4 font-mono font-bold text-amber-400">
                            {inv.invoiceNumber}
                          </td>
                          <td className="p-4 text-slate-300">
                            {new Date(inv.dateTime).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="p-4 font-semibold text-white">
                            {inv.tableName || `Table ${inv.tableNumber}`}
                          </td>
                          <td className="p-4 text-slate-300">
                            {inv.waiterName || 'Staff'}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold">
                              {inv.paymentMethod}
                            </span>
                          </td>
                          <td className="p-4 text-right font-black text-white text-sm">
                            {formatNPR(inv.total)}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setCompletedInvoice(inv)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold inline-flex items-center gap-1 transition"
                            >
                              <Printer className="w-3 h-3" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: CHECKOUT & BILL GENERATION */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  Checkout: {selectedTable.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Waiter: <strong className="text-amber-400">{selectedTable.currentWaiterName || 'Staff'}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedTable(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Itemized Bill List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Itemized Bill Summary:
              </p>

              {billItems.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs italic bg-slate-950 rounded-2xl border border-slate-800">
                  No food order items registered for this table yet.
                </div>
              ) : (
                <div className="space-y-2 bg-slate-950 rounded-2xl p-4 border border-slate-800">
                  {billItems.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-0">
                      <div>
                        <span className="font-bold text-white">{it.name}</span>
                        <span className="text-slate-500 ml-2">x{it.qty}</span>
                      </div>
                      <span className="font-mono text-slate-200">
                        {formatNPR(it.price * it.qty)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tax & Discount Controls */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Subtotal</span>
                  <span className="font-bold text-white">{formatNPR(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeVAT}
                      onChange={(e) => setIncludeVAT(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                    />
                    <span>Nepal VAT (13%)</span>
                  </label>
                  <span className="font-mono">{formatNPR(taxAmount)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeServiceCharge}
                      onChange={(e) => setIncludeServiceCharge(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                    />
                    <span>Service Charge (10%)</span>
                  </label>
                  <span className="font-mono">{formatNPR(serviceChargeAmount)}</span>
                </div>

                {/* Discount */}
                <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                  <span>Discount (NPR)</span>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                    className="w-24 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-right font-mono text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Final Total */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-base font-black">
                  <span className="text-white">TOTAL PAYABLE:</span>
                  <span className="text-amber-400 text-xl font-mono">{formatNPR(finalTotal)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Select Payment Method:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Cash', label: 'Cash', icon: Banknote },
                    { id: 'Card', label: 'Card', icon: CreditCard },
                    { id: 'Fonepay QR', label: 'Fonepay', icon: QrCode },
                    { id: 'eSewa', label: 'eSewa', icon: Smartphone }
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSel = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition active:scale-95 ${
                          isSel
                            ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* QR Code Presentation if Fonepay QR is selected */}
                {paymentMethod === 'Fonepay QR' && (
                  <div className="mt-3 p-4 rounded-2xl bg-white text-slate-950 text-center space-y-2 shadow-inner">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Scan via Fonepay / Any Nepali Banking App
                    </p>
                    <div className="flex justify-center p-2">
                      <QRCodeSVG
                        value={`fonepay://pay?recipient=HimalayanRestaurant&amount=${finalTotal}&ref=${selectedTable.name}`}
                        size={128}
                      />
                    </div>
                    <p className="text-xs font-black text-rose-600">
                      Amount: {formatNPR(finalTotal)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedTable(null)}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleProcessCheckout}
                disabled={processingCheckout || subtotal === 0}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{processingCheckout ? 'Settling Payment...' : 'Complete Payment & Free Table'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: THERMAL RECEIPT / INVOICE PREVIEW */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white text-slate-950 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto font-mono text-xs">
            {/* Receipt Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
              <h4 className="text-base font-black uppercase tracking-tight">
                Himalayan Flavors Restaurant
              </h4>
              <p className="text-[10px] text-slate-600">Durbar Marg, Kathmandu, Nepal</p>
              <p className="text-[10px] text-slate-600">PAN / VAT: 601234567 • Tel: 01-4234567</p>
              <p className="text-xs font-bold text-slate-800 mt-2">TAX INVOICE</p>
            </div>

            {/* Meta */}
            <div className="text-[11px] space-y-1 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>Invoice No:</span>
                <span className="font-bold">{completedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(completedInvoice.dateTime).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Table:</span>
                <span className="font-bold">{completedInvoice.tableName || `Table ${completedInvoice.tableNumber}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Served By:</span>
                <span>{completedInvoice.waiterName || 'Staff'}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="font-bold uppercase">{completedInvoice.paymentMethod}</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-2">
              {completedInvoice.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>{it.name} x{it.qty}</span>
                  <span>Rs. {(it.price * it.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rs. {completedInvoice.subtotal?.toFixed(2)}</span>
              </div>
              {completedInvoice.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>VAT (13%):</span>
                  <span>Rs. {completedInvoice.taxAmount?.toFixed(2)}</span>
                </div>
              )}
              {completedInvoice.serviceCharge > 0 && (
                <div className="flex justify-between">
                  <span>Service Charge (10%):</span>
                  <span>Rs. {completedInvoice.serviceCharge?.toFixed(2)}</span>
                </div>
              )}
              {completedInvoice.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>-Rs. {completedInvoice.discountAmount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-400">
                <span>GRAND TOTAL:</span>
                <span>Rs. {completedInvoice.total?.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-slate-500 pt-2 space-y-1">
              <p>Dhanyabad! Thank you for dining with us.</p>
              <p>Please visit again!</p>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-950 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill</span>
              </button>
              <button
                onClick={() => setCompletedInvoice(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionView;
