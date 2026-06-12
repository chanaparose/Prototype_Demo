const TOUR_CSS = `
@keyframes tour-card-in {
  from { opacity:0; transform:translateY(12px) scale(0.98); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
@keyframes tour-ring-pulse {
  0%,100% { opacity:0.82; }
  50%      { opacity:1; }
}
@keyframes tour-mock-in {
  from { opacity:0; transform:scale(0.97) translateY(6px); }
  to   { opacity:1; transform:scale(1) translateY(0); }
}
@keyframes tour-btn-glow {
  0%,100% { box-shadow: 0 0 0 0 var(--tour-glow,rgba(162,56,255,0.5)), 0 4px 12px var(--tour-glow-soft,rgba(162,56,255,0.3)); }
  50%      { box-shadow: 0 0 0 9px rgba(0,0,0,0), 0 4px 12px var(--tour-glow-soft,rgba(162,56,255,0.3)); }
}
.tour-ring { animation: tour-ring-pulse 1.6s ease-in-out infinite; }
.tour-mock-frame { animation: tour-mock-in 0.22s ease-out both; }
.tour-btn-glow { animation: tour-btn-glow 2s ease-in-out infinite; }
`;

let cssInjected = false;

export function injectTourCSS() {
  if (cssInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = TOUR_CSS;
  document.head.appendChild(style);
  cssInjected = true;
}
