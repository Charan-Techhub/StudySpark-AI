export interface UserProfile {
  name: string;
  email: string;
  studyGoal?: string;
  institution?: string;
  avatarUrl?: string;
  joinedDate: string;
}

export type CodeHighlightColor = 'red' | 'blue' | 'green' | 'yellow';

export interface DocumentMetadata {
  detectedLanguage: string;
  subject: string;
  chapter: string;
  headings: string[];
  importantConcepts: string[];
  definitions: { term: string; definition: string }[];
  formulas: string[];
  dates: string[];
  examples: string[];
  questions: string[];
  keyPoints: string[];
}

export interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  extractedText: string;
  metadata?: DocumentMetadata;
}

export type SummaryLength = 'short' | 'medium' | 'detailed' | 'bullet' | 'one-line' | 'academic' | 'exam';

export interface AISummary {
  docId: string;
  length: SummaryLength;
  text: string;
  highlights: { text: string; category: CodeHighlightColor; label: string }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'true-false' | 'fill-blank' | 'short-answer' | 'long-answer';
  question: string;
  options?: string[]; // for mcq
  correctAnswer: string;
  isCorrect?: boolean;
  userAnswer?: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  docId: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
  score?: number;
  solvedAt?: string;
}

export interface Flashcard {
  id: string;
  docId: string;
  question: string;
  answer: string;
  bookmarked: boolean;
}

export interface StudyScheduleItem {
  id: string;
  time: string;
  task: string;
  subject: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export interface StudyPlan {
  id: string;
  examDate: string;
  hoursAvailable: number;
  subjects: string[];
  priority: 'high' | 'medium' | 'low';
  dailySchedule: StudyScheduleItem[];
  weeklySchedule: { id: string; day: string; tasks: string[] }[];
  revisionPlan: string[];
  progress: number;
}

export interface StudySparkNotification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning';
  timestamp: string;
  read: boolean;
}

export interface DashboardStats {
  documentsCount: number;
  studyHours: number;
  averageQuizScore: number;
  learnedCount: number;
  streak: number;
  chartData: { day: string; hours: number; quizzes: number }[];
}
