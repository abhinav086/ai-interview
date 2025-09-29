import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Settings, UserCircle, Trash2 } from 'lucide-react';
import IntervieweeTab from './components/IntervieweeTab';
import InterviewerTab from './components/InterviewerTab';
import WelcomeBackModal from './components/WelcomeBackModal';
import { Candidate, TabType, AppState } from './types';
import { saveToStorage, loadFromStorage, clearStorage } from './utils/storage';
import { calculateScore } from './utils/scoring';

function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('interviewee');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [currentCandidateId, setCurrentCandidateId] = useState<string | undefined>();
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const savedData = loadFromStorage();
    if (savedData) {
      setCandidates(savedData.candidates);
      setCurrentTab(savedData.currentTab);
      setCurrentCandidateId(savedData.currentCandidateId);
      
      const incompleteCandidate = savedData.candidates.find(
        c => c.status === 'in-progress' || c.status === 'paused'
      );
      if (incompleteCandidate && savedData.currentTab === 'interviewee') {
        setCurrentCandidateId(incompleteCandidate.id);
        setShowWelcomeBack(true);
      }
    }
  }, []);

  useEffect(() => {
    const appState: AppState = {
      currentTab,
      candidates,
      currentCandidateId,
      showWelcomeBack: false
    };
    saveToStorage(appState);
  }, [currentTab, candidates, currentCandidateId]);

  const generateId = (): string => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const handleCreateCandidate = (candidateData: Partial<Candidate>) => {
    const newCandidate: Candidate = {
      id: generateId(),
      name: candidateData.name || '',
      email: candidateData.email || '',
      phone: candidateData.phone || '',
      resumeFile: candidateData.resumeFile,
      resumeText: candidateData.resumeText,
      status: candidateData.status || 'pending',
      createdAt: candidateData.createdAt || new Date(),
      updatedAt: candidateData.updatedAt || new Date(),
      missingFields: candidateData.missingFields || [],
      chatHistory: candidateData.chatHistory || [],
      interviewAnswers: candidateData.interviewAnswers || [],
      currentQuestionIndex: candidateData.currentQuestionIndex || 0,
      timeRemaining: candidateData.timeRemaining,
      interviewStartTime: candidateData.interviewStartTime,
      interviewEndTime: candidateData.interviewEndTime
    };

    setCandidates(prev => [...prev, newCandidate]);
    setCurrentCandidateId(newCandidate.id);
  };

  const handleCandidateUpdate = async (updatedCandidate: Candidate) => {
    // Generate AI evaluation when interview is completed
    if (updatedCandidate.status === 'completed' && !updatedCandidate.finalScore) {
      try {
        const scoringDetails = await calculateScore(
          updatedCandidate.interviewAnswers,
          updatedCandidate.name
        );
        updatedCandidate.finalScore = scoringDetails.overallScore;
        updatedCandidate.scoringDetails = scoringDetails;
      } catch (error) {
        console.error('Error calculating AI score:', error);
        // Fallback to basic scoring if AI fails
        const avgScore = updatedCandidate.interviewAnswers.length > 0
          ? Math.round(
              updatedCandidate.interviewAnswers.reduce((sum, a) => sum + a.score, 0) / 
              updatedCandidate.interviewAnswers.length
            )
          : 0;
        
        updatedCandidate.finalScore = avgScore;
        updatedCandidate.scoringDetails = {
          overallScore: avgScore,
          technicalScore: avgScore,
          communicationScore: avgScore,
          problemSolvingScore: avgScore,
          strengths: ['Completed all interview questions', 'Demonstrated understanding'],
          improvements: ['Continue developing technical skills', 'Practice explaining concepts'],
          recommendation: avgScore >= 70 ? 'Hire' : 'No Hire'
        };
      }
    }

    setCandidates(prev => 
      prev.map(candidate => 
        candidate.id === updatedCandidate.id ? updatedCandidate : candidate
      )
    );
  };

  const handleCandidateSelect = (candidateId: string) => {
    setCurrentCandidateId(candidateId);
  };

  const handleResetInterview = () => {
    setCurrentCandidateId(undefined);
    setCandidates([]);
    clearStorage();
  };

  const handleClearAllData = () => {
    setCurrentCandidateId(undefined);
    setCandidates([]);
    clearStorage();
    setShowClearConfirm(false);
    setCurrentTab('interviewee');
  };

  const handleWelcomeBackContinue = () => {
    setShowWelcomeBack(false);
  };

  const handleWelcomeBackStartNew = () => {
    setCurrentCandidateId(undefined);
    setShowWelcomeBack(false);
  };

  const handleWelcomeBackClose = () => {
    setShowWelcomeBack(false);
  };

  const currentCandidate = currentCandidateId ? candidates.find(c => c.id === currentCandidateId) : null;

  const getTabStats = () => {
    const total = candidates.length;
    const completed = candidates.filter(c => c.status === 'completed').length;
    const inProgress = candidates.filter(c => c.status === 'in-progress').length;
    const pending = candidates.filter(c => c.status === 'pending').length;

    return { total, completed, inProgress, pending };
  };

  const stats = getTabStats();

  return (
    <div className="h-screen bg-gray-100 font-sans antialiased flex flex-col overflow-hidden">
      <header className="bg-white shadow-md border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">Abhinav's AI Interview Assistant</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                <span className="font-medium">{stats.total}</span> candidates • 
                <span className="font-medium text-green-600 ml-1">{stats.completed} completed</span> • 
                <span className="font-medium text-blue-600 ml-1">{stats.inProgress} in progress</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-gray-50 rounded-full p-1 shadow-inner">
              <button
                onClick={() => setCurrentTab('interviewee')}
                className={`
                  flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ease-in-out
                  ${currentTab === 'interviewee' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }
                `}
              >
                <MessageSquare className="w-4 h-4" />
                Interviewee
              </button>
              <button
                onClick={() => setCurrentTab('interviewer')}
                className={`
                  relative flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ease-in-out
                  ${currentTab === 'interviewer' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }
                `}
              >
                <Users className="w-4 h-4" />
                Interviewer
                {stats.pending > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {stats.pending}
                  </span>
                )}
              </button>
            </div>
            
            {candidates.length > 0 && (
              <button 
                onClick={() => setShowClearConfirm(true)}
                className="p-2 rounded-full hover:bg-red-50 transition-colors text-red-600"
                title="Clear all data"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            
            {/* <button className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-600">
              <Settings className="w-5 h-5" />
            </button> */}
            {/* <button className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-600">
              <UserCircle className="w-5 h-5" />
            </button> */}
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto px-6 py-8">
        {currentTab === 'interviewee' ? (
          <IntervieweeTab
            candidate={currentCandidate}
            onCandidateUpdate={handleCandidateUpdate}
            onCreateCandidate={handleCreateCandidate}
            onResetInterview={handleResetInterview}
          />
        ) : (
          <InterviewerTab
            candidates={candidates}
            onCandidateSelect={handleCandidateSelect}
            selectedCandidateId={currentCandidateId}
          />
        )}
      </main>

      {showWelcomeBack && currentCandidate && (
        <WelcomeBackModal
          candidate={currentCandidate}
          onContinue={handleWelcomeBackContinue}
          onStartNew={handleWelcomeBackStartNew}
          onClose={handleWelcomeBackClose}
        />
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Clear All Data?</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              This will permanently delete all candidate data, interview responses, and AI evaluations. 
              Are you sure you want to continue?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllData}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;