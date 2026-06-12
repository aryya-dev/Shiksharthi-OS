'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Search, Plus, Check, AlertCircle, 
  TrendingUp, Wallet, Receipt, X, Edit2, CheckCircle
} from 'lucide-react';
import { dbClient } from '@/lib/db';
import { Student, StudentFee } from '@/types';

interface StudentFeeRecord {
  student: Student;
  fee: StudentFee;
}

export default function FeesTrackerPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<StudentFeeRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID' | 'DEFAULTER'>('ALL');
  
  // Modal states
  const [isLoggingPayment, setIsLoggingPayment] = useState(false);
  const [isEditingFee, setIsEditingFee] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<StudentFeeRecord | null>(null);
  
  // Form fields
  const [paymentAmount, setPaymentAmount] = useState('');
  const [customTotal, setCustomTotal] = useState('');
  const [customDiscount, setCustomDiscount] = useState('');
  const [customPaid, setCustomPaid] = useState('');

  const loadFeesData = async () => {
    try {
      setLoading(true);
      const students = await dbClient.students.list();
      const fees = await dbClient.studentFees.list();
      
      const mergedRecords: StudentFeeRecord[] = students.map(student => {
        let fee = fees.find(f => f.student_id === student.id);
        
        // Dynamic fallback in case table trigger hasn't populated the row yet
        if (!fee) {
          let discountPct = 0;
          const status = student.scholarship_status || '';
          if (status.includes('100')) discountPct = 100;
          else if (status.includes('75')) discountPct = 75;
          else if (status.includes('50')) discountPct = 50;
          else if (status.includes('25')) discountPct = 25;
          else if (status.includes('10')) discountPct = 10;
          
          fee = {
            id: `fee_fallback_${student.id}`,
            student_id: student.id,
            total_amount: 28000,
            scholarship_discount: (28000 * discountPct) / 100,
            amount_paid: 0
          };
        }
        
        return { student, fee };
      });
      
      setRecords(mergedRecords);
    } catch (err) {
      console.error('Failed to load fees directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeesData();
  }, []);

  const handleLogPayment = async () => {
    if (!selectedRecord || !paymentAmount) return;
    const payVal = parseFloat(paymentAmount);
    if (isNaN(payVal) || payVal <= 0) {
      alert('Please enter a valid positive payment amount.');
      return;
    }

    try {
      const netPayable = selectedRecord.fee.total_amount - selectedRecord.fee.scholarship_discount;
      const currentPaid = selectedRecord.fee.amount_paid;
      const newPaid = currentPaid + payVal;

      if (newPaid > netPayable) {
        if (!confirm(`Warning: Payment of ₹${payVal} will exceed the Net Payable amount of ₹${netPayable}. Proceed anyway?`)) {
          return;
        }
      }

      await dbClient.studentFees.update(selectedRecord.student.id, {
        amount_paid: newPaid
      });

      setIsLoggingPayment(false);
      setPaymentAmount('');
      setSelectedRecord(null);
      await loadFeesData();
    } catch (error) {
      console.error('Failed to log payment:', error);
      alert('Error updating payment data in database.');
    }
  };

  const handleSaveFeeEdits = async () => {
    if (!selectedRecord) return;
    const totalVal = parseFloat(customTotal);
    const discVal = parseFloat(customDiscount);
    const paidVal = parseFloat(customPaid);

    if (isNaN(totalVal) || totalVal < 0 || isNaN(discVal) || discVal < 0 || isNaN(paidVal) || paidVal < 0) {
      alert('Please enter valid non-negative numbers.');
      return;
    }

    try {
      await dbClient.studentFees.update(selectedRecord.student.id, {
        total_amount: totalVal,
        scholarship_discount: discVal,
        amount_paid: paidVal
      });

      setIsEditingFee(false);
      setSelectedRecord(null);
      await loadFeesData();
    } catch (error) {
      console.error('Failed to edit fee records:', error);
      alert('Error saving fee changes to database.');
    }
  };

  const handleToggleDefaulter = async (record: StudentFeeRecord) => {
    try {
      await dbClient.studentFees.update(record.student.id, {
        is_defaulter: !record.fee.is_defaulter
      });
      await loadFeesData();
    } catch (error) {
      console.error('Failed to toggle defaulter status:', error);
      alert('Failed to update defaulter status.');
    }
  };

  // Calculations for Summary Statistics
  const summary = records.reduce((acc, rec) => {
    const net = rec.fee.total_amount - rec.fee.scholarship_discount;
    const outstanding = Math.max(0, net - rec.fee.amount_paid);
    
    acc.expected += net;
    acc.collected += rec.fee.amount_paid;
    acc.outstanding += outstanding;
    return acc;
  }, { expected: 0, collected: 0, outstanding: 0 });

  const collectionPercent = summary.expected > 0 
    ? Math.round((summary.collected / summary.expected) * 100) 
    : 0;

  // Filter records based on search query and status filter
  const filteredRecords = records.filter(rec => {
    const matchesSearch = rec.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.student.parent_name.toLowerCase().includes(searchQuery.toLowerCase());
      
    const net = rec.fee.total_amount - rec.fee.scholarship_discount;
    const isPaid = rec.fee.amount_paid >= net && net > 0;
    const isUnpaid = rec.fee.amount_paid === 0 && net > 0;
    const isPartial = rec.fee.amount_paid > 0 && rec.fee.amount_paid < net;
    const isFree = net === 0; // 100% scholarship is considered fully paid
    
    let matchesStatus = true;
    if (statusFilter === 'PAID') {
      matchesStatus = isPaid || isFree;
    } else if (statusFilter === 'PARTIAL') {
      matchesStatus = isPartial;
    } else if (statusFilter === 'UNPAID') {
      matchesStatus = isUnpaid;
    } else if (statusFilter === 'DEFAULTER') {
      matchesStatus = !!rec.fee.is_defaulter;
    }
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-10 w-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-zinc-500">Loading student billing indices...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-dark-border">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-brand-purple" /> Fee Monitoring Console
          </h2>
          <p className="text-xs text-zinc-500">Track student tuition fees, scholarships, and outstanding receivables</p>
        </div>
      </div>

      {/* Summary Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-dark-card border border-dark-border flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-neon-blue/10 flex items-center justify-center border border-neon-blue/20">
            <Receipt className="h-5 w-5 text-neon-blue" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Expected Revenue</div>
            <div className="text-lg font-bold text-white mt-0.5">₹{summary.expected.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-dark-card border border-dark-border flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-neon-emerald/10 flex items-center justify-center border border-neon-emerald/20">
            <CheckCircle className="h-5 w-5 text-neon-emerald" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Revenue Collected</div>
            <div className="text-lg font-bold text-white mt-0.5">₹{summary.collected.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-dark-card border border-dark-border flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-neon-rose/10 flex items-center justify-center border border-neon-rose/20">
            <Wallet className="h-5 w-5 text-neon-rose" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Outstanding Balance</div>
            <div className="text-lg font-bold text-white mt-0.5">₹{summary.outstanding.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-dark-card border border-dark-border flex flex-col justify-center space-y-2">
          <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            <span>Collection Rate</span>
            <span className="text-brand-purple">{collectionPercent}%</span>
          </div>
          <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-dark-border/40">
            <div 
              className="bg-gradient-to-r from-brand-purple to-brand-violet h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
              style={{ width: `${collectionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search students by name, parent..."
            className="w-full pl-9 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['ALL', 'PAID', 'PARTIAL', 'UNPAID', 'DEFAULTER'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border transition-all-200 ${
                statusFilter === filter
                  ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20'
                  : 'bg-zinc-900 text-zinc-400 border-dark-border/60 hover:text-white'
              }`}
            >
              {filter === 'PARTIAL' ? 'Partially Paid' : filter === 'PAID' ? 'Fully Paid' : filter === 'DEFAULTER' ? 'Defaulters' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
        <div className="overflow-x-auto border border-dark-border rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-900 border-b border-dark-border text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="p-3">Student Name</th>
                <th className="p-3">Grade</th>
                <th className="p-3">Scholarship Status</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Scholarship Discount</th>
                <th className="p-3">Net Payable</th>
                <th className="p-3">Amount Paid</th>
                <th className="p-3">Outstanding</th>
                <th className="p-3">Payment Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/40 text-zinc-300">
              {filteredRecords.map(rec => {
                const net = rec.fee.total_amount - rec.fee.scholarship_discount;
                const outstanding = Math.max(0, net - rec.fee.amount_paid);
                
                const isPaid = rec.fee.amount_paid >= net && net > 0;
                const isUnpaid = rec.fee.amount_paid === 0 && net > 0;
                const isPartial = rec.fee.amount_paid > 0 && rec.fee.amount_paid < net;
                const isFree = net === 0;

                let statusBadge = (
                  <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border text-neon-rose bg-neon-rose/5 border-neon-rose/20">
                    Unpaid
                  </span>
                );
                if (isPaid || isFree) {
                  statusBadge = (
                    <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border text-neon-emerald bg-neon-emerald/5 border-neon-emerald/20">
                      Fully Paid
                    </span>
                  );
                } else if (isPartial) {
                  statusBadge = (
                    <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border text-neon-amber bg-neon-amber/5 border-neon-amber/20">
                      Partial
                    </span>
                  );
                }

                return (
                  <tr 
                    key={rec.student.id} 
                    className={`transition-all-200 border-b border-dark-border/20 ${
                      rec.fee.is_defaulter 
                        ? 'bg-red-500/5 hover:bg-red-500/10 border-l-2 border-l-neon-rose' 
                        : 'hover:bg-zinc-900/40'
                    }`}
                  >
                    <td className="p-3">
                      <div className="font-semibold text-white">{rec.student.name}</div>
                      <div className="text-[10px] text-zinc-500">Parent: {rec.student.parent_name}</div>
                    </td>
                    <td className="p-3 font-medium text-zinc-400">{rec.student.grade_level}</td>
                    <td className="p-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-950 text-brand-purple font-semibold border border-brand-purple/20">
                        {rec.student.scholarship_status || 'None'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-zinc-300">₹{rec.fee.total_amount.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-neon-rose font-medium">-₹{rec.fee.scholarship_discount.toLocaleString('en-IN')}</td>
                    <td className="p-3 font-bold text-white">₹{net.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-neon-emerald font-semibold">₹{rec.fee.amount_paid.toLocaleString('en-IN')}</td>
                    <td className="p-3 font-bold text-zinc-300">
                      {outstanding > 0 ? (
                        <span className="text-zinc-200">₹{outstanding.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-neon-emerald">₹0</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1.5 items-start">
                        {statusBadge}
                        {rec.fee.is_defaulter && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border text-neon-rose bg-neon-rose/5 border-neon-rose/20 shadow-[0_0_8px_rgba(244,63,94,0.2)] animate-pulse">
                            Defaulter
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleDefaulter(rec)}
                          className={`px-2 py-1 rounded border text-[10px] font-semibold transition-all-200 ${
                            rec.fee.is_defaulter
                              ? 'bg-red-950/40 text-neon-rose border-neon-rose/30 hover:bg-red-950/60'
                              : 'bg-zinc-900 border-dark-border text-zinc-400 hover:text-zinc-300 hover:border-zinc-700'
                          }`}
                        >
                          {rec.fee.is_defaulter ? 'Clear Defaulter' : 'Mark Defaulter'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRecord(rec);
                            setIsLoggingPayment(true);
                          }}
                          className="px-2 py-1 rounded bg-zinc-900 border border-dark-border text-[10px] font-semibold text-zinc-300 hover:text-white transition-all-200"
                        >
                          Log Payment
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRecord(rec);
                            setCustomTotal(rec.fee.total_amount.toString());
                            setCustomDiscount(rec.fee.scholarship_discount.toString());
                            setCustomPaid(rec.fee.amount_paid.toString());
                            setIsEditingFee(true);
                          }}
                          className="p-1.5 rounded bg-zinc-900 border border-dark-border text-zinc-400 hover:text-white transition-all-200"
                          title="Override Structure"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-zinc-500">
                    No billing accounts found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Log Payment */}
      {isLoggingPayment && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-xl p-5 shadow-2xl space-y-4 relative">
            <button 
              onClick={() => {
                setIsLoggingPayment(false);
                setSelectedRecord(null);
                setPaymentAmount('');
              }}
              className="absolute right-4 top-4 p-1 rounded bg-zinc-900 text-zinc-400 hover:text-white border border-dark-border"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Log Tuition Payment</h3>
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Record payments received for course fees</p>
            </div>

            <div className="p-3 rounded-lg bg-zinc-900/60 border border-dark-border/80 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Student:</span>
                <span className="text-white font-semibold">{selectedRecord.student.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Net Course Fee:</span>
                <span className="text-white font-semibold">
                  ₹{(selectedRecord.fee.total_amount - selectedRecord.fee.scholarship_discount).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Currently Paid:</span>
                <span className="text-neon-emerald font-semibold">₹{selectedRecord.fee.amount_paid.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-t border-dark-border pt-2 mt-1">
                <span className="text-zinc-400 font-medium">Outstanding Balance:</span>
                <span className="text-white font-bold">
                  ₹{Math.max(0, (selectedRecord.fee.total_amount - selectedRecord.fee.scholarship_discount - selectedRecord.fee.amount_paid)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-semibold uppercase">Amount Received (₹)</label>
              <input 
                type="number"
                placeholder="e.g. 5000"
                className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white placeholder-zinc-600 focus:outline-none"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsLoggingPayment(false);
                  setSelectedRecord(null);
                  setPaymentAmount('');
                }}
                className="flex-1 py-2 rounded-lg bg-zinc-900 border border-dark-border text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogPayment}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-brand-purple to-brand-violet text-xs font-semibold text-white shadow hover:opacity-90 transition-opacity"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Override / Edit Fee Structures */}
      {isEditingFee && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-xl p-5 shadow-2xl space-y-4 relative">
            <button 
              onClick={() => {
                setIsEditingFee(false);
                setSelectedRecord(null);
              }}
              className="absolute right-4 top-4 p-1 rounded bg-zinc-900 text-zinc-400 hover:text-white border border-dark-border"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Override Billing Details</h3>
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Manually adjust ledger entries for {selectedRecord.student.name}</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Total Base Fee (₹)</label>
                <input 
                  type="number"
                  placeholder="e.g. 28000"
                  className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white placeholder-zinc-600 focus:outline-none"
                  value={customTotal}
                  onChange={e => setCustomTotal(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Scholarship Discount Amount (₹)</label>
                <input 
                  type="number"
                  placeholder="e.g. 14000"
                  className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white placeholder-zinc-600 focus:outline-none"
                  value={customDiscount}
                  onChange={e => setCustomDiscount(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Total Cumulative Paid (₹)</label>
                <input 
                  type="number"
                  placeholder="e.g. 20000"
                  className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white placeholder-zinc-600 focus:outline-none"
                  value={customPaid}
                  onChange={e => setCustomPaid(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditingFee(false);
                  setSelectedRecord(null);
                }}
                className="flex-1 py-2 rounded-lg bg-zinc-900 border border-dark-border text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFeeEdits}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-brand-purple to-brand-violet text-xs font-semibold text-white shadow hover:opacity-90 transition-opacity"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
