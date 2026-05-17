import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';

import { activateTourMocks, clearTourMocks, setTourActive } from '@/utils/tourMocks';
import { useAuth } from '@/stores';
import { Button } from '@/components/ui/button';
import { TOUR_STEPS } from '@/components/features/explore/product-tour/tourSteps';
import { injectTourCSS } from '@/components/features/explore/product-tour/tourStyles';
import { TourCard } from '@/components/features/explore/product-tour/TourCard';
import { SpotlightOverlay } from '@/components/features/explore/product-tour/TourSpotlight';
import {
  MockCreateRfq,
  MockMessages,
  MockOrderDetail,
  MockProductDetail,
  MockRfqDetail,
} from '@/components/features/explore/product-tour/TourMockScreens';
import type { TourStepDef } from '@/components/features/explore/product-tour/tourTypes';

export const TOUR_KEY = 'tryly_tour_seen_v1';

export function ProductTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [autoShown, setAutoShown] = useState(false);
  const originPath = useRef('/');

  injectTourCSS();

  useEffect(() => {
    if (autoShown || open) return;
    if (location.pathname !== '/') return;
    if (isAuthenticated) {
      setAutoShown(true);
      return;
    }
    const seen = localStorage.getItem(TOUR_KEY);
    if (!seen) {
      const t = setTimeout(() => {
        setTourActive(true);
        setOpen(true);
        setAutoShown(true);
      }, 1200);
      return () => clearTimeout(t);
    }
    setAutoShown(true);
  }, [autoShown, open, location.pathname, isAuthenticated]);

  useEffect(() => {
    const handler = () => {
      originPath.current = location.pathname;
      setStep(0);
      setTourActive(true);
      setOpen(true);
    };
    window.addEventListener('tryly-open-tour', handler);
    return () => window.removeEventListener('tryly-open-tour', handler);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const def = TOUR_STEPS[step];
    if (def.mockScenario) {
      activateTourMocks(def.mockScenario);
    } else {
      clearTourMocks();
    }
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const def = TOUR_STEPS[step];
    if (!def.route) return;
    const current = `${location.pathname}${location.search}`;
    if (current !== def.route) {
      navigate(def.route);
    }
  }, [open, step, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!open) return;
    const def = TOUR_STEPS[step];
    if (!def.route) {
      setTargetRect(null);
      return;
    }
    const current = `${location.pathname}${location.search}`;
    if (current !== def.route) {
      setTargetRect(null);
      return;
    }

    const t = setTimeout(() => {
      const el = findTarget(def);
      if (!el) {
        setTargetRect(null);
        return;
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setTargetRect(el.getBoundingClientRect()), 350);
    }, 700);
    return () => clearTimeout(t);
  }, [open, step, location.pathname, location.search]);

  const isPublicRoute = useCallback((path: string) => {
    if (path === '/' || path === '/factory-ideas' || path === '/factories') return true;
    if (path.startsWith('/factories/')) return true;
    if (path.startsWith('/factory-ideas/')) return true;
    if (path === '/product-detail' || path === '/promotion-detail' || path === '/idea-detail')
      return true;
    return false;
  }, []);

  const closeTo = useCallback(
    (target: string) => {
      localStorage.setItem(TOUR_KEY, '1');
      clearTourMocks();
      setOpen(false);
      setTargetRect(null);

      if (location.pathname !== target) {
        navigate(target, { replace: true });
      }
      window.setTimeout(() => setTourActive(false), 50);
    },
    [location.pathname, navigate],
  );

  const handleClose = useCallback(() => {
    const target = isPublicRoute(originPath.current) ? originPath.current : '/';
    closeTo(target);
  }, [closeTo, isPublicRoute]);

  const handleFinish = useCallback(() => {
    closeTo('/');
  }, [closeTo]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, handleClose]);

  useEffect(() => {
    return () => {
      clearTourMocks();
      setTourActive(false);
    };
  }, []);

  const handleNext = useCallback(() => {
    setTargetRect(null);
    setStep((s) => Math.min(s + 1, TOUR_STEPS.length - 1));
  }, []);

  const handlePrev = useCallback(() => {
    setTargetRect(null);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  if (!open) return null;

  const def = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <>
      <SpotlightOverlay
        rect={targetRect}
        color={def.badgeColor}
        radius={def.spotlightRadius ?? 12}
        onClickOutside={handleClose}
      />
      <TourCard
        stepIdx={step}
        def={def}
        total={TOUR_STEPS.length}
        rect={targetRect}
        isMock={false}
        onPrev={handlePrev}
        onNext={isLast ? handleFinish : handleNext}
        onClose={handleClose}
      />
    </>
  );
}
