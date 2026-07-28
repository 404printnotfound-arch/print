import React from 'react';
import { PrintSettings, PrintItem } from '../types';
import { Layers, Copy, FileText, Sliders, Scissors, Trash2, Plus, FileImage, CheckCircle, Upload } from 'lucide-react';

interface PrintOptionsFormProps {
  files: PrintItem[];
  onUpdateItemSettings: (id: string, settings: Partial<PrintSettings>) => void;
  onRemoveItem: (id: string) => void;
  onTriggerCrop: (id: string) => void;
  onAddMoreFiles: () => void;
  onNext: () => void;
  onBack: () => void;
}

export default function PrintOptionsForm({
  files,
  onUpdateItemSettings,
  onRemoveItem,
  onTriggerCrop,
  onAddMoreFiles,
  onNext,
  onBack,
}: PrintOptionsFormProps) {
  const pricePerSheet = 3; // ₹3 per paper sheet

  // Helper calculation per file
  const getItemDetails = (item: PrintItem) => {
    const isImage = item.type.startsWith('image/');
    const isDuplex = item.settings.sides === 'double';
    const pages = Math.max(1, parseInt(String(item.pages || 1), 10));
    const copies = Math.max(1, parseInt(String(item.settings.copies || 1), 10));
    const sheetsPerCopy = isDuplex ? Math.ceil(pages / 2) : pages;
    const totalSheets = sheetsPerCopy * copies;
    const cost = totalSheets * pricePerSheet;
    return { isImage, isDuplex, pages, copies, sheetsPerCopy, totalSheets, cost };
  };

  // Aggregated totals
  const totalSheetsAll = files.reduce((acc, item) => acc + getItemDetails(item).totalSheets, 0);
  const totalPagesAll = files.reduce((acc, item) => acc + (getItemDetails(item).pages * getItemDetails(item).copies), 0);
  const totalCostAll = files.reduce((acc, item) => acc + getItemDetails(item).cost, 0);

  return (
    <div className="space-y-5" id="options-form">
      
      {/* File List Header */}
      <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-3.5 rounded-2xl">
        <div>
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Uploaded Batch</span>
          <p className="text-sm font-bold text-white font-sans">
            {files.length} {files.length === 1 ? 'File' : 'Files'} ({totalSheetsAll} Paper {totalSheetsAll === 1 ? 'Sheet' : 'Sheets'})
          </p>
        </div>
        <button
          onClick={onAddMoreFiles}
          disabled={files.length >= 10}
          className={`py-2 px-3 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 transition ${
            files.length >= 10
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-750'
              : 'bg-yellow-400 text-black hover:bg-yellow-500 active:scale-95 shadow-md cursor-pointer'
          }`}
          title={files.length >= 10 ? 'Maximum 10 files allowed' : 'Add another PDF or image'}
          id="add-more-files-btn"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add More</span>
        </button>
      </div>

      {/* Individual File Cards List */}
      <div className="space-y-4 max-h-[58vh] overflow-y-auto pr-1">
        {files.map((item, index) => {
          const { isImage, isDuplex, pages, copies, sheetsPerCopy, totalSheets, cost } = getItemDetails(item);
          const previewUrl = item.croppedUrl || item.url;

          return (
            <div 
              key={item.id || index}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-md relative"
            >
              {/* Card top row: File info & Crop/Remove buttons */}
              <div className="flex gap-3 items-start justify-between">
                <div className="flex gap-3 items-center min-w-0 flex-1">
                  {/* Thumbnail / Icon */}
                  <div 
                    className="w-14 h-16 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center shrink-0 relative bg-cover bg-center shadow-inner"
                    style={{ backgroundImage: isImage ? `url(${previewUrl})` : undefined }}
                  >
                    {!isImage && (
                      <FileText className="w-7 h-7 text-yellow-400" />
                    )}
                    {item.isCropped && (
                      <div className="absolute top-0 right-0 bg-yellow-400 text-black text-[8px] font-black px-1 py-0.5 rounded-bl uppercase tracking-tight">
                        ✓
                      </div>
                    )}
                  </div>

                  {/* File Metadata */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate font-sans">{item.name}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-zinc-400 font-sans">
                      <span className="bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300 font-mono">
                        {pages} {pages === 1 ? 'page' : 'pages'}
                      </span>
                      {item.isCropped && (
                        <span className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 px-2 py-0.5 rounded font-bold font-sans flex items-center gap-1 text-[10px]">
                          <CheckCircle className="w-3 h-3" /> Cropped
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: Crop (Images only) & Remove */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isImage && (
                    <button
                      onClick={() => onTriggerCrop(item.id)}
                      className="py-1.5 px-2.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg transition active:scale-95 flex items-center gap-1 text-xs font-bold font-sans shadow-sm"
                      title={item.isCropped ? 'Re-Crop Image' : 'Crop Image'}
                    >
                      <Scissors className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{item.isCropped ? 'Re-Crop' : 'Crop'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1.5 bg-zinc-800 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-750 hover:border-rose-900 rounded-lg transition active:scale-90"
                    title="Remove file from batch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card middle row: Individual Settings (Copies & Sides) */}
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                
                {/* Copies counter */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-400 font-medium font-sans">Copies:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateItemSettings(item.id, { copies: Math.max(1, copies - 1) })}
                      disabled={copies <= 1}
                      className="w-7 h-7 bg-zinc-850 hover:bg-zinc-800 disabled:opacity-40 text-white font-bold rounded-md flex items-center justify-center border border-zinc-750 active:scale-90 transition select-none"
                    >
                      −
                    </button>
                    <span className="font-bold font-mono text-yellow-400 w-5 text-center">{copies}</span>
                    <button
                      onClick={() => onUpdateItemSettings(item.id, { copies: Math.min(10, copies + 1) })}
                      disabled={copies >= 10}
                      className="w-7 h-7 bg-zinc-850 hover:bg-zinc-800 disabled:opacity-40 text-white font-bold rounded-md flex items-center justify-center border border-zinc-750 active:scale-90 transition select-none"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Sides toggle */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-400 font-medium font-sans">Sides:</span>
                  <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg">
                    <button
                      onClick={() => onUpdateItemSettings(item.id, { sides: 'single' })}
                      className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                        !isDuplex ? 'bg-yellow-400 text-black font-bold' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Single
                    </button>
                    <button
                      onClick={() => onUpdateItemSettings(item.id, { sides: 'double' })}
                      className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                        isDuplex ? 'bg-yellow-400 text-black font-bold' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Duplex
                    </button>
                  </div>
                </div>

              </div>

              {/* Card bottom row: Individual sheet calculation & cost */}
              <div className="flex justify-between items-center text-xs pt-0.5 px-1 font-sans">
                <span className="text-zinc-400 font-mono text-[11px]">
                  {totalSheets} {totalSheets === 1 ? 'Sheet' : 'Sheets'} ({sheetsPerCopy} sheet/copy)
                </span>
                <span className="font-bold text-yellow-400 font-mono text-sm">
                  Cost: ₹{cost}
                </span>
              </div>

            </div>
          );
        })}
      </div>

      {/* Total Batch Pricing Summary Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white space-y-3">
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Total Batch Bill</span>
        
        <div className="space-y-2 text-xs font-sans text-zinc-300">
          <div className="flex justify-between">
            <span>Total Files</span>
            <span className="font-mono text-white">{files.length} File{files.length > 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Pages (with copies)</span>
            <span className="font-mono text-white">{totalPagesAll} Pg(s)</span>
          </div>
          <div className="flex justify-between">
            <span>Total Paper Sheets</span>
            <span className="font-mono text-white">{totalSheetsAll} Sheet{totalSheetsAll > 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between">
            <span>Standard Rate</span>
            <span className="font-mono text-white">₹{pricePerSheet} / Sheet</span>
          </div>
          <div className="border-t border-zinc-800 pt-3 flex justify-between items-center text-sm font-semibold">
            <span className="text-white">TOTAL AMOUNT</span>
            <span className="text-yellow-400 font-extrabold font-mono text-xl">
              ₹{totalCostAll}
            </span>
          </div>
        </div>
      </div>

      {/* Final Action Buttons */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 px-4 rounded-xl text-center text-sm font-semibold bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 transition active:scale-98 font-sans"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={files.length === 0}
          className="flex-1 py-3.5 px-4 rounded-xl text-center text-sm font-bold bg-yellow-400 hover:bg-yellow-500 text-zinc-950 transition active:scale-98 shadow-[0_4px_16px_rgba(250,204,21,0.2)] font-sans disabled:opacity-50"
          id="proceed-to-pay-btn"
        >
          Proceed to Pay ₹{totalCostAll}
        </button>
      </div>

    </div>
  );
}

