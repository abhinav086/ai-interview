export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeFile?: File;
  resumeText?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
  missingFields: string[];
  chatHistory: ChatMessage[];
  interviewAnswers: InterviewAnswer[];
  finalScore?: number;
  scoringDetails?: ScoringDetails;
  currentQuestionIndex: number;
  timeRemaining?: number;
  interviewStartTime?: Date;
  interviewEndTime?: Date;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit: number; // in seconds
  category: string;
  expectedKeywords?: string[];
}

export interface InterviewAnswer {
  questionId: string;
  question: string;
  answer: string;
  timeUsed: number;
  score: number;
  feedback: string;
  timestamp: Date;
}

export interface ScoringDetails {
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  recommendation: 'Strong Hire' | 'Hire' | 'No Hire' | 'Strong No Hire';
}

export type TabType = 'interviewee' | 'interviewer';

export interface AppState {
  currentTab: TabType;
  candidates: Candidate[];
  currentCandidateId?: string;
  showWelcomeBack: boolean;
}