import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';

import { activateTourMocks, clearTourMocks, setTourActive } from '@/utils/tourMocks';
import { useAuth } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { queryClient } from '@/lib/queryClient';
import {
  chatKeys,
  orderKeys,
  rfqKeys,
  showcaseKeys,
  factoryIdeasKeys,
} from '@/lib/queryKeys';
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
  findTarget,
} from '@/components/features/explore/product-tour/TourMockScreens';
import type { TourStepDef } from '@/components/features/explore/product-tour/tourTypes';

const TOUR_KEY = 'tryly_tour_seen_v1';

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

    let cancelled = false;
    let rafId: ReturnType<typeof requestAnimationFrame> | null = null;
    let innerTimer: ReturnType<typeof setTimeout> | null = null;
    let vvCleanup: (() => void) | null = null;

    const outerTimer = setTimeout(() => {
      if (cancelled) return;
      const el = findTarget(def);
      if (!el) {
        setTargetRect(null);
        return;
      }
      // Non-animated scroll so position settles before we measure.
      el.scrollIntoView({ behavior: 'auto', block: 'center' });

      // Measure after paint — double-rAF ensures the browser has finished
      // layout and any URL-bar animation has settled on real mobile devices.
      const measure = () => {
        if (cancelled) return;
        if (rafId != null) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cancelled) return;
            setTargetRect(el.getBoundingClientRect());
          });
        });
      };

      // Give the mobile browser extra time to collapse/animate the URL bar.
      innerTimer = setTimeout(measure, 300);

      // Re-measure any time the visual viewport resizes (URL bar hide/show,
      // soft keyboard, etc.) so the spotlight stays aligned on real devices.
      const vv = window.visualViewport;
      if (vv) {
        vv.addEventListener('resize', measure);
        vv.addEventListener('scroll', measure);
        vvCleanup = () => {
          vv.removeEventListener('resize', measure);
          vv.removeEventListener('scroll', measure);
        };
      }
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(outerTimer);
      if (innerTimer != null) clearTimeout(innerTimer);
      if (rafId != null) cancelAnimationFrame(rafId);
      vvCleanup?.();
    };
  }, [open, step, location.pathname, location.search]);

  const isPublicRoute = useCallback((path: string) => {
    if (path === '/' || path === '/factory-ideas' || path === '/factories') return true;
    if (path.startsWith('/factories/')) return true;
    if (path.startsWith('/factory-ideas/')) return true;
    if (path === '/product-detail' || path === '/promotion-detail' || path === '/idea-detail')
      return true;
    return false;
  }, []);

  /**
   * ล้าง React Query cache ที่ถูก contaminate ด้วย tour mock data
   * เรียกเมื่อ tour จบหรือถูกปิด ก่อน navigate กลับ
   */
  const purgeTourQueryCache = useCallback(() => {
    // list: conversations ที่แสดง conv 9001 ปลอม
    queryClient.removeQueries({ queryKey: chatKeys.all });
    // factory-ideas: categories + showcases + factories จาก browse step
    queryClient.removeQueries({ queryKey: factoryIdeasKeys.all });
    // showcase 14 detail จาก product step
    queryClient.removeQueries({ queryKey: showcaseKeys.all });
    // rfq 28 bundle จาก rfq step
    queryClient.removeQueries({ queryKey: rfqKeys.detail('28') });
    // order 17 detail จาก order step
    queryClient.removeQueries({ queryKey: orderKeys.detail('17') });
    // wallet balance จาก order step
    queryClient.removeQueries({ queryKey: ['wallet', 'me'] });
    // review state ของ order 17
    queryClient.removeQueries({ queryKey: ['orderReviewState', '17'] });
  }, []);

  const closeTo = useCallback(
    (target: string) => {
      localStorage.setItem(TOUR_KEY, '1');
      clearTourMocks();
      purgeTourQueryCache();
      setOpen(false);
      setTargetRect(null);

      if (location.pathname !== target) {
        navigate(target, { replace: true });
      }
      window.setTimeout(() => setTourActive(false), 50);
    },
    [location.pathname, navigate, purgeTourQueryCache],
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
