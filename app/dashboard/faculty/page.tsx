'use client';

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Star, BookOpen, 
  MessageSquare, TrendingUp, ClipboardList, Plus, X, Trash2
} from 'lucide-react';
import { dbClient } from '@/lib/db';
import { FacultyMember, Feedback, ClassLog, Subject, UserProfile } from '@/types';

export default function FacultyPage() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [classes, setClasses] = useState<ClassLog[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);

  // Add Faculty form modal states
  const [isAddingFaculty, setIsAddingFaculty] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedStandardSubjects, setSelectedStandardSubjects] = useState<string[]>([]);
  const [customSubjectsInput, setCustomSubjectsInput] = useState('');

  const loadFacultyData = async () => {
    try {
      const user = await dbClient.profiles.getCurrentUser();
      setCurrentUser(user);

      const facs = await dbClient.facultyMembers.list();
      setFaculty(facs);

      const fbs = await dbClient.feedback.list();
      setFeedbacks(fbs);

      const cls = await dbClient.classes.list();
      setClasses(cls);

      const subs = await dbClient.subjects.list();
      setSubjects(subs);

      if (facs.length > 0 && !selectedFacultyId) {
        setSelectedFacultyId(facs[0].id);
      }
    } catch (error) {
      console.error('Failed to load faculty details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacultyData();
    window.addEventListener('role-change', loadFacultyData);
    return () => window.removeEventListener('role-change', loadFacultyData);
  }, []);

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Please enter a name.');
      return;
    }

    // Combine standard selected subjects and custom input subjects
    const customSubjects = customSubjectsInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    const combinedSubjects = Array.from(new Set([...selectedStandardSubjects, ...customSubjects]));

    if (combinedSubjects.length === 0) {
      alert('Please assign at least one subject.');
      return;
    }

    try {
      const newMember = await dbClient.facultyMembers.create({
        name: newName.trim(),
        subjects: combinedSubjects,
        is_active: true,
        joining_date: new Date().toISOString().split('T')[0]
      });

      // Clear form
      setNewName('');
      setSelectedStandardSubjects([]);
      setCustomSubjectsInput('');
      setIsAddingFaculty(false);

      // Reload
      await loadFacultyData();
      setSelectedFacultyId(newMember.id);
    } catch (error) {
      console.error('Failed to add faculty member:', error);
      alert('Error saving faculty member to backend.');
    }
  };

  const handleDeleteFaculty = async (id: string) => {
    if (!confirm('Are you sure you want to remove this faculty member from the registry?')) {
      return;
    }

    try {
      await dbClient.facultyMembers.delete(id);
      
      // Update selection if deleted active one
      if (selectedFacultyId === id) {
        setSelectedFacultyId(null);
      }

      await loadFacultyData();
    } catch (error) {
      console.error('Failed to delete faculty member:', error);
      alert('Error removing faculty member from backend.');
    }
  };

  const toggleStandardSubject = (sub: string) => {
    setSelectedStandardSubjects(prev =>
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-10 w-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-zinc-500">Aggregating faculty performance metrics...</span>
      </div>
    );
  }

  const activeFaculty = faculty.find(f => f.id === selectedFacultyId) || faculty[0];

  // Helper: get subjects taught by a faculty (derived from class logs)
  const getSubjectsTaughtByFaculty = (facultyId: string): Subject[] => {
    const subjectIds = [...new Set(
      classes.filter(c => c.faculty_id === facultyId).map(c => c.subject_id).filter(Boolean)
    )];
    return subjects.filter(s => subjectIds.includes(s.id));
  };

  // Helper: get class count for a faculty
  const getClassCountByFaculty = (facultyId: string): number =>
    classes.filter(c => c.faculty_id === facultyId).length;

  // Stats for selected faculty
  const activeFacultyClasses = classes.filter(c => c.faculty_id === activeFaculty?.id);
  const activeFacultyClassIds = activeFacultyClasses.map(c => c.id);
  const activeFacultyFeedbacks = feedbacks.filter(f => activeFacultyClassIds.includes(f.class_id));
  const activeFacultySubjectsTaught = getSubjectsTaughtByFaculty(activeFaculty?.id || '');

  const totalFbsCount = activeFacultyFeedbacks.length;
  const avgClarity = totalFbsCount > 0
    ? (activeFacultyFeedbacks.reduce((sum, f) => sum + f.rating_clarity, 0) / totalFbsCount).toFixed(1)
    : '—';
  const avgPace = totalFbsCount > 0
    ? (activeFacultyFeedbacks.reduce((sum, f) => sum + f.rating_pace, 0) / totalFbsCount).toFixed(1)
    : '—';
  const avgUnderstanding = totalFbsCount > 0
    ? (activeFacultyFeedbacks.reduce((sum, f) => sum + f.rating_understanding, 0) / totalFbsCount).toFixed(1)
    : '—';

  const overallScore = totalFbsCount > 0
    ? ((Number(avgClarity) + Number(avgPace) + Number(avgUnderstanding)) / 3).toFixed(1)
    : '—';

  const scoreNum = Number(overallScore);
  const badgeColor = scoreNum >= 4.5
    ? 'text-neon-emerald bg-neon-emerald/5 border-neon-emerald/20'
    : scoreNum >= 4.0
      ? 'text-neon-blue bg-neon-blue/5 border-neon-blue/20'
      : 'text-neon-amber bg-neon-amber/5 border-neon-amber/20';

  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'SPOC';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-dark-border gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-brand-purple" /> Faculty Registry & Performance Analytics
          </h2>
          <p className="text-xs text-zinc-500">Teaching registry with subject assignments and class delivery metrics</p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsAddingFaculty(true)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-violet hover:from-brand-violet hover:to-brand-purple text-xs font-semibold text-white transition-all-200 shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Faculty Member
          </button>
        )}
      </div>

      {/* Split view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Faculty Directory */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">Faculty Members</h3>
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {faculty.map(fac => {
              const facClassCount = getClassCountByFaculty(fac.id);
              const facClsIds = classes.filter(c => c.faculty_id === fac.id).map(c => c.id);
              const facFbs = feedbacks.filter(f => facClsIds.includes(f.class_id));
              const facScore = facFbs.length > 0
                ? (facFbs.reduce((sum, f) => sum + (f.rating_clarity + f.rating_pace + f.rating_understanding) / 3, 0) / facFbs.length).toFixed(1)
                : null;

              const isSelected = selectedFacultyId === fac.id;

              return (
                <div
                  key={fac.id}
                  onClick={() => setSelectedFacultyId(fac.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 space-y-2.5 relative group ${
                    isSelected
                      ? 'bg-brand-purple/8 border-brand-purple/50 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                      : 'bg-zinc-900 border-dark-border hover:border-zinc-600'
                  }`}
                >
                  {/* Delete Button (visible on hover for admins) */}
                  {canManage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFaculty(fac.id);
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-zinc-950 border border-dark-border/60 text-zinc-500 hover:text-neon-rose hover:border-neon-rose/40 transition-all opacity-0 group-hover:opacity-100 z-10"
                      title="Remove Faculty"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Name row */}
                  <div className="flex items-center justify-between pr-6">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30' : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        {fac.name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white leading-tight">{fac.name}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {fac.is_active ? (
                            <span className="text-neon-emerald">● Active</span>
                          ) : (
                            <span className="text-zinc-500">● Inactive</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {facScore && (
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-neon-amber shrink-0">
                        <Star className="h-3 w-3 fill-current" />
                        <span>{facScore}</span>
                      </div>
                    )}
                  </div>

                  {/* Subjects taught */}
                  <div className="space-y-1">
                    <div className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">Subjects</div>
                    <div className="flex flex-wrap gap-1">
                      {fac.subjects && fac.subjects.length > 0 ? fac.subjects.map(s => (
                        <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-850 text-zinc-300 border border-dark-border/60">
                          {s}
                        </span>
                      )) : (
                        <span className="text-[9px] text-zinc-600 italic">No subjects assigned</span>
                      )}
                    </div>
                  </div>

                  {/* Classes count */}
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                    <ClipboardList className="h-3 w-3" />
                    <span>{facClassCount} {facClassCount === 1 ? 'class' : 'classes'} taught</span>
                  </div>
                </div>
              );
            })}

            {faculty.length === 0 && (
              <div className="p-4 rounded-xl bg-dark-card border border-dark-border text-center text-xs text-zinc-500">
                No faculty members found.
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Faculty Detail Panel */}
        <div className="lg:col-span-2 space-y-5">
          {activeFaculty ? (
            <>
              {/* Profile Card */}
              <div className="p-5 rounded-xl bg-dark-card border border-dark-border relative overflow-hidden">
                <div className="absolute top-0 right-0 h-32 w-32 bg-brand-purple/5 blur-2xl rounded-full pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-brand-purple/30 to-brand-violet/20 flex items-center justify-center font-bold text-brand-purple border border-brand-purple/30 text-lg shrink-0">
                      {activeFaculty.name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{activeFaculty.name}</h3>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        Registry Member Profile
                      </div>
                      {activeFaculty.joining_date && (
                        <div className="text-[10px] text-zinc-600 mt-0.5">
                          Registered Tutors DB: {activeFaculty.joining_date}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    {overallScore !== '—' && (
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 ${badgeColor}`}>
                        <Star className="h-3 w-3 fill-current" /> {overallScore} / 5.0
                      </span>
                    )}
                  </div>
                </div>

                {/* Subject Tags */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> Subjects Taught (from logs)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeFacultySubjectsTaught.length > 0 ? activeFacultySubjectsTaught.map(s => (
                        <span key={s.id} className="text-[10px] px-2 py-0.5 rounded-md bg-brand-purple/10 text-brand-purple border border-brand-purple/20 font-medium">
                          {s.name}
                        </span>
                      )) : (
                        <span className="text-[10px] text-zinc-600 italic">No classes logged yet</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Registry Assigned Subjects
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeFaculty.subjects && activeFaculty.subjects.length > 0 ? activeFaculty.subjects.map((s, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-dark-border/60">
                          {s}
                        </span>
                      )) : (
                        <span className="text-[10px] text-zinc-600 italic">No subjects assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-1 text-center">
                  <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Classes Taught</div>
                  <div className="text-2xl font-bold text-white">{activeFacultyClasses.length}</div>
                </div>
                <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-1 text-center">
                  <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Clarity</div>
                  <div className="text-2xl font-bold text-white">{avgClarity}</div>
                  <div className="text-[9px] text-zinc-600">/ 5.0</div>
                </div>
                <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-1 text-center">
                  <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Pacing</div>
                  <div className="text-2xl font-bold text-white">{avgPace}</div>
                  <div className="text-[9px] text-zinc-600">/ 5.0</div>
                </div>
                <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-1 text-center">
                  <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Understanding</div>
                  <div className="text-2xl font-bold text-white">{avgUnderstanding}</div>
                  <div className="text-[9px] text-zinc-600">/ 5.0</div>
                </div>
              </div>

              {/* Student Feedback Comments */}
              <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-dark-border">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Student Feedback Comments
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-semibold">{activeFacultyFeedbacks.length} ratings</span>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {activeFacultyFeedbacks.map(fb => {
                    const cl = classes.find(c => c.id === fb.class_id);
                    const sub = subjects.find(s => s.id === cl?.subject_id);
                    const score = ((fb.rating_clarity + fb.rating_pace + fb.rating_understanding) / 3).toFixed(1);
                    return (
                      <div key={fb.id} className="p-3.5 rounded-lg bg-zinc-900 border border-dark-border/80 space-y-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-300">{sub?.name || 'Class'}</span>
                            <span className="text-zinc-500">{cl?.class_date}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-neon-amber font-semibold">
                            <Star className="h-3 w-3 fill-current" />
                            <span>{score}</span>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-400 italic">"{fb.comments || 'No comment provided'}"</p>
                      </div>
                    );
                  })}
                  {activeFacultyFeedbacks.length === 0 && (
                    <div className="text-center py-6 text-xs text-zinc-500 bg-zinc-900/20 border border-dashed border-dark-border rounded-lg">
                      No student feedbacks logged yet. Feedbacks are collected after each Class Log submission.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-5 rounded-xl bg-dark-card border border-dark-border text-center text-zinc-500">
              Select a faculty member to view performance analytics
            </div>
          )}
        </div>

      </div>

      {/* Add Faculty Modal */}
      {isAddingFaculty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-xl p-5 shadow-2xl space-y-4 relative">
            <button 
              onClick={() => {
                setIsAddingFaculty(false);
                setNewName('');
                setSelectedStandardSubjects([]);
                setCustomSubjectsInput('');
              }}
              className="absolute right-4 top-4 p-1 rounded bg-zinc-900 text-zinc-400 hover:text-white border border-dark-border"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Register Faculty Member</h3>
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Register names and teaching areas for logs and planning</p>
            </div>

            <form onSubmit={handleAddFaculty} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Faculty Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Aryya Sir"
                  className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white placeholder-zinc-650 focus:outline-none"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Subjects (Select standard classes)</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map(sub => {
                    const isChecked = selectedStandardSubjects.includes(sub);
                    return (
                      <div
                        key={sub}
                        onClick={() => toggleStandardSubject(sub)}
                        className={`p-2 rounded-lg border cursor-pointer text-center transition-all text-xs font-medium ${
                          isChecked
                            ? 'bg-brand-purple/10 border-brand-purple/55 text-brand-purple font-semibold'
                            : 'bg-zinc-900 border-dark-border text-zinc-400 hover:text-zinc-350'
                        }`}
                      >
                        {sub}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Other Subjects (Comma-separated)</label>
                <input 
                  type="text"
                  placeholder="e.g. English, Computer Science"
                  className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white placeholder-zinc-650 focus:outline-none"
                  value={customSubjectsInput}
                  onChange={e => setCustomSubjectsInput(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingFaculty(false);
                    setNewName('');
                    setSelectedStandardSubjects([]);
                    setCustomSubjectsInput('');
                  }}
                  className="flex-1 py-2 rounded-lg bg-zinc-900 border border-dark-border text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-brand-purple to-brand-violet text-xs font-semibold text-white shadow hover:opacity-90 transition-opacity"
                >
                  Register Tutor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
