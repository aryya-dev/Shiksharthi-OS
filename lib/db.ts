import { createClient } from '@supabase/supabase-js';
import { getLocalDB, saveLocalDB } from './mockData';
import { 
  Student, Faculty, Subject, Chapter, ChapterTopic, 
  LessonPlan, ClassLog, Attendance, Doubt, Feedback, 
  Exam, ExamResult, ParentInteraction, UserProfile, UserRole,
  AttendanceStatus, DoubtStatus, StudentFee
} from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Dual DB Router Wrapper
export const dbClient = {
  profiles: {
    getCurrentUser: async (): Promise<UserProfile> => {
      if (isSupabaseConfigured && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (data) return data;
          
          // Fallback to active Supabase Auth user details if profile table has not synced yet
          return {
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Admin',
            email: user.email || '',
            role: 'ADMIN'
          };
        }
      }
      
      // Fallback
      if (typeof window !== 'undefined') {
        const db = getLocalDB();
        const profile = db.profiles.find((p: UserProfile) => p.role === 'ADMIN');
        if (profile) return profile;
      }
      return { id: 'usr_admin', name: 'Alok Mishra (Admin)', email: 'admin@shiksharthi.in', role: 'ADMIN' };
    },
    setCurrentUserRole: async (role: UserRole): Promise<void> => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('shiksharthi_active_role', role);
        window.dispatchEvent(new Event('role-change'));
      }
    },
    list: async (): Promise<UserProfile[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('profiles').select('*');
        return data || [];
      }
      return getLocalDB().profiles;
    }
  },

  students: {
    list: async (): Promise<Student[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('students').select('*').order('name');
        return data || [];
      }
      return getLocalDB().students.sort((a, b) => a.name.localeCompare(b.name));
    },
    create: async (student: Omit<Student, 'id'>): Promise<Student> => {
      const newStudent = { ...student, id: `stud_${Date.now()}` } as Student;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('students').insert([student]).select().single();
        if (error) throw error;
        return data;
      }
      const db = getLocalDB();
      db.students.push(newStudent);
      
      // Auto-calculate discount and create local mock fee
      let discountPct = 0;
      const status = student.scholarship_status || '';
      if (status.includes('100')) discountPct = 100;
      else if (status.includes('75')) discountPct = 75;
      else if (status.includes('50')) discountPct = 50;
      else if (status.includes('25')) discountPct = 25;
      else if (status.includes('10')) discountPct = 10;
      
      const discountAmt = (28000 * discountPct) / 100;
      if (!db.studentFees) db.studentFees = [];
      db.studentFees.push({
        id: `fee_${Date.now()}`,
        student_id: newStudent.id,
        total_amount: 28000,
        scholarship_discount: discountAmt,
        amount_paid: 0
      });
      
      saveLocalDB(db);
      return newStudent;
    },
    update: async (id: string, updates: Partial<Student>): Promise<Student> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('students').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
      }
      const db = getLocalDB();
      const index = db.students.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Student not found');
      db.students[index] = { ...db.students[index], ...updates };
      
      // Update local mock fee discount if scholarship changes
      if (updates.scholarship_status !== undefined) {
        let discountPct = 0;
        const status = updates.scholarship_status || '';
        if (status.includes('100')) discountPct = 100;
        else if (status.includes('75')) discountPct = 75;
        else if (status.includes('50')) discountPct = 50;
        else if (status.includes('25')) discountPct = 25;
        else if (status.includes('10')) discountPct = 10;
        
        const discountAmt = (28000 * discountPct) / 100;
        if (!db.studentFees) db.studentFees = [];
        const feeIdx = db.studentFees.findIndex(f => f.student_id === id);
        if (feeIdx !== -1) {
          db.studentFees[feeIdx].scholarship_discount = discountAmt;
        } else {
          db.studentFees.push({
            id: `fee_${Date.now()}`,
            student_id: id,
            total_amount: 28000,
            scholarship_discount: discountAmt,
            amount_paid: 0
          });
        }
      }
      
      saveLocalDB(db);
      return db.students[index];
    }
  },

  faculty: {
    list: async (): Promise<Faculty[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('faculty').select('*');
        return data || [];
      }
      return getLocalDB().faculty;
    }
  },

  subjects: {
    list: async (): Promise<Subject[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('subjects').select('*');
        return data || [];
      }
      return getLocalDB().subjects;
    }
  },

  chapters: {
    list: async (subjectId?: string): Promise<Chapter[]> => {
      if (isSupabaseConfigured && supabase) {
        let query = supabase.from('chapters').select('*').order('sequence_order');
        if (subjectId) query = query.eq('subject_id', subjectId);
        const { data } = await query;
        return data || [];
      }
      const db = getLocalDB();
      return subjectId 
        ? db.chapters.filter(c => c.subject_id === subjectId).sort((a, b) => a.sequence_order - b.sequence_order)
        : db.chapters.sort((a, b) => a.sequence_order - b.sequence_order);
    },
    create: async (chapter: Omit<Chapter, 'id'> & { id?: string }): Promise<Chapter> => {
      const newChapter = { ...chapter, id: chapter.id || `ch_${Date.now()}` } as Chapter;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('chapters').insert([chapter]).select().single();
        if (error) throw error;
        return data;
      }
      const db = getLocalDB();
      db.chapters.push(newChapter);
      saveLocalDB(db);
      return newChapter;
    }
  },

  chapterTopics: {
    list: async (chapterId?: string): Promise<ChapterTopic[]> => {
      if (isSupabaseConfigured && supabase) {
        let query = supabase.from('chapter_topics').select('*').order('sequence_order');
        if (chapterId) query = query.eq('chapter_id', chapterId);
        const { data } = await query;
        return data || [];
      }
      const db = getLocalDB();
      return chapterId
        ? db.chapterTopics.filter(t => t.chapter_id === chapterId).sort((a, b) => a.sequence_order - b.sequence_order)
        : db.chapterTopics.sort((a, b) => a.sequence_order - b.sequence_order);
    },
    createMany: async (topics: Array<Omit<ChapterTopic, 'id'>>): Promise<ChapterTopic[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('chapter_topics').insert(topics).select();
        if (error) throw error;
        return data || [];
      }
      const db = getLocalDB();
      const newTopics = topics.map((t, idx) => ({ ...t, id: `top_${Date.now()}_${idx}` }));
      db.chapterTopics.push(...newTopics);
      saveLocalDB(db);
      return newTopics;
    },
    updateCompletion: async (topicId: string, isCompleted: boolean): Promise<ChapterTopic> => {
      const completed_at = isCompleted ? new Date().toISOString() : undefined;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('chapter_topics')
          .update({ is_completed: isCompleted, completed_at })
          .eq('id', topicId)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const db = getLocalDB();
      const index = db.chapterTopics.findIndex(t => t.id === topicId);
      if (index === -1) throw new Error('Topic not found');
      db.chapterTopics[index] = { ...db.chapterTopics[index], is_completed: isCompleted, completed_at };
      saveLocalDB(db);
      return db.chapterTopics[index];
    }
  },

  lessonPlans: {
    list: async (chapterId?: string): Promise<LessonPlan[]> => {
      if (isSupabaseConfigured && supabase) {
        let query = supabase.from('lesson_plans').select('*').order('class_number');
        if (chapterId) query = query.eq('chapter_id', chapterId);
        const { data } = await query;
        return data || [];
      }
      const db = getLocalDB();
      return chapterId
        ? db.lessonPlans.filter(lp => lp.chapter_id === chapterId).sort((a, b) => a.class_number - b.class_number)
        : db.lessonPlans.sort((a, b) => a.class_number - b.class_number);
    },
    createMany: async (plans: Array<Omit<LessonPlan, 'id'>>): Promise<LessonPlan[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('lesson_plans').insert(plans).select();
        if (error) throw error;
        return data || [];
      }
      const db = getLocalDB();
      const newPlans = plans.map((p, idx) => ({ ...p, id: `lp_${Date.now()}_${idx}` }));
      db.lessonPlans.push(...newPlans);
      saveLocalDB(db);
      return newPlans;
    }
  },

  classes: {
    list: async (): Promise<ClassLog[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('classes').select('*').order('class_date', { ascending: false });
        return data || [];
      }
      return getLocalDB().classes.sort((a, b) => b.class_date.localeCompare(a.class_date));
    },
    create: async (classLog: Omit<ClassLog, 'id'>, attendanceList: Array<{ student_id: string; status: AttendanceStatus; remarks?: string }>): Promise<ClassLog> => {
      const newClassId = `cls_${Date.now()}`;
      const newClass = { ...classLog, id: newClassId } as ClassLog;
      
      if (isSupabaseConfigured && supabase) {
        const { data: newClassData, error: classError } = await supabase.from('classes').insert([classLog]).select().single();
        if (classError) throw classError;
        
        const preparedAttendance = attendanceList.map(a => ({ ...a, class_id: newClassData.id }));
        const { error: attError } = await supabase.from('attendance').insert(preparedAttendance);
        if (attError) throw attError;
        
        // Update topics as completed in database
        if (classLog.actual_topics_covered && classLog.actual_topics_covered.length > 0) {
          await supabase.from('chapter_topics')
            .update({ is_completed: true, completed_at: new Date().toISOString() })
            .in('id', classLog.actual_topics_covered);
        }
        
        return newClassData;
      }
      
      const db = getLocalDB();
      
      // Save Class Log
      db.classes.push(newClass);
      
      // Save Attendance Records
      attendanceList.forEach(att => {
        db.attendance.push({
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          class_id: newClassId,
          student_id: att.student_id,
          status: att.status,
          remarks: att.remarks
        });
      });
      
      // Auto-update covered topics in chapterTopics to true!
      if (classLog.actual_topics_covered && classLog.actual_topics_covered.length > 0) {
        db.chapterTopics.forEach(topic => {
          if (classLog.actual_topics_covered.includes(topic.id)) {
            topic.is_completed = true;
            topic.completed_at = new Date().toISOString();
          }
        });
      }
      
      saveLocalDB(db);
      return newClass;
    }
  },

  attendance: {
    list: async (classId?: string): Promise<Attendance[]> => {
      if (isSupabaseConfigured && supabase) {
        let query = supabase.from('attendance').select('*');
        if (classId) query = query.eq('class_id', classId);
        const { data } = await query;
        return data || [];
      }
      const db = getLocalDB();
      return classId 
        ? db.attendance.filter(a => a.class_id === classId)
        : db.attendance;
    }
  },

  doubts: {
    list: async (): Promise<Doubt[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('doubts').select('*').order('created_at', { ascending: false });
        return data || [];
      }
      return getLocalDB().doubts.sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    create: async (doubt: Omit<Doubt, 'id' | 'created_at' | 'status'>): Promise<Doubt> => {
      const newDoubt = {
        ...doubt,
        id: `db_${Date.now()}`,
        status: 'PENDING',
        created_at: new Date().toISOString()
      } as Doubt;
      
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('doubts').insert([doubt]).select().single();
        if (error) throw error;
        return data;
      }
      
      const db = getLocalDB();
      db.doubts.push(newDoubt);
      saveLocalDB(db);
      return newDoubt;
    },
    updateStatus: async (id: string, status: DoubtStatus, remarks?: string, resolutionTime?: number): Promise<Doubt> => {
      const updates = { 
        status, 
        remarks, 
        resolution_time_minutes: resolutionTime, 
        resolved_at: status === 'RESOLVED' ? new Date().toISOString() : undefined 
      };
      
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('doubts').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
      }
      
      const db = getLocalDB();
      const index = db.doubts.findIndex(d => d.id === id);
      if (index === -1) throw new Error('Doubt not found');
      db.doubts[index] = { ...db.doubts[index], ...updates };
      saveLocalDB(db);
      return db.doubts[index];
    }
  },

  feedback: {
    list: async (classId?: string): Promise<Feedback[]> => {
      if (isSupabaseConfigured && supabase) {
        let query = supabase.from('feedback').select('*');
        if (classId) query = query.eq('class_id', classId);
        const { data } = await query;
        return data || [];
      }
      const db = getLocalDB();
      return classId 
        ? db.feedback.filter(f => f.class_id === classId)
        : db.feedback;
    },
    create: async (fb: Omit<Feedback, 'id' | 'created_at'>): Promise<Feedback> => {
      const newFb = { ...fb, id: `fb_${Date.now()}`, created_at: new Date().toISOString() } as Feedback;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('feedback').insert([fb]).select().single();
        if (error) throw error;
        return data;
      }
      const db = getLocalDB();
      db.feedback.push(newFb);
      saveLocalDB(db);
      return newFb;
    }
  },

  exams: {
    list: async (): Promise<Exam[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('exams').select('*').order('exam_date', { ascending: false });
        return data || [];
      }
      return getLocalDB().exams.sort((a, b) => b.exam_date.localeCompare(a.exam_date));
    },
    create: async (exam: Omit<Exam, 'id'>, chaptersScope: string[]): Promise<Exam> => {
      const newExamId = `ex_${Date.now()}`;
      const newExam = { ...exam, id: newExamId } as Exam;
      
      if (isSupabaseConfigured && supabase) {
        const { data: newExamData, error: examError } = await supabase.from('exams').insert([exam]).select().single();
        if (examError) throw examError;
        
        const scopePayload = chaptersScope.map(cId => ({ exam_id: newExamData.id, chapter_id: cId }));
        const { error: scopeError } = await supabase.from('exam_chapters').insert(scopePayload);
        if (scopeError) throw scopeError;
        
        return newExamData;
      }
      
      const db = getLocalDB();
      db.exams.push(newExam);
      saveLocalDB(db);
      return newExam;
    }
  },

  examResults: {
    list: async (examId?: string): Promise<ExamResult[]> => {
      if (isSupabaseConfigured && supabase) {
        let query = supabase.from('exam_results').select('*');
        if (examId) query = query.eq('exam_id', examId);
        const { data } = await query;
        return data || [];
      }
      const db = getLocalDB();
      return examId 
        ? db.examResults.filter(er => er.exam_id === examId)
        : db.examResults;
    },
    createMany: async (results: Array<Omit<ExamResult, 'id'>>): Promise<ExamResult[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('exam_results').insert(results).select();
        if (error) throw error;
        return data || [];
      }
      const db = getLocalDB();
      const newResults = results.map((r, idx) => ({ ...r, id: `er_${Date.now()}_${idx}` }));
      db.examResults.push(...newResults);
      saveLocalDB(db);
      return newResults;
    }
  },

  parentInteractions: {
    list: async (studentId?: string): Promise<ParentInteraction[]> => {
      if (isSupabaseConfigured && supabase) {
        let query = supabase.from('parent_interactions').select('*').order('interaction_date', { ascending: false });
        if (studentId) query = query.eq('student_id', studentId);
        const { data } = await query;
        return data || [];
      }
      const db = getLocalDB();
      return studentId 
        ? db.parentInteractions.filter(pi => pi.student_id === studentId).sort((a, b) => b.interaction_date.localeCompare(a.interaction_date))
        : db.parentInteractions.sort((a, b) => b.interaction_date.localeCompare(a.interaction_date));
    },
    create: async (interaction: Omit<ParentInteraction, 'id'>): Promise<ParentInteraction> => {
      const newInteraction = { ...interaction, id: `pi_${Date.now()}` } as ParentInteraction;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('parent_interactions').insert([interaction]).select().single();
        if (error) throw error;
        return data;
      }
      const db = getLocalDB();
      db.parentInteractions.push(newInteraction);
      saveLocalDB(db);
      return newInteraction;
    }
  },

  studentFees: {
    list: async (): Promise<StudentFee[]> => {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('student_fees').select('*');
        return data || [];
      }
      return getLocalDB().studentFees || [];
    },
    update: async (studentId: string, updates: Partial<StudentFee>): Promise<StudentFee> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('student_fees')
          .update(updates)
          .eq('student_id', studentId)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const db = getLocalDB();
      if (!db.studentFees) db.studentFees = [];
      let index = db.studentFees.findIndex(f => f.student_id === studentId);
      if (index === -1) {
        const newFee: StudentFee = {
          id: `fee_${Date.now()}`,
          student_id: studentId,
          total_amount: 28000,
          scholarship_discount: 0,
          amount_paid: 0,
          ...updates
        };
        db.studentFees.push(newFee);
        saveLocalDB(db);
        return newFee;
      }
      db.studentFees[index] = { ...db.studentFees[index], ...updates };
      saveLocalDB(db);
      return db.studentFees[index];
    },
    create: async (fee: Omit<StudentFee, 'id'>): Promise<StudentFee> => {
      const newFee = { ...fee, id: `fee_${Date.now()}` } as StudentFee;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('student_fees').insert([fee]).select().single();
        if (error) throw error;
        return data;
      }
      const db = getLocalDB();
      if (!db.studentFees) db.studentFees = [];
      db.studentFees.push(newFee);
      saveLocalDB(db);
      return newFee;
    }
  }
};
