import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, X } from 'lucide-react';
import Footer from './Footer';

export default function StickyFooter() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false); // NEW: Prevent re-expand during collapse
  const footerRef = useRef(null);
  const timerRef = useRef(null);

  const handleMouseEnter = () => {
    if (isCollapsing) return; // Ignore if collapsing
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    if (isCollapsing) return;
    timerRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 300);
  };

  const handleCollapse = () => {
    setIsCollapsing(true);
    setIsExpanded(false);
    // Reset flag after animation
    setTimeout(() => {
      setIsCollapsing(false);
    }, 500); // Matches transition duration
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
          <span className="text-sm font-medium">© 2024 Mould Market edit test. All rights reserved.</span>
          <ChevronUp className="w-4 h-4 animate-bounce" />
        </div>
      </div>

      {/* Full Footer Overlay */}
      <div
        ref={footerRef}
        className="fixed bottom-0 left-0 right-0 z-40 transition-transform duration-500 ease-in-out"
        style={{
          transform: isExpanded ? 'translateY(0)' : 'translateY(100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          pointerEvents: isExpanded ? 'auto' : 'none' // NEW: Prevent interaction when collapsed
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Collapse Button */}
        {isExpanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCollapse();
            }}
            onMouseDown={(e) => e.preventDefault()} // Changed from stopPropagation
            className="absolute top-4 right-4 z-50 bg-red-500 hover:bg-red-600 text-black dark:text-white p-2 rounded-full shadow-lg transition-colors"
            aria-label="Collapse footer"
            style={{ pointerEvents: 'auto' }} // Ensure button is clickable
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        {/* Your Existing Footer Component */}
        <Footer />
      </div>

      {/* Overlay backdrop when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 z-30"
          style={{ bottom: '0' }}
          onClick={handleCollapse}
        />
      )}
    </>
  );
}