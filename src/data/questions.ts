import { InterviewQuestion } from '../types';

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'easy-1',
    question: 'What is the difference between let, const, and var in JavaScript?',
    difficulty: 'Easy',
    timeLimit: 20,
    category: 'JavaScript Fundamentals',
    expectedKeywords: ['scope', 'hoisting', 'reassignment', 'block scope']
  },
  {
    id: 'easy-2', 
    question: 'Explain what React props are and how they work.',
    difficulty: 'Easy',
    timeLimit: 20,
    category: 'React Basics',
    expectedKeywords: ['properties', 'parent', 'child', 'immutable', 'data flow']
  },
  {
    id: 'medium-1',
    question: 'How would you optimize the performance of a React application?',
    difficulty: 'Medium',
    timeLimit: 60,
    category: 'React Performance',
    expectedKeywords: ['memoization', 'lazy loading', 'code splitting', 'virtual DOM']
  },
  {
    id: 'medium-2',
    question: 'Explain the concept of closures in JavaScript and provide an example.',
    difficulty: 'Medium', 
    timeLimit: 60,
    category: 'JavaScript Advanced',
    expectedKeywords: ['lexical scope', 'inner function', 'outer function', 'variable access']
  },
  {
    id: 'hard-1',
    question: 'Design a scalable system architecture for a real-time chat application with millions of users.',
    difficulty: 'Hard',
    timeLimit: 120,
    category: 'System Design',
    expectedKeywords: ['microservices', 'load balancing', 'websockets', 'database sharding']
  },
  
  {
    id: 'hard-2',
    question: 'Implement a function to find the longest palindromic substring in a string with optimal time complexity.',
    difficulty: 'Hard',
    timeLimit: 120, 
    category: 'Algorithms',
    expectedKeywords: ['dynamic programming', 'expand around center', 'time complexity', 'space complexity']
  }
];