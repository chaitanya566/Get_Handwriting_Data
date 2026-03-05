'use client';

import { useState } from 'react';
import { Menu, Undo2, RotateCcw, Check, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TopNavBarProps {
  writerName: string;
  setWriterName: (name: string) => void;
  onUndo?: () => void;
  onClear?: () => void;
  onSubmit?: () => void;
  onExport?: () => void;
  onNewSession?: () => void;
  stylusOnly?: boolean;
  onStylusToggle?: (enabled: boolean) => void;
  rowHeight?: number;
  setRowHeight?: (height: number) => void;
  onDeleteDatabase?: () => void;
  onResetSentence?: () => void;
    // ⭐ ADD THESE
  currentIndex?: number;
  totalCount?: number;
}

export default function TopNavBar({
  writerName,
  setWriterName,
  onUndo,
  onClear,
  onSubmit,
  onExport,
  onNewSession,
  stylusOnly = false,
  onStylusToggle,
  rowHeight = 60,
  setRowHeight,
  onDeleteDatabase,
  onResetSentence,
}: TopNavBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="h-12 border-b border-border bg-card flex items-center justify-between px-4 gap-2">
      {/* Left: Hamburger Menu */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle>Session Menu</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {/* Writer Name Input */}
            <div className="space-y-2">
              <Label htmlFor="writer-name">Writer Name</Label>
              <Input
                id="writer-name"
                placeholder="Enter your name"
                value={writerName}
                onChange={(e) => setWriterName(e.target.value)}
                className="bg-background"
              />
            </div>

            {/* Separator */}
            <div className="border-t border-border" />

            {/* Menu Actions */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  onNewSession?.();
                  setIsOpen(false);
                }}
              >
                New Session
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  onExport?.();
                  setIsOpen(false);
                }}
              >
                Export JSON
              </Button>
            </div>

            {/* Separator */}
            <div className="border-t border-border" />

            {/* Line Size Slider */}
            <div className="space-y-2">
              <Label htmlFor="line-size">Line Size: {rowHeight}px</Label>
              <input
                id="line-size"
                type="range"
                min="30"
                max="150"
                step="5"
                value={rowHeight}
                onChange={(e) => setRowHeight?.(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>

            {/* Separator */}
            <div className="border-t border-border" />

            {/* Stylus Only Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="stylus-toggle">Stylus Only</Label>
              <input
                id="stylus-toggle"
                type="checkbox"
                checked={stylusOnly}
                onChange={(e) => onStylusToggle?.(e.target.checked)}
                className="h-4 w-4"
              />
            </div>

            {/* Separator */}
            <div className="border-t border-border" />

            {/* Delete All Data Button */}
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={() => {
                const confirmed = window.confirm(
                  'Are you sure you want to delete all saved handwriting data? This cannot be undone.'
                );
                if (confirmed) {
                  onDeleteDatabase?.();
                  onResetSentence?.();
                  alert('All saved data has been cleared.');
                  setIsOpen(false);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All Data
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Center Spacer */}
      <div className="flex-1" />

      {/* Right: Action Icons */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onUndo}
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClear}
          title="Clear Canvas"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onSubmit}
          title="Submit & Next"
        >
          <Check className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
