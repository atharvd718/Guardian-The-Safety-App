import React, { useState } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, RotateCcw, Lock, Unlock } from 'lucide-react';

interface ZoomableStageProps {
  children: React.ReactNode;
  title?: string;
  minScale?: number;
  maxScale?: number;
}

const ZoomControlsBar: React.FC<{
  panLocked: boolean;
  onTogglePanLock: () => void;
}> = ({ panLocked, onTogglePanLock }) => {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 p-1 rounded-xl bg-[var(--color-surface-elevated)]/95 backdrop-blur-md border border-[var(--color-border)] shadow-md">
      <button
        type="button"
        onClick={() => zoomOut(0.25)}
        className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg hover:bg-black/5 text-[var(--color-foreground)] transition-colors"
        aria-label="Zoom out"
        title="Zoom Out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => zoomIn(0.25)}
        className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg hover:bg-black/5 text-[var(--color-foreground)] transition-colors"
        aria-label="Zoom in"
        title="Zoom In"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => resetTransform()}
        className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg hover:bg-black/5 text-[var(--color-foreground)] transition-colors"
        aria-label="Reset zoom"
        title="Reset Zoom"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onTogglePanLock}
        className={`min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg transition-colors ${
          panLocked
            ? 'bg-[var(--color-primary)] text-white'
            : 'hover:bg-black/5 text-[var(--color-foreground)]'
        }`}
        aria-label={panLocked ? 'Unlock pan' : 'Lock pan'}
        title={panLocked ? 'Pan Locked (page scrolls normally)' : 'Pan Unlocked (drag to inspect)'}
      >
        {panLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
      </button>
    </div>
  );
};

export const ZoomableStage: React.FC<ZoomableStageProps> = ({
  children,
  title,
  minScale = 0.75,
  maxScale = 2.4,
}) => {
  const [panLocked, setPanLocked] = useState(false);

  return (
    <div className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] overflow-hidden">
      {title && (
        <div className="px-4 py-2.5 border-b border-[var(--color-border)] flex items-center justify-between text-xs">
          <span className="font-bold text-[var(--color-foreground)]">{title}</span>
          <span className="text-[var(--color-muted)]">Pinch or tap + / -</span>
        </div>
      )}
      <TransformWrapper
        initialScale={1}
        minScale={minScale}
        maxScale={maxScale}
        panning={{ disabled: panLocked }}
        wheel={{ step: 0.15 }}
        doubleClick={{ mode: 'toggle' }}
      >
        <ZoomControlsBar
          panLocked={panLocked}
          onTogglePanLock={() => setPanLocked((prev) => !prev)}
        />
        <TransformComponent
          wrapperStyle={{ width: '100%', minHeight: '240px' }}
          contentStyle={{ width: '100%' }}
        >
          <div className="p-4 w-full">{children}</div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};
