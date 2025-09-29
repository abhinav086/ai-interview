import React, { useCallback, useState } from 'react';
import { Upload, File, AlertCircle, CheckCircle, User, Mail, Phone } from 'lucide-react';
import { parseResume, ParsedResume } from '../utils/resumeParser';

interface FileUploadProps {
  onFileUpload: (file: File, parsedData: ParsedResume) => void;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, className = '' }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setError(null);
    setParsedData(null);
    
    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('wordprocessingml')) {
      setError('Please upload a PDF or DOCX file.');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setIsProcessing(true);
    setUploadedFile(file);
    
    try {
      const parsed = await parseResume(file);
      setParsedData(parsed);
      
      // Show extraction results for 2 seconds before proceeding
      setTimeout(() => {
        onFileUpload(file, parsed);
      }, 2000);
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Error processing the file. Please try again.');
      setIsProcessing(false);
    }
  }, [onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  }, [handleFiles]);

  return (
    <div className={className}>
      <div
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleInputChange}
          className="hidden"
          id="resume-upload"
          disabled={isProcessing}
        />
        
        <label htmlFor="resume-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-4">
            {isProcessing ? (
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            ) : (
              <Upload className="w-12 h-12 text-gray-400" />
            )}
            
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {isProcessing ? 'Processing Resume...' : 'Upload Your Resume'}
              </h3>
              <p className="text-gray-600 mb-1">
                Drag and drop your resume here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports PDF and DOCX files (max 10MB)
              </p>
            </div>
          </div>
        </label>
      </div>

      {parsedData && uploadedFile && (
        <div className="mt-4 p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-800">Resume Processed Successfully</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <File className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700">{uploadedFile.name}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <div className="bg-white p-3 rounded border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-xs font-medium text-gray-600">Name</span>
                </div>
                <p className="text-sm font-medium text-gray-800">
                  {parsedData.name || <span className="text-orange-600">Not detected</span>}
                </p>
              </div>
              
              <div className="bg-white p-3 rounded border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-gray-600" />
                  <span className="text-xs font-medium text-gray-600">Email</span>
                </div>
                <p className="text-sm font-medium text-gray-800">
                  {parsedData.email || <span className="text-orange-600">Not detected</span>}
                </p>
              </div>
              
              <div className="bg-white p-3 rounded border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span className="text-xs font-medium text-gray-600">Phone</span>
                </div>
                <p className="text-sm font-medium text-gray-800">
                  {parsedData.phone || <span className="text-orange-600">Not detected</span>}
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-600 mt-3">
            Proceeding to next step...
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Upload Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;