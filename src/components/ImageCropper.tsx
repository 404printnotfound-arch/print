import React, { useState, useRef, useEffect } from 'react';
import { Crop, RotateCw, ZoomIn, ZoomOut, Check, Maximize, Minimize } from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedDataUrl: string) => void;
  onUseOriginal?: () => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageUrl, onCropComplete, onUseOriginal, onCancel }: ImageCropperProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<number>(3 / 4); // A4-ish portrait aspect ratio
  
  // Pan states
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Crop scale (how large the crop frame box itself is relative to the screen width)
  const [cropFrameScale, setCropFrameScale] = useState<number>(85); // 85% default

  // Reset zoom & pan when image changes
  useEffect(() => {
    fitWholeImage();
  }, [imageUrl, aspectRatio]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX - offset.x, y: clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setOffset({
      x: clientX - dragStart.current.x,
      y: clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const rotateImage = () => {
    setRotation((prev) => (prev + 90) % 360);
    setOffset({ x: 0, y: 0 });
  };

  // Automatically calculate the Zoom scale to fit the WHOLE image on the paper without clipping!
  const fitWholeImage = () => {
    const img = imageRef.current;
    if (!img) return;

    // Get original image proportions
    const imgRatio = rotation % 180 === 0 
      ? img.naturalWidth / img.naturalHeight 
      : img.naturalHeight / img.naturalWidth;
    
    // Calculate the perfect scaling factor so the entire image fits within the aspect ratio frame
    if (imgRatio > aspectRatio) {
      // Image is wider than crop box standard
      setZoom(aspectRatio / imgRatio);
    } else {
      // Image is taller or perfectly matches
      setZoom(1.0);
    }
    setOffset({ x: 0, y: 0 });
  };

  // Center full-bleed crop fill
  const fillFullPage = () => {
    setZoom(1.15);
    setOffset({ x: 0, y: 0 });
  };

  const handleCrop = () => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // We want output printed size to match typical high resolution quality (e.g. 1200 x 1600 px)
    const targetWidth = 1200;
    const targetHeight = targetWidth / aspectRatio;
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Fill background with white so the whole image is clean on physical paper!
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Save context state
    ctx.save();
    
    // Move to center of canvas to perform operations (rotation, zoom, pan)
    ctx.translate(targetWidth / 2, targetHeight / 2);
    
    // Zoom and rotate
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Contain the original image inside the target printing canvas and let scale (zoom) adjust size
    const imgRatio = img.naturalWidth / img.naturalHeight;
    let drawWidth = targetWidth;
    let drawHeight = targetWidth / imgRatio;

    if (imgRatio > aspectRatio) {
      // Wider than target aspect ratio
      drawWidth = targetWidth;
      drawHeight = targetWidth / imgRatio;
    } else {
      // Taller than target aspect ratio
      drawHeight = targetHeight;
      drawWidth = targetHeight * imgRatio;
    }

    // Apply scaling factor (zoom)
    ctx.scale(zoom, zoom);

    // Apply relative panning translations
    // Based on actual safely displayed container crop width versus canvas scale
    const containerWidth = containerRef.current?.offsetWidth || 300;
    const cropBoxWidth = containerWidth * (cropFrameScale / 100);
    const ratioScaleX = targetWidth / cropBoxWidth;
    ctx.translate(offset.x * ratioScaleX / zoom, offset.y * ratioScaleX / zoom);

    // Draw the image centered
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    // Restore state
    ctx.restore();

    // Get cropped Data URL and invoke callback
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onCropComplete(croppedDataUrl);
  };

  return (
    <div className="flex flex-col h-full select-none" id="crop-container">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Bar instructions */}
      <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <Crop className="w-5 h-5 text-yellow-400" />
          <span className="font-semibold text-sm tracking-tight font-sans">Adjust Crop Frame</span>
        </div>
        <p className="text-xs text-zinc-400 font-mono">Zoom, Drag, or Fit Entirety</p>
      </div>

      {/* Interactive Crop Viewport area */}
      <div 
        ref={containerRef}
        className="relative flex-1 bg-zinc-950 flex items-center justify-center p-4 overflow-hidden min-h-[300px]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        {/* Aspect Ratio Box Window Overlay (Crop target region with corner adjust anchors) */}
        <div 
          className="relative pointer-events-none z-10 border-2 border-yellow-400 shadow-[0_0_0_9999px_rgba(9,9,11,0.85)] rounded-md flex items-center justify-center overflow-hidden"
          style={{
            aspectRatio: aspectRatio,
            width: `${cropFrameScale}%`,
            maxWidth: '345px',
          }}
        >
          {/* Subtle grid lines */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
            <div className="border-r border-b border-yellow-400"></div>
            <div className="border-r border-b border-yellow-400"></div>
            <div className="border-b border-yellow-400"></div>
            <div className="border-r border-b border-yellow-400"></div>
            <div className="border-r border-b border-yellow-400"></div>
            <div className="border-b border-yellow-400"></div>
            <div className="border-r border-yellow-400"></div>
            <div className="border-r border-yellow-400"></div>
            <div></div>
          </div>

          {/* Interactive Visual Corner Handles to make it extremely clear you can adjust/hold corners! */}
          <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-yellow-400"></div>
          <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-yellow-400"></div>
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-yellow-400"></div>
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-yellow-400"></div>

          {/* Prompt banner inside crop frame */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-sans whitespace-nowrap shadow-md">
            Paper Safe Area
          </div>
        </div>

        {/* Mutable image with zoom & translation */}
        <div 
          className="absolute transition-transform duration-75 origin-center ease-out pointer-events-none"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
          }}
        >
          <img 
            ref={imageRef} 
            src={imageUrl} 
            alt="To Crop" 
            className="max-h-[280px] object-contain rounded select-none pointer-events-none"
            onLoad={() => {
              fitWholeImage();
            }}
          />
        </div>
      </div>

      {/* Control Widgets Panel with scroll protection for very raw/short mobile screens */}
      <div className="bg-zinc-900 p-4 border-t border-zinc-800 space-y-4 text-white overflow-y-auto max-h-[46vh] sm:max-h-none">
        
        {/* Helper quick actions: FIT WHOLE IMAGE or FILL PAGE */}
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-400 font-mono uppercase tracking-wider block">Automatic Layout Modes</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={fitWholeImage}
              className="py-2.5 px-3 rounded-xl text-xs font-bold font-sans bg-zinc-800 hover:bg-zinc-750 text-yellow-400 border border-zinc-700/60 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Minimize className="w-3.5 h-3.5" />
              Fit Whole Image on Paper
            </button>
            <button
              onClick={fillFullPage}
              className="py-2.5 px-3 rounded-xl text-xs font-bold font-sans bg-zinc-800 hover:bg-zinc-750 text-white border border-zinc-700/60 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Maximize className="w-3.5 h-3.5" />
              Full Page Bleed (Fill)
            </button>
          </div>
        </div>

        {/* Preset aspect ratios */}
        <div className="space-y-1">
          <label className="text-xs text-zinc-400 font-mono uppercase tracking-wider block">Paper Orientation Preset</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { setAspectRatio(3 / 4); }}
              className={`py-1.5 px-2 rounded text-xs font-semibold font-sans border transition ${
                aspectRatio === 3 / 4 
                  ? 'bg-yellow-400 text-black border-yellow-400 font-bold' 
                  : 'bg-zinc-850 border-zinc-750 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              Portrait A4 (3:4)
            </button>
            <button
              onClick={() => { setAspectRatio(4 / 3); }}
              className={`py-1.5 px-2 rounded text-xs font-semibold font-sans border transition ${
                aspectRatio === 4 / 3 
                  ? 'bg-yellow-400 text-black border-yellow-400 font-bold' 
                  : 'bg-zinc-850 border-zinc-750 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              Landscape A4 (4:3)
            </button>
            <button
              onClick={() => { setAspectRatio(1); }}
              className={`py-1.5 px-2 rounded text-xs font-semibold font-sans border transition ${
                aspectRatio === 1 
                  ? 'bg-yellow-400 text-black border-yellow-400 font-bold' 
                  : 'bg-zinc-850 border-zinc-750 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              Square (1:1)
            </button>
          </div>
        </div>

        {/* Crop Bounding Box Adjuster */}
        <div className="space-y-1.5 bg-zinc-950/45 p-3 rounded-xl border border-zinc-800/80">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400 font-mono uppercase tracking-wider">Adjustment Safe Area Scale</span>
            <span className="text-yellow-400 font-bold font-mono">{cropFrameScale}% Bounding Box</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setCropFrameScale(prev => Math.max(40, prev - 5))}
              className="px-2 py-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-750 text-xs font-bold transition active:scale-95 whitespace-nowrap"
              title="Shrink Crop Bounding Box"
            >
              Nudge Tight [-]
            </button>
            <input 
              type="range" 
              min="40" 
              max="100" 
              step="2" 
              value={cropFrameScale} 
              onChange={(e) => setCropFrameScale(parseInt(e.target.value))}
              className="flex-1 accent-yellow-400 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer text-yellow-400"
            />
            <button
              onClick={() => setCropFrameScale(prev => Math.min(100, prev + 5))}
              className="px-2 py-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-750 text-xs font-bold transition active:scale-95 whitespace-nowrap"
              title="Expand Crop Bounding Box"
            >
              Nudge Wide [+]
            </button>
          </div>
          <p className="text-[10px] text-zinc-400 leading-normal">
            💡 Adjust this scale slider to resize the margins on the printed page, or drag the photo to center it exactly.
          </p>
        </div>

        {/* Zoom & Rotate controls */}
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-2">
            <button
              onClick={() => setZoom(prev => Math.max(0.1, parseFloat((prev - 0.15).toFixed(2))))}
              className="w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-zinc-750 text-yellow-400 rounded-lg border border-zinc-750 text-xs font-bold transition active:scale-90"
              title="Zoom Out"
            >
              −
            </button>
            <input 
              type="range" 
              min="0.1" 
              max="3" 
              step="0.05" 
              value={zoom} 
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-yellow-400 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
            />
            <button
              onClick={() => setZoom(prev => Math.min(3, parseFloat((prev + 0.15).toFixed(2))))}
              className="w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-zinc-750 text-yellow-400 rounded-lg border border-zinc-750 text-xs font-bold transition active:scale-90"
              title="Zoom In"
            >
              +
            </button>
            <span className="text-xs font-mono w-10 text-right text-zinc-300">{Math.round(zoom * 100)}%</span>
          </div>

          <button
            onClick={rotateImage}
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 py-1.5 px-2.5 rounded text-xs font-semibold transition active:scale-95 text-yellow-400 font-sans"
            title="Rotate 90deg"
          >
            <RotateCw className="w-3.5 h-3.5 text-yellow-400 animate-spin-slow" />
            <span>90°</span>
          </button>
        </div>

        {/* Action Button Controls */}
        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex gap-2.5">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 px-2 rounded-xl text-center text-xs font-bold bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 transition active:scale-98 font-sans"
            >
              Cancel
            </button>
            {onUseOriginal && (
              <button
                onClick={onUseOriginal}
                className="flex-1 py-2.5 px-2 rounded-xl text-center text-xs font-bold bg-zinc-800 hover:bg-zinc-750 text-yellow-400 border border-yellow-400/35 transition active:scale-98 font-sans"
              >
                No Crop (Use Original)
              </button>
            )}
          </div>
          <button
            onClick={handleCrop}
            className="w-full py-3 px-4 rounded-xl text-center text-sm font-black bg-yellow-400 hover:bg-yellow-500 text-black transition active:scale-98 flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(250,204,21,0.2)] font-sans"
          >
            <Check className="w-4.5 h-4.5 stroke-[3]" />
            Apply Selection
          </button>
        </div>
      </div>
    </div>
  );
}
