'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Plus, Calendar, Clock, BookOpen, 
  Users, CheckCircle2, XCircle, AlertCircle, Save, ChevronRight, X, Copy, Download
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
  const [selectedReportClass, setSelectedReportClass] = useState<ClassLog | null>(null);

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
  const [formHomeworkDefaulters, setFormHomeworkDefaulters] = useState<string[]>([]);

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

  const copyReportText = (cl: ClassLog) => {
    const sub = subjects.find(s => s.id === cl.subject_id);
    const ch = chapters.find(c => c.id === cl.chapter_id);

    const classAtt = attendanceLogs.filter(a => a.class_id === cl.id);
    const absentees = classAtt
      .filter(a => a.status === 'ABSENT')
      .map(a => students.find(s => s.id === a.student_id)?.name)
      .filter(Boolean) as string[];

    const hwDefaulters = (cl.homework_defaulters || [])
      .map(id => students.find(s => s.id === id)?.name)
      .filter(Boolean) as string[];

    const absenteesText = absentees.length > 0 ? absentees.join(', ') : 'None';
    const defaultersText = hwDefaulters.length > 0 ? hwDefaulters.join(', ') : 'None';

    const text = `Date- ${formatDateOrdinal(cl.class_date)}
${(sub?.grade_level || 'CLASS - 11').toUpperCase()} | SUB-${(sub?.name || 'PHYSICS').toUpperCase()}

❌ ABSENTEE LIST:
${absenteesText}

⚠️ Homework Defaulters:
${defaultersText}

📚 Chapter Name:
${(ch?.title || 'PRACTICE CLASS').toUpperCase()}

✏️ HW:
${cl.homework_assigned || 'None'}
`;

    navigator.clipboard.writeText(text);
    alert('WhatsApp text report copied to clipboard!');
  };

  const downloadReportImage = (cl: ClassLog) => {
    const sub = subjects.find(s => s.id === cl.subject_id);
    const ch = chapters.find(c => c.id === cl.chapter_id);

    const classAtt = attendanceLogs.filter(a => a.class_id === cl.id);
    const absentees = classAtt
      .filter(a => a.status === 'ABSENT')
      .map(a => students.find(s => s.id === a.student_id)?.name)
      .filter(Boolean) as string[];

    const hwDefaulters = (cl.homework_defaulters || [])
      .map(id => students.find(s => s.id === id)?.name)
      .filter(Boolean) as string[];

    // Rows calculation (at least 8 rows for empty slots matching image)
    const rowCount = Math.max(absentees.length, hwDefaulters.length, 8);
    const rowHeight = 40;
    const headerHeight = 150;
    const totalHeight = headerHeight + rowCount * rowHeight;

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background (white)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';

    // 1. Date Header (0, 0, 800, 50)
    ctx.strokeRect(0, 0, 800, 50);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`Date- ${formatDateOrdinal(cl.class_date)}`, 400, 25);

    // 2. Class & Subject Header (0, 50, 800, 50)
    ctx.strokeRect(0, 50, 400, 50);
    ctx.fillText((sub?.grade_level || 'CLASS - 11').toUpperCase(), 200, 75);

    ctx.strokeRect(400, 50, 400, 50);
    ctx.fillText(`SUB-${(sub?.name || 'PHYSICS').toUpperCase()}`, 600, 75);

    // 3. Columns Header (0, 100, 800, 50)
    ctx.fillStyle = '#f8fafc'; // slightly off-white header tint
    ctx.fillRect(0, 100, 800, 50);
    
    ctx.fillStyle = '#000000';
    ctx.strokeRect(0, 100, 200, 50);
    ctx.fillText('ABSENTEE LIST', 100, 125);

    ctx.strokeRect(200, 100, 200, 50);
    ctx.fillText('Homework Defaulters', 300, 125);

    ctx.strokeRect(400, 100, 200, 50);
    ctx.fillText('Chapter Name', 500, 125);

    ctx.strokeRect(600, 100, 200, 50);
    ctx.fillText('HW', 700, 125);

    // 4. Data Rows (Y starting from 150)
    ctx.font = 'bold 16px sans-serif';
    for (let i = 0; i < rowCount; i++) {
      const currentY = 150 + i * rowHeight;

      // Absentees
      ctx.strokeRect(0, currentY, 200, rowHeight);
      if (absentees[i]) {
        ctx.fillStyle = '#dc2626'; // Bold red
        ctx.fillText(absentees[i], 100, currentY + 20);
      }

      // Defaulters
      ctx.strokeRect(200, currentY, 200, rowHeight);
      if (hwDefaulters[i]) {
        ctx.fillStyle = '#dc2626'; // Bold red
        ctx.fillText(hwDefaulters[i], 300, currentY + 20);
      }
    }

    // 5. Merged Columns (Chapter Name & HW)
    const chY = 150;
    const chHeight = rowCount * rowHeight;

    // Chapter Name Merged Cell
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(400, chY, 200, chHeight);
    ctx.strokeRect(400, chY, 200, chHeight);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px sans-serif';
    wrapTextAndDraw(ctx, (ch?.title || 'PRACTICE CLASS').toUpperCase(), 500, chY + chHeight / 2, 180, 22);

    // HW Merged Cell (spans all rows with gray fill)
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(600, chY, 200, chHeight);
    ctx.strokeRect(600, chY, 200, chHeight);

    ctx.fillStyle = '#000000';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    wrapTextAndDrawLeft(ctx, cl.homework_assigned || '', 615, chY + 15, 170, 20);

    // Download PNG
    const link = document.createElement('a');
    link.download = `WhatsApp_Report_${cl.class_date}_${sub?.name || 'Class'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const formatDateOrdinal = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const dayNum = date.getDate();
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthName = monthNames[date.getMonth()];
      
      let suffix = 'th';
      if (dayNum === 1 || dayNum === 21 || dayNum === 31) suffix = 'st';
      else if (dayNum === 2 || dayNum === 22) suffix = 'nd';
      else if (dayNum === 3 || dayNum === 23) suffix = 'rd';
      
      return `${dayNum}${suffix} ${monthName} ${date.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  const wrapTextAndDraw = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      let testLine = currentLine + words[i] + ' ';
      let metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        lines.push(currentLine.trim());
        currentLine = words[i] + ' ';
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine.trim());

    const totalHeight = lines.length * lineHeight;
    let startY = y - totalHeight / 2 + lineHeight / 2;

    lines.forEach(line => {
      ctx.fillText(line, x, startY);
      startY += lineHeight;
    });
  };

  const wrapTextAndDrawLeft = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      let testLine = currentLine + words[i] + ' ';
      let metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        lines.push(currentLine.trim());
        currentLine = words[i] + ' ';
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine.trim());

    let startY = y;
    lines.forEach(line => {
      ctx.fillText(line, x, startY);
      startY += lineHeight;
    });
  };

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
    setFormHomeworkDefaulters([]);
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
        homework_defaulters: formHomeworkDefaulters,
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
    } catch (err: any) {
      console.error('Failed to save class log:', err);
      alert('Failed to save class log: ' + (err?.message || JSON.stringify(err) || err));
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
                      
                      <button
                        onClick={() => setSelectedReportClass(cl)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40 text-[10px] font-semibold transition-all-200 flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
                      >
                        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97-1.861-1.868-4.339-2.897-6.97-2.899-5.437 0-9.862 4.37-9.866 9.8-.001 2.028.531 4.008 1.547 5.768l-.993 3.623 3.71-.973zm11.238-6.103c-.301-.15-1.777-.878-2.052-.978-.276-.099-.476-.149-.676.15-.2.299-.775.978-.95 1.178-.175.199-.35.224-.651.075-1.127-.565-1.921-1.002-2.696-2.328-.201-.349-.201-.225.075-.499.251-.25.551-.649.626-.824.075-.175.038-.349-.019-.499-.057-.15-.476-1.146-.651-1.571-.171-.41-.344-.354-.476-.36l-.406-.008c-.14-.004-.37-.053-.564.159-.194.213-.741.724-.741 1.767s.758 2.049.864 2.193c.106.143 1.493 2.28 3.616 3.197.505.218.899.349 1.206.446.508.162.97.139 1.336.085.408-.06 1.777-.724 2.027-1.424.25-.699.25-1.3.175-1.424-.075-.124-.275-.199-.575-.349z"/>
                        </svg>
                        WhatsApp Report
                      </button>
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

                  <div className="space-y-2 border-t border-dark-border pt-4">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Homework Defaulters</h4>
                    <p className="text-[9px] text-zinc-500">Select students who did not submit their homework today.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                      {students.map(s => {
                        const isChecked = formHomeworkDefaulters.includes(s.id);
                        return (
                          <div 
                            key={s.id}
                            onClick={() => {
                              setFormHomeworkDefaulters(prev =>
                                prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                              );
                            }}
                            className={`p-2.5 rounded-lg border cursor-pointer transition-all-200 flex items-center justify-between ${
                              isChecked
                                ? 'bg-red-950/20 border-red-500/30 text-neon-rose font-semibold'
                                : 'bg-zinc-900 border-dark-border text-zinc-350 hover:bg-zinc-800'
                            }`}
                          >
                            <span className="text-xs">{s.name}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="h-3.5 w-3.5 cursor-pointer accent-neon-rose"
                            />
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

      {/* WHATSAPP REPORT MODAL */}
      {selectedReportClass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-dark-card border border-dark-border rounded-xl p-5 shadow-2xl space-y-4 relative">
            <button 
              onClick={() => setSelectedReportClass(null)}
              className="absolute right-4 top-4 p-1 rounded bg-zinc-900 text-zinc-400 hover:text-white border border-dark-border cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                WhatsApp Report Generator
              </h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Preview and generate shareable media logs for WhatsApp</p>
            </div>

            {/* Preview Card */}
            <div className="border border-dark-border/80 rounded-lg p-5 bg-zinc-950 max-h-[420px] overflow-y-auto relative shadow-inner">
              <div className="bg-white text-black p-4 border border-black rounded-lg max-w-full overflow-x-auto">
                <table className="w-full border-collapse border-2 border-black text-xs font-bold text-center">
                  <tbody>
                    {/* Row 1: Date */}
                    <tr>
                      <td colSpan={4} className="border-2 border-black p-2 bg-white text-sm font-extrabold text-center text-black">
                        Date- {formatDateOrdinal(selectedReportClass.class_date)}
                      </td>
                    </tr>
                    
                    {/* Row 2: Class & Subject */}
                    <tr>
                      <td colSpan={2} className="border-2 border-black p-2 text-sm font-extrabold w-1/2 text-center text-black">
                        {(subjects.find(s => s.id === selectedReportClass.subject_id)?.grade_level || 'CLASS - 11').toUpperCase()}
                      </td>
                      <td colSpan={2} className="border-2 border-black p-2 text-sm font-extrabold w-1/2 text-center text-black">
                        SUB-{(subjects.find(s => s.id === selectedReportClass.subject_id)?.name || 'PHYSICS').toUpperCase()}
                      </td>
                    </tr>

                    {/* Row 3: Headers */}
                    <tr className="bg-slate-100 text-black">
                      <td className="border-2 border-black p-2 w-1/4 text-center">ABSENTEE LIST</td>
                      <td className="border-2 border-black p-2 w-1/4 text-center">Homework Defaulters</td>
                      <td className="border-2 border-black p-2 w-1/4 text-center">Chapter Name</td>
                      <td className="border-2 border-black p-2 w-1/4 text-center">HW</td>
                    </tr>

                    {/* Data Rows */}
                    {(() => {
                      const classAtt = attendanceLogs.filter(a => a.class_id === selectedReportClass.id);
                      const absList = classAtt
                        .filter(a => a.status === 'ABSENT')
                        .map(a => students.find(s => s.id === a.student_id)?.name)
                        .filter(Boolean) as string[];

                      const defList = (selectedReportClass.homework_defaulters || [])
                        .map(id => students.find(s => s.id === id)?.name)
                        .filter(Boolean) as string[];

                      const rowCount = Math.max(absList.length, defList.length, 8);
                      const rows = [];

                      for (let i = 0; i < rowCount; i++) {
                        rows.push(
                          <tr key={i} className="h-9">
                            {/* Absentee column */}
                            <td className="border-2 border-black p-1 text-red-600 font-bold text-center">
                              {absList[i] || ''}
                            </td>
                            
                            {/* Defaulter column */}
                            <td className="border-2 border-black p-1 text-red-600 font-bold text-center">
                              {defList[i] || ''}
                            </td>

                            {/* Chapter Column: spans all rows on the first iteration */}
                            {i === 0 && (
                              <td 
                                rowSpan={rowCount} 
                                className="border-2 border-black p-2 align-middle font-extrabold whitespace-normal break-words bg-white text-center text-black"
                              >
                                {(chapters.find(c => c.id === selectedReportClass.chapter_id)?.title || 'PRACTICE CLASS').toUpperCase()}
                              </td>
                            )}

                            {/* HW Column: spans all rows on the first iteration */}
                            {i === 0 && (
                              <td 
                                rowSpan={rowCount} 
                                className="border-2 border-black p-2 align-top text-left whitespace-normal break-words bg-slate-100 font-medium text-black"
                              >
                                {selectedReportClass.homework_assigned || ''}
                              </td>
                            )}
                          </tr>
                        );
                      }
                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => copyReportText(selectedReportClass)}
                className="flex-1 py-2 rounded-lg bg-zinc-900 border border-dark-border text-xs font-semibold text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Copy className="h-4 w-4 text-brand-purple" /> Copy Report Text
              </button>
              
              <button
                type="button"
                onClick={() => downloadReportImage(selectedReportClass)}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 text-xs font-semibold text-white shadow hover:opacity-95 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" /> Download Report Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
