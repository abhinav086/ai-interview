import React from 'react';
import { X, Clock, User, FileText } from 'lucide-react';
import { Candidate } from '../types';

interface WelcomeBackModalProps {
  candidate: Candidate;
  onContinue: () => void;
  onStartNew: () => void;
  onClose: () => void;
}

const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({
  candidate,
  onContinue,
  onStartNew,
  onClose
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return 'text-blue-600';
      case 'paused': return 'text-orange-600';
      case 'completed': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
          <p className="text-gray-600">We found your previous session</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium text-gray-800">{candidate.name}</p>
              <p className="text-sm text-gray-600">{candidate.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium text-gray-800">Status</p>
              <p className={`text-sm capitalize ${getStatusColor(candidate.status)}`}>
                {candidate.status.replace('-', ' ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium text-gray-800">Progress</p>
              <p className="text-sm text-gray-600">
                Question {candidate.currentQuestionIndex + 1} of 6
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onContinue}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Continue Previous Session
          </button>
          
          <button
            onClick={onStartNew}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Start New Interview
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Your progress is automatically saved locally
        </p>
      </div>
    </div>
  );
};

export default WelcomeBackModal;