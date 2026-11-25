import { ArrowDownToLine, Compass, Eye, Layers, Tag } from 'lucide-react';
import { CAMERA_PRESETS } from '../constants/rackLayout';
import type { CameraPreset, SlotCoordinates } from '../types/inventory';
import { formatSlotCoordinate } from '../utils/inventoryUtils';

interface CameraControlsBarProps {
  activePreset: CameraPreset | null;
  xrayMode: boolean;
  showLabels: boolean;
  hoveredSlot: SlotCoordinates | null;
  onSelectPreset: (preset: CameraPreset) => void;
  onToggleXray: () => void;
  onToggleLabels: () => void;
}

export function CameraControlsBar({
  activePreset,
  xrayMode,
  showLabels,
  hoveredSlot,
  onSelectPreset,
  onToggleXray,
  onToggleLabels,
}: CameraControlsBarProps) {
  const presetOrder: Array<{ id: CameraPreset; label: string; icon: typeof Compass }> = [
    { id: 'front', label: CAMERA_PRESETS.front.label, icon: Eye },
    { id: 'angled', label: CAMERA_PRESETS.angled.label, icon: Compass },
    { id: 'top', label: CAMERA_PRESETS.top.label, icon: ArrowDownToLine },
  ];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 p-2.5 sm:p-4">
      {/* Bottom Status + Legend Row */}
      <div className="flex w-full max-w-7xl flex-wrap items-center justify-between gap-2">
        {/* Hovered Slot Live Coordinate Indicator (Desktop) */}
        <div className="pointer-events-auto hidden items-center gap-2 rounded-xl border border-white/80 bg-white/85 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-md backdrop-blur-md lg:flex">
          {hoveredSlot ? (
            <>
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  hoveredSlot.depth === 'FRONT' ? 'bg-sky-500' : 'bg-orange-500'
                }`}
              />
              <span className="font-bold text-slate-900">
                {formatSlotCoordinate(hoveredSlot)}
              </span>
            </>
          ) : (
            <span className="text-slate-500">
              Kéo chuột để xoay • Cuộn để phóng to • Bấm vào ô trên kệ để quản lý
            </span>
          )}
        </div>

        {/* Color Legend Pill */}
        <div className="pointer-events-auto mx-auto flex items-center gap-3 rounded-xl border border-white/80 bg-white/85 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-md backdrop-blur-md lg:mx-0">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500 ring-2 ring-sky-200" />
            TRƯỚC (Xanh dương / Denim)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-orange-200" />
            SAU (Vàng kem / Cam đất)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs border border-dashed border-slate-400" />
            Trống
          </span>
        </div>
      </div>

      {/* Main Camera Preset & View Mode Pill */}
      <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1 rounded-2xl border border-white/80 bg-white/90 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
        {presetOrder.map(({ id, label, icon: Icon }) => {
          const isActive = activePreset === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectPreset(id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}

        <div className="mx-1 h-5 w-px bg-slate-200" />

        <button
          type="button"
          onClick={onToggleLabels}
          className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${
            showLabels
              ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Ẩn/Hiện tên khách hàng nổi trên gói hàng 3D"
        >
          <Tag className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Nhãn tên</span>
        </button>

        <button
          type="button"
          onClick={onToggleXray}
          className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${
            xrayMode
              ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Làm mờ mặt mâm kệ để nhìn xuyên qua các tầng bên dưới"
        >
          <Layers className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Xuyên thấu kệ</span>
        </button>
      </div>
    </div>
  );
}
