// src/utils/scoring.ts
import { InterviewAnswer } from '../types';
import { generateFinalReport } from '../services/geminiService';

export interface ScoringDetails {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  strengths: string[];
  improvements: string[];
  recommendation: 'Strong Hire' | 'Hire' | 'No Hire' | 'Strong No Hire';
}

export const calculateScore = async (
  answers: InterviewAnswer[],
  candidateName: string = 'Candidate'
): Promise<ScoringDetails> => {
  try {
    // Use AI to generate comprehensive evaluation
    const aiReport = await generateFinalReport(candidateName, answers);
    return aiReport;
  } catch (error) {
    console.error('Error generating AI report:', error);
    
    // Fallback to basic calculation
    const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
    const avgScore = Math.round(totalScore / answers.length);
    
    return {
      overallScore: avgScore,
      technicalScore: avgScore,
      communicationScore: avgScore - 5,
      problemSolvingScore: avgScore + 5,
      strengths: [
        'Completed all interview questions',
        'Demonstrated basic understanding',
        'Communicated clearly'
      ],
      improvements: [
        'Continue developing technical depth',
        'Practice explaining complex concepts',
        'Review fundamental concepts'
      ],
      recommendation: avgScore >= 80 ? 'Hire' : avgScore >= 60 ? 'No Hire' : 'Strong No Hire'
    };
  }
};

// Simple scoring for individual questions (fallback)
export const scoreAnswer = (answer: string, question: any): { score: number; feedback: string } => {
  const wordCount = answer.trim().split(/\s+/).length;
  
  let score = 0;
  if (wordCount > 100) score = 70;
  else if (wordCount > 50) score = 50;
  else if (wordCount > 20) score = 30;
  else score = 10;
  
  const feedback = wordCount > 50
    ? 'Good detailed answer with relevant information.'
    : 'Consider providing more detailed explanations in your answers.';
  
  return { score, feedback };
};