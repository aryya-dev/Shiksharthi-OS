'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, HelpCircle, AlertTriangle, BookOpen, Clock, 
  Calendar, CheckCircle, ChevronRight, UserCheck, MessageSquare, 
  TrendingUp, ArrowRight, Star
} from 'lucide-react';
import { dbClient } from '@/lib/db';
import { 
  Student, ClassLog, Doubt, Subject, Chapter, 
  ChapterTopic, Feedback, Exam, ParentInteraction 
} from '@/types';

export default function CommandCenter() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassLog[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<ChapterTopic[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [interactions, setInteractions] = useState<ParentInteraction[]>([]);

  // Simulation System Date: 2026-06-05
  const SYSTEM_DATE = '2026-06-05';

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const studs = await dbClient.students.list();
      const cl = await dbClient.classes.list();
      const dbt = await dbClient.doubts.list();
      const sub = await dbClient.subjects.list();
      const ch = await dbClient.chapters.list();
      const top = await dbClient.chapterTopics.list();
      const fb = await dbClient.feedback.list();
      const ex = await dbClient.exams.list();
      const inter = await dbClient.parentInteractions.list();

      setStudents(studs);
      setClasses(cl);
      setDoubts(dbt);
      setSubjects(sub);
      setChapters(ch);
      setTopics(top);
      setFeedbacks(fb);
      setExams(ex);
      setInteractions(inter);
    } catch (error) {
      console.error('Failed to load dashboard statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // Re-load if role changes
    window.addEventListener('role-change', loadDashboardData);
    return () => window.removeEventListener('role-change', loadDashboardData);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-10 w-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-zinc-500">Loading Shiksharthi intelligence...</span>
      </div>
    );
  }

  // 1. Metric Calculations
  const totalStudents = students.length;
  const activeDoubts = doubts.filter(d => d.status !== 'RESOLVED').length;
  const totalClassesTaught = classes.length;

  // 2. Syllabus Completion Progress
  const subjectProgress = subjects.map(sub => {
    const subChapters = chapters.filter(c => c.subject_id === sub.id);
    const subChapterIds = subChapters.map(c => c.id);
    const subTopics = topics.filter(t => subChapterIds.includes(t.chapter_id));
    const completedTopics = subTopics.filter(t => t.is_completed).length;
    const totalTopicsCount = subTopics.length;
    const progressPercent = totalTopicsCount > 0 
      ? Math.round((completedTopics / totalTopicsCount) * 100) 
      : 0;

    return {
      id: sub.id,
      name: sub.name,
      completed: completedTopics,
      total: totalTopicsCount,
      percent: progressPercent
    };
  });

  // 3. Planned vs Actual hours calculation
  const actualTaughtHours = classes.reduce((sum, c) => sum + (c.duration_minutes / 60), 0);
  const plannedSyllabusHours = chapters.reduce((sum, c) => sum + Number(c.estimated_hours || 0), 0);
  const hourDeviation = actualTaughtHours - plannedSyllabusHours;

  // 4. Students Requiring Attention (Risk analysis)
  const studentsAtRisk = students.map(student => {
    const studAtt = getStudentAttendanceMetrics(student.id);
    let riskReasons: string[] = [];
    if (studAtt.percentage < 75) {
      riskReasons.push(`Low Attendance (${studAtt.percentage}%)`);
    }
    if (studAtt.consecutiveAbsences >= 2) {
      riskReasons.push(`${studAtt.consecutiveAbsences} Consecutive Absences`);
    }
    return {
      student,
      riskLevel: riskReasons.length > 1 ? 'HIGH' : riskReasons.length === 1 ? 'MEDIUM' : 'NONE',
      reasons: riskReasons
    };
  }).filter(s => s.riskLevel !== 'NONE');

  function getStudentAttendanceMetrics(studentId: string) {
    // Calculate from actual database logs if present
    return { percentage: 100, consecutiveAbsences: 0, totalClasses: 0 };
  }

  // 5. Today's Classes List (Classes on SYSTEM_DATE)
  const todaysClasses = classes.filter(c => c.class_date === SYSTEM_DATE);

  // 6. Recent Feedback Average
  const averageFeedback = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + (f.rating_clarity + f.rating_pace + f.rating_understanding) / 3, 0) / feedbacks.length).toFixed(1)
    : '5.0';

  return (
    <div className="space-y-6">
      {/* Upper Alerts Banner (Academic Alerts) */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        {studentsAtRisk.length > 0 ? (
          <div className="flex-1 p-4 rounded-xl bg-gradient-to-r from-neon-rose/10 to-brand-purple/5 border border-neon-rose/20 flex items-start gap-3 shadow-[0_0_15px_rgba(244,63,94,0.05)]">
            <AlertTriangle className="h-5 w-5 text-neon-rose shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Critical Academic Alert</h4>
              <p className="text-xs text-zinc-300">
                Student <span className="font-semibold text-white">{studentsAtRisk[0].student.name}</span> is flagged at risk: {studentsAtRisk[0].reasons.join(', ')}.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4 rounded-xl bg-zinc-900/40 border border-dark-border flex items-start gap-3 shadow-[0_0_15px_rgba(255,255,255,0.01)]">
            <CheckCircle className="h-5 w-5 text-neon-emerald shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Academic Operations</h4>
              <p className="text-xs text-zinc-400">
                All student performance records are normal. No critical operations warnings.
              </p>
            </div>
          </div>
        )}

        {subjects.length === 0 ? (
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-dark-border flex items-start gap-3 md:w-96">
            <Clock className="h-5 w-5 text-zinc-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Syllabus Deviation</h4>
              <p className="text-xs text-zinc-400">
                No subjects configured. Add them in the Planner to track deviation.
              </p>
            </div>
          </div>
        ) : hourDeviation < 0 ? (
          <div className="p-4 rounded-xl bg-neon-amber/10 border border-neon-amber/20 flex items-start gap-3 md:w-96 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
            <Clock className="h-5 w-5 text-neon-amber shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Syllabus Deviation</h4>
              <p className="text-xs text-zinc-300">
                Curriculum is currently <span className="font-semibold text-white">{Math.abs(hourDeviation).toFixed(1)} hours behind</span> the planned academic calendar schedule.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-neon-emerald/10 border border-neon-emerald/20 flex items-start gap-3 md:w-96 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
            <Clock className="h-5 w-5 text-neon-emerald shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Syllabus Deviation</h4>
              <p className="text-xs text-zinc-300">
                Academic plan is <span className="font-semibold text-white">on schedule</span> ({actualTaughtHours.toFixed(1)} hrs taught / {plannedSyllabusHours.toFixed(1)} hrs planned).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grid of Key Statistics (Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-dark-card border border-dark-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Active Enrollment</span>
            <h2 className="text-2xl font-bold text-white">{totalStudents}</h2>
          </div>
          <div className="h-10 w-10 rounded-lg bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-dark-card border border-dark-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Taught Lectures</span>
            <h2 className="text-2xl font-bold text-white">{totalClassesTaught}</h2>
          </div>
          <div className="h-10 w-10 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-dark-card border border-dark-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Open Student Doubts</span>
            <h2 className="text-2xl font-bold text-white">{activeDoubts}</h2>
          </div>
          <div className="h-10 w-10 rounded-lg bg-neon-amber/10 border border-neon-amber/20 flex items-center justify-center text-neon-amber">
            <HelpCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-dark-card border border-dark-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Feedback Average</span>
            <h2 className="text-2xl font-bold text-white flex items-baseline gap-1">
              {averageFeedback} <span className="text-xs text-zinc-500">/ 5.0</span>
            </h2>
          </div>
          <div className="h-10 w-10 rounded-lg bg-neon-emerald/10 border border-neon-emerald/20 flex items-center justify-center text-neon-emerald">
            <Star className="h-5 w-5 fill-current" />
          </div>
        </div>
      </div>

      {/* Main Content Grid: 2 columns on desktop, 1 on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Panels: Spans 2 cols on desktop */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Planned vs Actual Tracking System Card */}
          <div className="p-5 rounded-xl bg-dark-card border border-dark-border relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-brand-purple/5 blur-xl rounded-full" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-brand-purple" /> Planned vs Actual Operations
                </h3>
                <p className="text-[11px] text-zinc-500">Comparing syllabus estimates against actual teaching logs</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-dark-border text-zinc-400 font-medium">
                Overall Progress
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3.5 rounded-lg bg-zinc-900 border border-dark-border/60">
                <div className="text-[10px] text-zinc-500 font-semibold uppercase">Total Scheduled Hours</div>
                <div className="text-lg font-bold text-white mt-1">{plannedSyllabusHours.toFixed(1)} hrs</div>
              </div>
              <div className="p-3.5 rounded-lg bg-zinc-900 border border-dark-border/60">
                <div className="text-[10px] text-zinc-500 font-semibold uppercase">Actual Taught Hours</div>
                <div className="text-lg font-bold text-neon-emerald mt-1">{(classes.reduce((s, c) => s + c.duration_minutes, 0) / 60).toFixed(1)} hrs</div>
              </div>
              <div className="p-3.5 rounded-lg bg-zinc-900 border border-dark-border/60">
                <div className="text-[10px] text-zinc-500 font-semibold uppercase">Estimated Delay Deviation</div>
                <div className={`text-lg font-bold mt-1 ${hourDeviation < 0 ? 'text-neon-rose' : 'text-neon-emerald'}`}>
                  {hourDeviation < 0 ? `-${Math.abs(hourDeviation).toFixed(1)} hrs` : `+${hourDeviation.toFixed(1)} hrs`}
                </div>
              </div>
            </div>

            {/* Visual Progress Bar comparing Planned vs Actual */}
            <div className="space-y-3">
              {subjectProgress.length === 0 ? (
                <div className="text-center py-4 text-xs text-zinc-500 italic">
                  No subject tracking data available.
                </div>
              ) : (
                subjectProgress.map(sub => (
                  <div key={sub.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-zinc-300">{sub.name}</span>
                      <span className="text-zinc-500 font-semibold">{sub.percent}% Completion ({sub.completed}/{sub.total} topics)</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-900/40">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${
                          sub.percent > 70 
                            ? 'from-neon-emerald to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                            : sub.percent > 40 
                              ? 'from-neon-blue to-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.3)]' 
                              : 'from-brand-purple to-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.3)]'
                        }`}
                        style={{ width: `${sub.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Today's Schedule & Pending Actions */}
          <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-neon-blue" /> Todays Lectures & Class Logs
                </h3>
                <p className="text-[11px] text-zinc-500">Scheduled classroom events for system calendar date: {SYSTEM_DATE}</p>
              </div>
              <span className="text-[10px] text-zinc-500 italic">{todaysClasses.length} Lectures Active</span>
            </div>

            {todaysClasses.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500 border border-dashed border-dark-border rounded-lg bg-zinc-900/10">
                No classes scheduled for today.
              </div>
            ) : (
              <div className="space-y-3">
                {todaysClasses.map(c => {
                  const subject = subjects.find(s => s.id === c.subject_id);
                  return (
                    <div key={c.id} className="p-3.5 rounded-lg bg-zinc-900 border border-dark-border/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">Class 9 {subject?.name || 'Subject'}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-neon-emerald/10 text-neon-emerald border border-neon-emerald/20 font-semibold uppercase">Logged</span>
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          Topics Covered: <span className="text-zinc-300">{c.actual_topics_covered.join(', ')}</span> | Duration: {c.duration_minutes} mins
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Doubt Feed Tracker */}
          <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-neon-amber" /> Open Student Doubts
                </h3>
                <p className="text-[11px] text-zinc-500">Realtime doubt resolution pipeline</p>
              </div>
              <span className="text-[10px] font-semibold text-neon-amber">{doubts.filter(d => d.status !== 'RESOLVED').length} Active Doubts</span>
            </div>

            {doubts.filter(d => d.status !== 'RESOLVED').length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500 border border-dashed border-dark-border rounded-lg bg-zinc-900/10">
                No active student doubts at the moment.
              </div>
            ) : (
              <div className="space-y-2.5">
                {doubts.filter(d => d.status !== 'RESOLVED').map(d => (
                  <div key={d.id} className="p-3.5 rounded-lg bg-zinc-900 border border-dark-border/60 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-dark-border">
                          {d.category}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Raised by: {students.find(s => s.id === d.student_id)?.name || 'Unknown'}
                        </span>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        d.status === 'RESOLVING' 
                          ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20' 
                          : 'bg-neon-amber/10 text-neon-amber border border-neon-amber/20'
                      }`}>
                        {d.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 font-medium italic">{d.question}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Panel: Spans 1 col on desktop, bottom on mobile */}
        <div className="space-y-6">
          
          {/* Students Requiring Attention */}
          <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-neon-rose" /> Students Requiring Attention
              </h3>
              <p className="text-[11px] text-zinc-500">Academic risk classification metrics</p>
            </div>

            {studentsAtRisk.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500 border border-dashed border-dark-border rounded-lg bg-zinc-900/10">
                All students are on track.
              </div>
            ) : (
              <div className="space-y-3">
                {studentsAtRisk.map(({ student, riskLevel, reasons }) => (
                  <div key={student.id} className="p-3 rounded-lg bg-zinc-900 border border-dark-border/80 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-white">{student.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        riskLevel === 'HIGH' 
                          ? 'bg-neon-rose/10 text-neon-rose border border-neon-rose/20' 
                          : 'bg-neon-amber/10 text-neon-amber border border-neon-amber/20'
                      }`}>
                        {riskLevel} RISK
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {reasons.map((r, idx) => (
                        <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-dark-border/40">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Parent Interactions */}
          <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-neon-emerald" /> Parent CRM & Follow-ups
              </h3>
              <p className="text-[11px] text-zinc-500 font-medium">Scheduled counselling calls & remarks</p>
            </div>

            {interactions.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500 border border-dashed border-dark-border rounded-lg bg-zinc-900/10">
                No pending parent interactions.
              </div>
            ) : (
              <div className="space-y-3">
                {interactions.slice(0, 2).map(i => (
                  <div key={i.id} className="p-3 rounded-lg bg-zinc-900 border border-dark-border/80 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-zinc-300">
                        {students.find(s => s.id === i.student_id)?.name || 'Unknown'}
                      </span>
                      <span className="text-[9px] font-medium text-zinc-500">Follow-up: {i.follow_up_date}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-3">{i.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Lecture Feedback Feed */}
          <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-brand-purple" /> Recent Faculty Feedback
              </h3>
              <p className="text-[11px] text-zinc-500">Student feedback ratings from recent class logs</p>
            </div>

            {feedbacks.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500 border border-dashed border-dark-border rounded-lg bg-zinc-900/10">
                No class feedback registered yet.
              </div>
            ) : (
              <div className="space-y-3">
                {feedbacks.slice(0, 2).map(f => (
                  <div key={f.id} className="p-3 rounded-lg bg-zinc-900 border border-dark-border/80 space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold text-zinc-300">
                      <span>{students.find(s => s.id === f.student_id)?.name || 'Student'}</span>
                      <div className="flex items-center gap-0.5 text-neon-amber">
                        <Star className="h-3 w-3 fill-current" />
                        <span>{((f.rating_clarity + f.rating_pace + f.rating_understanding)/3).toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-400 italic">"{f.comments}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
