import { useEffect, useRef } from 'react';

/**
 * Reusable modal hook providing:
 * 1. Click outside modal box (backdrop tap) to close.
 * 2. Escape key to close.
 * 3. Mobile phone hardware/gesture back button navigation (closes modal instead of leaving app).
 */
export function useModalBackdropClose(isOpen, onClose) {
  const closedByPopStateRef = useRef(false);

  useEffect(() => {
    if (!isOpen || typeof onClose !== 'function') return;

    closedByPopStateRef.current = false;

    // Handle keyboard Escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Support mobile system back navigation (Android back button, iOS swipe back, browser back)
    const stateId = `modal_${Date.now()}`;
    window.history.pushState({ modalId: stateId }, '');

    const handlePopState = () => {
      closedByPopStateRef.current = true;
      onClose();
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
      // If modal was closed by UI click (not by back button), pop the history state to keep history clean
      if (!closedByPopStateRef.current && window.history.state?.modalId === stateId) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && typeof onClose === 'function') {
      onClose();
    }
  };

  return { handleBackdropClick };
}
