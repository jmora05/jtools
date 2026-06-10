import { ChevronLeft, ChevronRight } from 'lucide-react';

function getPageNumbers(current: number, total: number): (number | '...')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (current > 3) pages.push('...');
    const start = Math.max(2, current - 1);
    const end   = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
}

interface SmartPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export function SmartPagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }: SmartPaginationProps) {
    if (totalPages <= 1) return null;
    const from = (currentPage - 1) * itemsPerPage + 1;
    const to   = Math.min(currentPage * itemsPerPage, totalItems);
    return (
        <div className="flex flex-col items-center gap-2 px-4 py-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                    page === '...' ? (
                        <span key={`e${idx}`} className="w-8 text-center text-gray-400 text-sm select-none">…</span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`h-8 w-8 text-xs font-semibold rounded-md transition-colors ${
                                currentPage === page
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >{page}</button>
                    )
                )}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
            <span className="text-xs text-gray-400">Mostrando {from}–{to} de {totalItems}</span>
        </div>
    );
}
