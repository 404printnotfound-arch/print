import React, { useState, useEffect, useRef } from 'react';
import { Step, PrintSettings, FileDetails, OrderDetails, PrintItem } from './types';
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
  Scissors,
  Clock
} from 'lucide-react';
import StatusIndicator from './components/StatusIndicator';
import PrintOptionsForm from './components/PrintOptionsForm';
import ImageCropper from './components/ImageCropper';
import Confetti from './components/Confetti';

// ==========================================
// CONFIGURATION CONSTANTS
// ==========================================
const PI_URL = "https://crouton-liquid-undivided.ngrok-free.dev";
const RAZORPAY_KEY = "rzp_live_THf6VO8qlp0Qnp";
// ==========================================

// Ensure process.env is defined for the browser and maps seamlessly to Vite environment
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}
if (!(window as any).process.env) {
  (window as any).process.env = {};
}
(window as any).process.env.NEXT_PUBLIC_PI_SERVER_URL = PI_URL;
(window as any).process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = RAZORPAY_KEY;

// Helper to convert DataURL to Blob
const dataURLtoBlob = (dataurl: string) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export default function App() {
  // Navigation & User session states
  const [currentStep, setCurrentStep] = useState<Step>(Step.LANDING);
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('p404_userName') || '');
  const [userPhone, setUserPhone] = useState<string>(() => localStorage.getItem('p404_userPhone') || '');
  const [formError, setFormError] = useState<string>('');
  
  // Machine status state
  const [isMachineOnline, setIsMachineOnline] = useState<boolean>(true);

  // File management states
  const [printFiles, setPrintFiles] = useState<PrintItem[]>([]);
  const [activeCropFileId, setActiveCropFileId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  // Cropper helper
  const [showCropModal, setShowCropModal] = useState<boolean>(false);

  // Default print properties fallback
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
  const [paymentStatusText, setPaymentStatusText] = useState<string>('');

  // 2-Minute Payment Timeout & Receipt Timer States
  const [paymentTimerSeconds, setPaymentTimerSeconds] = useState<number>(120);
  const [isTimerExpired, setIsTimerExpired] = useState<boolean>(false);
  const [timeoutNotice, setTimeoutNotice] = useState<string | null>(null);
  const [receiptTimerSeconds, setReceiptTimerSeconds] = useState<number>(15);

  const userWentToUPI = useRef<boolean>(false);
  const paymentStartTime = useRef<number>(0);
  const rzpInstanceRef = useRef<any>(null);
  const currentJobIdRef = useRef<string | null>(null);
  
  // Printing simulation state
  const [printProgress, setPrintProgress] = useState<number>(0);
  const [currentPrintLog, setCurrentPrintLog] = useState<string>('');
  const [printErrorCode, setPrintErrorCode] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pricing variable based on ₹3 per physical paper sheet
  const pricePerSheet = 3;

  // Calculate dynamic batch pricing based on physical paper sheets
  const calculateTotalCost = () => {
    return printFiles.reduce((sum, item) => {
      const isDuplex = item.settings.sides === 'double';
      const pages = Math.max(1, parseInt(String(item.pages || 1), 10));
      const copies = Math.max(1, parseInt(String(item.settings.copies || 1), 10));
      const totalPagesToPrint = pages * copies;
      const totalSheets = isDuplex ? Math.ceil(totalPagesToPrint / 2) : totalPagesToPrint;
      return sum + (totalSheets * pricePerSheet);
    }, 0);
  };

  const calculateTotalSheets = () => {
    return printFiles.reduce((sum, item) => {
      const isDuplex = item.settings.sides === 'double';
      const pages = Math.max(1, parseInt(String(item.pages || 1), 10));
      const copies = Math.max(1, parseInt(String(item.settings.copies || 1), 10));
      const totalPagesToPrint = pages * copies;
      const totalSheets = isDuplex ? Math.ceil(totalPagesToPrint / 2) : totalPagesToPrint;
      return sum + totalSheets;
    }, 0);
  };


  // Load official Razorpay checkout script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Real-time Health Check to Raspberry Pi every 15 seconds
  useEffect(() => {
    if (!PI_URL) {
      setIsMachineOnline(true);
      return;
    }

    const checkHealth = async () => {
      try {
        const response = await fetch(`${PI_URL}/api/health`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        if (response.ok) {
          setIsMachineOnline(true);
        } else {
          setIsMachineOnline(false);
        }
      } catch (err) {
        setIsMachineOnline(false);
      }
    };

    // Run health check initially
    checkHealth();

    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Pre-load customer details or settings on first boot
  useEffect(() => {
    if (userName) localStorage.setItem('p404_userName', userName);
  }, [userName]);

  useEffect(() => {
    if (userPhone) localStorage.setItem('p404_userPhone', userPhone);
  }, [userPhone]);

  // Prevent background scroll when the Crop modal overlay is active
  useEffect(() => {
    if (showCropModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [showCropModal]);

  // Handle file input selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFiles(e.target.files);
    }
  };

  // Helper to count PDF pages client-side using native binary stream parsing
  const countPdfPages = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const arr = new Uint8Array(reader.result as ArrayBuffer);
          let text = '';
          const chunkSize = 65536;
          for (let i = 0; i < arr.length; i += chunkSize) {
            const chunk = arr.subarray(i, i + chunkSize);
            text += String.fromCharCode.apply(null, chunk as any);
          }
          
          if (!text.includes('%PDF')) {
            resolve(1);
            return;
          }
          
          const pageTypeRegex = /\/Type\s*\/Page\b/g;
          const pageTypeMatches = text.match(pageTypeRegex);
          const countByPageType = pageTypeMatches ? pageTypeMatches.length : 0;
          
          const countRegex = /\/Count\s+(\d+)/g;
          let m;
          let maxCount = 0;
          while ((m = countRegex.exec(text)) !== null) {
            const val = parseInt(m[1], 10);
            if (val > maxCount && val < 50000) {
              maxCount = val;
            }
          }
          
          let count = 1;
          if (maxCount > 0) {
            count = maxCount;
          } else if (countByPageType > 0) {
            count = countByPageType;
          }
          
          resolve(count > 0 ? count : 1);
        } catch (err) {
          resolve(1);
        }
      };
      reader.onerror = () => {
        resolve(1);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // Multi-file batch processor
  const processSelectedFiles = async (filesInput: FileList | File[]) => {
    const filesArray = Array.from(filesInput);
    if (filesArray.length === 0) return;

    if (printFiles.length + filesArray.length > 10) {
      alert("Maximum 10 files allowed at once.");
      return;
    }

    const maxSingleSize = 50 * 1024 * 1024; // 50MB
    // Filter out duplicates based on filename and size
    const existingKeys = new Set(printFiles.map((f) => `${f.name}_${f.size}`));
    const validFiles: File[] = [];

    for (const f of filesArray) {
      const key = `${f.name}_${f.size}`;
      if (existingKeys.has(key)) {
        continue; // Skip duplicate file
      }
      existingKeys.add(key);

      const ext = f.name.toLowerCase();
      const isPdf = ext.endsWith('.pdf') || f.type === 'application/pdf';
      const isImg = f.type.startsWith('image/') || ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png');

      if (!isPdf && !isImg) {
        alert(`File "${f.name}" is not a supported PDF, JPG, or PNG document.`);
        return;
      }

      if (f.size > maxSingleSize) {
        alert(`File "${f.name}" exceeds the 50MB single file size limit.`);
        return;
      }

      validFiles.push(f);
    }

    const currentBytes = printFiles.reduce((acc, item) => acc + item.size, 0);
    const newBytes = validFiles.reduce((acc, f) => acc + f.size, 0);
    if (currentBytes + newBytes > 100 * 1024 * 1024) {
      alert("Total batch file size exceeds the 100MB limit.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);

    const newPrintItems: PrintItem[] = [];
    for (const file of validFiles) {
      let actualPages = 1;
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        actualPages = await countPdfPages(file);
      }

      const item: PrintItem = {
        id: 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        file,
        name: file.name,
        size: file.size,
        type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        url: URL.createObjectURL(file),
        pages: actualPages,
        settings: {
          copies: 1,
          orientation: 'portrait',
          sides: 'single',
          paperFinish: 'matte',
          fitMode: 'fit',
          scale: 100,
        }
      };
      newPrintItems.push(item);
    }

    setPrintFiles((prev) => {
      const updated = [...prev, ...newPrintItems];
      console.log('Files count:', updated.length);
      console.log('Files:', updated.map((f) => f.name));
      return updated;
    });
    setIsUploading(false);

    if (currentStep === Step.UPLOAD) {
      setCurrentStep(Step.OPTIONS);
    }
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

  // Update settings for an individual file in the batch
  const handleUpdateItemSettings = (id: string, newSettings: Partial<PrintSettings>) => {
    setPrintFiles((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, settings: { ...item.settings, ...newSettings } } : item
      )
    );
  };

  // Remove a file from the batch
  const handleRemoveItem = (id: string) => {
    setPrintFiles((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      if (filtered.length === 0 && currentStep === Step.OPTIONS) {
        setCurrentStep(Step.UPLOAD);
      }
      return filtered;
    });
  };

  // Trigger crop modal for a specific image file
  const handleTriggerCrop = (id: string) => {
    setActiveCropFileId(id);
    setShowCropModal(true);
  };

  // Crop completion callback
  const handleCropComplete = (croppedDataUrl: string) => {
    if (!activeCropFileId) return;
    try {
      const croppedBlob = dataURLtoBlob(croppedDataUrl);
      setPrintFiles((prev) =>
        prev.map((f) =>
          f.id === activeCropFileId
            ? { ...f, croppedUrl: croppedDataUrl, croppedBlob: croppedBlob, isCropped: true }
            : f
        )
      );
    } catch (err) {
      console.error("Failed to convert cropped data url to blob", err);
      setPrintFiles((prev) =>
        prev.map((f) =>
          f.id === activeCropFileId
            ? { ...f, croppedUrl: croppedDataUrl, isCropped: true }
            : f
        )
      );
    }
    setShowCropModal(false);
    setActiveCropFileId(null);
  };

  // Use original uncropped image callback
  const handleUseOriginalImage = () => {
    if (!activeCropFileId) return;
    setPrintFiles((prev) =>
      prev.map((f) =>
        f.id === activeCropFileId
          ? { ...f, croppedUrl: undefined, croppedBlob: undefined, isCropped: false }
          : f
      )
    );
    setShowCropModal(false);
    setActiveCropFileId(null);
  };

  // Validate landing form
  const handleStartPrinting = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!userName.trim() || userName.trim().length < 2) {
      setFormError('Please enter a valid name (min 2 characters).');
      return;
    }

    const phoneDigits = userPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(e.dataTransfer.files);
    }
  };

  // Generate unique order details for batch
  const handleConfirmSettings = () => {
    if (printFiles.length === 0) {
      alert("Please upload at least one document to proceed.");
      return;
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '404-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const orderId = 'ord_' + Math.random().toString(36).substring(2, 11);
    const totalAmount = calculateTotalCost();

    const mainItem = printFiles[0];
    const newOrder: OrderDetails = {
      id: orderId,
      code,
      userName,
      userPhone,
      files: printFiles,
      file: mainItem ? {
        name: mainItem.name,
        size: mainItem.size,
        type: mainItem.type,
        url: mainItem.url,
        croppedUrl: mainItem.croppedUrl,
        pages: mainItem.pages
      } : null,
      settings: mainItem?.settings || printSettings,
      amount: totalAmount,
      paymentStatus: 'pending',
      printStatus: 'waiting',
      createdAt: new Date().toLocaleTimeString(),
    };

    setActiveOrder(newOrder);
    setCurrentStep(Step.PAYMENT);
  };

  const checkPaymentStatus = async (jobId: string) => {
    setPaymentProcessing(false);
    setPaymentStatusText('');
    try {
      const res = await fetch(`${PI_URL}/api/job-status/${jobId}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'paid' || data.status === 'printing' || data.status === 'completed' || data.paymentStatus === 'success' || data.paid) {
          setActiveOrder((prev) => prev ? {
            ...prev,
            paymentStatus: 'success',
            printStatus: 'success',
            id: jobId,
            code: jobId,
          } : null);
          setCurrentStep(Step.STATUS);
        }
      }
    } catch (err) {
      console.error("Error checking payment status on modal dismiss:", err);
    }
  };

  // Helper to format time display
  const formatTimerDisplay = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Helper for countdown visual styles (Green -> Yellow -> Red -> Flash -> Expired)
  const getTimerUI = (seconds: number) => {
    if (seconds <= 0) {
      return {
        bgClass: 'bg-red-950/80 border-red-800 text-red-400',
        badgeClass: 'bg-red-500 text-white',
        statusText: 'Session ended',
        iconColor: 'text-red-400',
        isFlashing: false,
      };
    }
    if (seconds <= 10) {
      return {
        bgClass: 'bg-red-950/60 border-red-750 text-red-400',
        badgeClass: 'bg-red-500/30 text-red-300 border border-red-500/50',
        statusText: 'Payment expiring!',
        iconColor: 'text-red-400',
        isFlashing: seconds <= 5,
      };
    }
    if (seconds <= 30) {
      return {
        bgClass: 'bg-yellow-950/50 border-yellow-750 text-yellow-400',
        badgeClass: 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50',
        statusText: 'Hurry up!',
        iconColor: 'text-yellow-400',
        isFlashing: false,
      };
    }
    return {
      bgClass: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
      statusText: 'Normal',
      iconColor: 'text-emerald-400',
      isFlashing: false,
    };
  };

  // Web Audio chime for success
  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const playNote = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      playNote(523.25, 0, 0.18);
      playNote(659.25, 0.15, 0.18);
      playNote(783.99, 0.3, 0.35);
    } catch (e) {
      console.warn("Audio chime error:", e);
    }
  };

  // Helper to send job cancellation to Raspberry Pi backend
  const cancelJobOnServer = async (jobId?: string | null) => {
    const targetId = jobId || currentJobIdRef.current || activeOrder?.id;
    if (!targetId) return;
    try {
      console.log('Cancelling job on Pi:', targetId);
      await fetch(`${PI_URL}/api/cancel-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ jobId: targetId, batchId: targetId })
      });
    } catch (e) {
      console.error('Cancel failed:', e);
    }
  };

  // Handle explicit user cancellation via button or action
  const handleUserClickCancel = async () => {
    console.log('Payment cancelled by user');
    if (rzpInstanceRef.current) {
      try {
        rzpInstanceRef.current.close();
      } catch (e) {
        console.warn('Error closing Razorpay instance:', e);
      }
    }
    const targetJobId = currentJobIdRef.current || activeOrder?.id;
    if (targetJobId) {
      await cancelJobOnServer(targetJobId);
    }
    setTimeoutNotice('Payment cancelled. Redirecting...');
    setPaymentStatusText('Payment cancelled. Redirecting...');
    setPaymentProcessing(false);

    setTimeout(() => {
      handleRestartAnother();
    }, 2000);
  };

  // Handle Timer Timeout (120 seconds reached)
  const handleTimeout = async () => {
    setIsTimerExpired(true);

    if (rzpInstanceRef.current) {
      try {
        rzpInstanceRef.current.close();
      } catch (e) {
        console.warn("Could not close Razorpay instance", e);
      }
    }

    const jobId = currentJobIdRef.current || activeOrder?.id;

    if (userWentToUPI.current) {
      // SCENARIO B - User already opened UPI app
      setTimeoutNotice('⏰ Time expired! If you completed payment, print will happen automatically. Otherwise, please start over.');
      setTimeout(() => {
        handleRestartAnother();
      }, 5000);
    } else {
      // SCENARIO A - User still on payment page (before UPI)
      setTimeoutNotice('⏰ Payment Time Expired!\nYour session has ended. Please try again.');

      if (jobId) {
        try {
          await fetch(`${PI_URL}/api/cancel-job`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ jobId, batchId: jobId })
          });
        } catch (err) {
          console.error("Cancel job API error", err);
        }
      }

      setTimeout(() => {
        handleRestartAnother();
      }, 3000);
    }
  };

  // 2-minute Payment Timer countdown effect
  useEffect(() => {
    let timer: any;
    if (currentStep === Step.PAYMENT) {
      setPaymentTimerSeconds(120);
      setIsTimerExpired(false);
      userWentToUPI.current = false;
      paymentStartTime.current = Date.now();
      setTimeoutNotice(null);

      timer = setInterval(() => {
        const timeElapsed = Date.now() - paymentStartTime.current;
        const remaining = Math.max(0, 120 - Math.floor(timeElapsed / 1000));
        setPaymentTimerSeconds(remaining);

        if (timeElapsed >= 120000) {
          clearInterval(timer);
          handleTimeout();
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentStep]);

  // Receipt auto-redirect 15-second timer effect
  useEffect(() => {
    let timer: any;
    if (currentStep === Step.STATUS && activeOrder?.printStatus === 'success') {
      playSuccessChime();
      setReceiptTimerSeconds(15);

      timer = setInterval(() => {
        setReceiptTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleRestartAnother();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setReceiptTimerSeconds(15);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentStep, activeOrder?.printStatus]);

  // Real Payment and Multi-File API Upload processing
  const handleInitiatePayment = async () => {
    if (!activeOrder || printFiles.length === 0) return;

    setPaymentProcessing(true);
    setPaymentStatusText('Preparing multi-file batch upload...');

    try {
      const formData = new FormData();
      formData.append('name', userName || userPhone || 'Customer');

      // Deduplicate files by filename before appending to FormData
      const uniqueFiles = Array.from(new Set(printFiles.map((f) => f.name)))
        .map((name) => printFiles.find((f) => f.name === name)!);

      console.log('Files count:', uniqueFiles.length);
      console.log('Files:', uniqueFiles.map((f) => f.name));

      const settingsArray = uniqueFiles.map((item) => ({
        copies: item.settings.copies,
        sides: item.settings.sides === 'double' ? 'two-sided-long-edge' : 'one-sided',
        pages: item.pages,
        name: item.name
      }));
      formData.append('settings', JSON.stringify(settingsArray));

      uniqueFiles.forEach((item) => {
        const fileObj = item.croppedBlob 
          ? new File([item.croppedBlob], item.name, { type: item.type || 'image/jpeg' }) 
          : item.file;
        formData.append('files', fileObj);
      });

      setPaymentStatusText('Uploading document batch...');

      let uploadRes = await fetch(`${PI_URL}/api/upload-multi`, {
        method: 'POST',
        headers: { 'ngrok-skip-browser-warning': 'true' },
        body: formData,
      });

      if (!uploadRes.ok) {
        uploadRes = await fetch(`${PI_URL}/api/upload`, {
          method: 'POST',
          headers: { 'ngrok-skip-browser-warning': 'true' },
          body: formData,
        });
      }

      if (!uploadRes.ok) {
        throw new Error(`Upload failed with status ${uploadRes.status}`);
      }

      const uploadData = await uploadRes.json();
      const jobId = uploadData.batchId || uploadData.jobId || uploadData.batch_id || ('batch_' + Date.now());
      const amount = activeOrder?.amount ?? uploadData.amount;

      if (!jobId || amount === undefined) {
        throw new Error("Invalid response from server: missing jobId or amount.");
      }

      currentJobIdRef.current = jobId;

      setPaymentStatusText('Creating Razorpay order...');

      const orderResponse = await fetch(`${PI_URL}/api/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          amount: amount,
          jobId: jobId,
          batchId: jobId
        })
      });

      let orderData: any = {};
      if (orderResponse.ok) {
        orderData = await orderResponse.json();
      }

      const razorpayOrderId = orderData.orderId || orderData.order_id || orderData.id;
      const keyId = orderData.keyId || orderData.key_id || 'rzp_live_THf6VO8qlp0Qnp';
      const orderAmount = orderData.amount ?? (amount * 100);

      setPaymentStatusText('Opening secure Razorpay Gateway...');

      const options: any = {
        key: keyId,
        order_id: razorpayOrderId,
        amount: orderAmount,
        currency: 'INR',
        name: 'Print404',
        description: 'Print Service',
        image: 'https://ais-pre-topbswiopeu3lodqo2vguu-136008080948.asia-southeast1.run.app/assets/logo.png',
        notes: {
          jobId: jobId,
          batchId: jobId
        },
        handler: async function (response: any) {
          const paymentId = response.razorpay_payment_id;
          const orderId = response.razorpay_order_id || razorpayOrderId;
          const signature = response.razorpay_signature;
          
          setPaymentProcessing(true);
          setPaymentStatusText('Verifying & Confirming batch payment...');

          try {
            let confirmRes = await fetch(`${PI_URL}/api/confirm-batch-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
              },
              body: JSON.stringify({
                batchId: jobId,
                jobId: jobId,
                paymentId: paymentId,
                orderId: orderId,
                signature: signature
              }),
            });

            if (!confirmRes.ok) {
              confirmRes = await fetch(`${PI_URL}/api/confirm-payment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                  jobId: jobId,
                  paymentId: paymentId,
                  orderId: orderId,
                  signature: signature
                }),
              });
            }

            setActiveOrder((prev) => prev ? {
              ...prev,
              paymentStatus: 'success',
              printStatus: 'success',
              id: jobId,
              code: jobId,
            } : null);

            setPaymentProcessing(false);
            setPaymentStatusText('');
            setCurrentStep(Step.STATUS);
          } catch (err: any) {
            console.error("Batch payment confirmation error", err);
            setActiveOrder((prev) => prev ? {
              ...prev,
              paymentStatus: 'success',
              printStatus: 'success',
              id: jobId,
              code: jobId,
            } : null);
            setPaymentProcessing(false);
            setPaymentStatusText('');
            setCurrentStep(Step.STATUS);
          }
        },
        prefill: {
          name: userName,
          contact: userPhone,
        },
        theme: {
          color: '#FACC15',
        },
        modal: {
          ondismiss: async function() {
            console.log('Payment cancelled by user');
            
            // Cancel job on Pi
            try {
              await cancelJobOnServer(jobId);
            } catch (e) {
              console.error('Cancel failed:', e);
            }

            // Show message and redirect
            setTimeoutNotice('Payment cancelled. Redirecting...');
            setPaymentStatusText('Payment cancelled. Redirecting...');
            setPaymentProcessing(false);

            setTimeout(() => {
              handleRestartAnother();
            }, 2000);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzpInstanceRef.current = rzp;

      // Detect UPI submission / selection
      rzp.on('payment.submit', function (data: any) {
        if (data && (data.method === 'upi' || data.type === 'upi' || data.method === 'card' || data.method === 'netbanking')) {
          userWentToUPI.current = true;
        }
      });

      rzp.on('payment.failed', async function (response: any) {
        console.log('Payment failed:', response);
        try {
          await cancelJobOnServer(jobId);
        } catch (e) {
          console.error('Cancel failed:', e);
        }
        setTimeoutNotice('Payment failed. Please try again.');
        setPaymentStatusText('Payment failed. Please try again.');
        setPaymentProcessing(false);

        setTimeout(() => {
          handleRestartAnother();
        }, 3000);
      });

      rzp.open();

    } catch (err: any) {
      console.error("Initiate payment error", err);
      alert(`Print/Payment initialization failed: ${err.message || err}`);
      setPaymentProcessing(false);
      setPaymentStatusText('');
    }
  };


  // Reset print and navigate home
  const handleRestartAnother = () => {
    setPrintFiles([]);
    setActiveCropFileId(null);
    setUploadProgress(0);
    setIsUploading(false);
    setShowCropModal(false);
    setActiveOrder(null);
    setCurrentStep(Step.LANDING);
    setPrintProgress(0);
    setTimeoutNotice(null);
    setIsTimerExpired(false);
    userWentToUPI.current = false;
    currentJobIdRef.current = null;
    rzpInstanceRef.current = null;
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
            <div className="text-sm font-bold text-yellow-400 font-mono">₹{pricePerSheet} / Sheet</div>
            <div className="text-[10px] text-zinc-400 font-sans">A4 Standard Paper</div>
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
                      Scan, Upload & Print
                    </h2>
                    
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      No computer required! Simply configure crop selections, checkout via any UPI app, and physical high-resolution page prints emerge from the slot instantly.
                    </p>
                  </div>

                  {/* Single Paper Prices */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-900 border border-zinc-850 p-3.5 rounded-xl text-center space-y-1">
                      <span className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider block">Black & White</span>
                      <p className="text-lg font-bold text-white font-sans">₹3.00 / pg</p>
                      <span className="text-[10px] text-zinc-400 block font-sans">Black & White Prints</span>
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
                          Once payment clears, the machine automatically processes and drops physical sheets in the collection dispenser beneath the screen.
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
                    <h2 className="text-xl font-black font-sans tracking-tight">Upload Your Documents</h2>
                    <p className="text-xs text-zinc-400 font-sans">Upload up to 10 files (PDF, JPG, PNG) • Max 50MB per file, 100MB total</p>
                  </div>

                  {/* Hidden browser input with multiple attribute */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                    multiple
                    className="hidden"
                    id="file-input-raw"
                  />

                  {/* Drop/Click zone */}
                  {printFiles.length === 0 ? (
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
                        <p className="text-sm font-bold text-white font-sans">Tap to browse & select multiple files</p>
                        <p className="text-xs text-zinc-400 font-sans">or drag and drop up to 10 files here</p>
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
                    /* Progress or Batch Overview before options */
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4" id="batch-uploaded-summary">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white font-sans">
                            {printFiles.length} {printFiles.length === 1 ? 'File' : 'Files'} Selected
                          </p>
                          <p className="text-xs text-zinc-400 font-mono">
                            Total Size: {(printFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-yellow-400 border border-yellow-400/30 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        >
                          + Add More
                        </button>
                      </div>

                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {printFiles.map((item) => (
                          <div key={item.id} className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-850 text-xs">
                            <div className="flex items-center gap-2 truncate pr-2">
                              {item.type.startsWith('image/') ? (
                                <FileImage className="w-4 h-4 text-yellow-400 shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-yellow-400 shrink-0" />
                              )}
                              <span className="text-zinc-200 font-medium truncate">{item.name}</span>
                            </div>
                            <span className="text-zinc-400 font-mono shrink-0">{item.pages} pg(s)</span>
                          </div>
                        ))}
                      </div>

                      {/* Progress bar info */}
                      {isUploading && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-zinc-400">Processing upload...</span>
                            <span className="text-yellow-400 font-bold">{Math.round(uploadProgress)}%</span>
                          </div>
                          <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pricing transparency list */}
                  <div className="bg-zinc-900/30 p-4 border border-zinc-900 rounded-2xl flex gap-3 items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
                    <p className="text-xs text-zinc-400 tracking-wide font-sans">
                      All calculations are transparently locked at ₹3 per physical paper sheet.
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
                    disabled={printFiles.length === 0 || isUploading}
                    onClick={() => setCurrentStep(Step.OPTIONS)}
                    className={`flex-1 py-3.5 px-4 rounded-xl text-center text-sm font-bold transition flex items-center justify-center gap-1 font-sans ${
                      printFiles.length > 0 && !isUploading
                        ? 'bg-yellow-400 text-black hover:bg-yellow-500 shadow-[0_4px_16px_rgba(250,204,21,0.2)] active:scale-98'
                        : 'bg-zinc-800 text-zinc-600 border border-zinc-700/55 cursor-not-allowed'
                    }`}
                    id="upload-next-btn"
                  >
                    <span>Configure Print Items ({printFiles.length})</span>
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: OPTIONS */}
            {currentStep === Step.OPTIONS && printFiles.length > 0 && (
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
                    <h2 className="text-xl font-black font-sans tracking-tight">Configure Multi-File Print Settings</h2>
                    <p className="text-xs text-zinc-400 font-sans">Customize copies, single/duplex, and crop individual images.</p>
                  </div>

                  <PrintOptionsForm
                    files={printFiles}
                    onUpdateItemSettings={handleUpdateItemSettings}
                    onRemoveItem={handleRemoveItem}
                    onTriggerCrop={handleTriggerCrop}
                    onAddMoreFiles={() => fileInputRef.current?.click()}
                    onNext={handleConfirmSettings}
                    onBack={() => setCurrentStep(Step.UPLOAD)}
                  />
                </div>

                {/* IMAGE CROP MODAL INTERFACE */}
                <AnimatePresence>
                  {showCropModal && activeCropFileId && (
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
                        {(() => {
                          const activeItem = printFiles.find((f) => f.id === activeCropFileId);
                          if (!activeItem) return null;
                          return (
                            <ImageCropper
                              imageUrl={activeItem.url}
                              onCropComplete={handleCropComplete}
                              onUseOriginal={handleUseOriginalImage}
                              onCancel={() => {
                                setShowCropModal(false);
                                setActiveCropFileId(null);
                              }}
                            />
                          );
                        })()}
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

                  {/* PROMINENT VISIBLE PAYMENT COUNTDOWN TIMER */}
                  {(() => {
                    const timerUI = getTimerUI(paymentTimerSeconds);
                    return (
                      <div className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all duration-300 ${timerUI.bgClass} ${timerUI.isFlashing ? 'animate-pulse ring-2 ring-red-500' : ''}`} id="payment-countdown-timer-banner">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl bg-zinc-950/60 ${timerUI.iconColor}`}>
                            <Clock className="w-5 h-5 animate-spin-slow" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
                                Payment expires in
                              </span>
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-sans font-bold ${timerUI.badgeClass}`}>
                                {timerUI.statusText}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-300 font-sans mt-0.5">
                              ⏱️ Time remaining: <span className="font-mono font-extrabold text-sm text-white">{formatTimerDisplay(paymentTimerSeconds)}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right pl-2">
                          <span className="text-xl font-black font-mono tracking-wider">
                            {formatTimerDisplay(paymentTimerSeconds)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

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

                      {/* Itemized Batch Breakdown */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Document Breakdown ({printFiles.length})</span>
                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                          {printFiles.map((item, idx) => {
                            const isDuplex = item.settings.sides === 'double';
                            const pages = Math.max(1, parseInt(String(item.pages || 1), 10));
                            const copies = Math.max(1, parseInt(String(item.settings.copies || 1), 10));
                            const totalPagesToPrint = pages * copies;
                            const sheets = isDuplex ? Math.ceil(totalPagesToPrint / 2) : totalPagesToPrint;
                            const itemCost = sheets * pricePerSheet;
                            return (
                              <div key={item.id || idx} className="bg-zinc-950 p-2 rounded-xl border border-zinc-850 flex items-center justify-between text-[11px]">
                                <div className="truncate pr-2">
                                  <p className="text-white font-medium truncate">{item.name}</p>
                                  <p className="text-zinc-500 text-[10px]">
                                    {item.pages} pg • {isDuplex ? 'Duplex' : 'Single'} • {item.settings.copies} copy(s) = {sheets} sheet(s)
                                  </p>
                                </div>
                                <span className="text-yellow-400 font-bold font-mono shrink-0">₹{itemCost}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-between pt-1">
                        <span>Total Physical Sheets</span>
                        <span className="text-white font-bold font-mono">{calculateTotalSheets()} Sheet(s)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rate per Sheet</span>
                        <span className="text-white font-medium font-mono">₹{pricePerSheet} / Sheet</span>
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

                  {/* Processing upload state or ready to pay */}
                  {paymentProcessing ? (
                    <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-850 space-y-4 text-center flex flex-col items-center justify-center min-h-[180px]" id="upload-processing-box">
                      <Loader2 className="w-10 h-10 animate-spin text-yellow-400 stroke-[2.5]" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold font-sans text-white">Processing...</p>
                        <p className="text-xs text-zinc-400 font-sans">{paymentStatusText || 'Transferring print payload...'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-850 space-y-3.5 text-center flex flex-col items-center justify-center min-h-[180px]" id="payment-ready-box">
                      <CreditCard className="w-8 h-8 text-yellow-400 animate-pulse" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-widest block">Ready for Payment</p>
                        <p className="text-xs text-zinc-300 font-sans max-w-[240px] mx-auto leading-relaxed font-sans">
                          Click <b>Pay & Print</b> below to initialize the secure Razorpay Checkout overlay in your browser.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3.5 pt-4">
                  {/* Lock secured indicator */}
                  <p className="text-center text-[10px] text-zinc-500 font-sans flex items-center justify-center gap-1">
                    🔒 Secured by Razorpay Escrow. Absolute 256-bit financial encryption.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={handleUserClickCancel}
                      className="flex-1 py-3.5 px-4 rounded-xl text-center text-sm font-semibold bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 transition active:scale-98 font-sans"
                      id="cancel-payment-btn"
                    >
                      Cancel
                    </button>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      disabled={paymentProcessing}
                      onClick={handleInitiatePayment}
                      className="flex-1 py-3.5 px-4 rounded-xl text-center text-sm font-black bg-yellow-400 hover:bg-yellow-500 text-zinc-950 transition active:scale-98 shadow-[0_4px_16px_rgba(250,204,21,0.25)] flex items-center justify-center gap-2 font-sans disabled:opacity-80"
                      id="payment-execute-btn"
                    >
                      {paymentProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                          <span>{paymentStatusText || "Processing..."}</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>Pay & Print ₹{activeOrder.amount}</span>
                        </>
                      )}
                    </motion.button>
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
                          Please stay beside the machine slot. Your document batch is printing.
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
                          Do not minimize this window until all document sheets drop into the collection dispenser tray below.
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
                        <h2 className="text-xl font-extrabold text-white font-sans">Collect From Slot Below</h2>
                        <p className="text-xs text-zinc-400 font-sans max-w-[280px] mx-auto">
                          Take your physical print sheets. Check paper tray to ensure nothing remains.
                        </p>
                      </div>
                    </div>

                    {/* Receipt Auto-Redirect 15s Timer Banner */}
                    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between text-xs" id="receipt-autoredirect-banner">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />
                        <span className="font-sans">Auto returning to home in</span>
                      </div>
                      <span className="font-mono font-bold text-yellow-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                        {receiptTimerSeconds}s
                      </span>
                    </div>

                    {/* Digital Receipt Card details print-friendly */}
                    <div className="bg-white text-black p-5 rounded-3xl space-y-4 shadow-xl border border-zinc-150 relative overflow-hidden" id="print-recipient-receipt">
                      <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 opacity-5">
                        <Receipt className="w-40 h-40 text-black" />
                      </div>

                      <div className="text-center border-b-2 border-dashed border-zinc-200 pb-3.5 space-y-1">
                        <h3 className="font-mono font-black text-lg tracking-wider text-black">RECEIPT - PRINT 404</h3>
                        <p className="text-[9px] text-zinc-500 font-mono">INSTANT PRINTING KIOSK</p>
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

                        {/* Batch Item Breakdown */}
                        <div className="border-t border-b border-zinc-200 py-2 space-y-1.5">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Printed Documents ({printFiles.length})</span>
                          {printFiles.map((f, i) => {
                            const isDuplex = f.settings.sides === 'double';
                            const pages = Math.max(1, parseInt(String(f.pages || 1), 10));
                            const copies = Math.max(1, parseInt(String(f.settings.copies || 1), 10));
                            const totalPagesToPrint = pages * copies;
                            const sheets = isDuplex ? Math.ceil(totalPagesToPrint / 2) : totalPagesToPrint;
                            return (
                              <div key={f.id || i} className="flex justify-between text-[11px]">
                                <span className="truncate max-w-[170px] text-zinc-800 font-medium">{f.name}</span>
                                <span className="font-mono text-zinc-950 font-bold">{sheets} sheet(s) • ₹{sheets * pricePerSheet}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex justify-between">
                          <span className="font-medium text-zinc-500">Total Paper Sheets</span>
                          <span className="font-bold text-black font-mono">
                            {calculateTotalSheets()} Sheet(s)
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-bold border-t border-zinc-200 pt-3 text-black">
                          <span>Total Paid</span>
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

        {/* TIMEOUT NOTIFICATION OVERLAY MODAL */}
        <AnimatePresence>
          {timeoutNotice && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
              id="timeout-notice-overlay"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 10 }}
                className="bg-zinc-900 border border-zinc-750 p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl"
              >
                <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/30 shadow-lg">
                  <Clock className="w-8 h-8 animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white font-sans">Payment Time Expired!</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-line">{timeoutNotice}</p>
                </div>
                <div className="pt-2 text-[11px] font-mono text-zinc-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-400" />
                  <span>Redirecting to home screen...</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
