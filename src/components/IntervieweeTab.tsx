//src/components/IntervieweeTab.tsx
import React, { useState, useEffect } from 'react';
import { User, FileText, MessageCircle, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
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
}

const IntervieweeTab: React.FC<IntervieweeTabProps> = ({
  candidate,
  onCandidateUpdate,
  onCreateCandidate
}) => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'info-collection' | 'interview' | 'completed'>('upload');
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);

  useEffect(() => {
    if (candidate) {
      if (candidate.status === 'completed') {
        setCurrentStep('completed');
      } else if (candidate.currentQuestionIndex >= INTERVIEW_QUESTIONS.length) {
        setCurrentStep('completed');
      } else if (candidate.missingFields.length > 0) {
        setCurrentStep('info-collection');
      } else if (candidate.status === 'pending' && candidate.missingFields.length === 0) {
        setCurrentStep('info-collection'); // Show ready to start UI
      } else if (candidate.status === 'in-progress') {
        setCurrentStep('interview');
        setCurrentQuestion(INTERVIEW_QUESTIONS[candidate.currentQuestionIndex]);
      }
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
      setCurrentStep('info-collection'); // Show ready to start UI
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
      // Handle missing field collection
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

      // Add bot response
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
          updatedCandidate.status = 'pending'; // Ready to start but not started yet
        }
        
        onCandidateUpdate(updatedCandidate);
      }, 1000);

      onCandidateUpdate(updatedCandidate);
    } else if (currentStep === 'interview') {
      // Handle interview answer
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

      // Add bot response
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
          // Set up the next question with its time limit
          const nextQuestion = INTERVIEW_QUESTIONS[finalCandidate.currentQuestionIndex];
          finalCandidate.timeRemaining = nextQuestion.timeLimit;
          setCurrentQuestion(nextQuestion);
          
          // Add the next question message after a delay
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
        
        // Update the candidate state
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

  const renderUploadStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Technical Interview Assistant</h1>
        <p className="text-gray-600 text-lg">Upload your resume to get started with the interview process</p>
      </div>
      <FileUpload onFileUpload={handleFileUpload} />
    </div>
  );

  const renderInfoCollection = () => {
    if (!candidate) return null;
    
    // If all required fields are collected, show the "Ready to Begin" UI
    if (candidate.missingFields.length === 0) {
      return (
        <div className="max-w-4xl mx-auto">
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
      );
    }

    // If there are still missing fields, show the chat interface
    const missingField = candidate.missingFields[0];
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-orange-50 p-6 border-b border-orange-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Additional Information Needed</h2>
                <p className="text-gray-600">Please provide the missing information to proceed</p>
              </div>
            </div>
          </div>
          
          <div className="h-96">
            <ChatInterface
              messages={candidate.chatHistory}
              onSendMessage={handleChatMessage}
              placeholder={`Enter your ${missingField}...`}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderInterview = () => {
    if (!candidate || !currentQuestion) return null;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 p-6 border-b border-blue-200">
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
          
          <div className="h-96">
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
    );
  };

  const renderCompleted = () => {
    if (!candidate) return null;

    return (
      <div className="max-w-2xl mx-auto">
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
          
          <div className="p-6 text-center">
            <p className="text-gray-600 mb-6">
              Your interview has been successfully completed and submitted for evaluation. 
              The results will be available shortly in the interviewer dashboard.
            </p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-1">Questions Answered</h3>
                <p className="text-2xl font-bold text-blue-600">{candidate.interviewAnswers.length}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-1">Time Taken</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {candidate.interviewStartTime && candidate.interviewEndTime
                    ? Math.round((candidate.interviewEndTime.getTime() - candidate.interviewStartTime.getTime()) / 60000)
                    : 0} min
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {currentStep === 'upload' && renderUploadStep()}
      {currentStep === 'info-collection' && renderInfoCollection()}
      {currentStep === 'interview' && renderInterview()}
      {currentStep === 'completed' && renderCompleted()}
    </div>
  );
};

export default IntervieweeTab;