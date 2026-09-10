import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, CheckCircle2, ArrowDown } from 'lucide-react';

export const PullToRefresh = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const threshold = 70;

  useEffect(() => {
    const handleTouchStart = (e) => {
      // Only initiate pull-to-refresh if we are at the top of the page
      if (window.scrollY <= 2 && !isRefreshing) {
        touchStartY.current = e.touches[0].clientY;
        isPulling.current = true;
      } else {
        isPulling.current = false;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling.current || isRefreshing) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartY.current;

      if (diff > 0 && window.scrollY <= 2) {
        // Apply friction to pull
        const distance = Math.min(Math.pow(diff, 0.85) * 1.6, 95);
        setPullDistance(distance);

        // Prevent default native bounce when pulling at top
        if (distance > 10 && e.cancelable) {
          e.preventDefault();
        }
      } else {
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current || isRefreshing) return;
      isPulling.current = false;

      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        setPullDistance(50); // Keep indicator visible while refreshing

        try {
          if (onRefresh) {
            await onRefresh();
          }
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            setPullDistance(0);
            setIsRefreshing(false);
          }, 800);
        } catch (err) {
          console.error('Refresh error:', err);
          setPullDistance(0);
          setIsRefreshing(false);
        }
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, onRefresh]);

  const rotation = Math.min((pullDistance / threshold) * 360, 360);

  return (
    <div className="relative w-full">
      {/* Pull Indicator Pill */}
      <div 
        className={`fixed left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all ${
          isRefreshing || showSuccess ? 'duration-300' : 'duration-75'
        }`}
        style={{
          top: `${Math.max(pullDistance - 45, -60)}px`,
          opacity: pullDistance > 15 ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 backdrop-blur-md text-white shadow-xl border border-slate-700/50 text-xs font-semibold">
          {showSuccess ? (
            <>
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span className="text-emerald-300">Updated!</span>
            </>
          ) : isRefreshing ? (
            <>
              <RefreshCw size={15} className="animate-spin text-sky-400" />
              <span>Refreshing SusuRow...</span>
            </>
          ) : (
            <>
              <ArrowDown 
                size={15} 
                className="text-sky-400 transition-transform duration-100" 
                style={{ transform: `rotate(${rotation}deg)` }}
              />
              <span>{pullDistance >= threshold ? 'Release to refresh' : 'Pull down to refresh'}</span>
            </>
          )}
        </div>
      </div>

      {/* Children content with slight transform during pull */}
      <div 
        style={{ 
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.35}px)` : 'none',
          transition: isPulling.current ? 'none' : 'transform 0.25s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
};
