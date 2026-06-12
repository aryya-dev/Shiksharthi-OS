import { 
  Student, Faculty, Subject, Chapter, ChapterTopic, 
  LessonPlan, ClassLog, Attendance, Doubt, Feedback, 
  Exam, ExamResult, ParentInteraction, UserProfile,
  StudentFee, FacultyMember
} from '../types';

// Initial Profiles
export const mockProfiles: UserProfile[] = [
  { id: 'usr_admin', name: 'Alok Mishra', email: 'admin@shiksharthi.in', phone: '+91 98765 43210', role: 'ADMIN' },
  { id: 'usr_spoc', name: 'Sneha Kapur', email: 'spoc@shiksharthi.in', phone: '+91 87654 32109', role: 'SPOC' },
  { id: 'usr_fac_phy', name: 'Dr. R. C. Sen (Physics)', email: 'rcsen.phy@shiksharthi.in', phone: '+91 76543 21098', role: 'FACULTY' },
  { id: 'usr_fac_chem', name: 'Anjali Gupta (Chemistry)', email: 'anjali.chem@shiksharthi.in', phone: '+91 65432 10987', role: 'FACULTY' },
  { id: 'usr_fac_math', name: 'Vikram Malhotra (Maths)', email: 'vikram.math@shiksharthi.in', phone: '+91 54321 09876', role: 'FACULTY' },
  { id: 'usr_fac_bio', name: 'Dr. Priya Nair (Biology)', email: 'priya.bio@shiksharthi.in', phone: '+91 43210 98765', role: 'FACULTY' }
];

// Initial Faculty Details
export const mockFaculty: Faculty[] = [
  { id: 'usr_fac_phy', name: 'Dr. R. C. Sen', email: 'rcsen.phy@shiksharthi.in', phone: '+91 76543 21098', specialization: ['Motion & Force', 'Gravitation', 'Thermodynamics Foundation'], is_active: true },
  { id: 'usr_fac_chem', name: 'Anjali Gupta', email: 'anjali.chem@shiksharthi.in', phone: '+91 65432 10987', specialization: ['Atoms & Molecules', 'Matter in Our Surroundings', 'Chemical Reactions'], is_active: true },
  { id: 'usr_fac_math', name: 'Vikram Malhotra', email: 'vikram.math@shiksharthi.in', phone: '+91 54321 09876', specialization: ['Number Systems', 'Polynomials', 'Euclid Geometry'], is_active: true },
  { id: 'usr_fac_bio', name: 'Dr. Priya Nair', email: 'priya.bio@shiksharthi.in', phone: '+91 43210 98765', specialization: ['Cell Biology', 'Tissues', 'Plant Anatomy'], is_active: true }
];

// Subjects
export const mockSubjects: Subject[] = [
  { id: 'sub_phy_9', name: 'Physics (Class 9 Foundation)', grade_level: 'Class 9', description: 'Motion, Laws of Motion, Gravitation & Work-Energy Foundation' },
  { id: 'sub_chem_9', name: 'Chemistry (Class 9 Foundation)', grade_level: 'Class 9', description: 'Matter, Atoms, Molecules & Chemical Combinations' },
  { id: 'sub_maths_9', name: 'Mathematics (Class 9 Foundation)', grade_level: 'Class 9', description: 'Number Systems, Polynomials, Coordinate Geometry & Algebra' },
  { id: 'sub_bio_9', name: 'Biology (Class 9 Foundation)', grade_level: 'Class 9', description: 'Cell structure, Tissues & Living Organisms Diversity' }
];

// Chapters
export const mockChapters: Chapter[] = [
  // Physics Chapters
  {
    id: 'ch_phy_9_01',
    subject_id: 'sub_phy_9',
    title: 'Motion & Kinematics Foundation',
    sequence_order: 1,
    estimated_hours: 12.00,
    difficulty_level: 'Medium',
    prerequisites: ['Basic Algebraic Equations', 'Graph Plotting'],
    learning_outcomes: [
      'Differentiate speed and velocity vectors',
      'Derive equations of motion graphically',
      'Analyze uniform circular motion equations'
    ],
    formulas: [
      'v = u + at',
      's = ut + 0.5 * a * t^2',
      'v^2 = u^2 + 2as',
      'v_circular = (2 * π * r) / t'
    ],
    definitions: {
      'Displacement': 'The shortest vector distance between initial and final position points.',
      'Uniform Acceleration': 'Equal change in velocity occurring in equal intervals of time.'
    }
  },
  {
    id: 'ch_phy_9_02',
    subject_id: 'sub_phy_9',
    title: 'Force & Newton\'s Laws',
    sequence_order: 2,
    estimated_hours: 10.00,
    difficulty_level: 'Hard',
    prerequisites: ['Motion & Vectors Foundation'],
    learning_outcomes: [
      'Explain momentum conservation numerically',
      'Apply F=ma to horizontal blocks',
      'Analyze action-reaction force pairs'
    ],
    formulas: [
      'Force = mass * acceleration',
      'Momentum = mass * velocity',
      'm1*u1 + m2*u2 = m1*v1 + m2*v2'
    ],
    definitions: {
      'Inertia': 'The inherent property of a body to resist changes in its state of motion.'
    }
  },
  // Chemistry Chapters
  {
    id: 'ch_chem_9_01',
    subject_id: 'sub_chem_9',
    title: 'Atoms & Molecules',
    sequence_order: 1,
    estimated_hours: 8.00,
    difficulty_level: 'Medium',
    prerequisites: ['Matter states'],
    learning_outcomes: [
      'State and prove Law of Conservation of Mass',
      'Explain Mole concept and molecular weights calculation',
      'Write chemical formulas of ionic compounds'
    ],
    formulas: [
      'Moles = Given Mass / Molar Mass',
      'Number of Particles = Moles * 6.022e23'
    ],
    definitions: {
      'Valency': 'The combining capacity of an atom or group of atoms.',
      'Avogadro Number': 'The total number of atoms or molecules in one mole of any substance (6.022 x 10^23).'
    }
  },
  // Biology Chapters
  {
    id: 'ch_bio_9_01',
    subject_id: 'sub_bio_9',
    title: 'Cell - The Fundamental Unit of Life',
    sequence_order: 1,
    estimated_hours: 9.00,
    difficulty_level: 'Medium',
    prerequisites: ['General Science observations'],
    learning_outcomes: [
      'Differentiate eukaryotic vs prokaryotic cell nodes',
      'Analyze the function of cellular organelles',
      'Understand diffusion and osmosis in cell membranes'
    ],
    formulas: [],
    definitions: {
      'Plasmolysis': 'Shrinkage of cell contents away from the cell wall when placed in a hypertonic solution.',
      'Osmosis': 'Movement of water molecules through a semi-permeable membrane from high to low concentration.'
    }
  }
];

// Granular Chapter Topics
export const mockChapterTopics: ChapterTopic[] = [
  // Physics - Motion
  { id: 'top_phy_9_01_01', chapter_id: 'ch_phy_9_01', name: 'Reference Frames, Distance & Displacement', sequence_order: 1, estimated_minutes: 60, is_completed: true, completed_at: '2026-06-01T15:00:00.000Z' },
  { id: 'top_phy_9_01_02', chapter_id: 'ch_phy_9_01', name: 'Uniform & Non-Uniform Speed/Velocity', sequence_order: 2, estimated_minutes: 90, is_completed: true, completed_at: '2026-06-02T15:00:00.000Z' },
  { id: 'top_phy_9_01_03', chapter_id: 'ch_phy_9_01', name: 'Equations of Motion Graphical Derivation', sequence_order: 3, estimated_minutes: 90, is_completed: true, completed_at: '2026-06-03T15:00:00.000Z' },
  { id: 'top_phy_9_01_04', chapter_id: 'ch_phy_9_01', name: 'Uniform Circular Motion & Centripetal intro', sequence_order: 4, estimated_minutes: 90, is_completed: true, completed_at: '2026-06-04T15:00:00.000Z' },
  { id: 'top_phy_9_01_05', chapter_id: 'ch_phy_9_01', name: 'Relative Velocity in Straight Line', sequence_order: 5, estimated_minutes: 120, is_completed: false },
  
  // Physics - Force
  { id: 'top_phy_9_02_01', chapter_id: 'ch_phy_9_02', name: 'Concept of Balanced & Unbalanced Forces', sequence_order: 1, estimated_minutes: 60, is_completed: false },
  { id: 'top_phy_9_02_02', chapter_id: 'ch_phy_9_02', name: 'Inertia & Newton\'s First Law Applications', sequence_order: 2, estimated_minutes: 90, is_completed: false },

  // Chemistry - Atoms
  { id: 'top_chem_9_01_01', chapter_id: 'ch_chem_9_01', name: 'Laws of Chemical Combination (Mass/Proportions)', sequence_order: 1, estimated_minutes: 90, is_completed: true, completed_at: '2026-06-03T17:00:00.000Z' },
  { id: 'top_chem_9_01_02', chapter_id: 'ch_chem_9_01', name: 'Dalton\'s Atomic Theory & Atoms Definition', sequence_order: 2, estimated_minutes: 120, is_completed: true, completed_at: '2026-06-05T17:00:00.000Z' },
  { id: 'top_chem_9_01_03', chapter_id: 'ch_chem_9_01', name: 'Mole Concept & Avogadro Numericals', sequence_order: 3, estimated_minutes: 90, is_completed: false },

  // Biology - Cell
  { id: 'top_bio_9_01_01', chapter_id: 'ch_bio_9_01', name: 'Discovery of Cell & Cell Theory', sequence_order: 1, estimated_minutes: 60, is_completed: true, completed_at: '2026-06-02T16:00:00.000Z' },
  { id: 'top_bio_9_01_02', chapter_id: 'ch_bio_9_01', name: 'Structure of Cell Membrane & Osmosis', sequence_order: 2, estimated_minutes: 90, is_completed: false },
  { id: 'top_bio_9_01_03', chapter_id: 'ch_bio_9_01', name: 'Nucleus, Cytoplasm & Organelles (Mitochondria)', sequence_order: 3, estimated_minutes: 120, is_completed: false }
];

// Lesson Plans
export const mockLessonPlans: LessonPlan[] = [
  {
    id: 'lp_phy_9_01_01',
    chapter_id: 'ch_phy_9_01',
    class_number: 1,
    topics: ['Reference Frames', 'Distance & Displacement', 'Vector intro'],
    learning_objectives: ['Differentiate scalar distance from displacement', 'Calculate net displacement geometrically'],
    examples: ['Moving around a circular field of radius r. Find displacement at 1.5 rounds.'],
    homework: ['Motion Sheet 1: Questions 1 to 10'],
    revision_strategy: 'Review basic Pythagorean theorem'
  },
  {
    id: 'lp_phy_9_01_02',
    chapter_id: 'ch_phy_9_01',
    class_number: 2,
    topics: ['Uniform Speed', 'Graphical representation of velocity'],
    learning_objectives: ['Analyze distance-time straight lines', 'Calculate slope of graphs to get speed'],
    examples: ['Slope calculation of non-linear velocity curve.'],
    homework: ['Motion Sheet 1: Questions 11 to 20'],
    revision_strategy: 'Recap graph quadrant plots'
  }
];

// Students (Class 9 Foundation program)
export const mockStudents: Student[] = [
  { id: 'stud_01', name: 'Aarav Sharma', grade_level: 'Class 9', parent_name: 'Rajesh Sharma', scholarship_status: '50% Merit', enrollment_status: 'Active', enrollment_date: '2026-04-10' },
  { id: 'stud_02', name: 'Ananya Sen', grade_level: 'Class 9', parent_name: 'Deepak Sen', scholarship_status: 'None', enrollment_status: 'Active', enrollment_date: '2026-04-12' },
  { id: 'stud_03', name: 'Kabir Gupta', grade_level: 'Class 9', parent_name: 'Suresh Gupta', scholarship_status: '25% Sports', enrollment_status: 'Active', enrollment_date: '2026-04-15' },
  { id: 'stud_04', name: 'Ishaan Patel', grade_level: 'Class 9', parent_name: 'Mukesh Patel', scholarship_status: 'None', enrollment_status: 'Active', enrollment_date: '2026-04-18' },
  { id: 'stud_05', name: 'Meera Reddy', grade_level: 'Class 9', parent_name: 'Prakash Reddy', scholarship_status: '100% Foundation Scholarship', enrollment_status: 'Active', enrollment_date: '2026-04-20' },
  { id: 'stud_06', name: 'Rohit Verma', grade_level: 'Class 9', parent_name: 'Sanjeev Verma', scholarship_status: 'None', enrollment_status: 'Active', enrollment_date: '2026-04-22' }
];

// Class Logs
export const mockClasses: ClassLog[] = [
  {
    id: 'cls_01',
    class_date: '2026-06-01',
    duration_minutes: 90,
    faculty_id: 'usr_fac_phy',
    subject_id: 'sub_phy_9',
    chapter_id: 'ch_phy_9_01',
    planned_topics: ['Reference Frames', 'Distance & Displacement'],
    actual_topics_covered: ['top_phy_9_01_01'],
    homework_assigned: 'Read Chapter 8 NCERT. Solve Exercise Q1-Q5.',
    remarks: 'Class 9 students had a solid intuitive grasp of reference coordinates.'
  },
  {
    id: 'cls_02',
    class_date: '2026-06-02',
    duration_minutes: 90,
    faculty_id: 'usr_fac_phy',
    subject_id: 'sub_phy_9',
    chapter_id: 'ch_phy_9_01',
    planned_topics: ['Uniform Velocity', 'Instantaneous Velocity'],
    actual_topics_covered: ['top_phy_9_01_02'],
    homework_assigned: 'Solve kinematics foundation sheet.',
    remarks: 'Needed extra 15 mins to explain differential slope limit concept.'
  },
  {
    id: 'cls_03',
    class_date: '2026-06-03',
    duration_minutes: 100,
    faculty_id: 'usr_fac_phy',
    subject_id: 'sub_phy_9',
    chapter_id: 'ch_phy_9_01',
    planned_topics: ['Equations of Motion'],
    actual_topics_covered: ['top_phy_9_01_03'],
    homework_assigned: 'Derive three equations of motion graphically.',
    remarks: 'Graph areas and slopes calculations solved.'
  },
  {
    id: 'cls_04',
    class_date: '2026-06-04',
    duration_minutes: 90,
    faculty_id: 'usr_fac_phy',
    subject_id: 'sub_phy_9',
    chapter_id: 'ch_phy_9_01',
    planned_topics: ['Uniform Circular Motion'],
    actual_topics_covered: ['top_phy_9_01_04'],
    homework_assigned: 'Worksheet on circular velocity.',
    remarks: 'Completed Motion Chapter. Ready to start Force & Laws of Motion.'
  },
  {
    id: 'cls_05',
    class_date: '2026-06-03',
    duration_minutes: 90,
    faculty_id: 'usr_fac_chem',
    subject_id: 'sub_chem_9',
    chapter_id: 'ch_chem_9_01',
    planned_topics: ['Laws of Chemical Combination'],
    actual_topics_covered: ['top_chem_9_01_01'],
    homework_assigned: 'Verify conservation of mass worksheet calculations.',
    remarks: 'Students engaged well during weight balances demo.'
  },
  {
    id: 'cls_06',
    class_date: '2026-06-05',
    duration_minutes: 90,
    faculty_id: 'usr_fac_chem',
    subject_id: 'sub_chem_9',
    chapter_id: 'ch_chem_9_01',
    planned_topics: ['Dalton Atomic Theory'],
    actual_topics_covered: ['top_chem_9_01_02'],
    homework_assigned: 'Write postulates of Dalton theory.',
    remarks: 'Atomic representations completed.'
  },
  {
    id: 'cls_07',
    class_date: '2026-06-02',
    duration_minutes: 90,
    faculty_id: 'usr_fac_bio',
    subject_id: 'sub_bio_9',
    chapter_id: 'ch_bio_9_01',
    planned_topics: ['Discovery of Cells'],
    actual_topics_covered: ['top_bio_9_01_01'],
    homework_assigned: 'Draw labelled diagram of plant cell outline.',
    remarks: 'Discussed Robert Hooke observations.'
  }
];

// Attendance
export const mockAttendance: Attendance[] = [
  // Class 1
  { id: 'att_01', class_id: 'cls_01', student_id: 'stud_01', status: 'PRESENT' },
  { id: 'att_02', class_id: 'cls_01', student_id: 'stud_02', status: 'PRESENT' },
  { id: 'att_03', class_id: 'cls_01', student_id: 'stud_03', status: 'PRESENT' },
  { id: 'att_04', class_id: 'cls_01', student_id: 'stud_04', status: 'ABSENT', remarks: 'Medical leaves' },
  { id: 'att_05', class_id: 'cls_01', student_id: 'stud_05', status: 'PRESENT' },
  { id: 'att_06', class_id: 'cls_01', student_id: 'stud_06', status: 'PRESENT' },
  // Class 2
  { id: 'att_07', class_id: 'cls_02', student_id: 'stud_01', status: 'PRESENT' },
  { id: 'att_08', class_id: 'cls_02', student_id: 'stud_02', status: 'PRESENT' },
  { id: 'att_09', class_id: 'cls_02', student_id: 'stud_03', status: 'ABSENT', remarks: 'Missed school bus' },
  { id: 'att_10', class_id: 'cls_02', student_id: 'stud_04', status: 'ABSENT', remarks: 'Consecutive Absence' },
  { id: 'att_11', class_id: 'cls_02', student_id: 'stud_05', status: 'PRESENT' },
  { id: 'att_12', class_id: 'cls_02', student_id: 'stud_06', status: 'PRESENT' },
  // Class 3
  { id: 'att_13', class_id: 'cls_03', student_id: 'stud_01', status: 'PRESENT' },
  { id: 'att_14', class_id: 'cls_03', student_id: 'stud_02', status: 'PRESENT' },
  { id: 'att_15', class_id: 'cls_03', student_id: 'stud_03', status: 'PRESENT' },
  { id: 'att_16', class_id: 'cls_03', student_id: 'stud_04', status: 'ABSENT', remarks: 'Continuous sickness' },
  { id: 'att_17', class_id: 'cls_03', student_id: 'stud_05', status: 'PRESENT' },
  { id: 'att_18', class_id: 'cls_03', student_id: 'stud_06', status: 'LATE', remarks: '10 min late entry' }
];

// Feedback (clarity, pace, understanding, comments)
export const mockFeedback: Feedback[] = [
  { id: 'fb_01', class_id: 'cls_01', student_id: 'stud_01', rating_clarity: 5, rating_pace: 4, rating_understanding: 5, comments: 'Extremely clear explanation of frames.' },
  { id: 'fb_02', class_id: 'cls_01', student_id: 'stud_02', rating_clarity: 4, rating_pace: 3, rating_understanding: 4, comments: 'Pace was slightly fast but content is digestible.' },
  { id: 'fb_03', class_id: 'cls_02', student_id: 'stud_01', rating_clarity: 5, rating_pace: 4, rating_understanding: 5, comments: 'Equations of motion derivations were crystal clear.' },
  { id: 'fb_04', class_id: 'cls_02', student_id: 'stud_05', rating_clarity: 4, rating_pace: 4, rating_understanding: 4, comments: 'Graphical slopes questions solved really helped my homework.' }
];

// Doubts
export const mockDoubts: Doubt[] = [
  {
    id: 'db_01',
    student_id: 'stud_01',
    faculty_id: 'usr_fac_phy',
    question: 'How does frame of reference change displacement trajectories? A coin dropped inside a moving bus has what path for outside observer?',
    category: 'Physics',
    status: 'RESOLVED',
    remarks: 'Explained with relative velocity vector coordinates.',
    resolution_time_minutes: 15,
    created_at: '2026-06-02T10:00:00Z',
    resolved_at: '2026-06-02T10:15:00Z'
  },
  {
    id: 'db_02',
    student_id: 'stud_03',
    faculty_id: 'usr_fac_phy',
    question: 'Please explain the derivation of graphically plotting equations of motion. Why does area under v-t graph equal displacement?',
    category: 'Physics',
    status: 'PENDING',
    created_at: '2026-06-06T14:30:00Z'
  },
  {
    id: 'db_03',
    student_id: 'stud_05',
    faculty_id: 'usr_fac_chem',
    question: 'Why does Dalton theory fail for isotopes?',
    category: 'Chemistry',
    status: 'RESOLVING',
    remarks: 'Dalton assumed all atoms of an element are identical. Isotopes have different neutrons and masses.',
    resolution_time_minutes: 8,
    created_at: '2026-06-05T09:00:00Z'
  }
];

// Parent CRM interactions
export const mockParentInteractions: ParentInteraction[] = [
  {
    id: 'pi_01',
    student_id: 'stud_04',
    interaction_type: 'CALL',
    interaction_date: '2026-06-04',
    details: 'Called parent (Mukesh Patel) to enquire about Ishaan\'s consecutive absences in Class 9 Foundation lectures. Parent informed that Ishaan is suffering from viral fever. Requested doctor certificate and planned catch-up classes.',
    follow_up_date: '2026-06-11',
    logged_by: 'usr_spoc'
  },
  {
    id: 'pi_02',
    student_id: 'stud_03',
    interaction_type: 'PTM_MEET',
    interaction_date: '2026-06-03',
    details: 'PTM meeting logged. Parent is concerned about mathematics graph representation tests. Advised scheduling doubts sessions with Vikram Malhotra.',
    follow_up_date: '2026-06-20',
    logged_by: 'usr_spoc'
  }
];

// Exams
export const mockExams: Exam[] = [
  {
    id: 'ex_01',
    name: 'Physics Motion Chapter Test (Class 9)',
    exam_date: '2026-06-05',
    total_marks: 50,
    subject_id: 'sub_phy_9',
    is_published: true,
    question_paper_json: {
      instructions: [
        'Attempt all questions. Time limit is 60 minutes.',
        'Show all graphical derivations clearly.'
      ],
      questions: [
        { id: 1, question: 'A boy runs along a circular track of radius R. What is displacement at 1.5 rounds?', marks: 5, section: 'Section A (MCQ)' },
        { id: 2, question: 'Derive v = u + at and s = ut + 0.5at^2 graphically.', marks: 10, section: 'Section B (Subjective)' },
        { id: 3, question: 'A car accelerates uniformly from 18 km/h to 36 km/h in 5 seconds. Find acceleration and distance covered.', marks: 15, section: 'Section C (Numerical)' },
        { id: 4, question: 'Prove that area under velocity-time graph represents displacement.', marks: 20, section: 'Section C (Numerical)' }
      ]
    }
  }
];

// Exam Results
export const mockExamResults: ExamResult[] = [
  { id: 'er_01', exam_id: 'ex_01', student_id: 'stud_01', marks_obtained: 45.00, percentile: 98.50, remarks: 'Excellent graphical plotting skills.' },
  { id: 'er_02', exam_id: 'ex_01', student_id: 'stud_02', marks_obtained: 38.00, percentile: 82.00, remarks: 'Minor unit conversion error in Q3.' },
  { id: 'er_03', exam_id: 'ex_01', student_id: 'stud_03', marks_obtained: 28.00, percentile: 55.00, remarks: 'Revise graphical derivations.' },
  { id: 'er_04', exam_id: 'ex_01', student_id: 'stud_05', marks_obtained: 42.00, percentile: 92.50, remarks: 'Strong conceptual clarity.' },
  { id: 'er_05', exam_id: 'ex_01', student_id: 'stud_06', marks_obtained: 31.00, percentile: 68.00, remarks: 'Did not complete circular motion derivation.' }
];

// Student Fees
export const mockStudentFees: StudentFee[] = [
  { id: 'fee_01', student_id: 'stud_01', total_amount: 28000, scholarship_discount: 14000, amount_paid: 10000, is_defaulter: false },
  { id: 'fee_02', student_id: 'stud_02', total_amount: 28000, scholarship_discount: 0, amount_paid: 28000, is_defaulter: false },
  { id: 'fee_03', student_id: 'stud_03', total_amount: 28000, scholarship_discount: 7000, amount_paid: 15000, is_defaulter: false },
  { id: 'fee_04', student_id: 'stud_04', total_amount: 28000, scholarship_discount: 0, amount_paid: 0, is_defaulter: false },
  { id: 'fee_05', student_id: 'stud_05', total_amount: 28000, scholarship_discount: 28000, amount_paid: 0, is_defaulter: false },
  { id: 'fee_06', student_id: 'stud_06', total_amount: 28000, scholarship_discount: 0, amount_paid: 14000, is_defaulter: false }
];

// Faculty Members Registry (standalone, not tied to auth)
export const mockFacultyMembers: FacultyMember[] = [
  { id: 'fm_01', name: 'Aryya Sir', subjects: ['Physics', 'Chemistry'], is_active: true, joining_date: '2026-04-01' },
  { id: 'fm_02', name: 'Arya Sir', subjects: ['Physics'], is_active: true, joining_date: '2026-04-01' },
  { id: 'fm_03', name: 'Nilanjan Sir', subjects: ['Chemistry'], is_active: true, joining_date: '2026-04-01' },
  { id: 'fm_04', name: 'Payel Ma\'am', subjects: ['Biology'], is_active: true, joining_date: '2026-04-01' },
  { id: 'fm_05', name: 'Pratim Sir', subjects: ['Mathematics'], is_active: true, joining_date: '2026-04-01' }
];

export interface LocalDBState {
  profiles: UserProfile[];
  faculty: Faculty[];
  facultyMembers: FacultyMember[];
  subjects: Subject[];
  chapters: Chapter[];
  chapterTopics: ChapterTopic[];
  lessonPlans: LessonPlan[];
  students: Student[];
  classes: ClassLog[];
  attendance: Attendance[];
  feedback: Feedback[];
  doubts: Doubt[];
  parentInteractions: ParentInteraction[];
  exams: Exam[];
  examResults: ExamResult[];
  studentFees: StudentFee[];
}

// LocalStorage helpers to simulate database interactions
export const getLocalDB = (): LocalDBState => {
  if (typeof window === 'undefined') {
    return {
      profiles: mockProfiles,
      faculty: mockFaculty,
      facultyMembers: mockFacultyMembers,
      subjects: mockSubjects,
      chapters: mockChapters,
      chapterTopics: mockChapterTopics,
      lessonPlans: mockLessonPlans,
      students: mockStudents,
      classes: mockClasses,
      attendance: mockAttendance,
      feedback: mockFeedback,
      doubts: mockDoubts,
      parentInteractions: mockParentInteractions,
      exams: mockExams,
      examResults: mockExamResults,
      studentFees: mockStudentFees
    };
  }

  const load = (key: string, defaultVal: any) => {
    const val = localStorage.getItem(`shiksharthi_${key}`);
    return val ? JSON.parse(val) : defaultVal;
  };

  return {
    profiles: load('profiles', mockProfiles),
    faculty: load('faculty', mockFaculty),
    facultyMembers: load('facultyMembers', mockFacultyMembers),
    subjects: load('subjects', mockSubjects),
    chapters: load('chapters', mockChapters),
    chapterTopics: load('chapterTopics', mockChapterTopics),
    lessonPlans: load('lessonPlans', mockLessonPlans),
    students: load('students', mockStudents),
    classes: load('classes', mockClasses),
    attendance: load('attendance', mockAttendance),
    feedback: load('feedback', mockFeedback),
    doubts: load('doubts', mockDoubts),
    parentInteractions: load('parentInteractions', mockParentInteractions),
    exams: load('exams', mockExams),
    examResults: load('examResults', mockExamResults),
    studentFees: load('studentFees', mockStudentFees)
  };
};

export const saveLocalDB = (data: Partial<LocalDBState>) => {
  if (typeof window === 'undefined') return;
  Object.keys(data).forEach(key => {
    localStorage.setItem(`shiksharthi_${key}`, JSON.stringify(data[key as keyof LocalDBState]));
  });
};
