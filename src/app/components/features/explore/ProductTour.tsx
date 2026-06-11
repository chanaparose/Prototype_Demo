import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';

import { activateTourMocks, clearTourMocks, setTourActive } from '@/utils/tourMocks';
import { Button } from '@/components/ui/button';
import { queryClient } from '@/lib/queryClient';
import {
  chatKeys,
  orderKeys,
  rfqKeys,
  showcaseKeys,
  factoryIdeasKeys,
} from '@/lib/queryKeys';
import {
  TOUR_STEPS,
  PAGE_TOUR_STEPS,
  getPageKey,
  isPageTourSeen,
  markPageTourSeen,
} from '@/components/features/explore/product-tour/tourSteps';
import { injectTourCSS } from '@/components/features/explore/product-tour/tourStyles';
import { TourCard } from '@/components/features/explore/product-tour/TourCard';
import { SpotlightOverlay } from '@/components/features/explore/product-tour/TourSpotlight';
import {
  findTarget,
} from '@/components/features/explore/product-tour/TourMockScreens';
import type { TourStepDef } from '@/components/features/explore/product-tour/tourTypes';
import {
  getTourTargetRect,
  isTourTargetMostlyVisible,
} from '@/components/features/explore/product-tour/tourTargetRect';

/** Full-tour key (กดปุ่ม "สาธิตการใช้งาน") — ไม่ใช้สำหรับ auto-show อีกต่อไป */
const FULL_TOUR_KEY = 'tryly_tour_seen_v1';

type TourMode = 'full' | 'page';

export function ProductTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<TourMode>('full');
  const [activeSteps, setActiveSteps] = useState<TourStepDef[]>(TOUR_STEPS);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const originPath = useRef('/');
  // ป้องกัน auto-show ซ้ำใน session เดียวกัน
  const shownPageKeys = useRef<Set<string>>(new Set());

  injectTourCSS();

  // ── Per-page first-visit tour ───────────────────────────────────────────────
  useEffect(() => {
    if (open) return;
    const pageKey = getPageKey(location.pathname);
    if (!pageKey) return;
    // ถ้าแสดงไปแล้วใน session นี้ หรือ localStorage บอกว่าเคยเห็นแล้ว → ข้าม
    if (shownPageKeys.current.has(pageKey)) return;
    if (isPageTourSeen(pageKey)) return;
    const steps = PAGE_TOUR_STEPS[pageKey];
    if (!steps?.length) return;

    shownPageKeys.current.add(pageKey);
    const t = setTimeout(() => {
      setMode('page');
      setActiveSteps(steps);
      setStep(0);
      setTourActive(true);
      setOpen(true);
    }, 900);
    return () => clearTimeout(t);
  }, [location.pathname, open]);

  // ── Full tour — triggered by "สาธิตการใช้งาน" button ──────────────────────
  useEffect(() => {
    const handler = () => {
      originPath.current = location.pathname;
      setMode('full');
      setActiveSteps(TOUR_STEPS);
      setStep(0);
      setTourActive(true);
      setOpen(true);
    };
    window.addEventListener('tryly-open-tour', handler);
    return () => window.removeEventListener('tryly-open-tour', handler);
  }, [location.pathname]);

  // ── Activate mock scenario per step ────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const def = activeSteps[step];
    if (!def) return;
    if (def.mockScenario) {
      activateTourMocks(def.mockScenario);
    } else {
      clearTourMocks();
    }
  }, [open, step, activeSteps]);

  // ── Navigate to step route (full tour only) ─────────────────────────────────
  useEffect(() => {
    if (!open || mode === 'page') return;
    const def = activeSteps[step];
    if (!def?.route) return;
    const current = `${location.pathname}${location.search}`;
    if (current !== def.route) {
      navigate(def.route);
    }
  }, [open, mode, step, activeSteps, location.pathname, location.search, navigate]);

  // ── Measure target element ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const def = activeSteps[step];
    if (!def) return;

    // Page tour: ถ้า route ไม่ตรงกับหน้าปัจจุบัน ไม่แสดง spotlight
    if (mode === 'page') {
      const current = `${location.pathname}${location.search}`;
      const defRoute = def.route ?? '';
      // เปรียบเทียบเฉพาะ pathname ของ def.route (ตัด query string)
      const defPathname = defRoute.split('?')[0];
      if (defPathname && location.pathname !== defPathname) {
        setTargetRect(null);
        return;
      }
    } else {
      // Full tour: รอให้ navigate เสร็จก่อน
      if (def.route) {
        const current = `${location.pathname}${location.search}`;
        if (current !== def.route) {
          setTargetRect(null);
          return;
        }
      }
    }

    let cancelled = false;
    let rafId: ReturnType<typeof requestAnimationFrame> | null = null;
    let innerTimer: ReturnType<typeof setTimeout> | null = null;
    let touchFollowUpTimer: ReturnType<typeof setTimeout> | null = null;
    let vvCleanup: (() => void) | null = null;
    const isTouchDevice =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    const outerTimer = setTimeout(() => {
      if (cancelled) return;
      if (def.preActionSelector) {
        const preEl = document.querySelector<HTMLElement>(def.preActionSelector);
        if (preEl) preEl.click();
      }

      const measure = () => {
        if (cancelled) return;
        const el = findTarget(def);
        if (!el) { setTargetRect(null); return; }
        if (!isTourTargetMostlyVisible(el)) {
          el.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
        }
        if (rafId != null) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cancelled) return;
            setTargetRect(getTourTargetRect(el));
          });
        });
      };

      innerTimer = setTimeout(measure, def.preActionSelector ? 500 : (isTouchDevice ? 450 : 280));
      if (isTouchDevice) {
        touchFollowUpTimer = window.setTimeout(measure, 850);
      }

      const vv = window.visualViewport;
      const onViewportChange = () => measure();
      if (vv) {
        vv.addEventListener('resize', onViewportChange);
        vv.addEventListener('scroll', onViewportChange);
        vvCleanup = () => {
          vv.removeEventListener('resize', onViewportChange);
          vv.removeEventListener('scroll', onViewportChange);
        };
      }
      window.addEventListener('resize', onViewportChange);
      window.addEventListener('scroll', onViewportChange, { passive: true });
      const prevVvCleanup = vvCleanup;
      vvCleanup = () => {
        prevVvCleanup?.();
        window.removeEventListener('resize', onViewportChange);
        window.removeEventListener('scroll', onViewportChange);
      };
    }, isTouchDevice ? 800 : 700);

    return () => {
      cancelled = true;
      clearTimeout(outerTimer);
      if (innerTimer != null) clearTimeout(innerTimer);
      if (touchFollowUpTimer != null) clearTimeout(touchFollowUpTimer);
      if (rafId != null) cancelAnimationFrame(rafId);
      vvCleanup?.();
    };
  }, [open, mode, step, activeSteps, location.pathname, location.search]);

  const isPublicRoute = useCallback((path: string) => {
    if (path === '/' || path === '/factory-ideas' || path === '/factories') return true;
    if (path.startsWith('/factories/')) return true;
    if (path.startsWith('/factory-ideas/')) return true;
    if (path === '/product-detail' || path === '/promotion-detail' || path === '/idea-detail')
      return true;
    return false;
  }, []);

  const purgeTourQueryCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: chatKeys.all });
    queryClient.removeQueries({ queryKey: factoryIdeasKeys.all });
    queryClient.removeQueries({ queryKey: showcaseKeys.all });
    queryClient.removeQueries({ queryKey: rfqKeys.detail('28') });
    queryClient.removeQueries({ queryKey: orderKeys.detail('17') });
    queryClient.removeQueries({ queryKey: ['wallet', 'me'] });
    queryClient.removeQueries({ queryKey: ['orderReviewState', '17'] });
  }, []);

  const closeTo = useCallback(
    (target: string) => {
      // full tour: บันทึก global seen flag
      if (mode === 'full') {
        localStorage.setItem(FULL_TOUR_KEY, '1');
      }
      // page tour: บันทึก per-page seen flag
      if (mode === 'page') {
        const pageKey = getPageKey(location.pathname);
        if (pageKey) markPageTourSeen(pageKey);
      }
      clearTourMocks();
      purgeTourQueryCache();
      setOpen(false);
      setTargetRect(null);

      if (location.pathname !== target) {
        navigate(target, { replace: true });
      }
      window.setTimeout(() => setTourActive(false), 50);
    },
    [mode, location.pathname, navigate, purgeTourQueryCache],
  );

  const handleClose = useCallback(() => {
    if (mode === 'page') {
      // page tour: ปิดแล้วอยู่หน้าเดิม
      const pageKey = getPageKey(location.pathname);
      if (pageKey) markPageTourSeen(pageKey);
      clearTourMocks();
      purgeTourQueryCache();
      setOpen(false);
      setTargetRect(null);
      window.setTimeout(() => setTourActive(false), 50);
      return;
    }
    const target = isPublicRoute(originPath.current) ? originPath.current : '/';
    closeTo(target);
  }, [mode, location.pathname, closeTo, isPublicRoute, purgeTourQueryCache]);

  const handleFinish = useCallback(() => {
    if (mode === 'page') {
      handleClose();
      return;
    }
    closeTo('/');
  }, [mode, closeTo, handleClose]);

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
    setStep((s) => Math.min(s + 1, activeSteps.length - 1));
  }, [activeSteps.length]);

  const handlePrev = useCallback(() => {
    setTargetRect(null);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  if (!open) return null;

  const def = activeSteps[step];
  if (!def) return null;
  const isLast = step === activeSteps.length - 1;

  return (
    <>
      <SpotlightOverlay
        rect={targetRect}
        color={def.badgeColor}
        radius={def.spotlightRadius ?? 12}
        pad={def.spotlightPad ?? 10}
        onClickOutside={handleClose}
      />
      <TourCard
        stepIdx={step}
        def={def}
        total={activeSteps.length}
        rect={targetRect}
        isMock={false}
        onPrev={handlePrev}
        onNext={isLast ? handleFinish : handleNext}
        onClose={handleClose}
      />
    </>
  );
}
