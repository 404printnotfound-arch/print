export enum Step {
  LANDING = 'LANDING',
  UPLOAD = 'UPLOAD',
  OPTIONS = 'OPTIONS',
  PAYMENT = 'PAYMENT',
  STATUS = 'STATUS',
}

export interface PrintSettings {
  copies: number;
  orientation: 'portrait' | 'landscape';
  sides: 'single' | 'double';
  paperFinish: 'glossy' | 'matte';
  fitMode: 'fit' | 'fill';
  scale: number; // percentage sizing
}

export interface FileDetails {
  name: string;
  size: number;
  type: string;
  url: string; // original objectURL
  croppedUrl?: string; // cropped canvas image dataURL
  pages: number;
}

export interface PrintItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  url: string;
  croppedUrl?: string;
  croppedBlob?: Blob;
  isCropped?: boolean;
  pages: number;
  settings: PrintSettings;
}

export interface OrderDetails {
  id: string;
  code: string;
  userName: string;
  userPhone: string;
  files: PrintItem[];
  file?: FileDetails | null; // legacy single file reference if needed
  settings?: PrintSettings;
  amount: number;
  paymentStatus: 'pending' | 'success' | 'failed';
  printStatus: 'waiting' | 'printing' | 'success' | 'failed';
  createdAt: string;
}

