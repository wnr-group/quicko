import type { SVGProps } from "react";

// Clean line-icon set (Lucide-style), no emoji, no external deps.
type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={20}
      height={20}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconPackage = (p: IconProps) => (
  <Base {...p}>
    <path d="M16.5 9.4 7.5 4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </Base>
);

export const IconPlane = (p: IconProps) => (
  <Base {...p}>
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 4.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
  </Base>
);

export const IconTrain = (p: IconProps) => (
  <Base {...p}>
    <path d="M8 3.1V7a4 4 0 0 0 8 0V3.1" />
    <rect x="4" y="3" width="16" height="16" rx="2" />
    <path d="M4 11h16" />
    <path d="m8 19-2 3" />
    <path d="m18 22-2-3" />
    <circle cx="8" cy="15" r="1" />
    <circle cx="16" cy="15" r="1" />
  </Base>
);

export const IconBus = (p: IconProps) => (
  <Base {...p}>
    <path d="M8 6v6M16 6v6M2 12h20M4 17h16" />
    <rect x="4" y="3" width="16" height="14" rx="2" />
    <circle cx="8" cy="18" r="1.5" />
    <circle cx="16" cy="18" r="1.5" />
  </Base>
);

export const IconCar = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 13 6.5 7.5A2 2 0 0 1 8.4 6h7.2a2 2 0 0 1 1.9 1.5L19 13" />
    <path d="M4 13h16a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" />
    <circle cx="7.5" cy="16" r="1" />
    <circle cx="16.5" cy="16" r="1" />
  </Base>
);

export const IconArrowRight = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
);

export const IconArrowLeft = (p: IconProps) => (
  <Base {...p}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </Base>
);

export const IconChevronRight = (p: IconProps) => (
  <Base {...p}>
    <path d="m9 18 6-6-6-6" />
  </Base>
);

export const IconChevronDown = (p: IconProps) => (
  <Base {...p}>
    <path d="m6 9 6 6 6-6" />
  </Base>
);

export const IconCheck = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Base>
);

export const IconStar = (p: IconProps) => (
  <Base fill="currentColor" stroke="none" {...p}>
    <path d="M12 2.5l2.9 5.9 6.6.9-4.8 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.5 9.8l6.6-.9z" />
  </Base>
);

export const IconShieldCheck = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1 1 0 0 1 1.5 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </Base>
);

export const IconSparkles = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="M12 8l1.2 2.8L16 12l-2.8 1.2L12 16l-1.2-2.8L8 12l2.8-1.2z" />
  </Base>
);

export const IconClock = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Base>
);

export const IconMapPin = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Base>
);

export const IconFlag = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 21V4M4 4h13l-2 4 2 4H4" />
  </Base>
);

export const IconLocate = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </Base>
);

export const IconSearch = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </Base>
);

export const IconX = (p: IconProps) => (
  <Base {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Base>
);

export const IconPlus = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconMinus = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 12h14" />
  </Base>
);

export const IconEdit = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
  </Base>
);

export const IconHome = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </Base>
);

export const IconActivity = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 12h4l3 8 4-16 3 8h4" />
  </Base>
);

export const IconUser = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
  </Base>
);

export const IconChat = (p: IconProps) => (
  <Base {...p}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
  </Base>
);

export const IconBell = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Base>
);

export const IconWeight = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="5" r="2" />
    <path d="M8.5 7h7l2.5 12a1 1 0 0 1-1 1.2H7a1 1 0 0 1-1-1.2z" />
  </Base>
);

export const IconLogout = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </Base>
);

export const TRANSPORT_ICONS: Record<string, (p: IconProps) => React.ReactElement> = {
  flight: IconPlane,
  train: IconTrain,
  bus: IconBus,
  car: IconCar,
};

/**
 * Solid transport glyphs for small chips. The outline set is stroked at 1.75 on a
 * 24 viewBox, so at chip size the stroke falls under one device pixel and a train,
 * plane and bus blur into the same smudge. Filled shapes hold their silhouette.
 * Windows and wheels are knocked out with evenodd rather than drawn.
 */
function SolidBase({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      width={16}
      height={16}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconPlaneSolid = (p: IconProps) => (
  <SolidBase {...p}>
    <path d="M13.5 2.2a1.5 1.5 0 0 0-3 0V9L2 14.2v2.3l8.5-2.7v4.4l-2.3 1.7v1.6l3.8-1.1 3.8 1.1v-1.6l-2.3-1.7v-4.4l8.5 2.7v-2.3L13.5 9V2.2z" />
  </SolidBase>
);

export const IconTrainSolid = (p: IconProps) => (
  <SolidBase {...p}>
    <path d="M6 2h12a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-1l1.8 2.4a1 1 0 1 1-1.6 1.2L14.5 17h-5l-2.7 3.6a1 1 0 0 1-1.6-1.2L7 17H6a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zm1 3a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h4V5H7zm6 0v5h4a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-4zM7.5 12.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
  </SolidBase>
);

export const IconBusSolid = (p: IconProps) => (
  <SolidBase {...p}>
    <path d="M5 2h14a3 3 0 0 1 3 3v10a3 3 0 0 1-2 2.83V20a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2.17A3 3 0 0 1 2 15V5a3 3 0 0 1 3-3zm1 3a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H6zm.5 8a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
  </SolidBase>
);

export const IconCarSolid = (p: IconProps) => (
  <SolidBase {...p}>
    <path d="M6.3 5.2A2 2 0 0 1 8.2 4h7.6a2 2 0 0 1 1.9 1.2L19.4 9h.6a2 2 0 0 1 2 2v5a2 2 0 0 1-1 1.73V19a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-1.27A2 2 0 0 1 2 16v-5a2 2 0 0 1 2-2h.6l1.7-3.8zM8.6 6 7.3 9h9.4l-1.3-3H8.6zM6 12.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm12 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
  </SolidBase>
);

/** Filled set — use in chips and other small contexts. */
export const TRANSPORT_ICONS_SOLID: Record<string, (p: IconProps) => React.ReactElement> = {
  flight: IconPlaneSolid,
  train: IconTrainSolid,
  bus: IconBusSolid,
  car: IconCarSolid,
};
