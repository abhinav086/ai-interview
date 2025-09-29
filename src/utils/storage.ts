import { AppState } from '../types';

const STORAGE_KEY = 'interview_assistant_data';

export const saveToStorage = (data: AppState): void => {
  try {
    // Convert Dates to ISO strings for storage
    const serializedData = {
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
        interviewAnswers: candidate.interviewAnswers.map(ans => ({
          ...ans,
          timestamp: ans.timestamp.toISOString()
        }))
      }))
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedData));
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
};

export const loadFromStorage = (): AppState | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    
    // Convert ISO strings back to Dates
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
        interviewAnswers: candidate.interviewAnswers.map((ans: any) => ({
          ...ans,
          timestamp: new Date(ans.timestamp)
        }))
      }))
    };
  } catch (error) {
    console.error('Error loading from storage:', error);
    return null;
  }
};

export const clearStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};