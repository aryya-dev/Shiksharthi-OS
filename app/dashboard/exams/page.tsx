'use client';

import React, { useState, useEffect } from 'react';
import { 
  Award, Plus, FileText, CheckCircle2, ChevronRight, 
  HelpCircle, Sparkles, TrendingUp, AlertTriangle, Save, X 
} from 'lucide-react';
import { dbClient } from '@/lib/db';
import { Exam, Subject, Chapter, ChapterTopic, Student, ExamResult, UserProfile } from '@/types';

interface GeneratedQuestion {
  id: number;
  question: string;
  marks: number;
  section: string;
}

export default function ExamsPage() {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<ChapterTopic[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  // Wizard States
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formExamName, setFormExamName] = useState('');
  const [formExamDate, setFormExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTotalMarks, setFormTotalMarks] = useState(100);
  const [formSelectedChapters, setFormSelectedChapters] = useState<string[]>([]);
  const [isGeneratingPaper, setIsGeneratingPaper] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);

  const loadExamsData = async () => {
    try {
      const user = await dbClient.profiles.getCurrentUser();
      setCurrentUser(user);

      const ex = await dbClient.exams.list();
      setExams(ex);

      const subs = await dbClient.subjects.list();
      setSubjects(subs);

      const chs = await dbClient.chapters.list();
      setChapters(chs);

      const tops = await dbClient.chapterTopics.list();
      setTopics(tops);

      const studs = await dbClient.students.list();
      setStudents(studs);

      const results = await dbClient.examResults.list();
      setExamResults(results);

      if (subs.length > 0 && !formSubjectId) {
        setFormSubjectId(subs[0].id);
      }

      if (ex.length > 0 && !selectedExamId) {
        setSelectedExamId(ex[0].id);
      }
    } catch (err) {
      console.error('Failed to load exam modules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamsData();
    window.addEventListener('role-change', loadExamsData);
    return () => window.removeEventListener('role-change', loadExamsData);
  }, []);

  // Filter completed chapters for the chosen subject
  const getEligibleChapters = () => {
    const subChapters = chapters.filter(c => c.subject_id === formSubjectId);
    return subChapters.filter(ch => {
      // Find all topics in this chapter
      const chTopics = topics.filter(t => t.chapter_id === ch.id);
      if (chTopics.length === 0) return false;
      // Enforce: ALL topics in chapter must be completed
      return chTopics.every(t => t.is_completed);
    });
  };

  const handleCheckboxChapterChange = (chapterId: string) => {
    setFormSelectedChapters(prev => 
      prev.includes(chapterId) ? prev.filter(id => id !== chapterId) : [...prev, chapterId]
    );
  };

  const handleGenerateQuestions = () => {
    setIsGeneratingPaper(true);
    setTimeout(() => {
      // Mock questions compilation
      const selectedChapterTitles = chapters
        .filter(c => formSelectedChapters.includes(c.id))
        .map(c => c.title);

      const mockQuestions: GeneratedQuestion[] = [
        { id: 1, question: `Calculate the force/field properties based on concepts in ${selectedChapterTitles[0] || 'Syllabus'}.`, marks: 10, section: 'Section A (Subjective)' },
        { id: 2, question: `Derive the core formula equations extracted from ${selectedChapterTitles[0] || 'Syllabus'}.`, marks: 15, section: 'Section A (Subjective)' },
        { id: 3, question: `Calculate numerical velocity variables for symmetric pulleys relative to ${selectedChapterTitles[1] || 'Syllabus'}.`, marks: 25, section: 'Section B (Numerical)' }
      ];

      setGeneratedQuestions(mockQuestions);
      setIsGeneratingPaper(false);
    }, 1500);
  };

  const handleSaveExam = async () => {
    if (!formExamName || formSelectedChapters.length === 0) {
      alert('Please select chapters and name the exam.');
      return;
    }

    try {
      const savedExam = await dbClient.exams.create({
        name: formExamName,
        exam_date: formExamDate,
        total_marks: formTotalMarks,
        subject_id: formSubjectId,
        is_published: true,
        question_paper_json: {
          instructions: [
            'Time allowed: 90 minutes.',
            'Show all mathematical derivations clearly.'
          ],
          questions: generatedQuestions.map(q => ({
            id: q.id,
            question: q.question,
            marks: q.marks,
            section: q.section
          }))
        }
      }, formSelectedChapters);

      // Auto generate mock grades for students for this exam!
      const gradesPayload = students.map((s, idx) => {
        // Random marks relative to average
        const baseMark = formTotalMarks * 0.7; // 70% average
        const deviation = (Math.random() - 0.5) * (formTotalMarks * 0.3); // +/- 15%
        const score = Math.min(formTotalMarks, Math.max(20, Math.round(baseMark + deviation)));
        const percentile = 100 - (idx * (100 / students.length));

        return {
          exam_id: savedExam.id,
          student_id: s.id,
          marks_obtained: score,
          percentile: Number(percentile.toFixed(1)),
          remarks: score >= formTotalMarks * 0.8 ? 'Excellent Work' : score >= formTotalMarks * 0.6 ? 'Good Performance' : 'Needs attention'
        };
      });

      await dbClient.examResults.createMany(gradesPayload);

      setIsCreatingExam(false);
      // Reset form
      setFormExamName('');
      setFormSelectedChapters([]);
      setGeneratedQuestions([]);
      loadExamsData();
    } catch (error) {
      console.error('Failed to save exam:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-10 w-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-zinc-500">Retrieving results analytics...</span>
      </div>
    );
  }

  const activeExam = exams.find(e => e.id === selectedExamId) || exams[0];
  const activeExamResults = examResults.filter(er => er.exam_id === activeExam?.id);

  // Ranks students
  const rankedResults = [...activeExamResults]
    .sort((a, b) => b.marks_obtained - a.marks_obtained)
    .map((res, idx) => ({
      ...res,
      rank: idx + 1,
      studentName: students.find(s => s.id === res.student_id)?.name || 'Unknown',
      percentage: activeExam ? Math.round((res.marks_obtained / activeExam.total_marks) * 100) : 0
    }));

  const eligibleChaptersList = getEligibleChapters();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-dark-border">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Award className="h-5 w-5 text-brand-purple" /> Exams & Result Analytics
          </h2>
          <p className="text-xs text-zinc-500">Design question papers and track performance trends</p>
        </div>
        <button
          onClick={() => {
            setWizardStep(1);
            setIsCreatingExam(true);
          }}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-violet hover:from-brand-violet hover:to-brand-purple text-xs font-semibold text-white transition-all-200 shadow flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Create Exam
        </button>
      </div>

      {/* Split Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Exam List (Spans 1 col) */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
            <h3 className="text-sm font-semibold text-white">Exam Catalog</h3>
            
            <div className="space-y-2.5">
              {exams.map(ex => {
                const sub = subjects.find(s => s.id === ex.subject_id);
                return (
                  <div
                    key={ex.id}
                    onClick={() => setSelectedExamId(ex.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all-200 flex flex-col gap-1.5 ${
                      selectedExamId === ex.id
                        ? 'bg-brand-purple/5 border-brand-purple/40 text-brand-purple'
                        : 'bg-zinc-900 border-dark-border text-zinc-300 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-white">{ex.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-neon-emerald/10 text-neon-emerald border border-neon-emerald/20 font-bold uppercase">
                        Published
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Subject: {sub?.name || 'Class'} | Marks: {ex.total_marks} | Date: {ex.exam_date}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Active Exam Results and Analytics (Spans 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {activeExam ? (
            <div className="space-y-6">
              
              {/* Question Paper Preview Card */}
              {activeExam.question_paper_json && (
                <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-brand-purple" /> AI Question Paper Preview
                  </h3>
                  
                  <div className="space-y-3 p-3.5 rounded-lg bg-zinc-900 border border-dark-border/80 text-xs">
                    <div className="space-y-1">
                      <div className="font-bold text-white uppercase tracking-wide border-b border-dark-border pb-1">
                        Instructions:
                      </div>
                      <ul className="list-disc pl-4 text-zinc-400 space-y-0.5">
                        {activeExam.question_paper_json.instructions?.map((inst: string, idx: number) => (
                          <li key={idx}>{inst}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="font-bold text-white uppercase tracking-wide border-b border-dark-border pb-1">
                        Question Nodes:
                      </div>
                      {activeExam.question_paper_json.questions?.map((q: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-start gap-3 py-1 border-b border-dark-border/10 text-zinc-300">
                          <div>
                            <span className="font-semibold text-zinc-400">Q{q.id}.</span> {q.question}
                          </div>
                          <span className="text-[10px] text-zinc-500 font-semibold shrink-0">({q.marks} Marks)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Ranks & Analytics Table */}
              <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-neon-emerald" /> Results Ledger & Rank List
                    </h3>
                    <p className="text-[11px] text-zinc-500">Student scores, ranks, and percentile curves</p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-dark-border rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-dark-border text-zinc-400 font-semibold uppercase tracking-wider">
                        <th className="p-3 text-center">Rank</th>
                        <th className="p-3">Student</th>
                        <th className="p-3 text-center">Marks Obtained</th>
                        <th className="p-3 text-center">Percentage</th>
                        <th className="p-3 text-center">Percentile</th>
                        <th className="p-3 text-right">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border/40 text-zinc-300">
                      {rankedResults.map(res => (
                        <tr key={res.id} className="hover:bg-zinc-900/30 transition-all-200">
                          <td className="p-3 text-center font-bold text-white">#{res.rank}</td>
                          <td className="p-3 font-semibold text-white">{res.studentName}</td>
                          <td className="p-3 text-center font-medium text-neon-emerald">
                            {res.marks_obtained} <span className="text-[10px] text-zinc-500">/ {activeExam.total_marks}</span>
                          </td>
                          <td className="p-3 text-center font-semibold">{res.percentage}%</td>
                          <td className="p-3 text-center font-semibold text-neon-blue">{res.percentile}%ile</td>
                          <td className="p-3 text-right text-zinc-400 italic text-[11px]">{res.remarks || 'Passed'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-5 rounded-xl bg-dark-card border border-dark-border text-center text-zinc-500">
              Select an exam from catalog to view result analytics
            </div>
          )}
        </div>

      </div>

      {/* WIZARD DIALOG: CREATE EXAM (LIMITED TO COMPLETED SYLLABUS ONLY) */}
      {isCreatingExam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-dark-card border border-dark-border rounded-xl p-5 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsCreatingExam(false)}
              className="absolute right-4 top-4 p-1 rounded bg-zinc-900 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Exam Creator</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Step {wizardStep} of 3</p>
            </div>

            <div className="space-y-3">
              {/* STEP 1: Details */}
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 font-semibold uppercase">Subject Catalog</label>
                      <select 
                        className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white"
                        value={formSubjectId}
                        onChange={e => setFormSubjectId(e.target.value)}
                      >
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 font-semibold uppercase">Exam Title Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Physics Mid-Term Unit 1"
                        className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white placeholder-zinc-600 focus:outline-none"
                        value={formExamName}
                        onChange={e => setFormExamName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 font-semibold uppercase">Exam Date</label>
                      <input 
                        type="date"
                        className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white focus:outline-none"
                        value={formExamDate}
                        onChange={e => setFormExamDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 font-semibold uppercase">Total Marks</label>
                      <input 
                        type="number"
                        className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white focus:outline-none"
                        value={formTotalMarks}
                        onChange={e => setFormTotalMarks(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Completed Syllabus Checkbox */}
              {wizardStep === 2 && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-neon-amber/5 border border-neon-amber/20 text-xs space-y-1 text-zinc-300">
                    <span className="font-semibold text-neon-amber flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> Completed Syllabus Scope Required
                    </span>
                    <p>Shiksharthi OS enforces that test chapters must have 100% completed topics logged inside the Class Logs catalog.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-400 font-semibold uppercase block">Eligible Chapters</label>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {eligibleChaptersList.map(ch => (
                        <div 
                          key={ch.id} 
                          onClick={() => handleCheckboxChapterChange(ch.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all-200 flex items-center justify-between ${
                            formSelectedChapters.includes(ch.id)
                              ? 'bg-brand-purple/5 border-brand-purple/40 text-brand-purple'
                              : 'bg-zinc-900 border-dark-border text-zinc-300'
                          }`}
                        >
                          <span className="text-xs font-semibold">{ch.title}</span>
                          <input
                            type="checkbox"
                            checked={formSelectedChapters.includes(ch.id)}
                            readOnly
                            className="h-4 w-4 cursor-pointer"
                          />
                        </div>
                      ))}
                      {eligibleChaptersList.length === 0 && (
                        <div className="text-center py-6 text-xs text-zinc-500 italic bg-zinc-900/40 rounded border border-dashed border-dark-border">
                          No chapters qualify! Please log completed classes for this subject's topics first.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Question Paper Generation */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Compile AI Question Papers</h4>
                  
                  {generatedQuestions.length === 0 ? (
                    <button
                      type="button"
                      onClick={handleGenerateQuestions}
                      disabled={isGeneratingPaper}
                      className="w-full py-6 border-2 border-dashed border-dark-border rounded-xl flex flex-col items-center justify-center space-y-2 hover:bg-zinc-900/60 transition-all-200"
                    >
                      <Sparkles className="h-6 w-6 text-brand-purple animate-pulse" />
                      <span className="text-xs font-semibold text-white">Generate Questions via Claude AI</span>
                      <span className="text-[10px] text-zinc-500">Generates Section MCQs and Numerical problems based on syllabus</span>
                    </button>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {generatedQuestions.map((q, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-zinc-900 border border-dark-border flex justify-between items-start gap-3 text-xs">
                          <div>
                            <span className="font-bold text-zinc-500">Q{q.id}.</span> {q.question}
                          </div>
                          <span className="text-[9px] text-zinc-400 font-semibold shrink-0">({q.marks} Marks)</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {isGeneratingPaper && (
                    <div className="text-center py-4 text-xs text-zinc-500 flex flex-col items-center gap-2">
                      <div className="h-6 w-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
                      <span>Claude compiling questions database...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between pt-2 border-t border-dark-border/40">
              <button
                type="button"
                onClick={() => {
                  if (wizardStep === 1) setIsCreatingExam(false);
                  else setWizardStep(prev => prev - 1);
                }}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-dark-border text-xs font-semibold text-zinc-400 hover:text-white"
              >
                {wizardStep === 1 ? 'Cancel' : 'Back'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (wizardStep < 3) setWizardStep(prev => prev + 1);
                  else handleSaveExam();
                }}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-violet hover:from-brand-violet hover:to-brand-purple text-xs font-semibold text-white shadow flex items-center gap-1"
              >
                {wizardStep === 3 ? (
                  <>
                    <Save className="h-3.5 w-3.5" /> Save & Publish
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
