'use client'
import { useState, useEffect, useMemo } from "react";

export default function ActivityGrid() {
  const [timeframe, setTimeframe] = useState("Weekly");
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component only renders activity data on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getActivityData = () => {
    switch (timeframe) {
      case "Monthly":
        return Array.from({ length: 30 }, (_, i) => Math.floor(Math.random() * 5));
      case "Yearly":
        return Array.from({ length: 52 }, (_, i) => Math.floor(Math.random() * 5));
      default:
        return Array.from({ length: 7 }, (_, i) => Math.floor(Math.random() * 5));
    }
  };

  const getOpacity = (level) => {
    switch (level) {
      case 0:
        return "bg-violet-600/10";
      case 1:
        return "bg-violet-600/20";
      case 2:
        return "bg-violet-600/40";
      case 3:
        return "bg-violet-600/60";
      case 4:
        return "bg-violet-600/80";
      default:
        return "bg-violet-600";
    }
  };

  // Only generate activity data on client side to avoid hydration mismatch
  const activityData = useMemo(() => {
    if (!isMounted) {
      // Return empty array or default values during SSR
      return [];
    }
    return getActivityData();
  }, [timeframe, isMounted]);

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-white">Activity ({timeframe})</p>

        {/* Timeframe Buttons */}
        <div className="flex gap-2">
          {["Weekly", "Monthly", "Yearly"].map((label) => (
            <button
              key={label}
              onClick={() => setTimeframe(label)}
              className={`text-xs px-3 py-1 rounded transition-all ${
                timeframe === label
                  ? "bg-violet-600 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div
        className={`grid gap-1 ${
          timeframe === "Weekly"
            ? "grid-cols-7"
            : timeframe === "Monthly"
            ? "grid-cols-10"
            : "grid-cols-13"
        }`}
      >
        {isMounted && activityData.length > 0 ? (
          activityData.map((level, index) => (
            <div
              key={index}
              className={`aspect-square rounded-sm ${getOpacity(level)} transition-all duration-300`}
            ></div>
          ))
        ) : (
          // Placeholder during SSR/initial render
          Array.from({ 
            length: timeframe === "Weekly" ? 7 : timeframe === "Monthly" ? 30 : 52 
          }).map((_, index) => (
            <div
              key={index}
              className="aspect-square rounded-sm bg-violet-600/10 transition-all duration-300"
            ></div>
          ))
        )}
      </div>
    </div>
  );
}
