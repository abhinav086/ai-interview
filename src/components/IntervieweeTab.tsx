import React, { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import FileUpload from './FileUpload';
import ChatInterface from './ChatInterface';
import Timer from './Timer';
import { Candidate, ChatMessage, InterviewAnswer } from '../types';
import { parseResume, ParsedResume } from '../utils/resumeParser';
import { INTERVIEW_QUESTIONS } from '../data/questions';
import { scoreAnswer } from '../utils/scoring';

interface IntervieweeTabProps {
  candidate: Candidate | null;
  onCandidateUpdate: (candidate: Candidate) => void;
  onCreateCandidate: (candidateData: Partial<Candidate>) => void;
  onResetInterview: () => void;
}

const IntervieweeTab: React.FC<IntervieweeTabProps> = ({
  candidate,
  onCandidateUpdate,
  onCreateCandidate,
  onResetInterview
}) => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'info-collection' | 'interview' | 'completed'>('upload');
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (candidate) {
      if (candidate.status === 'completed') {
        setCurrentStep('completed');
      } else if (candidate.currentQuestionIndex >= INTERVIEW_QUESTIONS.length) {
        setCurrentStep('completed');
      } else if (candidate.missingFields.length > 0) {
        setCurrentStep('info-collection');
      } else if (candidate.status === 'pending' && candidate.missingFields.length === 0) {
        setCurrentStep('info-collection');
      } else if (candidate.status === 'in-progress') {
        setCurrentStep('interview');
        setCurrentQuestion(INTERVIEW_QUESTIONS[candidate.currentQuestionIndex]);
      }
    } else {
      setCurrentStep('upload');
    }
  }, [candidate]);

  const handleFileUpload = (file: File, parsedData: ParsedResume) => {
    const missingFields: string[] = [];
    if (!parsedData.name) missingFields.push('name');
    if (!parsedData.email) missingFields.push('email');
    if (!parsedData.phone) missingFields.push('phone');

    const newCandidate: Partial<Candidate> = {
      name: parsedData.name || '',
      email: parsedData.email || '',
      phone: parsedData.phone || '',
      resumeFile: file,
      resumeText: parsedData.text,
      status: missingFields.length > 0 ? 'pending' : 'pending',
      missingFields,
      chatHistory: [],
      interviewAnswers: [],
      currentQuestionIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onCreateCandidate(newCandidate);
    
    if (missingFields.length > 0) {
      setCurrentStep('info-collection');
    } else {
      setCurrentStep('info-collection');
    }
  };

  const handleChatMessage = (message: string) => {
    if (!candidate) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    const updatedChatHistory = [...candidate.chatHistory, userMessage];

    if (currentStep === 'info-collection' && candidate.missingFields.length > 0) {
      const missingField = candidate.missingFields[0];
      const updatedCandidate = { ...candidate };
      
      if (missingField === 'name') {
        updatedCandidate.name = message;
      } else if (missingField === 'email') {
        updatedCandidate.email = message;
      } else if (missingField === 'phone') {
        updatedCandidate.phone = message;
      }
      
      updatedCandidate.missingFields = candidate.missingFields.slice(1);
      updatedCandidate.chatHistory = updatedChatHistory;

      setTimeout(() => {
        const botResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: updatedCandidate.missingFields.length > 0 
            ? `Thank you! Now, please provide your ${updatedCandidate.missingFields[0]}.`
            : "Perfect! We have all the information we need. Let's begin the interview. Click 'Start Interview' when you're ready.",
          timestamp: new Date()
        };

        updatedCandidate.chatHistory = [...updatedCandidate.chatHistory, botResponse];
        
        if (updatedCandidate.missingFields.length === 0) {
          updatedCandidate.status = 'pending';
        }
        
        onCandidateUpdate(updatedCandidate);
      }, 1000);

      onCandidateUpdate(updatedCandidate);
    } else if (currentStep === 'interview') {
      const question = INTERVIEW_QUESTIONS[candidate.currentQuestionIndex];
      const timeUsed = question.timeLimit - (candidate.timeRemaining || question.timeLimit);
      const { score, feedback } = scoreAnswer(message, question);

      const answer: InterviewAnswer = {
        questionId: question.id,
        question: question.question,
        answer: message,
        timeUsed,
        score,
        feedback,
        timestamp: new Date()
      };

      const updatedCandidate = {
        ...candidate,
        chatHistory: updatedChatHistory,
        interviewAnswers: [...candidate.interviewAnswers, answer],
        currentQuestionIndex: candidate.currentQuestionIndex + 1,
        updatedAt: new Date()
      };

      setIsTimerActive(false);

      setTimeout(() => {
        const isLastQuestion = updatedCandidate.currentQuestionIndex >= INTERVIEW_QUESTIONS.length;
        
        const botResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: isLastQuestion 
            ? "Thank you for completing the interview! Your responses have been recorded and will be evaluated shortly."
            : `Great answer! Let's move to the next question.`,
          timestamp: new Date()
        };

        let finalCandidate = { ...updatedCandidate };
        finalCandidate.chatHistory = [...finalCandidate.chatHistory, botResponse];
        
        if (isLastQuestion) {
          finalCandidate.status = 'completed';
          finalCandidate.interviewEndTime = new Date();
          setCurrentStep('completed');
        } else {
          const nextQuestion = INTERVIEW_QUESTIONS[finalCandidate.currentQuestionIndex];
          finalCandidate.timeRemaining = nextQuestion.timeLimit;
          setCurrentQuestion(nextQuestion);
          
          setTimeout(() => {
            const nextQuestionMessage: ChatMessage = {
              id: (Date.now() + 2).toString(),
              type: 'bot',
              content: `Question ${finalCandidate.currentQuestionIndex + 1}:\n\n${nextQuestion.question}`,
              timestamp: new Date()
            };
            
            finalCandidate.chatHistory = [...finalCandidate.chatHistory, nextQuestionMessage];
            finalCandidate.updatedAt = new Date();
            
            onCandidateUpdate(finalCandidate);
            setIsTimerActive(true);
          }, 1500);
        }
        
        onCandidateUpdate(finalCandidate);
      }, 1000);
    }
  };

  const startInterview = () => {
    if (!candidate) return;

    const updatedCandidate = {
      ...candidate,
      status: 'in-progress' as const,
      interviewStartTime: new Date(),
      currentQuestionIndex: 0,
      timeRemaining: INTERVIEW_QUESTIONS[0].timeLimit
    };

    setCurrentQuestion(INTERVIEW_QUESTIONS[0]);

    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'bot',
      content: `Welcome to your technical interview, ${candidate.name}! We'll go through 6 questions of varying difficulty. Each question has a time limit. Let's start with question 1:\n\n${INTERVIEW_QUESTIONS[0].question}`,
      timestamp: new Date()
    };

    updatedCandidate.chatHistory = [...candidate.chatHistory, welcomeMessage];
    onCandidateUpdate(updatedCandidate);
    setCurrentStep('interview');
    setIsTimerActive(true);
  };

  const handleTimeUp = () => {
    if (!candidate || !currentQuestion) return;

    setIsTimerActive(false);
    
    const timeUpMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: "Time's up! Moving to the next question.",
      timestamp: new Date()
    };

    const answer: InterviewAnswer = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      answer: "(No answer provided - time expired)",
      timeUsed: currentQuestion.timeLimit,
      score: 0,
      feedback: "Time expired without providing an answer.",
      timestamp: new Date()
    };

    const updatedCandidate = {
      ...candidate,
      chatHistory: [...candidate.chatHistory, timeUpMessage],
      interviewAnswers: [...candidate.interviewAnswers, answer],
      currentQuestionIndex: candidate.currentQuestionIndex + 1,
      updatedAt: new Date()
    };

    if (updatedCandidate.currentQuestionIndex >= INTERVIEW_QUESTIONS.length) {
      updatedCandidate.status = 'completed';
      updatedCandidate.interviewEndTime = new Date();
      setCurrentStep('completed');
    } else {
      setCurrentQuestion(INTERVIEW_QUESTIONS[updatedCandidate.currentQuestionIndex]);
      
      setTimeout(() => {
        const nextQuestionMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: `Question ${updatedCandidate.currentQuestionIndex + 1}:\n\n${INTERVIEW_QUESTIONS[updatedCandidate.currentQuestionIndex].question}`,
          timestamp: new Date()
        };
        
        updatedCandidate.chatHistory = [...updatedCandidate.chatHistory, nextQuestionMessage];
        updatedCandidate.timeRemaining = INTERVIEW_QUESTIONS[updatedCandidate.currentQuestionIndex].timeLimit;
        onCandidateUpdate(updatedCandidate);
        setIsTimerActive(true);
      }, 2000);
    }

    onCandidateUpdate(updatedCandidate);
  };

  const handleReset = () => {
    onResetInterview();
    setShowResetConfirm(false);
    setCurrentStep('upload');
  };

  const renderUploadStep = () => (
    <div className="flex items-center justify-center min-h-full py-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Technical Interview Assistant</h1>
          <p className="text-gray-600 text-lg">Upload your resume to get started with the interview process</p>
        </div>
        <FileUpload onFileUpload={handleFileUpload} />
      </div>
    </div>
  );

  const renderInfoCollection = () => {
    if (!candidate) return null;
    
    if (candidate.missingFields.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-full py-8">
          <div className="max-w-4xl w-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-green-50 p-6 border-b border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Ready to Begin!</h2>
                    <p className="text-gray-600">All information collected successfully</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-1">Name</h3>
                    <p className="text-gray-600">{candidate.name}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-1">Email</h3>
                    <p className="text-gray-600">{candidate.email}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-1">Phone</h3>
                    <p className="text-gray-600">{candidate.phone}</p>
                  </div>
                </div>
                
                <button
                  onClick={startInterview}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Clock className="w-5 h-5" />
                  Start Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const missingField = candidate.missingFields[0];
    return (
      <div className="flex flex-col h-full">
        <div className="max-w-4xl w-full mx-auto flex flex-col h-full">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="bg-orange-50 p-6 border-b border-orange-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Additional Information Needed</h2>
                  <p className="text-gray-600">Please provide the missing information to proceed</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-h-0">
              <ChatInterface
                messages={candidate.chatHistory}
                onSendMessage={handleChatMessage}
                placeholder={`Enter your ${missingField}...`}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInterview = () => {
    if (!candidate || !currentQuestion) return null;

    return (
      <div className="flex flex-col h-full">
        <div className="max-w-4xl w-full mx-auto flex flex-col h-full">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="bg-blue-50 p-6 border-b border-blue-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Technical Interview</h2>
                  <p className="text-gray-600">
                    Question {candidate.currentQuestionIndex + 1} of {INTERVIEW_QUESTIONS.length} • 
                    {currentQuestion.difficulty} • {currentQuestion.category}
                  </p>
                </div>
                <Timer
                  initialTime={currentQuestion.timeLimit}
                  onTimeUp={handleTimeUp}
                  isActive={isTimerActive}
                  onTimeUpdate={(time) => {
                    const updatedCandidate = { ...candidate, timeRemaining: time };
                    onCandidateUpdate(updatedCandidate);
                  }}
                />
              </div>
            </div>
            
            <div className="flex-1 min-h-0">
              <ChatInterface
                messages={candidate.chatHistory}
                onSendMessage={handleChatMessage}
                placeholder="Type your answer here..."
                showTimer
                timeRemaining={candidate.timeRemaining}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCompleted = () => {
    if (!candidate) return null;

    return (
      <div className="flex items-center justify-center min-h-full py-8">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-green-50 p-6 border-b border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Interview Completed!</h2>
                  <p className="text-gray-600">Thank you for your time</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-6 text-center">
                Your interview has been successfully completed and submitted for evaluation. 
                The results are available in the interviewer dashboard.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h3 className="font-medium text-gray-800 mb-1">Questions Answered</h3>
                  <p className="text-2xl font-bold text-blue-600">{candidate.interviewAnswers.length}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h3 className="font-medium text-gray-800 mb-1">Time Taken</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {candidate.interviewStartTime && candidate.interviewEndTime
                      ? Math.round((candidate.interviewEndTime.getTime() - candidate.interviewStartTime.getTime()) / 60000)
                      : 0} min
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Start New Interview
              </button>
            </div>
          </div>

          {showResetConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Reset Interview?</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-6">
                  This will delete all interview data and allow you to start a fresh interview. 
                  Make sure you've checked the results in the Interviewer tab if needed.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {currentStep === 'upload' && renderUploadStep()}
      {currentStep === 'info-collection' && renderInfoCollection()}
      {currentStep === 'interview' && renderInterview()}
      {currentStep === 'completed' && renderCompleted()}
    </div>
  );
};

export default IntervieweeTab;