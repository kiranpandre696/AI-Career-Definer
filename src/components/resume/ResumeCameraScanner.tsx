import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  RotateCcw,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
  Upload,
  RefreshCw,
  Eye,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';

interface ResumeCameraScannerProps {
  onProcessImages: (images: string[]) => void;
  onClose: () => void;
  onFallbackToUpload: () => void;
  isProcessing?: boolean;
}

export const ResumeCameraScanner: React.FC<ResumeCameraScannerProps> = ({
  onProcessImages,
  onClose,
  onFallbackToUpload,
  isProcessing = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [capturedPages, setCapturedPages] = useState<{ id: string; dataUrl: string; pageNumber: number }[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);

  // Stop camera tracks cleanly
  const stopTracks = (mediaStream?: MediaStream | null) => {
    const s = mediaStream || stream;
    if (s) {
      s.getTracks().forEach((track) => track.stop());
    }
  };

  // Start Camera
  const startCamera = async (deviceId?: string) => {
    setPermissionError(null);
    setQualityWarning(null);
    stopTracks();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError('Camera API is not supported on this browser. Please use the file upload option.');
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: { ideal: 'environment' }, // Prefer back camera on mobile
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }

      // Enumerate available camera devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setCameraDevices(videoInputs);
      if (!selectedDeviceId && videoInputs.length > 0) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Camera permission is required to scan your resume. You can also upload a resume file instead.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionError('No camera found on this device. You can upload a resume file or image from your gallery instead.');
      } else {
        setPermissionError(`Unable to start camera: ${err.message || 'Unknown error'}. You can also upload a resume file.`);
      }
      setCameraActive(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopTracks();
    };
  }, []);

  // Capture current frame
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setQualityWarning('Camera frame is still initializing. Please hold steady and try again in a moment.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Basic brightness check
    try {
      const imgData = ctx.getImageData(0, 0, Math.min(100, canvas.width), Math.min(100, canvas.height));
      let sum = 0;
      for (let i = 0; i < imgData.data.length; i += 4) {
        sum += (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
      }
      const avgBrightness = sum / (imgData.data.length / 4);
      if (avgBrightness < 25) {
        setQualityWarning('The captured frame is very dark. Ensure your resume is under direct lighting to avoid OCR errors.');
      } else {
        setQualityWarning(null);
      }
    } catch {
      // Ignore image data read errors
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const newPage = {
      id: `page_${Date.now()}`,
      dataUrl,
      pageNumber: capturedPages.length + 1,
    };

    const updated = [...capturedPages, newPage];
    setCapturedPages(updated);
    setSelectedPageIndex(updated.length - 1);
  };

  // Add from gallery / local file
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File, idx) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setCapturedPages((prev) => {
            const next = [
              ...prev,
              {
                id: `gallery_${Date.now()}_${idx}`,
                dataUrl,
                pageNumber: prev.length + 1,
              },
            ];
            setSelectedPageIndex(next.length - 1);
            return next;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Delete a scanned page
  const handleDeletePage = (indexToDelete: number) => {
    setCapturedPages((prev) => {
      const filtered = prev.filter((_, idx) => idx !== indexToDelete);
      return filtered.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    });
    if (selectedPageIndex >= indexToDelete && selectedPageIndex > 0) {
      setSelectedPageIndex((prev) => prev - 1);
    }
  };

  // Retake current page
  const handleRetakeCurrent = () => {
    if (capturedPages.length > 0) {
      handleDeletePage(selectedPageIndex);
    }
    setQualityWarning(null);
  };

  // Switch camera device
  const handleSwitchCamera = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    startCamera(deviceId);
  };

  // Complete and submit for OCR
  const handleCompleteScan = () => {
    if (capturedPages.length === 0) {
      setQualityWarning('Please capture at least one page of your resume before continuing.');
      return;
    }
    stopTracks();
    onProcessImages(capturedPages.map((p) => p.dataUrl));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-fadeIn">
      {/* Top Header */}
      <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">AI Resume Camera Scanner</h3>
            <p className="text-[11px] text-slate-400">Position document within the viewfinder guide</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Private & In-Memory</span>
          </span>
          <button
            onClick={() => {
              stopTracks();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Permission Denied or Camera Error State */}
        {permissionError && (
          <div className="p-5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Camera Access Notice
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  {permissionError}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => startCamera(selectedDeviceId)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera Access</span>
              </button>

              <button
                onClick={() => {
                  stopTracks();
                  onFallbackToUpload();
                }}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Resume File Instead</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Pick Image from Gallery</span>
              </button>
            </div>
          </div>
        )}

        {/* Quality or Blurry Alert */}
        {qualityWarning && (
          <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">{qualityWarning}</div>
            <button
              onClick={() => setQualityWarning(null)}
              className="text-amber-700 hover:text-amber-900 dark:hover:text-amber-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Hidden Canvas for Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden Input for Gallery Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/jpg"
          multiple
          onChange={handleGalleryUpload}
          className="hidden"
        />

        {/* Camera Stage & Viewfinder */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Viewfinder (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative rounded-2xl bg-black overflow-hidden aspect-[4/3] sm:aspect-[16/10] border border-slate-800 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Document Framing Guides */}
              <div className="absolute inset-4 sm:inset-8 pointer-events-none border border-white/40 rounded-xl flex flex-col justify-between p-3">
                {/* 4 Corner Target Brackets */}
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-amber-400 rounded-tl-md" />
                  <div className="w-6 h-6 border-t-2 border-r-2 border-amber-400 rounded-tr-md" />
                </div>

                <div className="text-center">
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium tracking-wide border border-white/20">
                    Align physical resume document within frame
                  </span>
                </div>

                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-2 border-l-2 border-amber-400 rounded-bl-md" />
                  <div className="w-6 h-6 border-b-2 border-r-2 border-amber-400 rounded-br-md" />
                </div>
              </div>

              {/* Live Status Indicator */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold tracking-wider uppercase border border-white/10">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>Live Viewfinder</span>
              </div>

              {/* Camera Switcher Dropdown (if multiple cameras exist) */}
              {cameraDevices.length > 1 && (
                <div className="absolute top-3 right-3">
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => handleSwitchCamera(e.target.value)}
                    className="text-[11px] bg-black/75 text-white border border-white/20 rounded-lg px-2.5 py-1 focus:outline-none"
                  >
                    {cameraDevices.map((dev, i) => (
                      <option key={dev.deviceId || i} value={dev.deviceId}>
                        {dev.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Primary Capture Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  title="Upload image from device gallery"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload from Gallery</span>
                </button>

                {cameraDevices.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const currIdx = cameraDevices.findIndex((d) => d.deviceId === selectedDeviceId);
                      const nextDevice = cameraDevices[(currIdx + 1) % cameraDevices.length];
                      if (nextDevice) handleSwitchCamera(nextDevice.deviceId);
                    }}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    title="Switch camera"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Main Shutter / Capture Button */}
              <button
                type="button"
                onClick={handleCapture}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="w-3 h-3 rounded-full bg-slate-950 group-hover:scale-125 transition-transform" />
                <span>Capture Resume Page</span>
              </button>
            </div>
          </div>

          {/* Scanned Pages Preview & Multi-Page Tray (1 Column) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Scanned Pages ({capturedPages.length})
                  </h4>
                </div>
                {capturedPages.length > 0 && (
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                    Ready for OCR
                  </span>
                )}
              </div>

              {capturedPages.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="w-10 h-10 mx-auto rounded-full bg-blue-50 dark:bg-slate-800 text-blue-900 dark:text-amber-400 flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No pages captured yet
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Click "Capture Resume Page" to photograph Page 1 of your physical document. Multi-page resumes are fully supported.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Selected Page Large Preview */}
                  {capturedPages[selectedPageIndex] && (
                    <div className="space-y-2">
                      <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-900 aspect-[3/4] max-h-56">
                        <img
                          src={capturedPages[selectedPageIndex].dataUrl}
                          alt={`Scanned Page ${selectedPageIndex + 1}`}
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                          Page {selectedPageIndex + 1} of {capturedPages.length}
                        </div>
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleRetakeCurrent}
                            className="p-1 rounded bg-black/70 hover:bg-black text-white text-[10px] flex items-center gap-1"
                            title="Retake this page"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Retake</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePage(selectedPageIndex)}
                            className="p-1 rounded bg-red-600/90 hover:bg-red-700 text-white text-[10px]"
                            title="Delete this page"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Thumbnails Carousel */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                    {capturedPages.map((page, idx) => (
                      <button
                        key={page.id}
                        type="button"
                        onClick={() => setSelectedPageIndex(idx)}
                        className={`relative w-14 h-18 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                          selectedPageIndex === idx
                            ? 'border-blue-700 dark:border-amber-400 scale-105 shadow-xs'
                            : 'border-slate-300 dark:border-slate-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={page.dataUrl}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[9px] font-bold text-center py-0.5">
                          P.{idx + 1}
                        </span>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={handleCapture}
                      className="w-14 h-18 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 text-slate-500 hover:text-amber-500 flex flex-col items-center justify-center gap-1 shrink-0 transition-colors cursor-pointer text-[10px] font-bold"
                      title="Add another page"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+Page</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <button
                type="button"
                onClick={handleCompleteScan}
                disabled={capturedPages.length === 0 || isProcessing}
                className="w-full py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>Transcribing Scanned Resume...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>
                      Scan Resume ({capturedPages.length} {capturedPages.length === 1 ? 'Page' : 'Pages'})
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Supports multiple pages</span>
                <button
                  type="button"
                  onClick={() => {
                    stopTracks();
                    onFallbackToUpload();
                  }}
                  className="text-blue-900 dark:text-amber-400 hover:underline font-semibold"
                >
                  Switch to File Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
