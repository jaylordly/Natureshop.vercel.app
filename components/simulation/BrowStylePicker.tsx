'use client';
import { Loader2 } from 'lucide-react';

export interface BrowStyle {
  id: string;
  name: string;
  img: string;
  comingSoon?: boolean;
}

interface Props {
  styles: BrowStyle[];
  selectedId: string | null;
  isProcessing: boolean;
  onSelect: (style: BrowStyle) => void;
}

export default function BrowStylePicker({ styles, selectedId, isProcessing, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {styles.map((s) => {
        const active = selectedId === s.id;
        const disabled = s.comingSoon || (isProcessing && !active);
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            disabled={disabled}
            className={`relative aspect-square border bg-white overflow-hidden transition ${
              active
                ? 'border-[#8B4A4F] shadow-[0_4px_12px_rgba(139,74,79,0.2)]'
                : 'border-[#E8DCD7] hover:border-[#A88080]'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.img} alt={s.name} className="w-full h-full object-contain p-3" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-[10px] tracking-cta uppercase text-white">{s.name}</p>
            </div>
            {active && isProcessing && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-[#8B4A4F] animate-spin" />
              </div>
            )}
            {s.comingSoon && (
              <div className="absolute top-1.5 right-1.5 bg-[#A88080] text-white text-[9px] tracking-shop px-1.5 py-0.5">
                SOON
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
