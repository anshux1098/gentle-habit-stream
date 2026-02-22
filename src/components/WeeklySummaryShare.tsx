import { useState, useCallback } from 'react';
import { Share2, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface WeeklySummaryData {
  weekRange: string; // e.g. "Feb 10 – 16"
  completionPercentage: number;
  perfectDays: number;
  focusHabitRate: number; // 0–100
  insightSummary?: string; // 1-sentence AI insight
}

interface WeeklySummaryShareProps {
  data: WeeklySummaryData;
}

/**
 * Resolve a CSS custom property from :root / .dark to an actual color string.
 * Returns hsl(...) for properties defined as "H S% L%".
 */
function getCSSColor(property: string): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(property)
    .trim();
  if (!raw) return '#888';
  // If it already looks like a full color value, return as-is
  if (raw.startsWith('#') || raw.startsWith('rgb') || raw.startsWith('hsl(')) return raw;
  // Our tokens are "H S% L%" — wrap in hsl()
  return `hsl(${raw})`;
}

const CARD_W = 600;
const CARD_H = 440;
const PADDING = 40;

function drawSummaryCard(canvas: HTMLCanvasElement, data: WeeklySummaryData) {
  const ctx = canvas.getContext('2d')!;
  canvas.width = CARD_W * 2; // 2x for retina
  canvas.height = CARD_H * 2;
  ctx.scale(2, 2);

  const bg = getCSSColor('--background');
  const fg = getCSSColor('--foreground');
  const muted = getCSSColor('--muted-foreground');
  const primary = getCSSColor('--primary');
  const card = getCSSColor('--card');
  const border = getCSSColor('--border');
  const success = getCSSColor('--success');

  // Background
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, CARD_W, CARD_H, 20);
  ctx.fill();

  // Inner card
  ctx.fillStyle = card;
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(PADDING, PADDING, CARD_W - PADDING * 2, CARD_H - PADDING * 2, 14);
  ctx.fill();
  ctx.stroke();

  const innerX = PADDING + 24;
  const innerW = CARD_W - PADDING * 2 - 48;
  let y = PADDING + 36;

  // Title
  ctx.fillStyle = fg;
  ctx.font = '600 20px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('Weekly Summary', innerX, y);

  // Week range — right aligned
  ctx.fillStyle = muted;
  ctx.font = '400 14px "Plus Jakarta Sans", system-ui, sans-serif';
  const rangeWidth = ctx.measureText(data.weekRange).width;
  ctx.fillText(data.weekRange, innerX + innerW - rangeWidth, y);

  // Divider
  y += 18;
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(innerX, y);
  ctx.lineTo(innerX + innerW, y);
  ctx.stroke();

  // Stats grid (2×2)
  y += 28;
  const colW = innerW / 2;

  const stats = [
    { label: 'Completion', value: `${data.completionPercentage.toFixed(0)}%`, color: primary },
    { label: 'Perfect Days', value: String(data.perfectDays), color: success },
    { label: 'Focus Rate', value: `${data.focusHabitRate.toFixed(0)}%`, color: getCSSColor('--focus') },
    { label: 'Consistency', value: data.completionPercentage >= 80 ? 'Strong' : data.completionPercentage >= 50 ? 'Building' : 'Growing', color: getCSSColor('--streak') },
  ];

  stats.forEach((stat, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = innerX + col * colW;
    const sy = y + row * 72;

    // Value
    ctx.fillStyle = stat.color;
    ctx.font = '700 28px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(stat.value, sx, sy);

    // Label
    ctx.fillStyle = muted;
    ctx.font = '400 13px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(stat.label, sx, sy + 20);
  });

  // Insight
  y += 160;
  if (data.insightSummary) {
    ctx.fillStyle = muted;
    ctx.font = 'italic 400 13px "Plus Jakarta Sans", system-ui, sans-serif';
    // Word-wrap insight text
    const words = data.insightSummary.split(' ');
    let line = '';
    const maxW = innerW;
    for (const word of words) {
      const test = line + (line ? ' ' : '') + word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, innerX, y);
        line = word;
        y += 18;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, innerX, y);
  }

  // Branding
  y = CARD_H - PADDING - 16;
  ctx.fillStyle = muted;
  ctx.font = '400 11px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('Habit Flow', innerX, y);

  // Small dot separator
  const brandW = ctx.measureText('Habit Flow').width;
  ctx.fillText('·  built with consistency', innerX + brandW + 6, y);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas to blob failed'))),
      'image/png'
    );
  });
}

export function WeeklySummaryShare({ data }: WeeklySummaryShareProps) {
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = useCallback(() => {
    setIsGenerating(true);
    // Small delay to let the dialog render and CSS vars be accessible
    requestAnimationFrame(() => {
      try {
        const canvas = document.createElement('canvas');
        drawSummaryCard(canvas, data);
        const url = canvas.toDataURL('image/png');
        setPreviewUrl(url);
      } catch (err) {
        console.error('Failed to generate summary image', err);
        toast.error('Failed to generate image');
      } finally {
        setIsGenerating(false);
      }
    });
  }, [data]);

  const handleDownload = useCallback(() => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `habit-flow-weekly-${data.weekRange.replace(/\s/g, '-')}.png`;
    a.click();
    toast.success('Image downloaded!');
  }, [previewUrl, data.weekRange]);

  const handleNativeShare = useCallback(async () => {
    if (!previewUrl) return;
    try {
      const canvas = document.createElement('canvas');
      drawSummaryCard(canvas, data);
      const blob = await canvasToBlob(canvas);
      const file = new File([blob], 'habit-flow-weekly.png', { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'My Weekly Habit Summary',
          text: `${data.weekRange} — ${data.completionPercentage.toFixed(0)}% completion`,
          files: [file],
        });
      } else {
        // Fallback: share without file
        await navigator.share({
          title: 'My Weekly Habit Summary',
          text: `${data.weekRange} — ${data.completionPercentage.toFixed(0)}% completion, ${data.perfectDays} perfect days`,
        });
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        toast.error('Sharing failed');
      }
    }
  }, [previewUrl, data]);

  const supportsShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (v) generateImage();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" />
          Share Summary
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Weekly Summary</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Preview */}
          <div className="rounded-lg overflow-hidden border border-border bg-muted/30 flex items-center justify-center min-h-[200px]">
            {isGenerating ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Weekly summary preview"
                className="w-full h-auto"
              />
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">
            No habit names or personal details are included — only aggregated stats.
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={!previewUrl}
              className="flex-1 gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            {supportsShare && (
              <Button
                onClick={handleNativeShare}
                disabled={!previewUrl}
                className="flex-1 gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
