import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { trackPageView, initAnalyticsAttribution } from '../../analytics/analyticsClient';

/**
 * Global scroll manager:
 * - On PUSH/REPLACE: scrolls to top.
 * - On POP (back/forward): restores prior scroll position for that location.key.
 * Positions are kept in-memory per session.
 */
const ScrollManager = () => {
  const location = useLocation();
  const action = useNavigationType();
  const positionsRef = useRef({});

  // Initialize analytics identity + attribution once per session
  useEffect(() => {
    initAnalyticsAttribution();
  }, []);

  // Store previous page scroll position on unmount
  useEffect(() => {
    const key = location.key || `${location.pathname}${location.search}`;
    return () => {
      positionsRef.current[key] = window.scrollY;
    };
  }, [location]);

  // Apply scroll based on navigation type
  useEffect(() => {
    const key = location.key || `${location.pathname}${location.search}`;
    if (action === 'POP') {
      const y = positionsRef.current[key] ?? 0;
      window.scrollTo({ top: y, behavior: 'auto' });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [action, location]);

  // Track page views on route change (public pages only)
  useEffect(() => {
    trackPageView(location);
  }, [location]);

  return null;
};

export default ScrollManager;

