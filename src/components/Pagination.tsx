import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import type { PaginationConfig } from "@/types/table";

import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ChevronDown,
} from "lucide-react";

interface TablePaginationProps {
    pagination: PaginationConfig;
    onPaginationChange: (page: number, pageSize: number) => void;
    perPageValue?: number;
    onPerPageChange?: (value: number) => void;
    perPageOptions?: number[];
    columns?: Array<{ key: string; label: string }>;
    visibleColumns?: string[];
    onToggleColumn?: (columnKey: string) => void;
    additionalControls?: React.ReactNode;
}

export function TablePagination({
    pagination,
    onPaginationChange,
    perPageValue,
    onPerPageChange,
    perPageOptions = [5, 10, 15, 20, 25, 30],
    columns,
    visibleColumns,
    onToggleColumn,
    additionalControls,
}: TablePaginationProps) {
    const { page, pageSize, total } = pagination;

    const totalPages = Math.ceil(total / pageSize);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            onPaginationChange(newPage, pageSize);
        }
    };

    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (
            let i = Math.max(2, page - delta);
            i <= Math.min(totalPages - 1, page + delta);
            i++
        ) {
            range.push(i);
        }

        if (page - delta > 2) {
            rangeWithDots.push(1, "...");
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (page + delta < totalPages - 1) {
            rangeWithDots.push("...", totalPages);
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    return (
        <div className="flex items-center justify-between px-2 py-4">
            {/* Selector de filas por página y columnas */}
            <div className="flex items-center gap-4">
                {onPerPageChange && perPageValue && (
                    <>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="per-page" className="text-sm font-medium text-gray-700">
                                Filas:
                            </Label>
                            <Select
                                value={perPageValue.toString()}
                                onValueChange={(value) => onPerPageChange(Number(value))}
                            >
                                <SelectTrigger className="w-20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {perPageOptions.map((option) => (
                                        <SelectItem key={option} value={option.toString()}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Selector de columnas visibles - Multi-select */}
                        {columns && visibleColumns && onToggleColumn && (
                            <div className="flex items-center gap-2">
                                <Label className="text-sm font-medium text-gray-700">
                                    Columnas:
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-[220px] justify-between">
                                            <span className="truncate">
                                                {visibleColumns.length === columns.length
                                                    ? 'Seleccione columnas'
                                                    : `${visibleColumns.length} de ${columns.length} columnas`}
                                            </span>
                                            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[220px] p-0" align="start">
                                        <div className="max-h-[300px] overflow-y-auto p-3">
                                            <div className="space-y-2">
                                                {columns.map((column) => (
                                                    <div
                                                        key={column.key}
                                                        className="flex items-center space-x-2 hover:bg-purple-100 p-1 rounded cursor-pointer"
                                                        onClick={() => onToggleColumn(column.key)}
                                                    >
                                                        <Checkbox
                                                            id={`column-${column.key}`}
                                                            checked={visibleColumns.includes(column.key)}
                                                            onCheckedChange={() => onToggleColumn(column.key)}
                                                            className="data-[state=checked]:bg-brand-purple data-[state=checked]:border-brand-purple"
                                                        />
                                                        <Label
                                                            htmlFor={`column-${column.key}`}
                                                            className="text-sm font-normal cursor-pointer flex-1"
                                                        >
                                                            {column.label}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}

                        {/* Controles adicionales */}
                        {additionalControls}
                    </>
                )}
            </div>

            {/* Paginación - siempre a la derecha */}
            <div className="flex justify-end space-x-2">
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0 bg-transparent"
                        onClick={() => handlePageChange(1)}
                        disabled={page <= 1}
                    >
                        <span className="sr-only">Ir a la primera página</span>
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0 bg-transparent"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                    >
                        <span className="sr-only">Ir a la página anterior</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center space-x-1">
                        {getVisiblePages().map((pageNum, index) => (
                            <Button
                                key={index}
                                variant={pageNum === page ? "default" : "outline"}
                                className={
                                    pageNum === page
                                        ? "h-8 w-8 p-0 bg-brand-purple hover:bg-brand-purple text-white"
                                        : "h-8 w-8 p-0 bg-transparent"
                                }
                                onClick={() =>
                                    typeof pageNum === "number" && handlePageChange(pageNum)
                                }
                                disabled={pageNum === "..."}
                            >
                                {pageNum}
                            </Button>
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0 bg-transparent"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages}
                    >
                        <span className="sr-only">Ir a la página siguiente</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0 bg-transparent"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={page >= totalPages}
                    >
                        <span className="sr-only">Ir a la última página</span>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
