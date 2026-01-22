import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

interface InfoIconProps {
  title?: string;
  content: string | React.ReactNode;
  size?: number;
  className?: string;
}

const InfoIcon: React.FC<InfoIconProps> = ({ 
  title, 
  content, 
  size = 18, 
  className = '' 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // For short content, show tooltip; for long content, show modal
  const isLongContent = typeof content === 'string' && content.length > 100;

  return (
    <>
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => isLongContent ? setShowModal(true) : setShowTooltip(!showTooltip)}
          onMouseEnter={() => !isLongContent && setShowTooltip(true)}
          onMouseLeave={() => !isLongContent && setShowTooltip(false)}
          className={`text-gray-400 hover:text-secondary-600 transition-colors ${className}`}
          aria-label="Information"
        >
          <Info size={size} />
        </button>

        {/* Tooltip for short content */}
        {showTooltip && !isLongContent && (
          <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50">
            {title && <div className="font-semibold mb-1">{title}</div>}
            <div>{content}</div>
            <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
          </div>
        )}
      </div>

      {/* Modal for long content */}
      {showModal && isLongContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Info size={20} className="text-secondary-600" />
                {title || 'Information'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="text-gray-700">
              {typeof content === 'string' ? (
                <p className="whitespace-pre-line">{content}</p>
              ) : (
                content
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-primary"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InfoIcon;

