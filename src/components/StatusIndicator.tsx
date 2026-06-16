import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Clock } from 'lucide-react';

interface StatusIndicatorProps {
  isOnline: boolean;
}

export default function StatusIndicator({ isOnline }: StatusIndicatorProps) {
  const [checking, setChecking] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  useEffect(() => {
    setLastChecked(new Date());
  }, [isOnline]);

  useEffect(() => {
    // Show ping effect periodically
    const interval = setInterval(() => {
      setChecking(true);
      const timer = setTimeout(() => {
        setChecking(false);
        setLastChecked(new Date());
      }, 1000);
      return () => clearTimeout(timer);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-md space-y-3" id="printer-status">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            {isOnline ? (
              <>
                <span className="flex h-3.5 w-3.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
              </>
            ) : (
              <span className="flex h-3.5 w-3.5 relative">
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
              </span>
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white font-sans">
                {isOnline ? 'Kiosk #404 Online' : 'Kiosk #404 Offline'}
              </span>
              <span className="text-[10px] bg-zinc-805/70 hover:bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono border border-zinc-800">
                A4 Prints
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              {isOnline ? 'Ready to print instantly' : 'System under maintenance / offline'}
            </p>
          </div>
        </div>

        <div>
          {isOnline ? (
            <Wifi className="w-5 h-5 text-emerald-400" />
          ) : (
            <WifiOff className="w-5 h-5 text-rose-400" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono border-t border-zinc-850 pt-2.5">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span>
            {checking ? 'Pinging Raspberry Pi...' : `Updated: ${lastChecked.toLocaleTimeString()}`}
          </span>
        </div>
      </div>
    </div>
  );
}
