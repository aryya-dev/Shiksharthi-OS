'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, PhoneCall, Mail, User, Shield, 
  Calendar, MessageSquare, Clipboard, Search, Save, X 
} from 'lucide-react';
import { dbClient } from '@/lib/db';
import { Student, ParentInteraction, UserProfile, InteractionType } from '@/types';

export default function StudentsCRMPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [interactions, setInteractions] = useState<ParentInteraction[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  
  // Selected Student for Profile details
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // Logging Interaction Wizard state
  const [isLoggingCRM, setIsLoggingCRM] = useState(false);
  const [crmStudentId, setCrmStudentId] = useState('');
  const [crmType, setCrmType] = useState<InteractionType>('CALL');
  const [crmDetails, setCrmDetails] = useState('');
  const [crmFollowUp, setCrmFollowUp] = useState('');

  // Student creation state
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudName, setNewStudName] = useState('');
  const [newStudGrade, setNewStudGrade] = useState('Class 9');
  const [newStudParent, setNewStudParent] = useState('');
  const [newStudScholarship, setNewStudScholarship] = useState('None');

  const loadCRMData = async () => {
    try {
      const user = await dbClient.profiles.getCurrentUser();
      setCurrentUser(user);

      const studs = await dbClient.students.list();
      setStudents(studs);

      const inters = await dbClient.parentInteractions.list();
      setInteractions(inters);

      if (studs.length > 0 && !selectedStudentId) {
        setSelectedStudentId(studs[0].id);
      }
    } catch (err) {
      console.error('Failed to load CRM data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCRMData();
    window.addEventListener('role-change', loadCRMData);
    return () => window.removeEventListener('role-change', loadCRMData);
  }, []);

  const handleLogCRM = async () => {
    if (!crmStudentId || !crmDetails) return;
    try {
      const activeUser = await dbClient.profiles.getCurrentUser();
      await dbClient.parentInteractions.create({
        student_id: crmStudentId,
        interaction_type: crmType,
        details: crmDetails,
        follow_up_date: crmFollowUp || undefined,
        logged_by: activeUser.id,
        interaction_date: new Date().toISOString().split('T')[0]
      });

      setIsLoggingCRM(false);
      setCrmDetails('');
      setCrmFollowUp('');
      loadCRMData();
    } catch (error) {
      console.error('Failed to save parent CRM log:', error);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudName || !newStudParent) {
      alert('Please fill name and parent name.');
      return;
    }

    try {
      await dbClient.students.create({
        name: newStudName,
        grade_level: newStudGrade,
        parent_name: newStudParent,
        scholarship_status: newStudScholarship,
        enrollment_status: 'Active'
      });

      setIsAddingStudent(false);
      // Reset form
      setNewStudName('');
      setNewStudParent('');
      setNewStudScholarship('None');
      loadCRMData();
    } catch (error: any) {
      console.error('Failed to add student:', error);
      alert(`Failed to register student. Ensure database schema is applied and RLS is disabled. Error: ${error?.message || JSON.stringify(error)}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-10 w-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-zinc-500">Loading student directory & parent CRM...</span>
      </div>
    );
  }

  // Filter students based on search and grade filters
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.parent_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGrade = gradeFilter === 'ALL' || s.grade_level === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  const activeStudent = students.find(s => s.id === selectedStudentId) || students[0];
  const activeStudentCRM = interactions.filter(i => i.student_id === activeStudent?.id);

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-dark-border">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-purple" /> Student Profiles & Parent CRM
          </h2>
          <p className="text-xs text-zinc-500">Manage student directories and trace parent engagement counseling logs</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              if (activeStudent) {
                setCrmStudentId(activeStudent.id);
                setIsLoggingCRM(true);
              }
            }}
            className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-zinc-900 border border-dark-border text-xs font-semibold text-zinc-300 hover:text-white transition-all-200 flex items-center justify-center gap-1.5"
          >
            <PhoneCall className="h-4 w-4 text-neon-emerald" /> Log CRM Interaction
          </button>
          <button
            onClick={() => setIsAddingStudent(true)}
            className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-violet hover:from-brand-violet hover:to-brand-purple text-xs font-semibold text-white transition-all-200 shadow flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Student
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search students by name, email, parent..."
            className="w-full pl-9 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'Class 9'].map(grade => (
            <button
              key={grade}
              onClick={() => setGradeFilter(grade)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all-200 ${
                gradeFilter === grade
                  ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20'
                  : 'bg-zinc-900 text-zinc-400 border-dark-border/60 hover:text-white'
              }`}
            >
              {grade}
            </button>
          ))}
        </div>
      </div>

      {/* Split Directory and CRM Profile views */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Directory List (Spans 2 cols on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
            <h3 className="text-sm font-semibold text-white">Student Registry</h3>
            
            <div className="overflow-x-auto border border-dark-border rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-900 border-b border-dark-border text-zinc-400 font-semibold uppercase tracking-wider">
                    <th className="p-3">Name</th>
                    <th className="p-3">Grade Level</th>
                    <th className="p-3">Scholarship Status</th>
                    <th className="p-3">Parent / Contact</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/40 text-zinc-300">
                  {filteredStudents.map(student => (
                    <tr 
                      key={student.id} 
                      onClick={() => setSelectedStudentId(student.id)}
                      className={`cursor-pointer hover:bg-zinc-900/40 transition-all-200 ${
                        selectedStudentId === student.id ? 'bg-brand-purple/5 border-l-2 border-brand-purple' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div className="font-semibold text-white">{student.name}</div>
                      </td>
                      <td className="p-3 font-medium">{student.grade_level}</td>
                      <td className="p-3">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-950 text-brand-purple font-semibold border border-brand-purple/20">
                          {student.scholarship_status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-zinc-300">{student.parent_name}</div>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                          student.enrollment_status === 'Active'
                            ? 'text-neon-emerald bg-neon-emerald/5 border-neon-emerald/20'
                            : 'text-zinc-500 bg-zinc-900/40 border-dark-border'
                        }`}>
                          {student.enrollment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-zinc-500">No students matching search criteria</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Active Student Profile & Parent CRM Logs */}
        <div className="space-y-6">
          {activeStudent ? (
            <div className="space-y-6">
              
              {/* Profile Overview */}
              <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand-purple/20 flex items-center justify-center font-bold text-brand-purple border border-brand-purple/30 text-sm">
                    {activeStudent.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{activeStudent.name}</h3>
                    <p className="text-[10px] text-zinc-500">{activeStudent.grade_level} student</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs border-t border-dark-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Parent name:</span>
                    <span className="text-zinc-300 font-semibold">{activeStudent.parent_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Scholarship:</span>
                    <span className="text-zinc-300 font-semibold">{activeStudent.scholarship_status}</span>
                  </div>
                </div>
              </div>

              {/* Parent CRM Timeline */}
              <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-dark-border">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Counselling Timeline</h4>
                  <span className="text-[10px] text-zinc-500 font-semibold">{activeStudentCRM.length} logs</span>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {activeStudentCRM.map(crm => (
                    <div key={crm.id} className="p-3 rounded-lg bg-zinc-900 border border-dark-border/80 space-y-2 relative">
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          crm.interaction_type === 'CALL'
                            ? 'bg-neon-emerald/10 text-neon-emerald border-neon-emerald/20'
                            : crm.interaction_type === 'PTM_MEET'
                              ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20'
                              : 'bg-neon-blue/10 text-neon-blue border-neon-blue/20'
                        }`}>
                          {crm.interaction_type}
                        </span>
                        <span className="text-[9px] text-zinc-500">{crm.interaction_date}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{crm.details}</p>
                      {crm.follow_up_date && (
                        <div className="text-[9px] text-brand-purple font-semibold flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Next Follow-up: {crm.follow_up_date}
                        </div>
                      )}
                    </div>
                  ))}
                  {activeStudentCRM.length === 0 && (
                    <div className="text-center py-6 text-xs text-zinc-500 italic">
                      No parent communication logged for this student yet.
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-5 rounded-xl bg-dark-card border border-dark-border text-center text-zinc-500">
              Select a student to view parent counseling CRM logs
            </div>
          )}
        </div>

      </div>

      {/* DIALOG 1: LOG CRM INTERACTION */}
      {isLoggingCRM && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-xl p-5 shadow-2xl space-y-4 relative">
            <button 
              onClick={() => setIsLoggingCRM(false)}
              className="absolute right-4 top-4 p-1 rounded bg-zinc-900 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Log Parent Communication</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Record counselling logs, parent teacher meets, or complaints</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Student Target</label>
                <select 
                  className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white"
                  value={crmStudentId}
                  onChange={e => setCrmStudentId(e.target.value)}
                >
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Interaction Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CALL', 'PTM_MEET', 'COUNSELLING'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCrmType(type)}
                      className={`py-2 text-[10px] font-semibold border rounded-lg transition-all-200 uppercase ${
                        crmType === type 
                          ? 'bg-brand-purple/10 border-brand-purple/40 text-brand-purple' 
                          : 'bg-zinc-900 border-dark-border text-zinc-400 hover:text-white'
                      }`}
                    >
                      {type === 'PTM_MEET' ? 'PTM Meet' : type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Counselling details / Discussion notes</label>
                <textarea 
                  rows={4}
                  placeholder="Notes on student progress discussion, complaints, attendance reviews..."
                  className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white placeholder-zinc-600 focus:outline-none"
                  value={crmDetails}
                  onChange={e => setCrmDetails(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Follow-up schedule (Optional)</label>
                <input 
                  type="date"
                  className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white"
                  value={crmFollowUp}
                  onChange={e => setCrmFollowUp(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLoggingCRM(false)}
                className="flex-1 py-2 rounded-lg bg-zinc-900 border border-dark-border text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogCRM}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-brand-purple to-brand-violet text-xs font-semibold text-white shadow"
              >
                Log Interaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG 2: ADD STUDENT */}
      {isAddingStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-dark-card border border-dark-border rounded-xl p-5 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsAddingStudent(false)}
              className="absolute right-4 top-4 p-1 rounded bg-zinc-900 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Register New Student</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Add student demographics, scholarship parameters, and parent contact details</p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase">Student Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Priyan Sen"
                    className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white placeholder-zinc-600 focus:outline-none"
                    value={newStudName}
                    onChange={e => setNewStudName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase">Grade Level</label>
                  <select 
                    className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white"
                    value={newStudGrade}
                    onChange={e => setNewStudGrade(e.target.value)}
                  >
                    <option value="Class 9">Class 9</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 border-t border-dark-border/40 pt-2.5">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Parent Demographics</h4>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase">Parent Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Ramesh Sen"
                    className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white placeholder-zinc-600 focus:outline-none"
                    value={newStudParent}
                    onChange={e => setNewStudParent(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1 border-t border-dark-border/40 pt-2.5">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Scholarship Category</label>
                <input 
                  type="text" 
                  placeholder="e.g. None / 50% Merit / Foundation Scholarship"
                  className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white placeholder-zinc-600 focus:outline-none"
                  value={newStudScholarship}
                  onChange={e => setNewStudScholarship(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingStudent(false)}
                className="flex-1 py-2 rounded-lg bg-zinc-900 border border-dark-border text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddStudent}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-brand-purple to-brand-violet text-xs font-semibold text-white shadow"
              >
                Register Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
