'use client';

import { useState, useRef } from 'react';
import TopNavBar from '@/components/TopNavBar';
import HandwritingCanvas from '@/components/HandwritingCanvas';
import TargetTextArea from '@/components/TargetTextArea';
import { SENTENCE_BANK } from '@/lib/sentences'; // Import the bank

export default function Home() {
  const [writerName, setWriterName] = useState('');
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [stylusOnly, setStylusOnly] = useState(false);
  const [rowHeight, setRowHeight] = useState(60);
  const canvasRef = useRef<any>(null);

  // Target text now updates automatically when sentenceIndex changes
  const targetText = SENTENCE_BANK[sentenceIndex] || "All sentences completed!";

  const handleUndo = () => canvasRef.current?.handleUndo?.();
  const handleClear = () => canvasRef.current?.handleClear?.();

  const handleSubmit = async () => {
    // 1. Trigger the canvas to save current strokes
    await canvasRef.current?.handleSubmit?.();

    // 2. Move to next sentence in the bank
    if (sentenceIndex < SENTENCE_BANK.length - 1) {
      setSentenceIndex((prev) => prev + 1);
    } else {
      alert("Congratulations! You've completed the entire sentence bank.");
    }
  };

  const handleExport = () => canvasRef.current?.handleExport?.();
  const handleNewSession = () => {
    if (window.confirm("Start a fresh session? This won't delete saved data.")) {
      setSentenceIndex(0);
      canvasRef.current?.handleClear?.();
    }
  };

  const handleStylusToggle = (enabled: boolean) => {
    setStylusOnly(enabled);
    canvasRef.current?.handleStylusToggle?.(enabled);
  };

  const handleDeleteDatabase = async () => {
    if (window.confirm('PERMANENTLY delete all saved data?')) {
      await canvasRef.current?.handleDeleteDatabase?.();
      setSentenceIndex(0);
    }
  };

  const handleResetSentence = () => {
    setSentenceIndex(0);
  };

  return (
    <main className="flex h-screen w-full flex-col bg-background overflow-hidden">
      <TopNavBar
        writerName={writerName}
        setWriterName={setWriterName}
        onUndo={handleUndo}
        onClear={handleClear}
        onSubmit={handleSubmit}
        onExport={handleExport}
        onNewSession={handleNewSession}
        stylusOnly={stylusOnly}
        onStylusToggle={handleStylusToggle}
        rowHeight={rowHeight}
        setRowHeight={setRowHeight}
        onDeleteDatabase={handleDeleteDatabase}
        onResetSentence={handleResetSentence}
        currentIndex={sentenceIndex + 1}
        totalCount={SENTENCE_BANK.length}
      />

      <div className="w-full shrink-0 border-b border-border bg-muted/10">
        {/* Pass extra info like "1 / 30" so you know where you are */}
        <div className="text-[10px] text-center pt-1 opacity-50 uppercase tracking-widest">
          Sentence {sentenceIndex + 1} of {SENTENCE_BANK.length}
        </div>
        <TargetTextArea targetText={targetText} setTargetText={() => { }} />
      </div>

      <div className="flex-1 w-full relative">
        <HandwritingCanvas
          ref={canvasRef}
          writerName={writerName}
          targetText={targetText}
          rowHeight={rowHeight}
        />
      </div>
    </main>
  );
}