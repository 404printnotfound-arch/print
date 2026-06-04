import React, { useState, useEffect, useRef } from 'react';
import { Step, PrintSettings, FileDetails, OrderDetails } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, 
  Upload, 
  Settings, 
  CreditCard, 
  Loader2, 
  FileText, 
  Phone, 
  User, 
  CheckCircle, 
  Check, 
  X, 
  XCircle, 
  Play, 
  RotateCcw, 
  ChevronRight, 
  Sparkles, 
  AlertTriangle, 
  Smartphone, 
  FileImage, 
  Receipt, 
  Download,
  Info,
  Scissors
} from 'lucide-react';
import StatusIndicator from './components/StatusIndicator';
import PrintOptionsForm from './components/PrintOptionsForm';
import ImageCropper from './components/ImageCropper';
import Confetti from './components/Confetti';

export default function App() {
  // Navigation & User session states
  const [currentStep, setCurrentStep] = useState<Step>(Step.LANDING);
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('p404_userName') || '');
  const [userPhone, setUserPhone] = useState<string>(() => localStorage.getItem('p404_userPhone') || '');
  const [formError, setFormError] = useState<string>('');
  
  // Machine status state
  const [isMachineOnline, setIsMachineOnline] = useState<boolean>(true);

  // File management states
  const [selectedFile, setSelectedFile] = useState<FileDetails | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  // Cropper helper
  const [showCropModal, setShowCropModal] = useState<boolean>(false);

  // Print properties customization
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    copies: 1,
    orientation: 'portrait',
    sides: 'single',
    paperFinish: 'matte',
    fitMode: 'fit',
    scale: 100,
  });

  // Active Order state
  const [activeOrder, setActiveOrder] = useState<OrderDetails | null>(null);

  // Payment states
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'card' | 'wallet'>('upi');
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
  
  // Printing simulation state
  const [printProgress, setPrintProgress] = useState<number>(0);
  const [currentPrintLog, setCurrentPrintLog] = useState<string>('');
  const [printErrorCode, setPrintErrorCode] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pricing variable based on ₹3 each print
  const pricePerPage = 3;

  // Calculate dynamic pricing
  const calculateTotalCost = () => {
    if (!selectedFile) return 0;
    return selectedFile.pages * printSettings.copies * pricePerPage;
  };

  // Pre-load customer details or settings on first boot
  useEffect(() => {
    if (userName) localStorage.setItem('p404_userName', userName);
  }, [userName]);

  useEffect(() => {
    if (userPhone) localStorage.setItem('p404_userPhone', userPhone);
  }, [userPhone]);

  // Handle file input selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  // Common file processor
  const processSelectedFile = (file: File) => {
    // Validate size and extension
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert("File is too large. Maximum size allowed is 50MB.");
      return;
    }

    const type = file.type;
    const name = file.name;
    const url = URL.createObjectURL(file);
    
    // Guess page count (simplified simulator: if PDF, randomize 2-8 pages for awesome test fidelity, else 1)
    let guessedPages = 1;
    if (name.endsWith('.pdf')) {
      guessedPages = Math.floor(Math.random() * 5) + 2; // Simulated auto page count for PDFs!
    }

    // Initialize state
    setSelectedFile({
      name,
      size: file.size,
      type,
      url,
      pages: guessedPages
    });

    // Start animated high-fidelity upload simulation
    setIsUploading(true);
    setUploadProgress(0);
  };

  // Run the simulated progress bar
  useEffect(() => {
    if (isUploading) {
      const timer = setInterval(() => {
        setUploadProgress((old) => {
          if (old >= 100) {
            clearInterval(timer);
            setIsUploading(false);
            return 100;
          }
          const diff = Math.random() * 25 + 10;
          return Math.min(old + diff, 100);
        });
      }, 250);
      return () => clearInterval(timer);
    }
  }, [isUploading]);

  // Validate landing form
  const handleStartPrinting = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!userName.trim() || userName.trim().length < 2) {
      setFormError('Please enter a valid name (min 2 characters).');
      return;
    }

    // Phone regex for 10 digit Indian phones or general standard
    const phoneDigits = userPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Save details and proceed to Upload stage
    localStorage.setItem('p404_userName', userName.trim());
    localStorage.setItem('p404_userPhone', phoneDigits);
    setCurrentStep(Step.UPLOAD);
  };

  // Handle drag event helpers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Generate unique order details
  const handleConfirmSettings = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '404-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const orderId = 'ord_' + Math.random().toString(36).substring(2, 11);
    const newOrder: OrderDetails = {
      id: orderId,
      code,
      userName,
      userPhone,
      file: selectedFile,
      settings: printSettings,
      amount: calculateTotalCost(),
      paymentStatus: 'pending',
      printStatus: 'waiting',
      createdAt: new Date().toLocaleTimeString(),
    };

    setActiveOrder(newOrder);
    setCurrentStep(Step.PAYMENT);
  };

  // Simulated Payment processing
  const handleInitiatePayment = () => {
    if (!activeOrder) return;
    setPaymentProcessing(true);

    // High fidelity payment screen delay
    setTimeout(() => {
      setPaymentProcessing(false);
      setActiveOrder(prev => prev ? {
        ...prev,
        paymentStatus: 'success',
        printStatus: 'printing'
      } : null);

      setCurrentStep(Step.STATUS);
      // Trigger live physical printout simulator immediately!
      startPrintSimulation();
    }, 2200);
  };

  // Physical automated print loop simulator
  const startPrintSimulation = () => {
    setPrintProgress(0);
    setCurrentPrintLog('Connecting to HP Print Engine via cloud router...');
    
    const logs = [
      'Establishing TLS handshake with Kiosk #404 firmware...',
      'Verified Razorpay secure escrow receipt ID: RF910248.',
      'Siphoning high-fidelity print payload to spool buffer...',
      'Rasterizing layout to A4 format with white bleed margin boundaries...',
      'Waking thermo-fusing units & laser scanning arrays...',
      'Feeding premium photo-grade raw paper stack...',
      'A4 Sheet passed toner roller 1. Injecting precision ink arrays...',
      'Running double-sided duplex flipper apparatus...',
      'Fusing monochrome pigment at 185°C. Ejecting page into slot below...',
      'Print cycle complete. Validating status sensors...'
    ];

    let logCounter = 0;
    const logInterval = setInterval(() => {
      if (logCounter < logs.length) {
        setCurrentPrintLog(logs[logCounter]);
        setPrintProgress(Math.round(((logCounter + 1) / logs.length) * 100));
        logCounter++;
      } else {
        clearInterval(logInterval);
        
        // Randomly simulate an occasional fail if the printer mock offline logic is activated, else 100% success!
        const willSucceed = isMachineOnline; // Follow online/offline simulation status
        
        setActiveOrder(prev => prev ? {
          ...prev,
          printStatus: willSucceed ? 'success' : 'failed'
        } : null);

        if (!willSucceed) {
          setPrintErrorCode('ERR_PAPER_JAM_404');
        }
      }
    }, 2200); // 2.2 seconds between printing steps for beautiful realistic cadence
  };

  // Reset print and navigate home
  const handleRestartAnother = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setShowCropModal(false);
    setActiveOrder(null);
    setCurrentStep(Step.LANDING);
    setPrintProgress(0);
  };

  // Trigger browser simulation print receipt
  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-start p-0 sm:py-6 sm:px-4 selection:bg-yellow-400 selection:text-black">
      
      {/* Maximum Mobile layout width 430px centered constraint requested. */}
      <div className="w-full max-w-[430px] bg-zinc-950 sm:bg-zinc-900 border-0 sm:border border-zinc-800 rounded-none sm:rounded-3xl shadow-2xl relative flex flex-col overflow-hidden min-h-screen sm:min-h-[840px]" id="app-window-shell">
        
        {/* Dynamic global header representing PRINT 404 */}
        <header className="p-4 bg-zinc-900/90 border-b border-zinc-800 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-yellow-400 text-black p-1.5 rounded-lg font-black tracking-tighter text-xs flex items-center gap-1 shadow-sm">
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span className="font-mono">404</span>
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white font-sans flex items-center gap-1.5">
                PRINT 404
                <span className="text-[10px] text-yellow-400 font-mono bg-yellow-400/10 px-1 rounded uppercase tracking-wider">
                  Kiosk
                </span>
              </h1>
              <p className="text-[11px] text-zinc-400 font-sans tracking-wide">Print Smarter. Grab & Go.</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-bold text-yellow-400 font-mono">₹{pricePerPage} / Print</div>
            <div className="text-[10px] text-zinc-400 font-sans">A4 Monochrome Only</div>
          </div>
        </header>

        {/* Global Progress Steps breadcrumb for Step 1 - 3 */}
        {currentStep !== Step.LANDING && currentStep !== Step.STATUS && (
          <div className="bg-zinc-900/50 border-b border-zinc-900 px-4 py-3 flex items-center justify-between text-xs" id="progress-steps-menu">
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                currentStep === Step.UPLOAD ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-zinc-400'
              }`}>1</span>
              <span className={`font-sans font-medium ${currentStep === Step.UPLOAD ? 'text-white' : 'text-zinc-500'}`}>Upload</span>
            </div>
            
            <ChevronRight className="w-4 h-4 text-zinc-700" />

            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                currentStep === Step.OPTIONS ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-zinc-400'
              }`}>2</span>
              <span className={`font-sans font-medium ${currentStep === Step.OPTIONS ? 'text-white' : 'text-zinc-500'}`}>Crop & Options</span>
            </div>

            <ChevronRight className="w-4 h-4 text-zinc-700" />

            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                currentStep === Step.PAYMENT ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-zinc-400'
              }`}>3</span>
              <span className={`font-sans font-medium ${currentStep === Step.PAYMENT ? 'text-white' : 'text-zinc-500'}`}>Payment</span>
            </div>
          </div>
        )}

        {/* Primary Screen Area with elegant animations */}
        <main className="flex-1 p-4 relative flex flex-col justify-between">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: LANDING */}
            {currentStep === Step.LANDING && (
              <motion.div
                key="landing-step"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-6 flex flex-col justify-between h-full"
                id="view-landing"
              >
                <div className="space-y-5">
                  {/* Status Indicator */}
                  <StatusIndicator 
                    isOnline={isMachineOnline} 
                    onSimulateStatus={(status) => setIsMachineOnline(status)} 
                  />

                  {/* High Fidelity Banner Visual */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-md">
                    <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 opacity-10">
                      <Printer className="w-44 h-44 text-yellow-400" />
                    </div>
                    
                    <div className="inline-flex items-center gap-1 bg-yellow-400/10 text-yellow-400 text-[10px] py-1 px-2.5 rounded-full border border-yellow-400/20 font-bold font-sans uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      Instant Print Machine ATM
                    </div>
                    
                    <h2 className="text-xl font-bold font-sans tracking-tight leading-tight">
                      Scan, Upload & Print <span className="text-yellow-400">in 45 seconds</span>
                    </h2>
                    
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      No computer required! Simply configure crop selections, checkout via any UPI app, and physical high-resolution page prints emerge from the slot instantly.
                    </p>
                  </div>

                  {/* Single Paper Prices */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-900 border border-zinc-850 p-3.5 rounded-xl text-center space-y-1">
                      <span className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider block">Monochrome</span>
                      <p className="text-lg font-bold text-white font-sans">₹3.00 / pg</p>
                      <span className="text-[10px] text-zinc-400 block font-sans">High Contrast Pigment</span>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-850 p-3.5 rounded-xl text-center space-y-1">
                      <span className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider block">Paper Stock</span>
                      <p className="text-lg font-bold text-white font-sans">Standard A4</p>
                      <span className="text-[10px] text-zinc-400 block font-sans">Perfect Kiosk Printouts</span>
                    </div>
                  </div>

                  {/* Form to submit client profile */}
                  <form onSubmit={handleStartPrinting} className="space-y-4 pt-1">
                    <h3 className="text-xs font-semibold uppercase font-mono text-zinc-500 tracking-wider">Customer Information</h3>
                    
                    <div className="space-y-3.5">
                      {/* Name input */}
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                          <User className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          required
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="What is your name?"
                          maxLength={35}
                          className="w-full bg-zinc-900 hover:bg-zinc-850/85 focus:bg-zinc-900 focus:ring-2 focus:ring-yellow-400/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 font-sans font-medium outline-none transition"
                        />
                      </div>

                      {/* Phone input */}
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                          <Phone className="w-4 h-4" />
                        </span>
                        <input
                          type="tel"
                          required
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          placeholder="Your 10-digit Phone Number"
                          maxLength={12}
                          className="w-full bg-zinc-900 hover:bg-zinc-850/85 focus:bg-zinc-900 focus:ring-2 focus:ring-yellow-400/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 font-sans font-medium outline-none transition"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-mono">
                          +91 PREFIX
                        </span>
                      </div>
                    </div>

                    {formError && (
                      <div className="text-xs text-rose-450 flex items-center gap-1.5 bg-rose-950/20 border border-rose-900/30 p-2.5 rounded-lg">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                        <span className="font-sans font-semibold tracking-tight">{formError}</span>
                      </div>
                    )}

                    {/* How it works info rail */}
                    <div className="bg-zinc-900/40 p-4 border border-zinc-900 rounded-2xl flex items-start gap-3">
                      <Info className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-zinc-300 font-sans">Wait, how is print collected?</h4>
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                          Once payment clears, the machine automatically processes and drops physical sheets in the collection dispenser beneath the touchscreen.
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!isMachineOnline}
                      className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition font-sans ${
                        isMachineOnline
                          ? 'bg-yellow-400 text-black hover:bg-yellow-500 shadow-[0_4px_16px_rgba(250,204,21,0.2)] active:scale-98 cursor-pointer'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/55'
                      }`}
                      id="landing-submit-btn"
                    >
                      <span>Start Document Setup</span>
                      <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </form>
                </div>

                <div className="pt-4 text-center">
                  <p className="text-[10px] text-zinc-650 font-mono">
                    PRINT 404 KIOSK GATEWAY • DEMO VERSION 1.0.4
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 2: UPLOAD */}
            {currentStep === Step.UPLOAD && (
              <motion.div
                key="upload-step"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22 }}
                className="space-y-6 flex flex-col justify-between h-full"
                id="view-upload"
              >
                <div className="space-y-6">
                  {/* Step header */}
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-400 text-[10px] py-1 px-2.5 rounded-full border border-zinc-750 font-mono">
                      Step 1 of 3
                    </div>
                    <h2 className="text-xl font-black font-sans tracking-tight">Upload Your Document</h2>
                    <p className="text-xs text-zinc-400 font-sans">We support high resolution images (JPG/PNG) & PDF files up to 50MB.</p>
                  </div>

                  {/* Hidden browser input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                    className="hidden"
                    id="file-input-raw"
                  />

                  {/* Drop/Click zone */}
                  {!selectedFile ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 cursor-pointer transition py-12 ${
                        isDragging
                          ? 'border-yellow-400 bg-yellow-400/5 shadow-inner'
                          : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50'
                      }`}
                      id="upload-drag-zone"
                    >
                      <div className="w-14 h-14 bg-zinc-850 border border-zinc-800 rounded-2xl flex items-center justify-center text-yellow-400 shadow-md">
                        <Upload className="w-6 h-6 animate-pulse" />
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white font-sans">Tap to browse files</p>
                        <p className="text-xs text-zinc-400 font-sans">or drag and drop here</p>
                      </div>

                      <div className="flex gap-2 text-[10px] text-zinc-500 font-mono bg-zinc-950 px-3 py-1.5 rounded-full">
                        <span>PDF</span>
                        <span>•</span>
                        <span>PNG</span>
                        <span>•</span>
                        <span>JPG</span>
                        <span>•</span>
                        <span>JPEG</span>
                      </div>
                    </div>
                  ) : (
                    /* Selected File Details & Progress Area */
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-5" id="selected-upload-file">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center text-yellow-400">
                            {selectedFile.type.startsWith('image/') ? (
                              <FileImage className="w-6 h-6" />
                            ) : (
                              <FileText className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white max-w-[200px] truncate font-sans">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-zinc-400 font-mono">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>

                        {/* Remove selected file button */}
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="p-1 px-2.5 bg-zinc-800/80 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition text-xs font-semibold"
                          title="Remove file"
                          id="remove-file-btn"
                        >
                          Change
                        </button>
                      </div>

                      {/* Display page count selector / info indicator */}
                      <div className="bg-zinc-950 p-3.5 border border-zinc-850 rounded-xl flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-zinc-300 block font-sans">Pages Count</span>
                          <p className="text-[10px] text-zinc-550 font-sans">
                            {selectedFile.type.endsWith('pdf') 
                              ? 'Automatically detected PDF pages' 
                              : 'Single print layout for images'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedFile(prev => prev ? { ...prev, pages: Math.max(1, prev.pages - 1) } : null)}
                            className="w-7 h-7 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 font-bold rounded text-white flex items-center justify-center text-xs active:scale-90"
                            disabled={selectedFile.pages <= 1}
                          >
                            −
                          </button>
                          <span className="text-sm font-bold font-mono text-yellow-400 w-5 text-center">
                            {selectedFile.pages}
                          </span>
                          <button
                            onClick={() => setSelectedFile(prev => prev ? { ...prev, pages: Math.min(250, prev.pages + 1) } : null)}
                            className="w-7 h-7 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 font-bold rounded text-white flex items-center justify-center text-xs active:scale-90"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Progress bar info */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-zinc-400">
                            {isUploading ? 'Transferring file securely...' : 'Upload verification complete!'}
                          </span>
                          <span className={`${isUploading ? 'text-yellow-400' : 'text-emerald-400'} font-bold`}>
                            {Math.round(uploadProgress)}%
                          </span>
                        </div>
                        <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ease-out ${
                              isUploading ? 'bg-yellow-400' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Choice option specifically for images */}
                  {selectedFile && !isUploading && selectedFile.type.startsWith('image/') && (
                    <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-2xl space-y-3" id="image-upload-options-pitch">
                      <div className="flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-yellow-400 font-bold" />
                        <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Photo Preparation Mode</span>
                      </div>
                      <p className="text-xs text-zinc-350 font-sans leading-relaxed">
                        Do you want to adjust margins & crop the image fit first, or proceed directly to configuring paper dimensions and options with the original photo?
                      </p>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          onClick={() => setShowCropModal(true)}
                          className="py-2.5 px-3 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-yellow-400 border border-yellow-400/35 text-[11px] font-bold font-sans flex items-center justify-center gap-1.5 transition active:scale-95"
                          id="upload-crop-trigger-btn"
                        >
                          Crop & Align Photo
                        </button>
                        <button
                          onClick={() => {
                            setCurrentStep(Step.OPTIONS);
                          }}
                          className="py-2.5 px-3 rounded-xl bg-yellow-400 text-zinc-950 font-bold hover:bg-yellow-500 text-[11px] font-sans flex items-center justify-center gap-1 transition active:scale-95"
                          id="upload-proceed-nocrop-btn"
                        >
                          Keep Original & Next
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Pricing transparency list */}
                  <div className="bg-zinc-900/30 p-4 border border-zinc-900 rounded-2xl flex gap-3 items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
                    <p className="text-xs text-zinc-400 tracking-wide font-sans">
                      All calculations are locked server-side to guarantee standard pricing (₹3 per print page).
                    </p>
                  </div>
                </div>

                {/* Confirm step navigation buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setCurrentStep(Step.LANDING)}
                    className="flex-1 py-3.5 px-4 rounded-xl text-center text-sm font-semibold bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 transition active:scale-98 font-sans"
                  >
                    Back
                  </button>
                  <button
                    disabled={!selectedFile || isUploading}
                    onClick={() => {
                      // Move to the next page and allow manual crop if desired, instead of forcing auto-crop!
                      setCurrentStep(Step.OPTIONS);
                    }}
                    className={`flex-1 py-3.5 px-4 rounded-xl text-center text-sm font-bold transition flex items-center justify-center gap-1 font-sans ${
                      selectedFile && !isUploading
                        ? 'bg-yellow-400 text-black hover:bg-yellow-500 shadow-[0_4px_16px_rgba(250,204,21,0.2)] active:scale-98'
                        : 'bg-zinc-800 text-zinc-600 border border-zinc-700/55 cursor-not-allowed'
                    }`}
                    id="upload-next-btn"
                  >
                    <span>Configure Sizing</span>
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: OPTIONS */}
            {currentStep === Step.OPTIONS && selectedFile && (
              <motion.div
                key="options-step"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22 }}
                className="space-y-6 flex flex-col justify-between h-full"
                id="view-options"
              >
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-400 text-[10px] py-1 px-2.5 rounded-full border border-zinc-750 font-mono">
                      Step 2 of 3
                    </div>
                    <h2 className="text-xl font-black font-sans tracking-tight">Sizing & Print Settings</h2>
                    <p className="text-xs text-zinc-400 font-sans">Configure your print size layout, properties, and image cropping.</p>
                  </div>

                  <PrintOptionsForm
                    settings={printSettings}
                    file={selectedFile}
                    onUpdateSettings={(newSet) => setPrintSettings((old) => ({ ...old, ...newSet }))}
                    onTriggerCrop={() => setShowCropModal(true)}
                    onNext={handleConfirmSettings}
                    onBack={() => setCurrentStep(Step.UPLOAD)}
                  />
                </div>

                {/* IMAGE CROP MODAL INTERFACE */}
                <AnimatePresence>
                  {showCropModal && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/92 z-50 flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4"
                      id="crop-modal-overlay"
                    >
                      <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="w-full max-w-[430px] bg-zinc-900 sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl relative max-h-[95vh] sm:max-h-[90vh]"
                      >
                        <ImageCropper
                          imageUrl={selectedFile.url}
                          onCropComplete={(croppedData) => {
                            setSelectedFile((prev) => prev ? { ...prev, croppedUrl: croppedData } : null);
                            setShowCropModal(false);
                          }}
                          onUseOriginal={() => {
                            setSelectedFile((prev) => prev ? { ...prev, croppedUrl: undefined } : null);
                            setShowCropModal(false);
                          }}
                          onCancel={() => setShowCropModal(false)}
                        />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* STEP 4: PAYMENT */}
            {currentStep === Step.PAYMENT && activeOrder && (
              <motion.div
                key="payment-step"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22 }}
                className="space-y-5 flex flex-col justify-between h-full"
                id="view-payment"
              >
                <div className="space-y-5">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-400 text-[10px] py-1 px-2.5 rounded-full border border-zinc-750 font-mono">
                      Step 3 of 3
                    </div>
                    <h2 className="text-xl font-black font-sans tracking-tight">Unified UPI Payment</h2>
                    <p className="text-xs text-zinc-400 font-sans">Payment verification occurs server-side in real-time.</p>
                  </div>

                  {/* Bill Outline Receipt */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-lg text-white" id="billing-summary-card">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">UPI Order Reference</span>
                        <p className="text-sm font-bold font-mono text-yellow-400">{activeOrder.code}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">Date</span>
                        <p className="text-xs font-mono text-zinc-300">{activeOrder.createdAt}</p>
                      </div>
                    </div>

                    <div className="space-y-3.5 text-xs text-zinc-300 font-sans border-b border-zinc-800 pb-4">
                      <div className="flex justify-between">
                        <span>Customer Profile</span>
                        <span className="text-white font-medium">{activeOrder.userName} ({activeOrder.userPhone})</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Configured File</span>
                        <span className="text-white font-medium truncate max-w-[200px]">{activeOrder.file?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Print Pages Info</span>
                        <span className="text-white font-medium font-mono">{activeOrder.file?.pages} Pg(s)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Copies Multiplier</span>
                        <span className="text-white font-medium font-mono">x {activeOrder.settings.copies} Copy(s)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Paper Spec</span>
                        <span className="text-white font-medium capitalize font-mono">Premium A4 Sheet</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1" id="total_payment_row">
                      <div className="space-y-0.5">
                        <span className="text-xs text-zinc-400 font-sans">Total Bill amount (INR)</span>
                        <p className="text-[10px] text-zinc-500 font-sans">Inclusive of CGST/SGST at 0%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black font-mono text-yellow-400">₹{activeOrder.amount}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Choices */}
                  <div className="space-y-3 pt-1">
                    <span className="text-xs font-semibold uppercase font-mono text-zinc-550 tracking-wider">Gateway option</span>
                    
                    <div className="bg-yellow-400/5 border-2 border-yellow-400 p-4 rounded-2xl text-left transition" id="payment-gateways">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-yellow-400" />
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold font-sans block text-white">Unified UPI QR / App Checkout</span>
                          <span className="text-[10px] text-zinc-400">1-click fast transaction or direct scan</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* simulated instant checkout */}
                  <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-850 space-y-3.5 text-center" id="upi-options-drawer">
                    <p className="text-xs text-zinc-300 font-sans">Simulating Secure UPI QR Code handshake...</p>
                    
                    <div className="bg-white p-3 inline-block rounded-xl mx-auto shadow-md">
                      {/* Beautiful generated retro print-qr */}
                      <div className="w-28 h-28 bg-zinc-100 flex flex-col justify-center items-center border border-zinc-200 relative">
                        <div className="absolute inset-2 grid grid-cols-5 grid-rows-5 gap-1.5 p-1">
                          <div className="bg-black"></div>
                          <div className="bg-black"></div>
                          <div></div>
                          <div className="bg-black"></div>
                          <div className="bg-black"></div>
                          <div className="bg-black"></div>
                          <div></div>
                          <div className="bg-black"></div>
                          <div></div>
                          <div className="bg-black"></div>
                          <div></div>
                          <div className="bg-black"></div>
                          <div></div>
                          <div className="bg-black"></div>
                          <div></div>
                          <div className="bg-black"></div>
                          <div></div>
                          <div className="bg-black"></div>
                          <div></div>
                          <div className="bg-black"></div>
                          <div className="bg-black"></div>
                          <div className="bg-black"></div>
                          <div></div>
                          <div className="bg-black"></div>
                          <div className="bg-black"></div>
                        </div>
                        {/* Mini logo inside */}
                        <div className="w-6 h-6 bg-yellow-400 text-black font-black font-mono text-[9px] rounded-sm flex items-center justify-center z-10 border border-white">
                          404
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">
                      Scan with GPay, PhonePe, Paytm, or BHIM
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5 pt-4">
                  {/* Lock secured indicator */}
                  <p className="text-center text-[10px] text-zinc-500 font-sans flex items-center justify-center gap-1">
                    🔒 Secured by Razorpay Escrow. Absolute 256-bit financial encryption.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setCurrentStep(Step.OPTIONS)}
                      className="flex-1 py-3.5 px-4 rounded-xl text-center text-sm font-semibold bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 transition active:scale-98 font-sans"
                    >
                      Back
                    </button>
                    <button
                      disabled={paymentProcessing}
                      onClick={handleInitiatePayment}
                      className="flex-1 py-3.5 px-4 rounded-xl text-center text-sm font-black bg-yellow-400 hover:bg-yellow-500 text-zinc-950 transition active:scale-98 shadow-[0_4px_16px_rgba(250,204,21,0.25)] flex items-center justify-center gap-2 font-sans"
                      id="payment-execute-btn"
                    >
                      {paymentProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                          <span>Authorizing ₹{activeOrder.amount}...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>Pay & Print ₹{activeOrder.amount}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: STATUS */}
            {currentStep === Step.STATUS && activeOrder && (
              <motion.div
                key="status-step"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="space-y-6 flex flex-col justify-between h-full"
                id="view-status"
              >
                {/* STATE A: ACTIVE PRINTING SIMULATION */}
                {activeOrder.printStatus === 'printing' && (
                  <div className="space-y-6 py-6" id="status-printing-box">
                    <div className="text-center space-y-3 relative">
                      {/* Pulse active print layout */}
                      <div className="relative mx-auto w-24 h-24 bg-gradient-to-br from-yellow-400 to-amber-500 text-zinc-950 rounded-3xl flex items-center justify-center shadow-lg animate-bounce">
                        <Printer className="w-10 h-10 stroke-[2.25] text-zinc-950" />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
                        </span>
                      </div>

                      <div className="space-y-1 pt-1.5">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">ORDER IN PROCESS</span>
                        <h2 className="text-xl font-extrabold font-sans text-white">Spooling physical Sheets...</h2>
                        <p className="text-xs text-zinc-400 font-sans max-w-[280px] mx-auto">
                          Please stay beside the machine slot. Your file is passing Kiosk HP rollers.
                        </p>
                      </div>
                    </div>

                    {/* Progress Percentage Display */}
                    <div className="space-y-2 bg-zinc-900 border border-zinc-850 p-4 rounded-2xl">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-500">Kiosk Inkjet Status</span>
                        <span className="text-yellow-400 font-extrabold">{printProgress}% Spooled</span>
                      </div>
                      
                      <div className="h-3 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-350 to-yellow-400 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${printProgress}%` }}
                        />
                      </div>

                      {/* Log monitor terminal ticker style */}
                      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-left font-mono mt-1 min-h-[48px] flex items-center">
                        <p className="text-[10px] text-yellow-400 leading-tight">
                          <span className="text-zinc-650 font-bold mr-1.5">&gt;</span>
                          {currentPrintLog}
                        </p>
                      </div>
                    </div>

                    {/* Safety Note */}
                    <div className="bg-zinc-900/30 p-4 border border-zinc-900 rounded-2xl flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-zinc-300 font-sans italic">Important Warning</h4>
                        <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                          Do not minimize this window or scan another QR code until the progress bar reaches 100%. Doing so might disrupt the print stack telemetry.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STATE B: PRINT SUCCESS DONE */}
                {activeOrder.printStatus === 'success' && (
                  <div className="space-y-6" id="status-success-box">
                    <Confetti />

                    <div className="text-center space-y-3 pt-4">
                      <div className="mx-auto w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <CheckCircle className="w-10 h-10 stroke-[2.25]" />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase tracking-widest block">PRINT COMPLETED ✅</span>
                        <h2 className="text-xl font-extrabold text-white font-sans">Collect From Slot below</h2>
                        <p className="text-xs text-zinc-400 font-sans max-w-[280px] mx-auto">
                          Take your physical print sheets. Check paper tray to ensure nothing remains.
                        </p>
                      </div>
                    </div>

                    {/* Digital Receipt Card details print-friendly */}
                    <div className="bg-white text-black p-5 rounded-3xl space-y-4 shadow-xl border border-zinc-150 relative overflow-hidden" id="print-recipient-receipt">
                      <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 opacity-5">
                        <Receipt className="w-40 h-40 text-black" />
                      </div>

                      <div className="text-center border-b-2 border-dashed border-zinc-200 pb-3.5 space-y-1">
                        <h3 className="font-mono font-black text-lg tracking-wider text-black">RECEIPT - PRINT 404</h3>
                        <p className="text-[9px] text-zinc-500 font-mono">KIOSK LOCATED AT COLLEGE WING 3</p>
                        <p className="text-[10px] text-zinc-800 font-mono tracking-tight">Order ID: #{activeOrder.code}</p>
                      </div>

                      <div className="space-y-2.5 font-sans text-xs text-zinc-800">
                        <div className="flex justify-between">
                          <span className="font-medium text-zinc-500">Customer</span>
                          <span className="font-bold text-black">{activeOrder.userName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-zinc-500">Mobile ID</span>
                          <span className="font-semibold text-black">{activeOrder.userPhone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-zinc-500">Filename</span>
                          <span className="font-semibold text-black truncate max-w-[180px]">{activeOrder.file?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-zinc-500">Pages Auto Count</span>
                          <span className="font-bold text-black font-mono">{activeOrder.file?.pages} Pg(s)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-zinc-500">Quantity Copied</span>
                          <span className="font-bold text-black font-mono">x {activeOrder.settings.copies} Copy(s)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-zinc-500">Paper Size Spec</span>
                          <span className="font-semibold text-black capitalize font-mono">Standard A4 Sheet</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold border-t border-zinc-200 pt-3 text-black">
                          <span>Total Cash Paid</span>
                          <span className="font-mono text-zinc-950 text-sm">₹{activeOrder.amount}.00</span>
                        </div>
                      </div>

                      <div className="text-center pt-2.5">
                        <p className="text-[9px] text-zinc-500 font-mono block">THANK YOU FOR USING PRINT 404</p>
                        <p className="text-[9px] text-zinc-400 font-mono italic block">File purged automatically within 10 minutes</p>
                      </div>
                    </div>

                    {/* Receipt helper operations */}
                    <div className="grid grid-cols-2 gap-3" id="success-receivers">
                      <button
                        onClick={printReceipt}
                        className="py-2.5 px-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white transition text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 hover:bg-zinc-900"
                        id="download-receipt-btn"
                      >
                        <Download className="w-4 h-4 shrink-0" />
                        <span>Save Receipt</span>
                      </button>

                      <button
                        onClick={handleRestartAnother}
                        className="py-2.5 px-3 rounded-xl bg-yellow-400 text-black hover:bg-yellow-500 transition text-xs font-bold flex items-center justify-center gap-1 active:scale-95 shadow-md font-sans"
                        id="start-another-btn"
                      >
                        <RotateCcw className="w-4 h-4 shrink-0" />
                        <span>Print Another</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STATE C: PRINT FAILED & JAM ERRORS */}
                {activeOrder.printStatus === 'failed' && (
                  <div className="space-y-6" id="status-failed-box">
                    <div className="text-center space-y-3 pt-4">
                      <div className="mx-auto w-16 h-16 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-rose-500/20">
                        <XCircle className="w-10 h-10 stroke-[2.25]" />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-rose-450 font-extrabold uppercase tracking-widest block">HARDWARE ERROR ❌</span>
                        <h2 className="text-xl font-extrabold text-white font-sans">Print Execution Stopped</h2>
                        <p className="text-xs text-zinc-400 font-sans max-w-[285px] mx-auto">
                          We detected a hardware jam in Kiosk #404 tray feeder. Your money has not been debited.
                        </p>
                      </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-850 p-5 rounded-2xl space-y-3" id="error-diagnostics">
                      <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">Diagnostics Log</span>
                      <div className="space-y-2 text-xs font-mono text-zinc-300">
                        <div className="flex justify-between">
                          <span>Error Code</span>
                          <span className="text-rose-400 font-bold">{printErrorCode || 'ERR_IO_TIMEOUT'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Session ID</span>
                          <span className="text-white truncate max-w-[160px]">{activeOrder.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transaction Secure Key</span>
                          <span className="text-white">{activeOrder.code}</span>
                        </div>
                        <div className="border-t border-zinc-800 pt-2 text-[11px] text-zinc-400 leading-relaxed">
                          Your file is safe. Please show this diagnostic error screen to the front desk technician to print this file manually or receive an instant cash refund.
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleRestartAnother}
                      className="w-full py-3.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-sm transition active:scale-98 flex items-center justify-center gap-1 shadow-md font-sans"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Return To Home screen</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* Global branding footer for the center mobile container */}
        <footer className="p-3 bg-zinc-900 text-center border-t border-zinc-850 text-zinc-500 text-[10px] font-sans">
          <span>PRINT 404 Kiosk ATM Network Ltd. All Rights Protected.</span>
        </footer>

      </div>
    </div>
  );
}
