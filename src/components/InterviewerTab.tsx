import React, { useState, useMemo } from 'react';
import { Search, Users, Clock, CheckCircle, AlertCircle, Eye, Download, Star } from 'lucide-react';
import { Candidate } from '../types';

interface InterviewerTabProps {
  candidates: Candidate[];
  onCandidateSelect: (candidateId: string) => void;
  selectedCandidateId?: string;
}

const InterviewerTab: React.FC<InterviewerTabProps> = ({
  candidates,
  onCandidateSelect,
  selectedCandidateId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'score'>('date');
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');

  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = candidates.filter(candidate => {
      const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'score':
          const aScore = a.finalScore || 0;
          const bScore = b.finalScore || 0;
          return bScore - aScore;
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [candidates, searchTerm, statusFilter, sortBy]);

  const selectedCandidate = selectedCandidateId ? candidates.find(c => c.id === selectedCandidateId) : null;
  const scoringDetails = selectedCandidate?.scoringDetails || null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'paused': return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default: return <Users className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'Strong Hire': return 'bg-green-100 text-green-800';
      case 'Hire': return 'bg-blue-100 text-blue-800';
      case 'No Hire': return 'bg-orange-100 text-orange-800';
      case 'Strong No Hire': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCandidateList = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Interview Dashboard</h2>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search candidates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'score')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="score">Sort by Score</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {filteredAndSortedCandidates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No candidates found</p>
          </div>
        ) : (
          filteredAndSortedCandidates.map((candidate) => {
            const score = candidate.finalScore || null;
            
            return (
              <div
                key={candidate.id}
                className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedCandidateId === candidate.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => onCandidateSelect(candidate.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(candidate.status)}
                    <div>
                      <h3 className="font-semibold text-gray-800">{candidate.name}</h3>
                      <p className="text-sm text-gray-600">{candidate.email}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(candidate.createdAt).toLocaleDateString()} • {candidate.phone}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {score !== null && (
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold text-gray-800">{score}</span>
                        </div>
                        <p className="text-xs text-gray-500">Overall Score</p>
                      </div>
                    )}
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(candidate.status)}`}>
                      {candidate.status.replace('-', ' ')}
                    </span>
                    
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderCandidateDetails = () => {
    if (!selectedCandidate) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Select a candidate to view details</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Candidate Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedCandidate.name}</h2>
                <p className="text-gray-600">{selectedCandidate.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(selectedCandidate.status)}`}>
                {selectedCandidate.status.replace('-', ' ')}
              </span>
  
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Phone</h3>
              <p className="text-gray-800">{selectedCandidate.phone}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Applied</h3>
              <p className="text-gray-800">{new Date(selectedCandidate.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Progress</h3>
              <p className="text-gray-800">{selectedCandidate.interviewAnswers.length} questions answered</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Duration</h3>
              <p className="text-gray-800">
                {selectedCandidate.interviewStartTime && selectedCandidate.interviewEndTime
                  ? `${Math.round((selectedCandidate.interviewEndTime.getTime() - selectedCandidate.interviewStartTime.getTime()) / 60000)} min`
                  : 'In Progress'}
              </p>
            </div>
          </div>
        </div>

        {/* Scoring Details */}
        {scoringDetails && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">AI Performance Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <h4 className="text-sm font-medium text-gray-600 mb-1">Overall Score</h4>
                <p className="text-3xl font-bold text-blue-600">{scoringDetails.overallScore}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <h4 className="text-sm font-medium text-gray-600 mb-1">Technical</h4>
                <p className="text-3xl font-bold text-green-600">{scoringDetails.technicalScore}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <h4 className="text-sm font-medium text-gray-600 mb-1">Communication</h4>
                <p className="text-3xl font-bold text-purple-600">{scoringDetails.communicationScore}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <h4 className="text-sm font-medium text-gray-600 mb-1">Problem Solving</h4>
                <p className="text-3xl font-bold text-orange-600">{scoringDetails.problemSolvingScore}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Strengths
                </h4>
                <ul className="space-y-2">
                  {scoringDetails.strengths.map((strength, index) => (
                    <li key={index} className="text-gray-600 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Areas for Improvement
                </h4>
                <ul className="space-y-2">
                  {scoringDetails.improvements.map((improvement, index) => (
                    <li key={index} className="text-gray-600 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">AI Recommendation</h4>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(scoringDetails.recommendation)}`}>
                {scoringDetails.recommendation}
              </span>
            </div>
          </div>
        )}

        {/* Interview Answers */}
        {selectedCandidate.interviewAnswers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Interview Responses</h3>
            
            <div className="space-y-6">
              {selectedCandidate.interviewAnswers.map((answer, index) => (
                <div key={answer.questionId} className="border-l-4 border-l-blue-200 pl-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-800">Question {index + 1}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{answer.timeUsed}s</span>
                      <span className="text-sm font-medium text-blue-600">{answer.score}/100</span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3 font-medium">{answer.question}</p>
                  <div className="bg-gray-50 p-4 rounded-lg mb-2">
                    <p className="text-gray-800 whitespace-pre-wrap">{answer.answer}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700"><span className="font-semibold">AI Feedback:</span> {answer.feedback}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto">
        {viewMode === 'list' ? (
          <div className="space-y-6">
            {renderCandidateList()}
            {selectedCandidateId && (
              <button
                onClick={() => setViewMode('details')}
                className="fixed bottom-6 right-6 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2 z-10"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <button
              onClick={() => setViewMode('list')}
              className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-2 font-medium"
            >
              ← Back to List
            </button>
            {renderCandidateDetails()}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewerTab;