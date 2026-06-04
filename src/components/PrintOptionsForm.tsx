import React from 'react';
import { PrintSettings, FileDetails } from '../types';
import { Layers, Copy, FileText, Sliders, Scissors } from 'lucide-react';

interface PrintOptionsFormProps {
  settings: PrintSettings;
  file: FileDetails;
  onUpdateSettings: (settings: Partial<PrintSettings>) => void;
  onTriggerCrop: () => void;
  onNext: () => void;
  onBack: () => void;
}

export default function PrintOptionsForm({
  settings,
  file,
  onUpdateSettings,
  onTriggerCrop,
  onNext,
  onBack,
}: PrintOptionsFormProps) {
  const isImage = file.type.startsWith('image/');
  const pricePerPage = 3; // ₹3 each page print as requested!
  const totalCost = file.pages * settings.copies * pricePerPage;

  return (
    <div className="space-y-6" id="options-form">
      {/* File Preview Thumbnail */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex gap-4 items-center">
        <div className="w-20 h-24 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center shrink-0 relative bg-cover bg-center shadow-inner"
             style={{ backgroundImage: file.croppedUrl ? `url(${file.croppedUrl})` : `url(${file.url})` }}>
          {!file.croppedUrl && !isImage && (
            <FileText className="w-8 h-8 text-yellow-400" />
          )}
          {file.croppedUrl && (
            <span className="absolute bottom-1 right-1 bg-yellow-400 text-black text-[9px] font-bold px-1 rounded uppercase tracking-wider font-mono">
              Cropped
            </span>
          )}
        </div>
        <div className="space-y-1 overflow-hidden flex-1">
          <p className="text-sm font-semibold text-white truncate font-sans">{file.name}</p>
          <p className="text-xs text-zinc-400 font-mono">Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
          <div className="flex gap-2 text-[11px] text-zinc-300 font-sans font-medium">
            <span className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">
              {file.pages} page{file.pages > 1 ? 's' : ''}
            </span>
            <span className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">
              ₹3 / print
            </span>
          </div>
        </div>

        {isImage && (
          <button
            onClick={onTriggerCrop}
            className="flex flex-col items-center gap-1.5 p-2 bg-yellow-400 text-black rounded-xl hover:bg-yellow-500 transition active:scale-95 shadow-md shrink-0"
            id="crop-trigger-btn"
          >
            <Scissors className="w-4 h-4 stroke-[2.5]" />
            <span className="text-[10px] font-bold font-sans">Crop</span>
          </button>
        )}
      </div>

      {/* Adjust Custom Print settings */}
      <div className="space-y-5 bg-white border border-zinc-150 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
          <Sliders className="w-4 h-4 text-zinc-900" />
          <h3 className="font-semibold text-zinc-900 text-sm font-sans tracking-tight">Print Properties</h3>
        </div>

        {/* Option 1: Number of Copies */}
        <div className="flex justify-between items-center py-2 border-b border-zinc-50" id="setting-copies">
          <div className="space-y-0.5">
            <span className="text-sm font-semibold text-zinc-800 font-sans">Print Copies</span>
            <p className="text-xs text-zinc-400 font-sans">Quantity required for collection</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onUpdateSettings({ copies: Math.max(1, settings.copies - 1) })}
              className="w-9 h-9 border border-zinc-200 rounded-lg flex items-center justify-center font-bold text-zinc-700 hover:bg-zinc-100 transition active:scale-90 text-lg select-none"
              disabled={settings.copies <= 1}
            >
              −
            </button>
            <span className="text-base font-bold font-mono text-zinc-900 w-6 text-center">{settings.copies}</span>
            <button
              onClick={() => onUpdateSettings({ copies: Math.min(20, settings.copies + 1) })}
              className="w-9 h-9 border border-zinc-200 rounded-lg flex items-center justify-center font-bold text-zinc-700 hover:bg-zinc-100 transition active:scale-90 text-lg select-none"
              disabled={settings.copies >= 20}
            >
              +
            </button>
          </div>
        </div>

        {/* Option 2: Orientation Toggle */}
        <div className="space-y-2 border-b border-zinc-50 pb-4" id="setting-orientation">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-800 font-sans">Orientation</span>
            <span className="text-xs text-zinc-400 capitalize font-mono">{settings.orientation} Mode</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onUpdateSettings({ orientation: 'portrait' })}
              className={`py-2 px-3 rounded-xl text-xs font-semibold font-sans border-2 transition ${
                settings.orientation === 'portrait'
                  ? 'border-zinc-900 bg-zinc-90 w-full text-zinc-900'
                  : 'border-zinc-100 bg-zinc-50 text-zinc-500 hover:bg-zinc-100'
              }`}
            >
              Portrait
            </button>
            <button
              onClick={() => onUpdateSettings({ orientation: 'landscape' })}
              className={`py-2 px-3 rounded-xl text-xs font-semibold font-sans border-2 transition ${
                settings.orientation === 'landscape'
                  ? 'border-zinc-900 bg-zinc-90 w-full text-zinc-900'
                  : 'border-zinc-100 bg-zinc-50 text-zinc-500 hover:bg-zinc-100'
              }`}
            >
              Landscape
            </button>
          </div>
        </div>

        {/* Option 3: Double vs Single Sided */}
        <div className="space-y-2 border-b border-zinc-50 pb-4" id="setting-sides">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-800 font-sans">Print Sides</span>
            <span className="text-xs text-zinc-400 capitalize font-mono">
              {settings.sides === 'single' ? 'Single Sided' : 'Double Sided (Duplex)'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onUpdateSettings({ sides: 'single' })}
              className={`py-2 px-3 rounded-xl text-xs font-semibold font-sans border-2 transition ${
                settings.sides === 'single'
                  ? 'border-zinc-900 bg-zinc-90 text-zinc-900'
                  : 'border-zinc-100 bg-zinc-50 text-zinc-500 hover:bg-zinc-100'
              }`}
            >
              Single-Sided
            </button>
            <button
              onClick={() => onUpdateSettings({ sides: 'double' })}
              className={`py-2 px-3 rounded-xl text-xs font-semibold font-sans border-2 transition ${
                settings.sides === 'double'
                  ? 'border-zinc-900 bg-zinc-90 text-zinc-900'
                  : 'border-zinc-100 bg-zinc-50 text-zinc-500 hover:bg-zinc-100'
              }`}
            >
              Double-Sided Accord
            </button>
          </div>
        </div>

      </div>

      {/* Bill Break up Summary Cards */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white space-y-3">
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Price Breakdown</span>
        <div className="space-y-2 text-xs font-sans text-zinc-300">
          <div className="flex justify-between">
            <span>Pages auto-detected</span>
            <span className="font-mono text-white">{file.pages} Page{file.pages > 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between">
            <span>Quantity Copies</span>
            <span className="font-mono text-white">x{settings.copies}</span>
          </div>
          <div className="flex justify-between">
            <span>Unit print rate (Standard)</span>
            <span className="font-mono text-white">₹{pricePerPage} each</span>
          </div>
          <div className="border-t border-zinc-800 pt-3 flex justify-between items-center text-sm font-semibold">
            <span className="text-white">Amount Total</span>
            <span className="text-yellow-400 font-bold font-mono text-lg">
              ₹{totalCost}
            </span>
          </div>
        </div>
      </div>

      {/* Final step buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 px-4 rounded-xl text-center text-sm font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition active:scale-98 font-sans"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-3.5 px-4 rounded-xl text-center text-sm font-bold bg-yellow-400 hover:bg-yellow-500 text-zinc-950 transition active:scale-98 shadow-[0_4px_16px_rgba(250,204,21,0.2)] font-sans"
        >
          Confirm Settings
        </button>
      </div>
    </div>
  );
}
