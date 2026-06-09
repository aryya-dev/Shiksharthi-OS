'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, CheckSquare, AlertTriangle, PlayCircle, 
  TrendingUp, Award, CheckCircle, RefreshCw, BarChart2 
} from 'lucide-react';
import { dbClient } from '@/lib/db';
import { 
  Subject, Chapter, ChapterTopic, ClassLog, Faculty, UserProfile 
} from '@/types';

export default function AcademicPlanner() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<ChapterTopic[]>([]);
  const [classes, setClasses] = useState<ClassLog[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [updatingTopicId, setUpdatingTopicId] = useState<string | null>(null);

  const loadPlannerData = async () => {
    try {
      const user = await dbClient.profiles.getCurrentUser();
      setCurrentUser(user);

      const subs = await dbClient.subjects.list();
      setSubjects(subs);
      
      if (subs.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subs[0].id);
      }

      const cl = await dbClient.classes.list();
      setClasses(cl);

      const fac = await dbClient.faculty.list();
      setFaculty(fac);

      if (selectedSubjectId || subs.length > 0) {
        const activeSubId = selectedSubjectId || subs[0].id;
        const chs = await dbClient.chapters.list(activeSubId);
        setChapters(chs);

        const tops = await dbClient.chapterTopics.list();
        setTopics(tops);
      }
    } catch (error) {
      console.error('Failed to load planner data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlannerData();
    window.addEventListener('role-change', loadPlannerData);
    return () => window.removeEventListener('role-change', loadPlannerData);
  }, [selectedSubjectId]);

  // Handle Topic completion toggle (authorized for ADMIN/SPOC only)
  const handleToggleTopic = async (topicId: string, currentStatus: boolean) => {
    if (currentUser?.role === 'FACULTY') {
      alert('Syllabus status editing is locked for Faculty. Please create a Class Log to mark topics as covered.');
      return;
    }

    setUpdatingTopicId(topicId);
    try {
      await dbClient.chapterTopics.updateCompletion(topicId, !currentStatus);
      // Reload topics state
      const tops = await dbClient.chapterTopics.list();
      setTopics(tops);
    } catch (error) {
      console.error('Failed to update topic status:', error);
    } finally {
      setUpdatingTopicId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-10 w-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-zinc-500">Calculating curriculum metrics...</span>
      </div>
    );
  }

  // Active Subject details
  const activeSubject = subjects.find(s => s.id === selectedSubjectId);

  // Filter components for selected subject
  const activeChapters = chapters.filter(c => c.subject_id === selectedSubjectId);
  const activeChapterIds = activeChapters.map(c => c.id);
  const activeTopics = topics.filter(t => activeChapterIds.includes(t.chapter_id));

  // Calculations for Active Subject
  const totalTopics = activeTopics.length;
  const completedTopics = activeTopics.filter(t => t.is_completed).length;
  const syllabusPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Actual Taught Hours for active subject
  const subjectClasses = classes.filter(c => c.subject_id === selectedSubjectId);
  const actualHours = subjectClasses.reduce((sum, c) => sum + (c.duration_minutes / 60), 0);
  
  // Planned Hours for active subject
  const plannedHours = activeChapters.reduce((sum, c) => sum + Number(c.estimated_hours), 0);

  // Compare actual vs planned to calculate delays
  const topicsCompletedDuration = activeTopics
    .filter(t => t.is_completed)
    .reduce((sum, t) => sum + (t.estimated_minutes / 60), 0);
  const remainingPlannedHours = plannedHours - topicsCompletedDuration;
  
  // Delay Calculation: If actual taught hours exceed estimated hours of topics completed, we are delayed.
  // For the active subject, calculate active discrepancy
  const delayHours = actualHours > topicsCompletedDuration 
    ? Number((actualHours - topicsCompletedDuration).toFixed(1)) 
    : 0;

  // Faculty performance: actual hours spent per chapter compared to estimated chapter hours
  const facultyPerformance = faculty.map(fac => {
    const facClasses = subjectClasses.filter(c => c.faculty_id === fac.id);
    const facHours = facClasses.reduce((sum, c) => sum + (c.duration_minutes / 60), 0);
    
    // Total estimated hours for topics this faculty completed
    // Collect all topic IDs covered by this faculty's classes
    const coveredTopicIds = facClasses.flatMap(c => c.actual_topics_covered || []);
    const estimatedHoursCovered = topics
      .filter(t => coveredTopicIds.includes(t.id))
      .reduce((sum, t) => sum + (t.estimated_minutes / 60), 0);

    const deviation = facHours - estimatedHoursCovered;

    return {
      faculty: fac,
      actualHoursSpent: facHours,
      estimatedHoursTarget: estimatedHoursCovered,
      deviation: Number(deviation.toFixed(1))
    };
  }).filter(f => f.actualHoursSpent > 0);

  return (
    <div className="space-y-6">
      {/* Subject Selector Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-dark-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand-purple" /> Academic Planner & Syllabus Control
          </h2>
          <p className="text-xs text-zinc-500">Track and adjust course maps dynamically</p>
        </div>

        {/* Swipeable Tabs on Mobile */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {subjects.map(sub => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all-200 border shrink-0 ${
                selectedSubjectId === sub.id
                  ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/30'
                  : 'bg-zinc-900 text-zinc-400 border-dark-border/60 hover:text-white'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Metrics of Selected Subject */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-1">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Syllabus Completion</span>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">{syllabusPercent}%</h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-purple/15 text-brand-purple font-semibold">
              {completedTopics}/{totalTopics} Topics
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-1">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Estimated Syllabus Hours</span>
          <h2 className="text-2xl font-bold text-white">{plannedHours.toFixed(1)} hrs</h2>
        </div>

        <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-1">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Actual Taught Hours</span>
          <h2 className="text-2xl font-bold text-neon-emerald">{actualHours.toFixed(1)} hrs</h2>
        </div>

        <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-1">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Operational Delay</span>
          <div className="flex items-center gap-2">
            <h2 className={`text-2xl font-bold ${delayHours > 0 ? 'text-neon-rose' : 'text-neon-emerald'}`}>
              {delayHours > 0 ? `+${delayHours} hrs` : 'On Time'}
            </h2>
            {delayHours > 0 && <AlertTriangle className="h-4 w-4 text-neon-rose" />}
          </div>
        </div>
      </div>

      {/* Main Grid: Planned vs Actual Matrix & Topic checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Planned vs Actual Matrix Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-brand-purple" /> Chapter Progress & Syllabus Deviation
              </h3>
              <p className="text-[11px] text-zinc-500">Comparison of estimated hours vs actual hours spent per chapter</p>
            </div>

            {/* Scrollable table container on mobile */}
            <div className="overflow-x-auto border border-dark-border rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-900 border-b border-dark-border text-zinc-400 font-semibold uppercase tracking-wider">
                    <th className="p-3">Chapter</th>
                    <th className="p-3 text-center">Planned Hours</th>
                    <th className="p-3 text-center">Actual Hours</th>
                    <th className="p-3 text-center">Subtopics</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/40 text-zinc-300">
                  {activeChapters.map(ch => {
                    // Calculate actual hours spent on this chapter
                    const chClasses = subjectClasses.filter(c => c.chapter_id === ch.id);
                    const chActualHrs = chClasses.reduce((sum, c) => sum + (c.duration_minutes / 60), 0);

                    // Topics summary
                    const chTopics = activeTopics.filter(t => t.chapter_id === ch.id);
                    const chCompleted = chTopics.filter(t => t.is_completed).length;
                    const chTotal = chTopics.length;

                    // Compute Status
                    let statusLabel = 'Not Started';
                    let statusColor = 'text-zinc-500 bg-zinc-900/40 border-dark-border';
                    if (chCompleted === chTotal && chTotal > 0) {
                      if (chActualHrs > Number(ch.estimated_hours)) {
                        statusLabel = 'Completed (Delayed)';
                        statusColor = 'text-neon-amber bg-neon-amber/5 border-neon-amber/20';
                      } else {
                        statusLabel = 'Completed';
                        statusColor = 'text-neon-emerald bg-neon-emerald/5 border-neon-emerald/20';
                      }
                    } else if (chCompleted > 0) {
                      if (chActualHrs > Number(ch.estimated_hours)) {
                        statusLabel = 'Delayed Progress';
                        statusColor = 'text-neon-rose bg-neon-rose/5 border-neon-rose/20';
                      } else {
                        statusLabel = 'In Progress';
                        statusColor = 'text-neon-blue bg-neon-blue/5 border-neon-blue/20';
                      }
                    }

                    return (
                      <tr key={ch.id} className="hover:bg-zinc-900/30 transition-all-200">
                        <td className="p-3 font-semibold text-white max-w-[200px] truncate">{ch.title}</td>
                        <td className="p-3 text-center font-medium">{Number(ch.estimated_hours).toFixed(1)} hrs</td>
                        <td className="p-3 text-center font-medium text-neon-emerald">{chActualHrs.toFixed(1)} hrs</td>
                        <td className="p-3 text-center font-medium">{chCompleted}/{chTotal}</td>
                        <td className="p-3 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Faculty Performance Comparison details */}
          <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <BarChart2 className="h-4 w-4 text-neon-emerald" /> Faculty Lecture Efficiency Log
              </h3>
              <p className="text-[11px] text-zinc-500">Analyzes planned course outline pacing vs actual classroom delivery speeds</p>
            </div>

            {facultyPerformance.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500 bg-zinc-900/20 border border-dashed border-dark-border rounded-lg">
                No teaching logs associated with this subject yet.
              </div>
            ) : (
              <div className="space-y-3">
                {facultyPerformance.map(perf => (
                  <div key={perf.faculty.id} className="p-3.5 rounded-lg bg-zinc-900 border border-dark-border/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-white">{perf.faculty.name}</div>
                      <div className="text-[10px] text-zinc-400">
                        Assigned Specialization: {perf.faculty.specialization.join(', ')}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <div className="text-center">
                        <div className="text-[9px] text-zinc-500 uppercase">Estimated</div>
                        <div className="text-white">{perf.estimatedHoursTarget.toFixed(1)}h</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px] text-zinc-500 uppercase">Actual Spent</div>
                        <div className="text-neon-emerald">{perf.actualHoursSpent.toFixed(1)}h</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px] text-zinc-500 uppercase">Variance</div>
                        <div className={perf.deviation > 0 ? 'text-neon-rose' : 'text-neon-emerald'}>
                          {perf.deviation > 0 ? `+${perf.deviation}h` : `${perf.deviation}h`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Chapter & Subtopic Checklist */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-dark-border">
              <div>
                <h3 className="text-sm font-semibold text-white">Interactive Checklist</h3>
                <p className="text-[10px] text-zinc-500">Toggle subtopics to update syllabus</p>
              </div>
              {currentUser?.role !== 'FACULTY' && (
                <span className="text-[9px] font-semibold text-brand-purple bg-brand-purple/10 px-1.5 py-0.5 rounded border border-brand-purple/20">
                  EDIT MODE
                </span>
              )}
            </div>

            {/* List chapters & topics */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {activeChapters.map(ch => {
                const chTopics = activeTopics.filter(t => t.chapter_id === ch.id);
                return (
                  <div key={ch.id} className="space-y-2">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{ch.title}</h4>
                    <div className="space-y-1.5 pl-1.5 border-l border-zinc-800">
                      {chTopics.map(topic => (
                        <div 
                          key={topic.id} 
                          className="flex items-start gap-2.5 p-2 rounded hover:bg-zinc-900/40 transition-all-200"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 h-3.5 w-3.5 cursor-pointer disabled:cursor-not-allowed"
                            checked={topic.is_completed}
                            disabled={currentUser?.role === 'FACULTY' || updatingTopicId === topic.id}
                            onChange={() => handleToggleTopic(topic.id, topic.is_completed)}
                          />
                          <div className="space-y-0.5">
                            <span className={`text-xs ${
                              topic.is_completed ? 'line-through text-zinc-500' : 'text-zinc-300'
                            }`}>
                              {topic.name}
                            </span>
                            <div className="text-[9px] text-zinc-500">
                              Est: {topic.estimated_minutes} mins {topic.completed_at && `| Done: ${new Date(topic.completed_at).toLocaleDateString()}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
