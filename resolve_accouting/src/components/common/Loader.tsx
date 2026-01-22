import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'fullscreen';
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ 
  message = 'Loading...', 
  subMessage,
  size = 'md',
  variant = 'default',
  className = ''
}) => {
  const sizeClasses = {
    sm: {
      container: 'w-12 h-12',
      spinner: 20,
      centerPulse: 'w-4 h-4',
      innerCircle: 'w-3 h-3',
      text: 'text-sm',
      subText: 'text-xs'
    },
    md: {
      container: 'w-20 h-20',
      spinner: 40,
      centerPulse: 'w-10 h-10',
      innerCircle: 'w-6 h-6',
      text: 'text-xl',
      subText: 'text-sm'
    },
    lg: {
      container: 'w-24 h-24',
      spinner: 48,
      centerPulse: 'w-12 h-12',
      innerCircle: 'w-8 h-8',
      text: 'text-2xl',
      subText: 'text-base'
    }
  };

  const variantClasses = {
    default: 'py-16 bg-gradient-to-br from-secondary-50 to-blue-50 rounded-xl border-2 border-secondary-200',
    compact: 'py-8 bg-gradient-to-br from-secondary-50 to-blue-50 rounded-lg border border-secondary-200',
    fullscreen: 'py-32 bg-gradient-to-br from-secondary-50 to-blue-50 rounded-2xl border-2 border-secondary-200'
  };

  const currentSize = sizeClasses[size];

  const loaderContent = (
    <div className="text-center">
      <div className="relative inline-block mb-6">
        {/* Outer rotating ring */}
        <div 
          className="absolute inset-0 border-4 border-secondary-200 rounded-full animate-spin" 
          style={{ animationDuration: '3s' }}
        />
        {/* Middle pulsing ring */}
        <div className="absolute inset-2 border-4 border-secondary-400 rounded-full animate-pulse" />
        {/* Inner spinner */}
        <div className={`relative ${currentSize.container} flex items-center justify-center`}>
          <Loader2 
            size={currentSize.spinner} 
            className="animate-spin text-secondary-600" 
            style={{ animationDuration: '1s' }} 
          />
          {/* Center pulse */}
          <div className={`absolute ${currentSize.centerPulse} bg-secondary-500 rounded-full animate-ping opacity-75`} />
          <div className={`absolute ${currentSize.innerCircle} bg-secondary-600 rounded-full`} />
        </div>
      </div>
      <p className={`${currentSize.text} font-bold text-gray-800 mb-2 animate-pulse`}>{message}</p>
      {subMessage && (
        <p className={`${currentSize.subText} text-gray-600`}>{subMessage}</p>
      )}
      <div className="mt-4 flex items-center justify-center gap-2 text-secondary-600">
        <div className="w-2 h-2 bg-secondary-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
        <div className="w-2 h-2 bg-secondary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        <div className="w-2 h-2 bg-secondary-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );

  if (variant === 'fullscreen') {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className}`}>
        <div className={variantClasses[variant]}>
          {loaderContent}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${variantClasses[variant]} ${className} animate-fade-in`}>
      {loaderContent}
    </div>
  );
};

export default Loader;

