'use client';

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Star, BookOpen, 
  MessageSquare, TrendingUp, ClipboardList
} from 'lucide-react';
import { dbClient } from '@/lib/db';
import { Faculty, Feedback, ClassLog, Subject } from '@/types';

export default function FacultyPage() {
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [classes, setClasses] = useState<ClassLog[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);

  const loadFacultyData = async () => {
    try {
      const facs = await dbClient.faculty.list();
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
  const activeFacultySubjects = getSubjectsTaughtByFaculty(activeFaculty?.id || '');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-dark-border">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-brand-purple" /> Faculty Directory & Performance Analytics
        </h2>
        <p className="text-xs text-zinc-500">Teaching registry with subject assignments and class delivery metrics</p>
      </div>

      {/* Split view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Faculty Directory */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">Faculty Members</h3>
          {faculty.map(fac => {
            const facSubjects = getSubjectsTaughtByFaculty(fac.id);
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
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 space-y-2.5 ${
                  isSelected
                    ? 'bg-brand-purple/8 border-brand-purple/50 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                    : 'bg-zinc-900 border-dark-border hover:border-zinc-600'
                }`}
              >
                {/* Name row */}
                <div className="flex items-center justify-between">
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
                  <div className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">Subjects Taught</div>
                  <div className="flex flex-wrap gap-1">
                    {facSubjects.length > 0 ? facSubjects.map(s => (
                      <span key={s.id} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-dark-border/60">
                        {s.name}
                      </span>
                    )) : (
                      <span className="text-[9px] text-zinc-600 italic">No classes logged yet</span>
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
                        {activeFaculty.email}
                      </div>
                      {activeFaculty.joining_date && (
                        <div className="text-[10px] text-zinc-600 mt-0.5">
                          Joined: {activeFaculty.joining_date}
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

                {/* Subject Tags + Specialization */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> Subjects Assigned
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeFacultySubjects.length > 0 ? activeFacultySubjects.map(s => (
                        <span key={s.id} className="text-[10px] px-2 py-0.5 rounded-md bg-brand-purple/10 text-brand-purple border border-brand-purple/20 font-medium">
                          {s.name}
                        </span>
                      )) : (
                        <span className="text-[10px] text-zinc-600 italic">No subjects logged yet</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Specializations
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeFaculty.specialization.map((sp, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-dark-border/60">
                          {sp}
                        </span>
                      ))}
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
    </div>
  );
}
