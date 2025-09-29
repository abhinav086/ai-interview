// src/utils/resumeParser.ts
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface ParsedResume {
  text: string;
  name?: string;
  email?: string;
  phone?: string;
}

// Define keywords for topic extraction
const TECH_KEYWORDS = [
  // Programming Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby',
  // Frontend Technologies
  'React', 'Angular', 'Vue.js', 'HTML', 'CSS', 'SASS', 'LESS', 'Webpack', 'Vite', 'Next.js', 'Nuxt.js',
  // Backend Technologies
  'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'ASP.NET', 'FastAPI', 'GraphQL', 'REST',
  // Databases
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'Cassandra', 'Oracle', 'SQL Server',
  // DevOps & Cloud
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Jenkins', 'GitLab CI', 'GitHub Actions', 'CI/CD', 'Terraform', 'Ansible',
  // Frameworks & Libraries
  'jQuery', 'Lodash', 'Express.js', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Scikit-learn',
  // Tools & Concepts
  'Git', 'SDLC', 'Agile', 'Scrum', 'Jira', 'Linux', 'Bash', 'Algorithms', 'Data Structures', 'OOP', 'Microservices',
  // AI/ML related (as seen in your example)
  'AI', 'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision',
  // Other relevant terms
  'Full Stack', 'Frontend', 'Backend', 'API', 'Microservices', 'Testing', 'Jest', 'Cypress', 'Selenium'
];

export const parseResume = async (file: File): Promise<ParsedResume> => {
  let text = '';
  
  try {
    if (file.type === 'application/pdf') {
      text = await extractTextFromPDF(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value;
    } else {
      throw new Error('Unsupported file type');
    }

    console.log('Extracted text length:', text.length);
    console.log('First 500 characters:', text.substring(0, 500));

    const contactInfo = extractContactInfo(text);
    console.log('Extracted contact info:', contactInfo);
    
    return { text, ...contactInfo };
  } catch (error) {
    console.error('Error parsing resume:', error);
    return { text: '', name: undefined, email: undefined, phone: undefined };
  }
};

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Preserve line structure by checking Y coordinates
      let lastY = -1;
      const items = textContent.items as any[];
      
      for (const item of items) {
        // Add newline if Y coordinate changed significantly (new line)
        if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
          fullText += '\n';
        }
        
        fullText += item.str + ' ';
        lastY = item.transform[5];
      }
      
      fullText += '\n\n'; // Page break
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

export const extractContactInfo = (text: string): Omit<ParsedResume, 'text'> => {
  const extractedData: Omit<ParsedResume, 'text'> = {};
  
  // Email extraction
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatches = text.match(emailRegex);
  if (emailMatches && emailMatches.length > 0) {
    extractedData.email = emailMatches[0];
  }
  
  // Phone number extraction - multiple formats
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})|(\+?\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4})/g;
  const phoneMatches = text.match(phoneRegex);
  if (phoneMatches && phoneMatches.length > 0) {
    // Clean up the phone number
    let phone = phoneMatches[0].replace(/[^\d+]/g, '');
    
    // Remove leading +1 or 1 for US numbers
    if (phone.startsWith('+1')) {
      phone = phone.substring(2);
    } else if (phone.startsWith('1') && phone.length === 11) {
      phone = phone.substring(1);
    }
    
    // Format if it's a 10-digit number
    if (phone.length === 10) {
      extractedData.phone = `(${phone.slice(0,3)}) ${phone.slice(3,6)}-${phone.slice(6)}`;
    } else {
      extractedData.phone = phoneMatches[0]; // Keep original format if not standard
    }
  }
  
  // Name extraction
  extractedData.name = extractName(text);
  
  return extractedData;
};

const extractName = (text: string): string | undefined => {
  // Common resume section headers to skip
  const sectionHeaders = [
    'experience', 'education', 'skills', 'objective', 'summary', 
    'work experience', 'employment', 'projects', 'certifications',
    'achievements', 'awards', 'references', 'contact', 'about',
    'professional', 'background', 'qualification', 'technical'
  ];
  
  // Split text into lines and clean them
  const lines = text
    .split(/\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  console.log('First 15 lines for name extraction:', lines.slice(0, 15));
  
  // Look for name in the first 15 lines
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i];
    
    // Skip if line is too long (likely not a name)
    if (line.length > 50) continue;
    
    // Skip lines that are section headers
    if (sectionHeaders.some(header => line.toLowerCase().includes(header))) {
      continue;
    }
    
    // Skip lines with email or phone
    if (line.includes('@') || /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(line)) {
      continue;
    }
    
    // Skip lines with URLs or common resume keywords
    if (line.toLowerCase().includes('http') || 
        line.toLowerCase().includes('linkedin') ||
        line.toLowerCase().includes('github') ||
        line.toLowerCase().includes('.com')) {
      continue;
    }
    
    const words = line.split(/\s+/).filter(w => w.length > 0);
    
    // Name should be 2-4 words
    if (words.length < 2 || words.length > 4) continue;
    
    // Check if words look like a name (start with capital letter, mostly letters)
    const looksLikeName = words.every(word => {
      // Should start with capital letter
      if (!/^[A-Z]/.test(word)) return false;
      
      // Should be mostly letters (allow apostrophes, hyphens)
      const letterCount = (word.match(/[a-zA-Z]/g) || []).length;
      return letterCount >= word.length * 0.7;
    });
    
    if (looksLikeName) {
      const name = words.join(' ');
      console.log('Found potential name:', name);
      return name;
    }
  }
  
  console.log('No name found in resume');
  return undefined;
};

// NEW FUNCTION: Extract topics from resume text
export const extractTopicsFromResumeText = (resumeText: string): string[] => {
  if (!resumeText) return [];

  // Normalize the text for comparison (lowercase, remove punctuation around keywords)
  const normalizedText = resumeText.toLowerCase();

  const foundTopics = new Set<string>();

  TECH_KEYWORDS.forEach(keyword => {
    // Create a case-insensitive, word-boundary aware regex for the keyword
    // This helps avoid partial matches within other words (e.g., finding 'React' in 'Abstract')
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(normalizedText)) {
      foundTopics.add(keyword);
    }
  });

  // Convert Set to Array and return
  return Array.from(foundTopics);
};