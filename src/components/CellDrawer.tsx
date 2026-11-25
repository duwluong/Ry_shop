import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  PackageCheck,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type {
  CellCoordinates,
  ColumnNumber,
  DepthPosition,
  PackageItem,
  SlotCoordinates,
} from '../types/inventory';
import {
  formatCellCoordinate,
  formatCurrencyVND,
  formatDateVN,
  formatThousandsInput,
  getTodayISODate,
  makeSlotKey,
  parseCurrencyInput,
} from '../utils/inventoryUtils';

interface CellDrawerProps {
  selectedCell: CellCoordinates | null;
  focusedDepth: DepthPosition;
  frontItem?: PackageItem;
  backItem?: PackageItem;
  onClose: () => void;
  onChangeCell: (cell: CellCoordinates) => void;
  onFocus3DCell: (coords: SlotCoordinates) => void;
  onSaveSlot: (
    depth: DepthPosition,
    data: { customerName: string; totalAmount: number; startDate: string }
  ) => void;
  onDeliverSlot: (depth: DepthPosition) => void;
  onDeliverFrontAndPullBack: () => void;
  onPullBackToFront: () => void;
}

interface SlotCardProps {
  depth: DepthPosition;
  item?: PackageItem;
  isFocused: boolean;
  onSave: (data: {
    customerName: string;
    totalAmount: number;
    startDate: string;
  }) => void;
  onDeliver: () => void;
  onFocus3D: () => void;
}

const QUICK_ADD_PRESETS = [
  { label: '+50k', value: 50000 },
  { label: '+100k', value: 100000 },
  { label: '+150k', value: 150000 },
  { label: '+200k', value: 200000 },
  { label: '+500k', value: 500000 },
];

function SlotCard({
  depth,
  item,
  isFocused,
  onSave,
  onDeliver,
  onFocus3D,
}: SlotCardProps) {
  const isFront = depth === 'FRONT';
  const [customerName, setCustomerName] = useState(item?.customerName ?? '');
  const [totalAmount, setTotalAmount] = useState<number>(item?.totalAmount ?? 0);
  const [startDate, setStartDate] = useState<string>(
    item?.startDate ?? getTodayISODate()
  );
  const [extraAmountInput, setExtraAmountInput] = useState('');
  const [error, setError] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCustomerName(item?.customerName ?? '');
    setTotalAmount(item?.totalAmount ?? 0);
    setStartDate(item?.startDate ?? getTodayISODate());
    setExtraAmountInput('');
    setError('');
  }, [item, depth]);

  useEffect(() => {
    if (isFocused && !item) {
      const t = setTimeout(() => nameInputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [isFocused, item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customerName.trim();
    if (!trimmed) {
      setError('Vui lòng nhập tên khách hàng.');
      nameInputRef.current?.focus();
      return;
    }
    onSave({
      customerName: trimmed,
      totalAmount: Math.max(0, totalAmount),
      startDate: startDate || getTodayISODate(),
    });
    setError('');
  };

  const handleQuickAdd = (delta: number) => {
    setTotalAmount((prev) => Math.min(999_999_999, Math.max(0, prev + delta)));
  };

  const handleAddExtraInput = () => {
    const extra = parseCurrencyInput(extraAmountInput);
    if (extra <= 0) return;
    handleQuickAdd(extra);
    setExtraAmountInput('');
  };

  const hasUnsavedChanges =
    !item ||
    customerName.trim() !== item.customerName ||
    totalAmount !== item.totalAmount ||
    startDate !== item.startDate;

  const borderTheme = isFocused
    ? isFront
      ? 'border-sky-400 ring-2 ring-sky-500/20'
      : 'border-orange-400 ring-2 ring-orange-500/20'
    : 'border-slate-200';

  return (
    <div
      className={`rounded-2xl border bg-white p-3.5 shadow-xs transition ${borderTheme}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-extrabold ${
              isFront
                ? 'bg-sky-100 text-sky-800'
                : 'bg-orange-100 text-orange-800'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isFront ? 'bg-sky-500' : 'bg-orange-500'
              }`}
            />
            {isFront ? 'Vị trí TRƯỚC (Ngoài)' : 'Vị trí SAU (Trong)'}
          </span>
          <span
            className={`text-[11px] font-bold ${
              item ? 'text-slate-600' : 'text-emerald-600'
            }`}
          >
            {item ? `${formatCurrencyVND(item.totalAmount)}` : 'Còn trống'}
          </span>
        </div>

        <button
          type="button"
          onClick={onFocus3D}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          title="Zoom 3D tới vị trí này"
        >
          <Crosshair className="h-4 w-4" />
        </button>
      </div>

      {/* 3-Field Form (Always directly editable for fast consolidation) */}
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        {/* Field 1: Tên khách hàng */}
        <div>
          <label className="mb-1 block text-[11px] font-bold text-slate-600">
            1. Tên khách hàng <span className="text-rose-500">*</span>
          </label>
          <input
            ref={nameInputRef}
            type="text"
            value={customerName}
            onChange={(e) => {
              setCustomerName(e.target.value);
              if (error) setError('');
            }}
            placeholder="VD: Chị Linh, Anh Tuấn..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
          {error && <p className="mt-1 text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        {/* Field 2: Tổng tiền (VNĐ) + Cộng nhanh tiền dồn đơn */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-600">
              2. Tổng tiền (VNĐ)
            </label>
            <span className="text-xs font-extrabold text-emerald-700">
              {formatCurrencyVND(totalAmount)}
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={formatThousandsInput(totalAmount)}
              onChange={(e) => setTotalAmount(parseCurrencyInput(e.target.value))}
              placeholder="0"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-9 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              đ
            </span>
          </div>

          {/* Quick-add buttons for order consolidation */}
          <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50/90 p-2">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Cộng nhanh khi khách dồn thêm đơn
            </div>
            <div className="flex flex-wrap gap-1">
              {QUICK_ADD_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleQuickAdd(preset.value)}
                  className="rounded-lg border border-sky-200 bg-white px-2 py-1 text-[11px] font-extrabold text-sky-700 shadow-2xs transition hover:bg-sky-50 active:scale-95"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="numeric"
                  value={extraAmountInput}
                  onChange={(e) => {
                    const num = parseCurrencyInput(e.target.value);
                    setExtraAmountInput(num > 0 ? formatThousandsInput(num) : '');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddExtraInput();
                    }
                  }}
                  placeholder="Nhập tiền đơn mới (vd: 185.000)"
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-2.5 pr-6 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                  đ
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddExtraInput}
                disabled={parseCurrencyInput(extraAmountInput) <= 0}
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-2.5 text-[11px] font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Plus className="h-3.5 w-3.5" />
                Cộng
              </button>
            </div>
          </div>
        </div>

        {/* Field 3: Ngày bắt đầu dồn */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-600">
              3. Ngày bắt đầu dồn
            </label>
            {startDate && (
              <span className="text-[11px] font-semibold text-slate-500">
                {formatDateVN(startDate)}
              </span>
            )}
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        {/* Core Slot Actions: Lưu cập nhật & Đã giao / Xóa trống */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            className={`inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-extrabold text-white shadow-sm transition active:scale-[0.99] ${
              isFront
                ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20'
                : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
            } ${item && !hasUnsavedChanges ? 'opacity-85' : ''}`}
          >
            <CheckCircle2 className="h-4 w-4" />
            Lưu cập nhật
          </button>

          {item && (
            <button
              type="button"
              onClick={onDeliver}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.99]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Đã giao / Xóa trống
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export function CellDrawer({
  selectedCell,
  focusedDepth,
  frontItem,
  backItem,
  onClose,
  onChangeCell,
  onFocus3DCell,
  onSaveSlot,
  onDeliverSlot,
  onDeliverFrontAndPullBack,
  onPullBackToFront,
}: CellDrawerProps) {
  if (!selectedCell) return null;

  const stepColumn = (delta: -1 | 1) => {
    const flatIdx = (selectedCell.rack - 1) * 6 + (selectedCell.col - 1);
    const nextIdx = (flatIdx + delta + 12) % 12;
    const nextRack = (nextIdx < 6 ? 1 : 2) as 1 | 2;
    const nextCol = ((nextIdx % 6) + 1) as ColumnNumber;
    onChangeCell({ rack: nextRack, tier: selectedCell.tier, col: nextCol });
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-end md:items-stretch">
      <div
        onClick={onClose}
        className="pointer-events-auto fixed inset-0 bg-slate-900/25 backdrop-blur-[1px] md:bg-transparent md:backdrop-blur-none"
      />

      <aside className="pointer-events-auto relative flex max-h-[88vh] w-full flex-col rounded-t-3xl border border-slate-200/90 bg-slate-50/96 shadow-2xl backdrop-blur-xl md:my-3 md:mr-3 md:max-h-[calc(100vh-24px)] md:w-[420px] md:rounded-3xl">
        <div className="flex justify-center pt-2.5 md:hidden">
          <div className="h-1.5 w-12 rounded-full bg-slate-300" />
        </div>

        {/* Drawer Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 px-4 py-3.5">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ô dồn đơn trên kệ
            </div>
            <h2 className="text-base font-extrabold text-slate-900">
              {formatCellCoordinate(selectedCell)}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => stepColumn(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              title="Ô bên trái"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => stepColumn(1)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              title="Ô bên phải"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600"
              title="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Slot Cards */}
        <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
          {/* Core Smart Action: Giao khách TRƯỚC (Đẩy khách SAU lên trước) */}
          {frontItem && backItem && (
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 p-3 shadow-xs">
              <button
                type="button"
                onClick={onDeliverFrontAndPullBack}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2.5 text-xs font-extrabold text-white shadow-md shadow-emerald-600/20 transition hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99]"
              >
                <PackageCheck className="h-4 w-4 shrink-0" />
                <span>Giao khách TRƯỚC (Đẩy khách SAU lên trước)</span>
              </button>
              <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-600">
                <span className="truncate font-bold text-sky-700">
                  Giao: {frontItem.customerName}
                </span>
                <ArrowRight className="h-3 w-3 shrink-0 text-slate-400" />
                <span className="truncate font-bold text-orange-700">
                  Lên trước: {backItem.customerName}
                </span>
              </div>
            </div>
          )}

          {!frontItem && backItem && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50/90 p-3">
              <button
                type="button"
                onClick={onPullBackToFront}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-sky-700"
              >
                <ArrowRight className="h-4 w-4" />
                Đẩy khách SAU ({backItem.customerName}) lên TRƯỚC
              </button>
            </div>
          )}

          <SlotCard
            key={`${makeSlotKey(selectedCell.rack, selectedCell.tier, selectedCell.col, 'FRONT')}_${frontItem?.updatedAt ?? 'empty'}`}
            depth="FRONT"
            item={frontItem}
            isFocused={focusedDepth === 'FRONT'}
            onSave={(data) => onSaveSlot('FRONT', data)}
            onDeliver={() => onDeliverSlot('FRONT')}
            onFocus3D={() => onFocus3DCell({ ...selectedCell, depth: 'FRONT' })}
          />

          <SlotCard
            key={`${makeSlotKey(selectedCell.rack, selectedCell.tier, selectedCell.col, 'BACK')}_${backItem?.updatedAt ?? 'empty'}`}
            depth="BACK"
            item={backItem}
            isFocused={focusedDepth === 'BACK'}
            onSave={(data) => onSaveSlot('BACK', data)}
            onDeliver={() => onDeliverSlot('BACK')}
            onFocus3D={() => onFocus3DCell({ ...selectedCell, depth: 'BACK' })}
          />
        </div>
      </aside>
    </div>
  );
}
