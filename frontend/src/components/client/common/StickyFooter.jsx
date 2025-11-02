import React, { useState, useRef, useEffect, useContext } from 'react';
import { ChevronUp, X } from 'lucide-react';
import Footer from './Footer';
import { CompanySettingsContext } from '../../../../Context/CompanySettingsContext';

export default function StickyFooter() {
  const { companySettings } = useContext(CompanySettingsContext);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const footerRef = useRef(null);
  const timerRef = useRef(null);

  const handleMouseEnter = () => {
    if (isCollapsing) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsExpanded(true);
  };

  const handleMouseLeave = (e) => {
  if (isCollapsing) return;
  
  // Don't collapse if moving to the close button
  const closeButton = document.querySelector('[aria-label="Collapse footer"]');
  if (closeButton && closeButton.contains(e.relatedTarget)) {
    return;
  }
  
  timerRef.current = setTimeout(() => {
    setIsExpanded(false);
  }, 300);
};

  const handleCollapse = () => {
    setIsCollapsing(true);
    setIsExpanded(false);
    setTimeout(() => {
      setIsCollapsing(false);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Small Sticky Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-gray-800 text-white shadow-lg transition-opacity duration-300"
        style={{ 
          height: '45px',
          opacity: isExpanded ? 0 : 1,
          pointerEvents: isExpanded ? 'none' : 'auto'
        }}
        onMouseEnter={handleMouseEnter}
      >
        <div className="h-full flex items-center justify-center gap-2 px-4">
          <span className="text-sm font-medium">
            © 2024 {companySettings?.companyName || "Our Company"}. All rights reserved.
          </span>
          <ChevronUp className="w-4 h-4 animate-bounce" />
        </div>
      </div>

      {/* Collapse Button - Fixed Position (Always Visible) */}
{isExpanded && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleCollapse();
    }}
    onMouseEnter={handleMouseEnter}
    className="fixed z-50 bg-red-500 hover:bg-red-600 dark:text-white text-black p-2 rounded-full shadow-lg transition-colors"
    aria-label="Collapse footer"
    style={{
      top: '170px',
      right: '16px'
    }}
  >
    <X className="w-5 h-5" />
  </button>
)}

      {/* Full Footer Overlay */}
      <div
        ref={footerRef}
        className="fixed bottom-0 left-0 right-0 z-40 transition-transform duration-500 ease-in-out"
        style={{
          transform: isExpanded ? 'translateY(0)' : 'translateY(100%)',
          top: '156px',
          maxHeight: 'calc(100vh - 156px)',
          overflowY: 'auto',
          pointerEvents: isExpanded ? 'auto' : 'none'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Your Existing Footer Component */}
        <Footer />
      </div>

      {/* Overlay backdrop when expanded */}
{isExpanded && (
  <div 
    className="fixed bg-black/20 z-30"
    style={{ 
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}
    onClick={handleCollapse}
  />
)}
    </>
  );
}