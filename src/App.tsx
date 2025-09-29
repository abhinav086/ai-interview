import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Settings, UserCircle } from 'lucide-react'; // Added UserCircle for a potential user menu/settings
import IntervieweeTab from './components/IntervieweeTab';
import InterviewerTab from './components/InterviewerTab';
import WelcomeBackModal from './components/WelcomeBackModal';
import { Candidate, TabType, AppState } from './types';
import { saveToStorage, loadFromStorage } from './utils/storage';
import { calculateScore } from './utils/scoring';

function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('interviewee');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [currentCandidateId, setCurrentCandidateId] = useState<string | undefined>();
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  // Load data from localStorage on app start
  useEffect(() => {
    const savedData = loadFromStorage();
    if (savedData) {
      setCandidates(savedData.candidates);
      setCurrentTab(savedData.currentTab);
      setCurrentCandidateId(savedData.currentCandidateId);
      
      // Show welcome back modal if there's an incomplete interview
      const incompleteCandidate = savedData.candidates.find(
        c => c.status === 'in-progress' || c.status === 'paused'
      );
      if (incompleteCandidate && savedData.currentTab === 'interviewee') {
        setCurrentCandidateId(incompleteCandidate.id);
        setShowWelcomeBack(true);
      }
    }
  }, []);

  // Save data to localStorage whenever state changes
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

  const handleCandidateUpdate = (updatedCandidate: Candidate) => {
    // Calculate final score if interview is completed and not already calculated
    if (updatedCandidate.status === 'completed' && !updatedCandidate.finalScore) {
      const scoringDetails = calculateScore(updatedCandidate.interviewAnswers);
      updatedCandidate.finalScore = scoringDetails.overallScore;
      updatedCandidate.scoringDetails = scoringDetails;
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
    <div className="min-h-screen bg-gray-100 font-sans antialiased"> {/* Smoother background, better font rendering */}
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40"> {/* More pronounced shadow */}
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* Brand and Stats */}
          <div className="flex items-center gap-4"> {/* Increased gap for better spacing */}
            {/* Logo placeholder - could be an SVG or image */}
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md"> {/* Gradient for a modern look */}
              <MessageSquare className="w-5 h-5 text-white" /> {/* Used MessageSquare as a generic app icon */}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">Abhinav's Interview Assistant</h1> {/* Stronger title */}
              <p className="text-sm text-gray-500 mt-0.5"> {/* Subtler stats */}
                <span className="font-medium">{stats.total}</span> candidates • 
                <span className="font-medium text-green-600 ml-1">{stats.completed} completed</span> • 
                <span className="font-medium text-blue-600 ml-1">{stats.inProgress} in progress</span>
              </p>
            </div>
          </div>

          {/* Tab Navigation & User Actions */}
          <div className="flex items-center gap-4"> {/* Aligned with user actions */}
            <div className="flex bg-gray-50 rounded-full p-1 shadow-inner"> {/* Pill-shaped tabs, subtle inner shadow */}
              <button
                onClick={() => setCurrentTab('interviewee')}
                className={`
                  flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ease-in-out
                  ${currentTab === 'interviewee' 
                    ? 'bg-blue-600 text-white shadow-md' // Stronger active state
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' // Clearer hover
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
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm"> {/* More prominent badge */}
                    {stats.pending}
                  </span>
                )}
              </button>
            </div>
            {/* Optional: User Settings/Profile */}
            <button className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-600">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-600">
              <UserCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8"> {/* Added padding to main content */}
        {currentTab === 'interviewee' ? (
          <IntervieweeTab
            candidate={currentCandidate}
            onCandidateUpdate={handleCandidateUpdate}
            onCreateCandidate={handleCreateCandidate}
          />
        ) : (
          <InterviewerTab
            candidates={candidates}
            onCandidateSelect={handleCandidateSelect}
            selectedCandidateId={currentCandidateId}
          />
        )}
      </main>

      {/* Welcome Back Modal */}
      {showWelcomeBack && currentCandidate && (
        <WelcomeBackModal
          candidate={currentCandidate}
          onContinue={handleWelcomeBackContinue}
          onStartNew={handleWelcomeBackStartNew}
          onClose={handleWelcomeBackClose}
        />
      )}
    </div>
  );
}

export default App;