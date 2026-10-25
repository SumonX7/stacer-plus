import React from "react";

interface ArcGaugeProps {
  title: string;
  value: number; // 0 to 100
  label: string;
  startColor: string;
  endColor: string;
  actionButton?: React.ReactNode;
}

export const ArcGauge: React.FC<ArcGaugeProps> = ({
  title,
  value,
  label,
  startColor,
  endColor,
  actionButton,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  // Stacer uses an arc of ~230 degrees (from -115 to +115 degrees)
  const radius = 68;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  // Arc angle fraction: 230 / 360 = ~0.6388
  const arcLength = circumference * (230 / 360);
  const strokeDashoffset = arcLength - (clampedValue / 100) * arcLength;

  const gradientId = `arc-grad-${title.replace(/\s+/g, "-")}`;

  return (
    <div className="bg-theme-card border border-theme rounded-md p-4 flex flex-col items-center justify-between w-full h-[220px] shadow-sm relative transition-colors duration-200">
      <div className="text-theme-muted font-bold text-xs tracking-wider uppercase mb-1">
        {title}
      </div>

      <div className="relative flex items-center justify-center my-auto">
        <svg width="170" height="120" viewBox="0 0 180 140" className="overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={startColor} />
              <stop offset="100%" stopColor={endColor} />
            </linearGradient>
          </defs>

          {/* Background track arc */}
          <circle
            cx="90"
            cy="80"
            r={radius}
            fill="none"
            stroke="var(--gauge-track)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            transform="rotate(155 90 80)"
            className="transition-colors duration-200"
          />

          {/* Colored progress arc */}
          <circle
            cx="90"
            cy="80"
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(155 90 80)"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center label */}
        <div className="absolute top-[68px] text-center w-full px-2">
          <div className="text-theme-title font-semibold text-sm tracking-tight truncate">
            {label}
          </div>
        </div>
      </div>

      {actionButton ? (
        <div className="mt-1 w-full flex justify-center">{actionButton}</div>
      ) : (
        <div className="h-4" />
      )}
    </div>
  );
};
