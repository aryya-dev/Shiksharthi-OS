'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Plus, Calendar, Clock, BookOpen, 
  Users, CheckCircle2, XCircle, AlertCircle, Save, ChevronRight, X 
} from 'lucide-react';
import { dbClient } from '@/lib/db';
import { 
  ClassLog, Student, Subject, Chapter, ChapterTopic, FacultyMember, Attendance, AttendanceStatus 
} from '@/types';

export default function ClassLogsPage() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassLog[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<ChapterTopic[]>([]);
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([]);

  // Logging wizard state
  const [isLogging, setIsLogging] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  
  // Form values
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formChapterId, setFormChapterId] = useState('');
  const [formFacultyId, setFormFacultyId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDuration, setFormDuration] = useState(90);

  const [formHomework, setFormHomework] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formCoveredTopics, setFormCoveredTopics] = useState<string[]>([]);
  const [formAttendance, setFormAttendance] = useState<Record<string, { status: AttendanceStatus; remarks?: string }>>({});

  const loadClassesData = async () => {
    setLoading(true);
    try {
      const cls = await dbClient.classes.list();
      setClasses(cls);

      const studs = await dbClient.students.list();
      setStudents(studs);

      const subs = await dbClient.subjects.list();
      setSubjects(subs);

      const fac = await dbClient.facultyMembers.list();
      setFaculty(fac);

      const tops = await dbClient.chapterTopics.list();
      setTopics(tops);

      const chs = await dbClient.chapters.list();
      setChapters(chs);

      const atts = await dbClient.attendance.list();
      setAttendanceLogs(atts);

      // Prepopulate form defaults
      if (subs.length > 0) {
        setFormSubjectId(subs[0].id);
      }
    } catch (err) {
      console.error('Error loading classes data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassesData();
    window.addEventListener('role-change', loadClassesData);
    return () => window.removeEventListener('role-change', loadClassesData);
  }, []);

  // Update chapters when form subject changes
  useEffect(() => {
    if (formSubjectId) {
      const filteredChs = chapters.filter(c => c.subject_id === formSubjectId);
      if (filteredChs.length > 0) {
        setFormChapterId(filteredChs[0].id);
      } else {
        setFormChapterId('');
      }
    }
  }, [formSubjectId, chapters]);

  // Pre-populate attendance state when wizard loads
  const startLoggingFlow = async () => {
    const initialAttendance: Record<string, { status: AttendanceStatus; remarks?: string }> = {};
    students.forEach(s => {
      initialAttendance[s.id] = { status: 'PRESENT', remarks: '' };
    });
    setFormAttendance(initialAttendance);
    setFormCoveredTopics([]);
    // Auto-assign faculty: if logged-in user is FACULTY, pin to them
    const activeUser = await dbClient.profiles.getCurrentUser();
    if (activeUser.role === 'FACULTY') {
      setFormFacultyId(activeUser.id);
    } else {
      setFormFacultyId(faculty[0]?.id || '');
    }
    setWizardStep(1);
    setIsLogging(true);
  };

  const handleTopicCheckboxChange = (topicId: string) => {
    setFormCoveredTopics(prev => 
      prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
    );
  };

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setFormAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleAttendanceRemarksChange = (studentId: string, remarks: string) => {
    setFormAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks }
    }));
  };

  const handleSaveClassLog = async () => {
    try {
      const payloadLog = {
        class_date: formDate,
        duration_minutes: Number(formDuration),
        faculty_id: formFacultyId || null,
        subject_id: formSubjectId || null,
        chapter_id: formChapterId || null,
        planned_topics: formCoveredTopics.map(tId => topics.find(t => t.id === tId)?.name || ''),
        actual_topics_covered: formCoveredTopics,
        homework_assigned: formHomework,
        remarks: formRemarks
      };

      const attendanceList = Object.keys(formAttendance).map(studId => ({
        student_id: studId,
        status: formAttendance[studId].status,
        remarks: formAttendance[studId].remarks
      }));

      await dbClient.classes.create(payloadLog, attendanceList);
      setIsLogging(false);
      loadClassesData();
    } catch (err) {
      console.error('Failed to save class log:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-10 w-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-zinc-500">Retrieving operational classroom records...</span>
      </div>
    );
  }

  // Attendance stats calculator
  const studentStats = students.map(student => {
    const studentAttLogs = attendanceLogs.filter(a => a.student_id === student.id);
    const totalClasses = studentAttLogs.length;
    const attended = studentAttLogs.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const percentage = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 100;

    // Consecutive absences calculations (ordered by class date descending)
    const sortedAtts = studentAttLogs.map(att => {
      const cl = classes.find(c => c.id === att.class_id);
      return { status: att.status, date: cl?.class_date || '' };
    }).sort((a, b) => b.date.localeCompare(a.date));

    let consecutiveAbsences = 0;
    for (const att of sortedAtts) {
      if (att.status === 'ABSENT') {
        consecutiveAbsences++;
      } else {
        break;
      }
    }

    return {
      student,
      percentage,
      totalClasses,
      attended,
      consecutiveAbsences
    };
  });

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex justify-between items-center pb-4 border-b border-dark-border">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-brand-purple" /> Class Execution Logs
          </h2>
          <p className="text-xs text-zinc-500">Log topic details and attendance sheet in real-time</p>
        </div>
        <button
          onClick={startLoggingFlow}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-violet hover:from-brand-violet hover:to-brand-purple text-xs font-semibold text-white transition-all-200 shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Create Class Log
        </button>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Column: Class Logs History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
            <h3 className="text-sm font-semibold text-white">Execution History</h3>
            
            <div className="space-y-3">
              {classes.map(cl => {
                const sub = subjects.find(s => s.id === cl.subject_id);
                const ch = chapters.find(c => c.id === cl.chapter_id);
                const fac = faculty.find(f => f.id === cl.faculty_id);

                return (
                  <div key={cl.id} className="p-4 rounded-xl bg-zinc-900 border border-dark-border/60 hover:border-dark-border space-y-3 transition-all-200 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-dark-border/30 pb-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-white">{sub?.name || 'Class'}</span>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {cl.class_date}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {cl.duration_minutes} mins</span>
                          <span>Faculty: {fac?.name || 'Assigned Instructor'}</span>
                        </div>
                      </div>

                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] text-zinc-500 uppercase font-semibold">Topics Covered ({ch?.title}):</div>
                      <div className="flex flex-wrap gap-1.5">
                        {cl.planned_topics.map((t, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-zinc-950 text-zinc-300 border border-dark-border/50">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {cl.homework_assigned && (
                      <div className="p-2.5 rounded bg-zinc-950 border border-dark-border/30 text-[11px] text-zinc-400">
                        <span className="font-semibold text-brand-purple">Homework:</span> {cl.homework_assigned}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Attendance Analytics board */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Users className="h-4 w-4 text-neon-blue" /> Student Attendance Analytics
              </h3>
              <p className="text-[11px] text-zinc-500">Calculates percentages and flags consecutive absences</p>
            </div>

            <div className="space-y-3">
              {studentStats.map(({ student, percentage, totalClasses, attended, consecutiveAbsences }) => (
                <div key={student.id} className="p-3 rounded-lg bg-zinc-900 border border-dark-border/80 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-white">{student.name}</span>
                    <div className="text-[10px] text-zinc-500">
                      Attended: {attended}/{totalClasses} Classes
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className={`text-xs font-bold ${
                      percentage >= 75 ? 'text-neon-emerald' : 'text-neon-rose'
                    }`}>
                      {percentage}%
                    </div>
                    {consecutiveAbsences >= 2 && (
                      <span className="inline-block px-1.5 py-0.5 bg-neon-rose/15 text-neon-rose text-[8px] font-bold border border-neon-rose/25 rounded uppercase tracking-wide">
                        {consecutiveAbsences} Absences Flagged
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* LOGGING WIZARD DRAWER (MOBILE FRIENDLY COLLAPSIBLE DIALOG) */}
      {isLogging && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-dark-card border-l border-dark-border h-full flex flex-col justify-between shadow-2xl animate-slide-in">
            {/* Header */}
            <div className="p-4 border-b border-dark-border flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Log New Lecture</h3>
                <p className="text-[10px] text-zinc-500">Step {wizardStep} of 3</p>
              </div>
              <button 
                onClick={() => setIsLogging(false)}
                className="p-1 rounded bg-zinc-900 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              
              {/* STEP 1: Basic details */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  {/* Faculty Assignment */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-semibold uppercase">Assign Teacher</label>
                    <select 
                      className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white"
                      value={formFacultyId}
                      onChange={e => setFormFacultyId(e.target.value)}
                    >
                      {faculty.length === 0 && <option value="">No faculty configured</option>}
                      {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 font-semibold uppercase">Subject</label>
                      <select 
                        className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white"
                        value={formSubjectId}
                        onChange={e => setFormSubjectId(e.target.value)}
                      >
                        {subjects.length === 0 && <option value="">No subjects configured</option>}
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 font-semibold uppercase">Chapter Target</label>
                      <select 
                        className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white"
                        value={formChapterId}
                        onChange={e => setFormChapterId(e.target.value)}
                      >
                        {chapters.filter(c => c.subject_id === formSubjectId).length === 0 && <option value="">No chapters available</option>}
                        {chapters.filter(c => c.subject_id === formSubjectId).map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-semibold uppercase">Class Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white"
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-zinc-400 font-semibold uppercase">
                      <span>Lecture Duration</span>
                      <span className="text-brand-purple">{formDuration} minutes</span>
                    </div>
                    <input 
                      type="range" 
                      min="60" 
                      max="180" 
                      step="15" 
                      className="w-full accent-brand-purple"
                      value={formDuration}
                      onChange={e => setFormDuration(Number(e.target.value))}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Topics Checklist */}
              {wizardStep === 2 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Which subtopics did you cover today?</h4>
                  <p className="text-[10px] text-zinc-500">Checking these off updates the Syllabus Progress chart automatically.</p>
                  
                  <div className="space-y-2">
                    {topics.filter(t => t.chapter_id === formChapterId).map(topic => (
                      <div 
                        key={topic.id}
                        onClick={() => handleTopicCheckboxChange(topic.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all-200 flex items-center justify-between ${
                          formCoveredTopics.includes(topic.id)
                            ? 'bg-brand-purple/5 border-brand-purple/40 text-brand-purple'
                            : 'bg-zinc-900 border-dark-border text-zinc-300'
                        }`}
                      >
                        <span className="text-xs font-semibold">{topic.name}</span>
                        <input
                          type="checkbox"
                          checked={formCoveredTopics.includes(topic.id)}
                          readOnly
                          className="h-4 w-4 cursor-pointer"
                        />
                      </div>
                    ))}
                    {topics.filter(t => t.chapter_id === formChapterId).length === 0 && (
                      <div className="text-center py-6 text-xs text-zinc-500">
                        No subtopics found for the chosen chapter. Go to AI Curriculum Engine to generate topics.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: Student Attendance sheet, Homework & Remarks */}
              {wizardStep === 3 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Attendance Roll Call</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {students.map(s => {
                        const status = formAttendance[s.id]?.status || 'PRESENT';
                        return (
                          <div key={s.id} className="p-3 rounded-lg bg-zinc-900 border border-dark-border flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-white">{s.name}</span>
                            <div className="flex gap-1.5">
                              {(['PRESENT', 'ABSENT', 'LATE'] as AttendanceStatus[]).map(st => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleAttendanceChange(s.id, st)}
                                  className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wide uppercase border ${
                                    status === st
                                      ? st === 'PRESENT'
                                        ? 'bg-neon-emerald/10 text-neon-emerald border-neon-emerald/30'
                                        : st === 'ABSENT'
                                          ? 'bg-neon-rose/10 text-neon-rose border-neon-rose/30'
                                          : 'bg-neon-amber/10 text-neon-amber border-neon-amber/30'
                                      : 'bg-zinc-950 text-zinc-500 border-dark-border'
                                  }`}
                                >
                                  {st.slice(0, 3)}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-dark-border pt-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 font-semibold uppercase">Homework Assignment</label>
                      <textarea 
                        rows={2}
                        placeholder="Exercise sheets, textbook questions..."
                        className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white placeholder-zinc-600 focus:outline-none"
                        value={formHomework}
                        onChange={e => setFormHomework(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 font-semibold uppercase">Remarks / Observations</label>
                      <textarea 
                        rows={2}
                        placeholder="Class behavior, speed adjustments needed..."
                        className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white placeholder-zinc-600 focus:outline-none"
                        value={formRemarks}
                        onChange={e => setFormRemarks(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-dark-border flex justify-between bg-zinc-950">
              <button
                type="button"
                onClick={() => {
                  if (wizardStep === 1) setIsLogging(false);
                  else setWizardStep(prev => prev - 1);
                }}
                className="px-3 py-1.5 rounded bg-zinc-900 border border-dark-border text-xs font-semibold text-zinc-400 hover:text-white"
              >
                {wizardStep === 1 ? 'Cancel' : 'Back'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (wizardStep < 3) setWizardStep(prev => prev + 1);
                  else handleSaveClassLog();
                }}
                className="px-4 py-1.5 rounded bg-gradient-to-r from-brand-purple to-brand-violet hover:from-brand-violet hover:to-brand-purple text-xs font-semibold text-white shadow flex items-center gap-1"
              >
                {wizardStep === 3 ? (
                  <>
                    <Save className="h-3.5 w-3.5" /> Submit Log
                  </>
                ) : (
                  <>
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
