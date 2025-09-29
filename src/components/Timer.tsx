import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimerProps {
  initialTime: number; // in seconds
  onTimeUp: () => void;
  isActive: boolean;
  onTimeUpdate?: (timeRemaining: number) => void;
  className?: string;
}

const Timer: React.FC<TimerProps> = ({ 
  initialTime, 
  onTimeUp, 
  isActive, 
  onTimeUpdate,
  className = '' 
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = Math.max(0, prev - 1);
        onTimeUpdate?.(newTime);
        
        if (newTime === 0) {
          onTimeUp();
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onTimeUp, onTimeUpdate]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    return ((initialTime - timeLeft) / initialTime) * 100;
  };

  const getColorClasses = () => {
    const percentage = (timeLeft / initialTime) * 100;
    if (percentage <= 10) return 'text-red-600 bg-red-50 border-red-200';
    if (percentage <= 25) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const isWarning = (timeLeft / initialTime) <= 0.25;

  return (
    <div className={`${className}`}>
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-300 ${getColorClasses()}`}>
        {isWarning ? (
          <AlertTriangle className="w-5 h-5 animate-pulse" />
        ) : (
          <Clock className="w-5 h-5" />
        )}
        <span className="font-mono text-lg font-semibold">
          {formatTime(timeLeft)}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${
            isWarning ? 'bg-red-500' : 'bg-blue-500'
          }`}
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>
    </div>
  );
};

export default Timer;