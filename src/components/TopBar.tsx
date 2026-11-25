import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  MapPin,
  Search,
  Shirt,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { SearchMatch } from '../types/inventory';
import {
  formatCurrencyVND,
  formatDateVN,
  type InventoryStats,
} from '../utils/inventoryUtils';

interface TopBarProps {
  stats: InventoryStats;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  matches: SearchMatch[];
  activeMatchIndex: number;
  onSelectMatch: (index: number, openDrawer?: boolean) => void;
  onClearSearch: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
}

export function TopBar({
  stats,
  searchQuery,
  onSearchChange,
  matches,
  activeMatchIndex,
  onSelectMatch,
  onClearSearch,
  onExportJson,
  onImportJson,
}: TopBarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [dataMenuOpen, setDataMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const dataMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (!isTyping && e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchFocused(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
      if (dataMenuRef.current && !dataMenuRef.current.contains(e.target as Node)) {
        setDataMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const hasQuery = searchQuery.trim().length > 0;
  const showResultsDropdown = hasQuery && searchFocused;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 p-2.5 sm:p-4">
      <div className="pointer-events-auto mx-auto flex max-w-6xl flex-col gap-2.5 rounded-2xl border border-white/80 bg-white/90 px-3.5 py-2.5 shadow-lg shadow-slate-900/8 backdrop-blur-xl sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Brand & Live Occupancy Stats */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm shadow-sky-500/25">
              <Shirt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
                Shop Quần Áo • Kho Dồn Đơn 3D
              </h1>
              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                <span>
                  Đã dồn:{' '}
                  <strong className="font-bold text-slate-800">
                    {stats.occupied}/{stats.total}
                  </strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-emerald-600">
                  Còn trống: {stats.empty}
                </span>
              </div>
            </div>
          </div>

          {/* Search Input (Accent-insensitive by customer name) */}
          <div
            ref={searchWrapperRef}
            className="relative order-3 w-full md:order-2 md:max-w-md md:flex-1 lg:max-w-lg"
          >
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setSearchFocused(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && matches.length > 0) {
                    e.preventDefault();
                    const nextIdx =
                      activeMatchIndex >= 0 && activeMatchIndex < matches.length
                        ? activeMatchIndex
                        : 0;
                    onSelectMatch(nextIdx, false);
                  }
                }}
                placeholder="Tìm tên khách (không dấu, vd: linh, tuan)..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/90 pl-9 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
              {hasQuery ? (
                <div className="absolute right-2 flex items-center gap-1">
                  {matches.length > 0 && (
                    <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800">
                      {matches.length}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onClearSearch();
                      searchInputRef.current?.focus();
                    }}
                    title="Xóa tìm kiếm"
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <kbd className="pointer-events-none absolute right-2.5 hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:inline-block">
                  Ctrl+K
                </kbd>
              )}
            </div>

            {/* Minimized Active Search Strip */}
            {hasQuery && matches.length > 0 && !showResultsDropdown && (
              <div className="mt-1.5 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/95 px-2.5 py-1.5 text-xs shadow-sm">
                <button
                  type="button"
                  onClick={() => setSearchFocused(true)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <span className="truncate font-bold text-amber-950">
                    {matches[activeMatchIndex]?.item.customerName}
                  </span>
                  <span className="hidden truncate font-medium text-amber-800 sm:inline">
                    • {matches[activeMatchIndex]?.coordinateLabel}
                  </span>
                  <span className="shrink-0 font-extrabold text-emerald-700">
                    {formatCurrencyVND(matches[activeMatchIndex]?.item.totalAmount ?? 0)}
                  </span>
                  <span className="hidden shrink-0 text-[11px] text-slate-600 sm:inline">
                    ({formatDateVN(matches[activeMatchIndex]?.item.startDate ?? '')})
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  {matches.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          onSelectMatch(
                            (activeMatchIndex - 1 + matches.length) % matches.length
                          )
                        }
                        className="rounded-md bg-white p-1 text-slate-600 shadow-xs hover:bg-slate-100"
                        title="Kết quả trước"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-1 font-bold text-amber-900">
                        {activeMatchIndex + 1}/{matches.length}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onSelectMatch((activeMatchIndex + 1) % matches.length)
                        }
                        className="rounded-md bg-white p-1 text-slate-600 shadow-xs hover:bg-slate-100"
                        title="Kết quả tiếp"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={onClearSearch}
                    className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 shadow-xs hover:bg-slate-100"
                  >
                    Thoát
                  </button>
                </div>
              </div>
            )}

            {/* Search Dropdown Results: Coordinate + Total Amount + Start Date */}
            {showResultsDropdown && (
              <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white/98 shadow-2xl backdrop-blur-xl">
                {matches.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3 py-2 text-xs">
                      <span className="font-semibold text-slate-600">
                        Tìm thấy <strong className="text-slate-900">{matches.length}</strong>{' '}
                        chồng đồ khớp
                      </span>
                      <div className="flex items-center gap-1.5">
                        {matches.length > 1 && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                onSelectMatch(
                                  (activeMatchIndex - 1 + matches.length) % matches.length
                                )
                              }
                              className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <span className="text-[11px] font-bold text-slate-700">
                              {activeMatchIndex + 1}/{matches.length}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onSelectMatch((activeMatchIndex + 1) % matches.length)
                              }
                              className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={onClearSearch}
                          className="rounded-lg px-2 py-0.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-200/70 hover:text-slate-800"
                        >
                          Đóng tìm
                        </button>
                      </div>
                    </div>

                    <ul className="custom-scrollbar max-h-72 divide-y divide-slate-100 overflow-y-auto">
                      {matches.map((match, idx) => {
                        const isFront = match.coords.depth === 'FRONT';
                        const isActive = idx === activeMatchIndex;
                        return (
                          <li
                            key={match.slotKey}
                            className={`flex items-center justify-between gap-2 px-3 py-2.5 transition-colors ${
                              isActive ? 'bg-amber-50/90' : 'hover:bg-slate-50'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onSelectMatch(idx, false);
                                setSearchFocused(false);
                              }}
                              className="min-w-0 flex-1 text-left"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                  <span
                                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                      isFront ? 'bg-sky-500' : 'bg-orange-500'
                                    }`}
                                  />
                                  <span className="truncate text-sm font-extrabold text-slate-900">
                                    {match.item.customerName}
                                  </span>
                                </div>
                                <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-200/70">
                                  {formatCurrencyVND(match.item.totalAmount)}
                                </span>
                              </div>

                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                    isFront
                                      ? 'bg-sky-100 text-sky-800'
                                      : 'bg-orange-100 text-orange-800'
                                  }`}
                                >
                                  <MapPin className="h-3 w-3" />
                                  {match.coordinateLabel}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                  Dồn từ {formatDateVN(match.item.startDate)}
                                </span>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onSelectMatch(idx, true);
                                setSearchFocused(false);
                              }}
                              className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                            >
                              Mở ô
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-slate-500">
                    Không tìm thấy khách nào khớp với{' '}
                    <span className="font-semibold text-slate-800">“{searchQuery}”</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Backup / Restore Data Button ONLY */}
          <div ref={dataMenuRef} className="relative order-2 md:order-3">
            <button
              type="button"
              onClick={() => setDataMenuOpen((v) => !v)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50"
              title="Sao lưu / Khôi phục dữ liệu"
            >
              <Database className="h-4 w-4 text-sky-600" />
              <span className="hidden sm:inline">Sao lưu / Khôi phục</span>
              <span className="sm:hidden">Sao lưu</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImportJson(file);
                  e.target.value = '';
                }
                setDataMenuOpen(false);
              }}
            />

            {dataMenuOpen && (
              <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    onExportJson();
                    setDataMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Download className="h-4 w-4 text-sky-600" />
                  Xuất file sao lưu (.json)
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Upload className="h-4 w-4 text-emerald-600" />
                  Khôi phục từ file (.json)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
