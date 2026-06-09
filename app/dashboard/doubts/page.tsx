'use client';

import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, Plus, Clock, User, CheckCircle2, 
  PlayCircle, AlertCircle, Save, X, Search 
} from 'lucide-react';
import { dbClient } from '@/lib/db';
import { Doubt, Student, Faculty, UserProfile, DoubtStatus } from '@/types';

export default function DoubtTrackerPage() {
  const [loading, setLoading] = useState(true);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | DoubtStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal Dialog states
  const [isAddingDoubt, setIsAddingDoubt] = useState(false);
  const [newDoubtStudent, setNewDoubtStudent] = useState('');
  const [newDoubtFaculty, setNewDoubtFaculty] = useState('');
  const [newDoubtQuestion, setNewDoubtQuestion] = useState('');
  const [newDoubtCategory, setNewDoubtCategory] = useState('Physics');

  // Resolution dialog
  const [resolvingDoubtId, setResolvingDoubtId] = useState<string | null>(null);
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [resolutionTime, setResolutionTime] = useState(15);

  const loadDoubtsData = async () => {
    try {
      const user = await dbClient.profiles.getCurrentUser();
      setCurrentUser(user);

      const dbts = await dbClient.doubts.list();
      setDoubts(dbts);

      const studs = await dbClient.students.list();
      setStudents(studs);

      const facs = await dbClient.faculty.list();
      setFaculty(facs);

      if (studs.length > 0) setNewDoubtStudent(studs[0].id);
      if (facs.length > 0) setNewDoubtFaculty(facs[0].id);
    } catch (error) {
      console.error('Failed to load doubt logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoubtsData();
    window.addEventListener('role-change', loadDoubtsData);
    return () => window.removeEventListener('role-change', loadDoubtsData);
  }, []);

  const handleCreateDoubt = async () => {
    if (!newDoubtQuestion || !crmActiveCheck()) return;
    try {
      await dbClient.doubts.create({
        student_id: newDoubtStudent,
        faculty_id: newDoubtFaculty || undefined,
        question: newDoubtQuestion,
        category: newDoubtCategory
      });

      setIsAddingDoubt(false);
      setNewDoubtQuestion('');
      loadDoubtsData();
    } catch (error) {
      console.error('Failed to log doubt:', error);
    }
  };

  const handleStartResolving = async (id: string) => {
    try {
      await dbClient.doubts.updateStatus(id, 'RESOLVING');
      loadDoubtsData();
    } catch (error) {
      console.error('Failed to update resolution pipeline:', error);
    }
  };

  const handleResolveDoubt = async () => {
    if (!resolvingDoubtId || !resolutionRemarks) return;
    try {
      await dbClient.doubts.updateStatus(
        resolvingDoubtId, 
        'RESOLVED', 
        resolutionRemarks, 
        Number(resolutionTime)
      );

      setResolvingDoubtId(null);
      setResolutionRemarks('');
      setResolutionTime(15);
      loadDoubtsData();
    } catch (error) {
      console.error('Failed to mark doubt resolved:', error);
    }
  };

  const crmActiveCheck = () => {
    return !!newDoubtStudent;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-10 w-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-zinc-500">Retrieving active doubt registry...</span>
      </div>
    );
  }

  // Filter calculations
  const filteredDoubts = doubts.filter(d => {
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || d.category === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  const totalTickets = doubts.length;
  const pendingTickets = doubts.filter(d => d.status === 'PENDING').length;
  const resolvingTickets = doubts.filter(d => d.status === 'RESOLVING').length;
  const resolvedTickets = doubts.filter(d => d.status === 'RESOLVED').length;

  // Average resolution time (resolved only)
  const resolvedList = doubts.filter(d => d.status === 'RESOLVED' && d.resolution_time_minutes);
  const avgTime = resolvedList.length > 0
    ? Math.round(resolvedList.reduce((sum, d) => sum + (d.resolution_time_minutes || 0), 0) / resolvedList.length)
    : 12;

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex justify-between items-center pb-4 border-b border-dark-border">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-brand-purple" /> Realtime Doubt Tracker
          </h2>
          <p className="text-xs text-zinc-500">Record, assign, and track student doubts resolution metrics</p>
        </div>
        <button
          onClick={() => setIsAddingDoubt(true)}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-violet hover:from-brand-violet hover:to-brand-purple text-xs font-semibold text-white transition-all-200 shadow flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Log Doubt Ticket
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-1">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Total Tickets</span>
          <h2 className="text-2xl font-bold text-white">{totalTickets}</h2>
        </div>

        <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-1">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Unassigned / Pending</span>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-neon-amber">{pendingTickets}</h2>
            <AlertCircle className="h-4.5 w-4.5 text-neon-amber animate-pulse" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-1">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">In Resolution</span>
          <h2 className="text-2xl font-bold text-neon-blue">{resolvingTickets}</h2>
        </div>

        <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-1">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Average Resolution Time</span>
          <h2 className="text-2xl font-bold text-neon-emerald">{avgTime} minutes</h2>
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex gap-2">
          {(['ALL', 'PENDING', 'RESOLVING', 'RESOLVED'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all-200 uppercase ${
                statusFilter === status
                  ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20'
                  : 'bg-zinc-900 text-zinc-400 border-dark-border/60 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {['ALL', 'Physics', 'Chemistry', 'Mathematics'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all-200 ${
                categoryFilter === cat
                  ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20'
                  : 'bg-zinc-900 text-zinc-400 border-dark-border/60 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Doubts list */}
      <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
        <h3 className="text-sm font-semibold text-white">Active Doubt Queue</h3>
        
        <div className="space-y-3">
          {filteredDoubts.map(doubt => {
            const stud = students.find(s => s.id === doubt.student_id);
            const fac = faculty.find(f => f.id === doubt.faculty_id);

            return (
              <div key={doubt.id} className="p-4 rounded-xl bg-zinc-900 border border-dark-border/60 hover:border-dark-border transition-all-200 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-dark-border/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-950 text-zinc-300 border border-dark-border">
                      {doubt.category}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">
                      Student: <span className="text-zinc-200 font-semibold">{stud?.name || 'Unknown'}</span> ({stud?.grade_level})
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-500">
                      Assigned: {fac?.name || 'Unassigned'}
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${
                      doubt.status === 'RESOLVED'
                        ? 'text-neon-emerald bg-neon-emerald/5 border-neon-emerald/20'
                        : doubt.status === 'RESOLVING'
                          ? 'text-neon-blue bg-neon-blue/5 border-neon-blue/20'
                          : 'text-neon-amber bg-neon-amber/5 border-neon-amber/20'
                    }`}>
                      {doubt.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-white font-medium italic">"{doubt.question}"</p>
                  {doubt.status === 'RESOLVED' && doubt.remarks && (
                    <div className="mt-2 p-2.5 rounded bg-zinc-950 border border-dark-border/30 text-[11px] text-zinc-400 space-y-1">
                      <span className="font-semibold text-neon-emerald">Resolution:</span> {doubt.remarks}
                      <div className="text-[9px] text-zinc-500 flex items-center gap-1.5 pt-1 border-t border-dark-border/20">
                        <Clock className="h-3 w-3" /> Resolved in {doubt.resolution_time_minutes} mins {doubt.resolved_at && `on ${new Date(doubt.resolved_at).toLocaleDateString()}`}
                      </div>
                    </div>
                  )}
                </div>

                {/* Operations pipeline controls */}
                {doubt.status !== 'RESOLVED' && (
                  <div className="flex justify-end gap-2 border-t border-dark-border/20 pt-2">
                    {doubt.status === 'PENDING' ? (
                      <button
                        onClick={() => handleStartResolving(doubt.id)}
                        className="px-2.5 py-1 text-[10px] font-semibold text-white bg-neon-blue rounded hover:bg-sky-600 transition-all-200 flex items-center gap-1"
                      >
                        <PlayCircle className="h-3.5 w-3.5" /> Begin Resolving
                      </button>
                    ) : (
                      <button
                        onClick={() => setResolvingDoubtId(doubt.id)}
                        className="px-2.5 py-1 text-[10px] font-semibold text-white bg-brand-purple rounded hover:bg-brand-violet transition-all-200 flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filteredDoubts.length === 0 && (
            <div className="text-center py-8 text-xs text-zinc-500 bg-zinc-900/10 border border-dashed border-dark-border rounded-lg">
              No doubt logs found matching active filter parameters.
            </div>
          )}
        </div>
      </div>

      {/* DIALOG 1: LOG NEW DOUBT */}
      {isAddingDoubt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-xl p-5 shadow-2xl space-y-4 relative">
            <button 
              onClick={() => setIsAddingDoubt(false)}
              className="absolute right-4 top-4 p-1 rounded bg-zinc-900 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Log Student Doubt</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Record a question asked by a student in class or doubt slots</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Student Target</label>
                <select 
                  className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white"
                  value={newDoubtStudent}
                  onChange={e => setNewDoubtStudent(e.target.value)}
                >
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase">Responsible Faculty</label>
                  <select 
                    className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white"
                    value={newDoubtFaculty}
                    onChange={e => setNewDoubtFaculty(e.target.value)}
                  >
                    {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase">Category Subject</label>
                  <select 
                    className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white"
                    value={newDoubtCategory}
                    onChange={e => setNewDoubtCategory(e.target.value)}
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Doubt Question Text</label>
                <textarea 
                  rows={4}
                  placeholder="Type the exact question, physics equation, or chemistry concept details..."
                  className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white placeholder-zinc-600 focus:outline-none"
                  value={newDoubtQuestion}
                  onChange={e => setNewDoubtQuestion(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingDoubt(false)}
                className="flex-1 py-2 rounded-lg bg-zinc-900 border border-dark-border text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateDoubt}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-brand-purple to-brand-violet text-xs font-semibold text-white shadow"
              >
                Log Doubt Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG 2: MARK DOUBT RESOLVED */}
      {resolvingDoubtId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-xl p-5 shadow-2xl space-y-4 relative">
            <button 
              onClick={() => setResolvingDoubtId(null)}
              className="absolute right-4 top-4 p-1 rounded bg-zinc-900 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Complete Doubt Ticket</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Record the explanation details and time spent solving this doubt</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Resolution Remarks / Explanation</label>
                <textarea 
                  rows={4}
                  placeholder="Enter the conceptual solution, numerical steps, or reference textbook sections..."
                  className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white placeholder-zinc-600 focus:outline-none"
                  value={resolutionRemarks}
                  onChange={e => setResolutionRemarks(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Time Spent (Minutes)</label>
                <input 
                  type="number" 
                  min="5" 
                  max="120"
                  className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white focus:outline-none"
                  value={resolutionTime}
                  onChange={e => setResolutionTime(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResolvingDoubtId(null)}
                className="flex-1 py-2 rounded-lg bg-zinc-900 border border-dark-border text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolveDoubt}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-neon-emerald to-emerald-600 text-xs font-semibold text-white shadow"
              >
                Submit Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
