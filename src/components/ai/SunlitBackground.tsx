import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const NOISE_URL = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// A stylized eucalyptus-like branch. Rendered blurred as a wall shadow,
// or sharp in caramel as the real plant peeking into the frame.
const LEAVES = [
  { cx: 114, cy: 288, rx: 30, ry: 11, rotate: -52 },
  { cx: 84, cy: 260, rx: 31, ry: 11, rotate: 50 },
  { cx: 113, cy: 232, rx: 29, ry: 10, rotate: -48 },
  { cx: 85, cy: 206, rx: 27, ry: 10, rotate: 46 },
  { cx: 111, cy: 180, rx: 26, ry: 9, rotate: -46 },
  { cx: 86, cy: 156, rx: 24, ry: 9, rotate: 44 },
  { cx: 110, cy: 132, rx: 22, ry: 8, rotate: -44 },
  { cx: 87, cy: 110, rx: 20, ry: 8, rotate: 42 },
  { cx: 108, cy: 90, rx: 18, ry: 7, rotate: -40 },
  { cx: 89, cy: 72, rx: 16, ry: 6, rotate: 38 },
  { cx: 97, cy: 55, rx: 14, ry: 6, rotate: 10 },
];

function Branch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 320" className={className} aria-hidden="true">
      <path
        d="M100 320 C 98 250, 102 170, 96 40"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {LEAVES.map((leaf, index) => (
        <ellipse
          key={index}
          cx={leaf.cx}
          cy={leaf.cy}
          rx={leaf.rx}
          ry={leaf.ry}
          fill="currentColor"
          transform={`rotate(${leaf.rotate} ${leaf.cx} ${leaf.cy})`}
        />
      ))}
    </svg>
  );
}

/**
 * Sunlit-wall ambience for the AI assistant page: warm ivory wall, a slow
 * drifting sunbeam, and branch shadows swaying as if in a light breeze.
 * Animations are skipped entirely when the user prefers reduced motion.
 */
export function SunlitBackground() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // gsap.matchMedia() requires window.matchMedia, which jsdom (tests) and
    // very old browsers lack; fall back to the static scene without it.
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    const media = gsap.matchMedia();

    media.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          '.sunlit-beam',
          { opacity: 0.5 },
          { opacity: 0.85, duration: 11, ease: 'sine.inOut', yoyo: true, repeat: -1 },
        );
        gsap.fromTo(
          '.sunlit-beam',
          { xPercent: -3 },
          { xPercent: 3, duration: 18, ease: 'sine.inOut', yoyo: true, repeat: -1 },
        );
        gsap.fromTo(
          '.sunlit-shadow-main',
          { rotation: -2.2 },
          {
            rotation: 2.4,
            duration: 9,
            transformOrigin: '50% 100%',
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          },
        );
        gsap.fromTo(
          '.sunlit-shadow-side',
          { rotation: 2 },
          {
            rotation: -2.6,
            duration: 11.5,
            transformOrigin: '50% 100%',
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: 0.8,
          },
        );
        gsap.fromTo(
          '.sunlit-accent',
          { rotation: -1.6 },
          {
            rotation: 1.8,
            duration: 7.5,
            transformOrigin: '50% 100%',
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: 0.4,
          },
        );
      }, rootRef);

      return () => ctx.revert();
    });

    return () => media.revert();
  }, []);

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Warm ivory wall */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F7F2E7] via-[#F3ECDC] to-[#EBDFC8]" />
      {/* Tabletop band along the bottom, echoing the still-life composition */}
      <div className="absolute inset-x-0 bottom-0 h-[12vh] bg-gradient-to-b from-transparent to-[#E2D2B4]/70" />

      {/* Diagonal sunbeam */}
      <div className="sunlit-beam absolute -left-[20%] -top-[30%] h-[160%] w-[85%] rotate-[24deg] bg-gradient-to-r from-[#FFF9EB]/0 via-[#FFFDF5]/80 to-[#FFF9EB]/0 blur-2xl" />

      {/* Branch shadows on the wall */}
      <div className="absolute -left-[4%] bottom-[-6%] h-[78%]">
        <Branch className="sunlit-shadow-main h-full w-auto text-[#6B5740] opacity-[0.16] blur-[6px]" />
      </div>
      <div className="absolute -top-[8%] right-[4%] h-[58%] rotate-180">
        <Branch className="sunlit-shadow-side h-full w-auto text-[#6B5740] opacity-[0.12] blur-[8px]" />
      </div>

      {/* The real golden branch peeking into the frame, top-right */}
      <div className="absolute -right-8 -top-10 h-[36%] rotate-[150deg]">
        <Branch className="sunlit-accent h-full w-auto text-[#B98E5A] opacity-70" />
      </div>

      {/* Paper grain */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: NOISE_URL }} />
    </div>
  );
}
