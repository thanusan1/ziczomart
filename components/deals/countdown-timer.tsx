"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  endAt: string;
  compact?: boolean;
}

function getTimeLeft(endMs: number) {
  const diff = Math.max(0, endMs - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { diff, days, hours, minutes, seconds };
}

export default function CountdownTimer({
  endAt,
  compact = false,
}: CountdownTimerProps) {
  const endMs = new Date(endAt).getTime();
  const [timeLeft, setTimeLeft] = useState<{
    diff: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const update = () => setTimeLeft(getTimeLeft(endMs));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [endMs]);

  if (!timeLeft || timeLeft.diff <= 0) {
    return null;
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-bold text-[#2563EB]">
        <Clock size={11} />
        {timeLeft.days > 0 ? `${timeLeft.days}d ` : ""}
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
      <Clock size={13} className="text-[#DC2626]" />
      <span className="text-slate-500">Ends in:</span>
      <span className="rounded bg-[#0F172A] px-1.5 py-0.5 text-[11px] text-white">
        {timeLeft.days > 0 ? `${timeLeft.days}d ` : ""}
        {pad(timeLeft.hours)}h : {pad(timeLeft.minutes)}m :{" "}
        {pad(timeLeft.seconds)}s
      </span>
    </div>
  );
}
