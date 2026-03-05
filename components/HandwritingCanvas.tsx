'use client';

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';

interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

interface WritingSession {
  writerName: string;
  targetText: string;
  strokes: Point[][];
  canvasWidth: number;
  canvasHeight: number;
  lineSpacing: number;
  createdAt: string;
}

interface HandwritingCanvasProps {
  writerName: string;
  targetText: string;
  rowHeight?: number;
  onNextSentence?: () => void; // Added so we can change the text!
}

const HandwritingCanvas = forwardRef<any, HandwritingCanvasProps>(
  function HandwritingCanvas({ writerName, targetText, rowHeight = 60, onNextSentence }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [strokes, setStrokes] = useState<Point[][]>([]);
    const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
    const [stylusOnly, setStylusOnly] = useState(false);

    // Redraw loop with smooth ink rendering
    const redrawCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Use logical CSS pixels for math, not physical DPR pixels
      const rect = canvas.getBoundingClientRect();

      // Clear canvas
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Calculate strictly centered guide line
      // // Calculate strictly centered guide lines
      // FIX: 4 lines create 3 vertical spaces, not 4!
      const blockHeight = 3 * rowHeight;
      const startY = (rect.height - blockHeight) / 2;

      const guideLines = [
        startY,                         // Ascender (Top Line)
        startY + rowHeight,             // Midline
        startY + (2 * rowHeight),       // Baseline (Red Anchor)
        startY + (3 * rowHeight),       // Descender (Bottom Line)
      ];

      // Draw Guide Lines
      ctx.lineWidth = 1;
      for (let i = 0; i < guideLines.length; i++) {
        const yPos = guideLines[i];
        ctx.beginPath();

        if (i === 1) {
          // Midline (Dashed)
          ctx.setLineDash([8, 8]);
          ctx.strokeStyle = 'rgba(136, 136, 136, 0.4)';
        } else if (i === 2) {
          // Baseline (Solid Red Anchor)
          ctx.setLineDash([]);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
        } else {
          // Ascender & Descender (Solid Grey)
          ctx.setLineDash([]);
          ctx.strokeStyle = 'rgba(136, 136, 136, 0.4)';
        }

        ctx.moveTo(0, yPos);
        ctx.lineTo(rect.width, yPos);
        ctx.stroke();
      }
      ctx.setLineDash([]); // Reset dash for ink

      // Set smooth ink rendering properties
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'white'; // High contrast ink for dark mode
      ctx.lineWidth = 2.5;

      // Redraw all completed strokes
      for (const stroke of strokes) {
        if (stroke.length === 0) continue;
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        ctx.stroke();
      }

      // Draw current active stroke
      if (currentStroke.length > 0) {
        ctx.beginPath();
        ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
        for (let i = 1; i < currentStroke.length; i++) {
          ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
        }
        ctx.stroke();
      }
    }, [strokes, currentStroke, rowHeight]);

    // Setup Fluid Canvas Resizing
    useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const handleResize = () => {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // Set actual internal pixel density
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        // Lock CSS size to container
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr); // Normalizes coordinate system

        redrawCanvas();
      };

      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [redrawCanvas]);

    // The Ultimate Offset Fix
    const getCanvasCoordinates = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (stylusOnly && e.pointerType !== 'pen') return;
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      if (!coords) return;
      setIsDrawing(true);
      setCurrentStroke([{ x: coords.x, y: coords.y, pressure: e.pressure || 0.5, timestamp: Date.now() }]);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      if (stylusOnly && e.pointerType !== 'pen') return;

      const points: Point[] = [];

      // THE FIX: Dig under React's wrapper to get the raw DOM PointerEvent
      const nativeEvent = e.nativeEvent as PointerEvent;

      // Attempt to get high-frequency coalesced events
      if (typeof nativeEvent.getCoalescedEvents === 'function') {
        const coalesced = nativeEvent.getCoalescedEvents();
        for (const ev of coalesced) {
          const coords = getCanvasCoordinates(ev.clientX, ev.clientY);
          if (coords) {
            points.push({
              x: coords.x,
              y: coords.y,
              pressure: ev.pressure || 0.5,
              timestamp: Date.now()
            });
          }
        }
      } else {
        // Fallback for older browsers
        const coords = getCanvasCoordinates(e.clientX, e.clientY);
        if (coords) {
          points.push({
            x: coords.x,
            y: coords.y,
            pressure: e.pressure || 0.5,
            timestamp: Date.now()
          });
        }
      }

      if (points.length > 0) {
        setCurrentStroke((prev) => [...prev, ...points]);
      }
    };

    const handlePointerUp = () => {
      if (currentStroke.length > 0) {
        setStrokes((prev) => [...prev, currentStroke]);
      }
      setCurrentStroke([]);
      setIsDrawing(false);
    };

    const handleUndo = () => setStrokes((prev) => prev.slice(0, -1));
    const handleClear = () => { setStrokes([]); setCurrentStroke([]); };

    // FIXED SUBMIT: Awaits DB save, then triggers text update
    const handleSubmit = async () => {
      if (strokes.length === 0) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      const session: WritingSession = {
        writerName: writerName || 'Anonymous',
        targetText,
        strokes,
        canvasWidth: rect?.width || 0,
        canvasHeight: rect?.height || 0,
        lineSpacing: rowHeight,
        createdAt: new Date().toISOString(),
      };

      await saveToIndexedDB(session);
      handleClear();
      if (onNextSentence) onNextSentence(); // Moves to next sentence!
    };

    // FIXED EXPORT: Downloads full history from DB
    const handleExport = async () => {
      const allSessions = await getAllFromIndexedDB();
      if (allSessions.length === 0) {
        alert('No saved data to export! Write a sentence and hit Submit first.');
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, -5);
      const filename = `${writerName || 'Dataset'}_${timestamp}.json`;

      const json = JSON.stringify(allSessions, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const handleNewSession = () => handleClear();
    const handleStylusToggle = (enabled: boolean) => setStylusOnly(enabled);

    const handleDeleteDatabase = async () => {
      try {
        await clearAllFromIndexedDB();
      } catch (error) {
        console.error('Failed to clear database:', error);
        throw error;
      }
    };

    useImperativeHandle(ref, () => ({
      handleUndo, handleClear, handleSubmit, handleExport, handleNewSession, handleStylusToggle, handleDeleteDatabase,
    }));

    return (
      <div className="flex flex-col w-full h-full p-2 md:p-4">
        {/* Container ref allows the canvas to be truly fluid */}
        <div ref={containerRef} className="flex-1 w-full h-full relative overflow-hidden rounded-lg border border-border bg-[#1a1a1a]">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="absolute top-0 left-0 cursor-crosshair touch-none"
          />
        </div>
        <div className="text-xs text-muted-foreground mt-2 text-center">
          Strokes: {strokes.length} • Stylus Only: {stylusOnly ? 'ON' : 'OFF'}
        </div>
      </div>
    );
  }
);

export default HandwritingCanvas;

// --- ROBUST INDEXEDDB HELPERS ---

async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HandwritingData', 1);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'createdAt' });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function saveToIndexedDB(session: WritingSession): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');
    store.add(session);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getAllFromIndexedDB(): Promise<WritingSession[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['sessions'], 'readonly');
    const store = transaction.objectStore('sessions');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function clearAllFromIndexedDB(): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');
    store.clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
