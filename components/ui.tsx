"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

// =============================================================================
// Card
// =============================================================================

export function Card({
  children,
  className,
  hover = false,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "bg-flourish-card rounded-flourish-lg p-6 shadow-flourish",
        hover && "transition-shadow duration-200 hover:shadow-flourish-hover",
        className
      )}
    >
      {children}
    </div>
  );
}

// =============================================================================
// PillToggle
// =============================================================================

export function PillToggle({
  options,
  value,
  onChange,
  size = "sm",
}: {
  options: (string | { value: string; label: string })[];
  value: string;
  onChange: (v: string) => void;
  size?: "sm" | "md";
}) {
  const normalized = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  return (
    <div className="inline-flex items-center gap-0 rounded-full bg-flourish-bg p-0.5">
      {normalized.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full font-medium transition-all duration-200",
            size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
            value === opt.value
              ? "bg-flourish-text text-white shadow-sm"
              : "text-flourish-secondary hover:text-flourish-text"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// SectionHeader
// =============================================================================

export function SectionHeader({
  title,
  children,
  trailing,
  onTrailingClick,
}: {
  title?: string;
  children?: React.ReactNode;
  trailing?: string;
  onTrailingClick?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium uppercase tracking-wider text-flourish-tertiary">
        {title ?? children}
      </span>
      {trailing && (
        <button
          onClick={onTrailingClick}
          className="text-xs font-medium text-flourish-orange hover:underline"
        >
          {trailing}
        </button>
      )}
    </div>
  );
}

// =============================================================================
// ProgressBar
// =============================================================================

export function ProgressBar({
  progress,
  color = "var(--flourish-green)",
  height = 4,
  className,
}: {
  progress: number;
  color?: string;
  height?: number;
  className?: string;
}) {
  const clamped = Math.min(progress, 1);
  const isOver = progress > 1;

  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-flourish-bg", className)}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${clamped * 100}%`,
          backgroundColor: isOver ? "var(--flourish-red)" : color,
        }}
      />
    </div>
  );
}

// =============================================================================
// Sparkline (SVG)
// =============================================================================

export function Sparkline({
  data,
  width = 80,
  height = 28,
  color = "#E5633A",
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const linePath = `M${points.join(" L")}`;
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={areaPath} fill={color} opacity={0.12} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} opacity={0.6} />
    </svg>
  );
}

// =============================================================================
// Dropdown
// =============================================================================

export function Dropdown({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: (string | { value: string; label: string })[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const displayLabel = normalizedOptions.find((o) => o.value === value)?.label ?? value;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flourish-bg px-3 py-1.5 text-sm text-flourish-text transition-colors hover:bg-flourish-tertiary/10"
      >
        {label && <span className="text-xs text-flourish-secondary">{label}</span>}
        <span className="font-medium">{displayLabel}</span>
        <svg className="h-3 w-3 text-flourish-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-flourish bg-white py-1 shadow-flourish-hover">
            {normalizedOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-flourish-bg",
                  value === opt.value && "font-medium text-flourish-orange"
                )}
              >
                {value === opt.value && (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span className={value !== opt.value ? "pl-5" : ""}>{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// EmptyState
// =============================================================================

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="text-flourish-tertiary">{icon}</div>
      <p className="text-lg font-semibold text-flourish-text">{title}</p>
      <p className="text-sm text-flourish-secondary">{subtitle}</p>
    </div>
  );
}

// =============================================================================
// Badge
// =============================================================================

// =============================================================================
// Skeleton
// =============================================================================

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-flourish-bg rounded-lg", className)} />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-full" />
      </div>
    </Card>
  );
}

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning";
  className?: string;
}) {
  const colors = {
    default: "bg-flourish-bg text-flourish-secondary",
    success: "bg-emerald-50 text-flourish-green",
    danger: "bg-red-50 text-flourish-red",
    warning: "bg-amber-50 text-amber-700",
  };

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", colors[variant], className)}>
      {children}
    </span>
  );
}
