// src/services/geminiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyBOtFaE1R2g1tJGlc5dTwUKapwe0eARdwQ';
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export interface AIQuestion {
  id: string;
  question: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  timeLimit: number;
  expectedPoints: string[];
}

export interface AIEvaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export const generateInterviewQuestions = async (
  topic: string = 'React and Node.js',
  count: number = 6
): Promise<AIQuestion[]> => {
  const prompt = `Generate ${count} technical interview questions about ${topic}. 
  Requirements:
  - 2 Easy questions (20 seconds to answer) - ask for one or two word answers
  - 2 Medium questions (60 seconds to answer) - ask for one or two word answers
  - 2 Hard questions (120 seconds to answer) - ask for one or two word answers
  - Questions should be specific and require short answers (like MCQ)
  - Mix of conceptual and practical questions
  - Cover both React and Node.js topics
  For each question, provide:
  1. The question text
  2. Difficulty level (Easy/Medium/Hard)
  3. Specific category (e.g., "React Hooks", "Node.js Performance", etc.)
  4. Expected key points in the answer (3-5 points)
  Format your response as a JSON array with this structure:
  [
    {
      "question": "question text",
      "difficulty": "Easy|Medium|Hard",
      "category": "specific category",
      "expectedPoints": ["point1", "point2", "point3"]
    }
  ]
  Only return the JSON array, no additional text.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Raw AI Response for questions:", text);

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Failed to find JSON array in AI response:", text);
      throw new Error('Failed to parse AI response - no JSON array found');
    }
    const questionsData = JSON.parse(jsonMatch[0]);

    // Transform to AIQuestion format with correct time limits
    return questionsData.map((q: any, index: number) => ({
      id: `ai-q-${Date.now()}-${index}`,
      question: q.question,
      difficulty: q.difficulty,
      category: q.category,
      timeLimit: q.difficulty === 'Easy' ? 20 : q.difficulty === 'Medium' ? 60 : 120,
      expectedPoints: q.expectedPoints
    }));
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
};

export const evaluateAnswer = async (
  question: string,
  answer: string,
  expectedPoints: string[],
  timeUsed: number,
  timeLimit: number
): Promise<AIEvaluation> => {
  const prompt = `Evaluate this technical interview answer:
Question: ${question}
Expected Key Points:
${expectedPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}
Candidate's Answer: ${answer}
Time Used: ${timeUsed} seconds out of ${timeLimit} seconds allowed
Evaluate based on:
1. Technical accuracy and correctness
2. Completeness (covered expected points)
3. Clarity and communication
4. Depth of understanding
5. Time management
Provide:
- Score out of 100
- Detailed feedback (2-3 sentences)
- 2-3 specific strengths
- 2-3 areas for improvement
Format as JSON:
{
  "score": number (0-100),
  "feedback": "detailed feedback text",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"]
}
Only return the JSON object, no additional text.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Raw AI Response for evaluation:", text);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to find JSON object in AI evaluation response:", text);
      throw new Error('Failed to parse AI evaluation - no JSON object found');
    }
    const evaluation = JSON.parse(jsonMatch[0]);

    evaluation.score = Math.max(0, Math.min(100, evaluation.score));
    return evaluation;
  } catch (error) {
    console.error('Error evaluating answer:', error);
    return {
      score: 50,
      feedback: 'Unable to evaluate answer automatically. Please review manually.',
      strengths: ['Answer provided'],
      improvements: ['Evaluation service temporarily unavailable']
    };
  }
};

export const generateFinalReport = async (
  candidateName: string,
  answers: Array<{ question: string; answer: string; score: number; feedback: string }>
): Promise<{
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  strengths: string[];
  improvements: string[];
  recommendation: string;
}> => {
  const prompt = `Generate a comprehensive interview evaluation report for ${candidateName}.
Interview Performance:
${answers.map((a, i) => `
Question ${i + 1}: ${a.question}
Answer: ${a.answer}
Score: ${a.score}/100
Feedback: ${a.feedback}
`).join('\n---\n')}

Provide:
1. Overall score (0-100)
2. Technical knowledge score (0-100)
3. Communication clarity score (0-100)
4. Problem-solving ability score (0-100)
5. Top 3-4 strengths
6. Top 3-4 areas for improvement
7. Hiring recommendation: "Strong Hire" | "Hire" | "No Hire" | "Strong No Hire"
Format as JSON:
{
  "overallScore": number,
  "technicalScore": number,
  "communicationScore": number,
  "problemSolvingScore": number,
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "recommendation": "Strong Hire|Hire|No Hire|Strong No Hire"
}
Only return the JSON object, no additional text.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Raw AI Response for final report:", text);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to find JSON object in AI final report response:", text);
      throw new Error('Failed to parse final report - no JSON object found');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating final report:', error);
    const avgScore = Math.round(
      answers.reduce((sum, a) => sum + a.score, 0) / answers.length
    );
    return {
      overallScore: avgScore,
      technicalScore: avgScore,
      communicationScore: avgScore,
      problemSolvingScore: avgScore,
      strengths: ['Completed all questions'],
      improvements: ['Continue developing technical skills'],
      recommendation: avgScore >= 70 ? 'Hire' : 'No Hire'
    };
  }
};