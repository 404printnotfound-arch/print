import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Clock } from 'lucide-react';

interface StatusIndicatorProps {
  isOnline: boolean;
  onSimulateStatus: (status: boolean) => void;
}

export default function StatusIndicator({ isOnline, onSimulateStatus }: StatusIndicatorProps) {
  const [checking, setChecking] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  useEffect(() => {
    // Simulate auto-refreshes every 30 seconds
    const interval = setInterval(() => {
      setChecking(true);
      setTimeout(() => {
        setChecking(false);
        setLastChecked(new Date());
      }, 1200);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const triggerManualCheck = () => {
    if (checking) return;
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setLastChecked(new Date());
    }, 1000);
  };

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
        
        {/* Toggle Simulation Mode (Super-helpful for testing the demo) */}
        <button 
          onClick={() => onSimulateStatus(!isOnline)} 
          className="text-xs text-yellow-400/80 hover:text-yellow-400 font-semibold underline underline-offset-2 transition active:scale-95"
          id="toggle-simulator-btn"
        >
          {isOnline ? 'Simulate Offline' : 'Simulate Online'}
        </button>
      </div>
    </div>
  );
}
