'use client';

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, UserCheck, Star, Award, Calendar, BookOpen, 
  MessageSquare, User, TrendingUp, Sparkles 
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
        <span className="text-sm text-zinc-500">Aggregating student feedback metrics...</span>
      </div>
    );
  }

  const activeFaculty = faculty.find(f => f.id === selectedFacultyId) || faculty[0];

  // Calculate stats for Active Faculty
  const activeFacultyClasses = classes.filter(c => c.faculty_id === activeFaculty?.id);
  const activeFacultyClassIds = activeFacultyClasses.map(c => c.id);
  const activeFacultyFeedbacks = feedbacks.filter(f => activeFacultyClassIds.includes(f.class_id));

  // Rating averages
  const totalFbsCount = activeFacultyFeedbacks.length;
  
  const avgClarity = totalFbsCount > 0 
    ? (activeFacultyFeedbacks.reduce((sum, f) => sum + f.rating_clarity, 0) / totalFbsCount).toFixed(1)
    : '4.8';
  
  const avgPace = totalFbsCount > 0 
    ? (activeFacultyFeedbacks.reduce((sum, f) => sum + f.rating_pace, 0) / totalFbsCount).toFixed(1)
    : '4.5';
  
  const avgUnderstanding = totalFbsCount > 0 
    ? (activeFacultyFeedbacks.reduce((sum, f) => sum + f.rating_understanding, 0) / totalFbsCount).toFixed(1)
    : '4.6';

  const overallScore = ((Number(avgClarity) + Number(avgPace) + Number(avgUnderstanding)) / 3).toFixed(1);

  // Performance Rating Badge color
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
        <p className="text-xs text-zinc-500">View teaching registries and trace educational quality logs</p>
      </div>

      {/* Split view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Directory list (Spans 1 col) */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
            <h3 className="text-sm font-semibold text-white">Faculty Members</h3>
            
            <div className="space-y-2.5">
              {faculty.map(fac => {
                const facCls = classes.filter(c => c.faculty_id === fac.id);
                // Calculate average feedback for this faculty
                const facClsIds = facCls.map(c => c.id);
                const facFbs = feedbacks.filter(f => facClsIds.includes(f.class_id));
                const facScore = facFbs.length > 0
                  ? (facFbs.reduce((sum, f) => sum + (f.rating_clarity + f.rating_pace + f.rating_understanding)/3, 0) / facFbs.length).toFixed(1)
                  : '4.6';

                return (
                  <div
                    key={fac.id}
                    onClick={() => setSelectedFacultyId(fac.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all-200 flex items-center justify-between gap-3 ${
                      selectedFacultyId === fac.id
                        ? 'bg-brand-purple/5 border-brand-purple/40 text-brand-purple'
                        : 'bg-zinc-900 border-dark-border text-zinc-300 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white">{fac.name}</div>
                      <div className="text-[10px] text-zinc-500">
                        Joining: {fac.joining_date || 'N/A'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-semibold text-neon-amber shrink-0">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span>{facScore}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Active Faculty Details & Analytics (Spans 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {activeFaculty ? (
            <div className="space-y-6">
              
              {/* Profile Overview Card */}
              <div className="p-5 rounded-xl bg-dark-card border border-dark-border flex flex-col md:flex-row justify-between gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-24 w-24 bg-brand-purple/5 blur-xl rounded-full" />
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-brand-purple/20 flex items-center justify-center font-bold text-brand-purple border border-brand-purple/30 text-lg">
                    {activeFaculty.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-white">{activeFaculty.name}</h3>
                    <div className="text-[11px] text-zinc-500">
                      Specializations: {activeFaculty.specialization.join(', ')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <span className="text-[10px] text-zinc-500 font-semibold">Overall Rating:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${badgeColor}`}>
                    <Star className="h-3 w-3 fill-current" /> {overallScore} / 5.0
                  </span>
                </div>
              </div>

              {/* Feedback Breakdown Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-1">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Concept Clarity</span>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold text-white">{avgClarity}</h2>
                    <span className="text-[10px] text-zinc-500">/ 5.0</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-1">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Lecture Pacing</span>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold text-white">{avgPace}</h2>
                    <span className="text-[10px] text-zinc-500">/ 5.0</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-1">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Understanding Ratio</span>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold text-white">{avgUnderstanding}</h2>
                    <span className="text-[10px] text-zinc-500">/ 5.0</span>
                  </div>
                </div>
              </div>

              {/* Student Comments Timeline */}
              <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-dark-border">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Class Feedbacks Comments</h4>
                  <span className="text-[10px] text-zinc-500 font-semibold">{activeFacultyFeedbacks.length} ratings</span>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {activeFacultyFeedbacks.map(fb => {
                    const cl = classes.find(c => c.id === fb.class_id);
                    const sub = subjects.find(s => s.id === cl?.subject_id);
                    
                    const score = ((fb.rating_clarity + fb.rating_pace + fb.rating_understanding) / 3).toFixed(1);

                    return (
                      <div key={fb.id} className="p-3.5 rounded-lg bg-zinc-900 border border-dark-border/80 space-y-2 relative">
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
                      No student feedbacks logged for this faculty member yet. Feedbacks are collected after each Class Log submission.
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-5 rounded-xl bg-dark-card border border-dark-border text-center text-zinc-500">
              Select a faculty member to see performance analytics
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
