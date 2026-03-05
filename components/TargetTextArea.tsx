import React from 'react';

interface TargetTextAreaProps {
  targetText: string;
  setTargetText: (text: string) => void;
}

export default function TargetTextArea({ targetText }: TargetTextAreaProps) {
  return (
    <div className="w-full px-4 py-3 md:py-4 flex items-center justify-center bg-card text-card-foreground">
      <h2 className="text-lg md:text-2xl font-medium text-center leading-relaxed opacity-90">
        {targetText}
      </h2>
    </div>
  );
}