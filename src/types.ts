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

export interface OrderDetails {
  id: string;
  code: string;
  userName: string;
  userPhone: string;
  file: FileDetails | null;
  settings: PrintSettings;
  amount: number;
  paymentStatus: 'pending' | 'success' | 'failed';
  printStatus: 'waiting' | 'printing' | 'success' | 'failed';
  createdAt: string;
}
