import { InterviewAnswer, ScoringDetails } from '../types';
import { INTERVIEW_QUESTIONS } from '../data/questions';

export const calculateScore = (answers: InterviewAnswer[]): ScoringDetails => {
  if (answers.length === 0) {
    return {
      technicalScore: 0,
      communicationScore: 0,
      problemSolvingScore: 0,
      overallScore: 0,
      strengths: [],
      improvements: ['No answers provided'],
      recommendation: 'Strong No Hire'
    };
  }

  // Calculate individual scores
  const technicalScore = calculateTechnicalScore(answers);
  const communicationScore = calculateCommunicationScore(answers);
  const problemSolvingScore = calculateProblemSolvingScore(answers);
  
  const overallScore = Math.round((technicalScore + communicationScore + problemSolvingScore) / 3);
  
  const strengths = identifyStrengths(answers, technicalScore, communicationScore, problemSolvingScore);
  const improvements = identifyImprovements(answers, technicalScore, communicationScore, problemSolvingScore);
  const recommendation = getRecommendation(overallScore);

  return {
    technicalScore,
    communicationScore,
    problemSolvingScore,
    overallScore,
    strengths,
    improvements,
    recommendation
  };
};

const calculateTechnicalScore = (answers: InterviewAnswer[]): number => {
  const technicalAnswers = answers.filter(answer => {
    const question = INTERVIEW_QUESTIONS.find(q => q.id === answer.questionId);
    return question && ['JavaScript Fundamentals', 'React Basics', 'React Performance', 'JavaScript Advanced', 'Algorithms'].includes(question.category);
  });

  if (technicalAnswers.length === 0) return 0;
  
  const avgScore = technicalAnswers.reduce((sum, answer) => sum + answer.score, 0) / technicalAnswers.length;
  return Math.round(avgScore);
};

const calculateCommunicationScore = (answers: InterviewAnswer[]): number => {
  // Base communication score on answer length, clarity, and structure
  let totalScore = 0;
  
  answers.forEach(answer => {
    let score = 0;
    
    // Length factor (reasonable length answers score higher)
    const wordCount = answer.answer.split(/\s+/).length;
    if (wordCount >= 20 && wordCount <= 150) score += 30;
    else if (wordCount >= 10) score += 20;
    else score += 10;
    
    // Structure factor (sentences, paragraphs)
    const sentences = answer.answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 2) score += 20;
    
    // Clarity factor (proper punctuation, capitalization)
    if (/^[A-Z]/.test(answer.answer.trim())) score += 15;
    if (/[.!?]$/.test(answer.answer.trim())) score += 15;
    
    // Professional language
    if (!/\b(um|uh|like|you know)\b/i.test(answer.answer)) score += 20;
    
    totalScore += Math.min(score, 100);
  });
  
  return Math.round(totalScore / answers.length);
};

const calculateProblemSolvingScore = (answers: InterviewAnswer[]): number => {
  const problemSolvingAnswers = answers.filter(answer => {
    const question = INTERVIEW_QUESTIONS.find(q => q.id === answer.questionId);
    return question && ['System Design', 'Algorithms'].includes(question.category);
  });

  if (problemSolvingAnswers.length === 0) {
    // Use overall answer quality for problem-solving assessment
    return Math.round(answers.reduce((sum, answer) => sum + answer.score, 0) / answers.length);
  }
  
  const avgScore = problemSolvingAnswers.reduce((sum, answer) => sum + answer.score, 0) / problemSolvingAnswers.length;
  return Math.round(avgScore);
};

const identifyStrengths = (answers: InterviewAnswer[], technical: number, communication: number, problemSolving: number): string[] => {
  const strengths: string[] = [];
  
  if (technical >= 80) strengths.push('Strong technical knowledge');
  if (communication >= 80) strengths.push('Excellent communication skills');
  if (problemSolving >= 80) strengths.push('Outstanding problem-solving abilities');
  
  // Check for consistent performance
  const scores = answers.map(a => a.score);
  const consistency = scores.every(score => Math.abs(score - scores[0]) <= 20);
  if (consistency && scores[0] >= 70) strengths.push('Consistent performance across questions');
  
  // Check for time management
  const timeManagement = answers.every(answer => {
    const question = INTERVIEW_QUESTIONS.find(q => q.id === answer.questionId);
    return question && answer.timeUsed <= question.timeLimit;
  });
  if (timeManagement) strengths.push('Excellent time management');
  
  return strengths.length > 0 ? strengths : ['Shows potential in key areas'];
};

const identifyImprovements = (answers: InterviewAnswer[], technical: number, communication: number, problemSolving: number): string[] => {
  const improvements: string[] = [];
  
  if (technical < 60) improvements.push('Strengthen technical fundamentals');
  if (communication < 60) improvements.push('Improve communication clarity');
  if (problemSolving < 60) improvements.push('Enhance problem-solving approach');
  
  // Check for time issues
  const timeIssues = answers.some(answer => {
    const question = INTERVIEW_QUESTIONS.find(q => q.id === answer.questionId);
    return question && answer.timeUsed > question.timeLimit * 0.9;
  });
  if (timeIssues) improvements.push('Work on time management');
  
  // Check for inconsistency
  const scores = answers.map(a => a.score);
  const hasLowScores = scores.some(score => score < 50);
  if (hasLowScores) improvements.push('Focus on weaker subject areas');
  
  return improvements.length > 0 ? improvements : ['Continue developing existing skills'];
};

const getRecommendation = (overallScore: number): 'Strong Hire' | 'Hire' | 'No Hire' | 'Strong No Hire' => {
  if (overallScore >= 85) return 'Strong Hire';
  if (overallScore >= 70) return 'Hire';
  if (overallScore >= 50) return 'No Hire';
  return 'Strong No Hire';
};

export const scoreAnswer = (answer: string, question: any): { score: number; feedback: string } => {
  let score = 0;
  let feedback = '';
  
  const answerLength = answer.trim().length;
  const wordCount = answer.split(/\s+/).length;
  
  // Basic scoring factors
  if (answerLength < 10) {
    score = 20;
    feedback = 'Answer is too brief. Try to provide more detailed explanations.';
  } else if (answerLength < 50) {
    score = 40;
    feedback = 'Good start, but could benefit from more detail and examples.';
  } else if (answerLength < 200) {
    score = 70;
    feedback = 'Well-structured answer with good detail.';
  } else {
    score = 85;
    feedback = 'Comprehensive and detailed response.';
  }
  
  // Keyword matching bonus
  if (question.expectedKeywords) {
    const foundKeywords = question.expectedKeywords.filter(keyword => 
      answer.toLowerCase().includes(keyword.toLowerCase())
    );
    const keywordBonus = (foundKeywords.length / question.expectedKeywords.length) * 15;
    score += keywordBonus;
    
    if (foundKeywords.length > 0) {
      feedback += ` Good use of relevant technical terms.`;
    }
  }
  
  // Ensure score doesn't exceed 100
  score = Math.min(Math.round(score), 100);
  
  return { score, feedback };
};