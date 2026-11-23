import { useId } from "react";

const paths = {
  check: "M20 6 9 17l-5-5",
  plus: "M12 5v14M5 12h14",
  x: "M18 6 6 18M6 6l12 12",
  trash: "M4 7h16M9 7V4.5h6V7M18 7l-.8 12.2a1 1 0 0 1-1 .8H7.8a1 1 0 0 1-1-.8L6 7M10 11v5M14 11v5",
  reset: "M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5M3.5 3.5v5h5",
  sun: "M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  moon: "M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.6 6.6 0 0 0 9.7 9.7Z",
  download: "M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14",
  upload: "M12 20V9M7.5 13.5 12 9l4.5 4.5M5 4h14",
  chevron: "m6 9 6 6 6-6",
} as const;

export type IconName = keyof typeof paths;

export const Icon = ({ name, size = 18 }: { name: IconName; size?: number }) => (
  <svg
    className="icon"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={paths[name]} />
  </svg>
);

/** The brand mark: a three-quarter progress arc around a check. Same drawing as public/favicon.svg. */
export const Logomark = ({ size = 32 }: { size?: number }) => {
  const gradientId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="logomark">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6366F1" />
          <stop offset="1" stopColor="#9333EA" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <circle cx="16" cy="16" r="9" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="2.6" />
      <path
        d="M16 7a9 9 0 1 1-9 9"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="m12.4 16.2 2.5 2.5 4.8-5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
