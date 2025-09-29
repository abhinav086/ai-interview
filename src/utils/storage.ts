import { Candidate, AppState } from '../types';

const STORAGE_KEY = 'interview-assistant';

export const saveToStorage = (data: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      candidates: data.candidates.map(candidate => ({
        ...candidate,
        createdAt: candidate.createdAt.toISOString(),
        updatedAt: candidate.updatedAt.toISOString(),
        interviewStartTime: candidate.interviewStartTime?.toISOString(),
        interviewEndTime: candidate.interviewEndTime?.toISOString(),
        chatHistory: candidate.chatHistory.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        })),
        interviewAnswers: candidate.interviewAnswers.map(answer => ({
          ...answer,
          timestamp: answer.timestamp.toISOString()
        }))
      }))
    }));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadFromStorage = (): AppState | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      candidates: parsed.candidates.map((candidate: any) => ({
        ...candidate,
        createdAt: new Date(candidate.createdAt),
        updatedAt: new Date(candidate.updatedAt),
        interviewStartTime: candidate.interviewStartTime ? new Date(candidate.interviewStartTime) : undefined,
        interviewEndTime: candidate.interviewEndTime ? new Date(candidate.interviewEndTime) : undefined,
        chatHistory: candidate.chatHistory.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })),
        interviewAnswers: candidate.interviewAnswers.map((answer: any) => ({
          ...answer,
          timestamp: new Date(answer.timestamp)
        }))
      }))
    };
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

export const clearStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};