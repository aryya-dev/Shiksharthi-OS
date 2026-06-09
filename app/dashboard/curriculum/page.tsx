'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, FileText, Upload, CheckCircle2, Plus, X 
} from 'lucide-react';
import { dbClient } from '@/lib/db';
import { Subject } from '@/types';

interface ExtractedChapterData {
  title: string;
  sequence_order: number;
  estimated_hours: number;
  difficulty_level: 'Easy' | 'Medium' | 'Hard';
  topics: Array<{ name: string; estimated_minutes: number }>;
}

export default function AICurriculumEngine() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedChapterData | null>(null);
  const [isSavingToPlanner, setIsSavingToPlanner] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      const subs = await dbClient.subjects.list();
      setSubjects(subs);
      if (subs.length > 0) {
        setSelectedSubjectId(subs[0].id);
      }
    };
    fetchSubjects();
  }, []);

  const simulateAIExtraction = (filename: string) => {
    setIsProcessing(true);
    setProcessingProgress(10);
    setExtractedData(null);
    setSaveSuccess(false);

    // Simulate progress ticks
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Inject custom chapter data based on file names
          let parsedTitle = 'Electrostatics & Field Theory';
          if (filename.toLowerCase().includes('thermo')) parsedTitle = 'Thermodynamics & Heat Transfer';
          if (filename.toLowerCase().includes('organic')) parsedTitle = 'General Organic Chemistry';
          if (filename.toLowerCase().includes('calculus')) parsedTitle = 'Integral Calculus';

          const demoData: ExtractedChapterData = {
            title: parsedTitle,
            sequence_order: 3,
            estimated_hours: 14.5,
            difficulty_level: 'Hard',
            topics: [
              { name: 'Concept of Charge & Coulomb\'s Law derivation', estimated_minutes: 60 },
              { name: 'Electric Field intensity & Superposition principle', estimated_minutes: 90 },
              { name: 'Continuous Charge Distributions (Ring, Line, Shell)', estimated_minutes: 120 },
              { name: 'Gauss\' Law & Sphere electric field calculations', estimated_minutes: 120 },
              { name: 'Electrostatic Potential & Equipotential structures', estimated_minutes: 90 },
              { name: 'Capacitors, Series-Parallel combinations & Dielectrics', estimated_minutes: 120 }
            ]
          };

          setExtractedData(demoData);
          setIsProcessing(false);
          return 100;
        }
        return prev + 15;
      });
    }, 400);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      simulateAIExtraction(files[0].name);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      simulateAIExtraction(files[0].name);
    }
  };

  // State update handlers for manual edits
  const updateMetadata = (key: keyof ExtractedChapterData, value: any) => {
    setExtractedData(prev => prev ? { ...prev, [key]: value } : null);
  };

  const updateTopic = (index: number, field: 'name' | 'estimated_minutes', value: any) => {
    setExtractedData(prev => {
      if (!prev) return null;
      const topics = [...prev.topics];
      topics[index] = { ...topics[index], [field]: value };
      return { ...prev, topics };
    });
  };

  const addTopic = () => {
    setExtractedData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        topics: [...prev.topics, { name: '', estimated_minutes: 60 }]
      };
    });
  };

  const removeTopic = (index: number) => {
    setExtractedData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        topics: prev.topics.filter((_, i) => i !== index)
      };
    });
  };

  const handleCreateManually = () => {
    const template: ExtractedChapterData = {
      title: 'New Chapter Outline',
      sequence_order: 1,
      estimated_hours: 10,
      difficulty_level: 'Medium',
      topics: [{ name: 'Topic 1', estimated_minutes: 60 }]
    };
    setExtractedData(template);
    setSaveSuccess(false);
  };

  const handlePublishToPlanner = async () => {
    if (!extractedData) return;
    setIsSavingToPlanner(true);

    try {
      // 1. Save Chapter
      const savedChapter = await dbClient.chapters.create({
        subject_id: selectedSubjectId,
        title: extractedData.title,
        sequence_order: extractedData.sequence_order,
        estimated_hours: extractedData.estimated_hours,
        difficulty_level: extractedData.difficulty_level,
        prerequisites: [],
        learning_outcomes: [],
        formulas: [],
        definitions: {}
      });

      // 2. Save Chapter Topics
      const topicsPayload = extractedData.topics
        .filter(t => t.name.trim() !== '')
        .map((t, idx) => ({
          chapter_id: savedChapter.id,
          name: t.name,
          sequence_order: idx + 1,
          estimated_minutes: t.estimated_minutes,
          is_completed: false
        }));
      await dbClient.chapterTopics.createMany(topicsPayload);

      setSaveSuccess(true);
    } catch (error) {
      console.error('Failed to sync chapter to planner:', error);
    } finally {
      setIsSavingToPlanner(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-dark-border">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-purple" /> Curriculum Engine
        </h2>
        <p className="text-xs text-zinc-500">Create a chapter and its topics manually or upload a PDF to automatically extract them</p>
      </div>

      {/* Main Grid: Upload/Creator Area & Output Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Upload & Manual Creator Controls */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
            <h3 className="text-sm font-semibold text-white">Target Assignment</h3>
            
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-semibold uppercase">Subject Catalog</label>
              <select 
                className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2.5 text-white"
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
              >
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Drag and Drop Zone */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all-200 cursor-pointer flex flex-col items-center justify-center space-y-3 min-h-[200px] ${
                isDragging 
                  ? 'border-brand-purple bg-brand-purple/5' 
                  : 'border-dark-border bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700'
              }`}
            >
              <input
                type="file"
                id="chapter-pdf"
                className="hidden"
                accept=".pdf"
                onChange={handleFileSelect}
              />
              <label htmlFor="chapter-pdf" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                <div className="h-10 w-10 rounded-full bg-zinc-900 border border-dark-border flex items-center justify-center text-zinc-400">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">Drop chapter PDF here</span>
                  <span className="text-[10px] text-zinc-500">or click to browse from device</span>
                </div>
              </label>
            </div>

            {/* Manual Toggle Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink mx-4 text-[10px] text-zinc-500 font-bold uppercase">or</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>

            {/* Manual Creator Button */}
            <button
              onClick={handleCreateManually}
              className="w-full py-2.5 rounded-lg bg-zinc-900 border border-dark-border text-xs font-semibold text-zinc-300 hover:text-white transition-all-200 flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4 text-brand-purple" /> Create Chapter Manually
            </button>
          </div>

          {/* AI Loader */}
          {isProcessing && (
            <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-brand-purple animate-pulse" /> Claude Analyzing PDF...
                </span>
                <span className="text-brand-purple font-bold">{processingProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  className="h-full bg-gradient-to-r from-brand-purple to-brand-violet transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500 italic">Extracting chapter details and compiling subtopics checklist...</p>
            </div>
          )}
        </div>

        {/* Right Side: Processed/Editable Output */}
        <div className="lg:col-span-2 space-y-4">
          {extractedData ? (
            <>
              {/* Extract Summary Header & Metadata Inputs */}
              <div className="p-5 rounded-xl bg-dark-card border border-dark-border relative overflow-hidden space-y-4">
                <div className="absolute top-0 right-0 h-24 w-24 bg-brand-purple/5 blur-xl rounded-full" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-grow">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[9px] text-zinc-400 font-bold uppercase">Chapter Title</label>
                      <input
                        type="text"
                        className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2 text-white placeholder-zinc-650 focus:outline-none"
                        value={extractedData.title}
                        onChange={e => updateMetadata('title', e.target.value)}
                        placeholder="Chapter Title"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-400 font-bold uppercase">Difficulty</label>
                      <select
                        className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2 text-white focus:outline-none"
                        value={extractedData.difficulty_level}
                        onChange={e => updateMetadata('difficulty_level', e.target.value)}
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-400 font-bold uppercase">Estimated Hours</label>
                      <input
                        type="number"
                        step="0.5"
                        className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2 text-white placeholder-zinc-600 focus:outline-none"
                        value={extractedData.estimated_hours}
                        onChange={e => updateMetadata('estimated_hours', parseFloat(e.target.value) || 0)}
                        placeholder="Hours"
                      />
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 self-end">
                    <div className="space-y-1 w-20 mr-2">
                      <label className="text-[9px] text-zinc-400 font-bold uppercase">Seq Order</label>
                      <input
                        type="number"
                        className="w-full bg-zinc-900 border border-dark-border text-xs rounded-lg p-2 text-white placeholder-zinc-600 focus:outline-none"
                        value={extractedData.sequence_order}
                        onChange={e => updateMetadata('sequence_order', parseInt(e.target.value) || 0)}
                        placeholder="Seq"
                      />
                    </div>
                    {saveSuccess ? (
                      <div className="flex items-center gap-1 text-xs text-neon-emerald font-semibold">
                        <CheckCircle2 className="h-4 w-4" /> Added to Planner
                      </div>
                    ) : (
                      <button
                        onClick={handlePublishToPlanner}
                        disabled={isSavingToPlanner}
                        className="px-3 py-2 rounded-lg bg-brand-purple text-white hover:bg-brand-violet text-xs font-semibold shadow transition-all-200 flex items-center gap-1 disabled:opacity-50"
                      >
                        {isSavingToPlanner ? 'Publishing...' : 'Add to Academic Planner'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Subtopics Checklist Preview / Editor */}
              <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Subtopics Breakdowns (Topic Logs)</h4>
                  <button
                    onClick={addTopic}
                    className="px-2.5 py-1 bg-brand-purple/10 border border-brand-purple/20 rounded-lg text-xs text-brand-purple hover:bg-brand-purple/20 font-semibold flex items-center gap-1 transition-all-200"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Topic
                  </button>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {extractedData.topics.map((top, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-zinc-900 border border-dark-border/40 flex gap-2 items-center text-xs relative group">
                      <span className="text-zinc-500 font-bold shrink-0 w-4">{idx + 1}.</span>
                      <input
                        type="text"
                        className="w-full bg-zinc-950 border border-dark-border/60 text-xs rounded-lg p-2 text-white placeholder-zinc-650 focus:outline-none"
                        value={top.name}
                        onChange={e => updateTopic(idx, 'name', e.target.value)}
                        placeholder="e.g. Coulomb's law derivation"
                      />
                      <input
                        type="number"
                        className="w-20 bg-zinc-950 border border-dark-border/60 text-xs rounded-lg p-2 text-white text-center focus:outline-none shrink-0"
                        value={top.estimated_minutes}
                        onChange={e => updateTopic(idx, 'estimated_minutes', parseInt(e.target.value) || 0)}
                        placeholder="Mins"
                      />
                      <span className="text-zinc-500 font-medium shrink-0 text-[10px]">min</span>
                      <button
                        onClick={() => removeTopic(idx)}
                        className="p-1.5 hover:text-neon-rose text-zinc-500 shrink-0 hover:bg-zinc-800 rounded-lg transition-all-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {extractedData.topics.length === 0 && (
                    <div className="text-center py-6 text-xs text-zinc-500 italic">No topics added yet. Click "Add Topic" to start.</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-10 rounded-xl bg-dark-card border border-dark-border border-dashed text-center flex flex-col items-center justify-center space-y-2 text-zinc-500 min-h-[300px]">
              <FileText className="h-10 w-10 text-zinc-600 animate-pulse" />
              <div>
                <span className="text-xs font-semibold text-zinc-400 block">Awaiting File Processing / Manual Creation</span>
                <span className="text-[10px] max-w-sm block">Upload a PDF or click "Create Chapter Manually" in the left column. You can then view, modify, and publish the curriculum topic outline here.</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
