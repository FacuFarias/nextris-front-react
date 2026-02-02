import { useState } from "react";
//shadcn ui
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
//icons and utilities
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
//types
import { TablePagination } from "./Pagination";
import type { DynamicTableProps, TableColumn } from "@/types/table";
//components

export function TablaDynamic<T extends Record<string, any>>({
    data,
    columns,
    actions = [],
    loading = false,
    emptyMessage = "No hay datos disponibles",
    className,
    showIndex = false,
    onRowClick,
    onRowDoubleClick,
    pagination,
    onPaginationChange,
    selectedRow,
    rowIdKey = 'guid' as keyof T,
}: DynamicTableProps<T>) {
    const [sortConfig, setSortConfig] = useState<{
        key: keyof T | string;
        direction: "asc" | "desc";
    } | null>(null);
    // Función para obtener el valor anidado de un objeto
    const getNestedValue = (obj: any, path: string): any => {
        return path.split(".").reduce((current, key) => current?.[key], obj);
    };

    // Función para ordenar los datos
    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0;

        const aValue = getNestedValue(a, sortConfig.key as string);
        const bValue = getNestedValue(b, sortConfig.key as string);

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === "string" && typeof bValue === "string") {
            return sortConfig.direction === "asc"
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
    });

    // Aplicar paginación local SOLO si serverSide es explícitamente false
    // Por defecto (serverSide undefined o true), se asume que el backend ya envió los datos paginados
    const paginatedData = pagination && pagination.serverSide === false
        ? sortedData.slice((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize)
        : sortedData;

    // Ajustar el índice para la paginación
    const getRowIndex = (index: number) => {
        return pagination
            ? (pagination.page - 1) * pagination.pageSize + index
            : index;
    };

    const handleSort = (column: TableColumn<T>) => {
        if (!column.sortable) return;

        setSortConfig((current) => {
            if (current?.key === column.key) {
                if (current.direction === "asc") {
                    return { key: column.key, direction: "desc" };
                } else {
                    return null; // Remove sorting
                }
            }
            return { key: column.key, direction: "asc" };
        });
    };

    const getSortIcon = (column: TableColumn<T>) => {
        if (!column.sortable) return null;

        if (sortConfig?.key === column.key) {
            return sortConfig.direction === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
                <ArrowDown className="ml-2 h-4 w-4" />
            );
        }
        return <ArrowUpDown className="ml-2 h-4 w-4" />;
    };

    const renderCellContent = (column: TableColumn<T>, row: T, index: number) => {
        const value = getNestedValue(row, column.key as string);

        if (column.render) {
            return column.render(value, row, index);
        }

        if (value === null || value === undefined) {
            return <span className="text-muted-foreground">-</span>;
        }

        return String(value);
    };

    const visibleActions = (row: T) =>
        actions.filter((action) => !action.hidden?.(row));

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="h-8 bg-muted animate-pulse rounded" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
            </div>
        );
    }

    return (
        <div className={cn("space-y-4 mt-5", className)}>
            <div className="rounded-md border overflow-hidden">
                <Table /* style={{ tableLayout: "fixed" }} */>
                    <TableHeader className="bg-brand-purple">
                        <TableRow className="hover:bg-brand-purple border-b-0">
                            {columns.map((column, index) => (
                                <TableHead
                                    key={index}
                                    className={cn(
                                        "text-white",
                                        column.headerClassName,
                                        column.sortable &&
                                        "cursor-pointer select-none",
                                        column.hideOnMobile && "hidden md:table-cell"
                                    )}
                                    onClick={() => handleSort(column)}
                                >
                                    <div className="flex items-center">
                                        {column.label}
                                        {getSortIcon(column)}
                                    </div>
                                </TableHead>
                            ))}
                            {actions.length > 0 && (
                                <TableHead className="w-[70px] text-white">Acciones</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length === 0 ? (
                            <TableRow className="">
                                <TableCell
                                    colSpan={
                                        columns.length +
                                        (showIndex ? 1 : 0) +
                                        (actions.length > 0 ? 1 : 0)
                                    }
                                    className="h-24 text-center text-muted-foreground "
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((row, index) => {
                                const isSelected = selectedRow && row[rowIdKey] === selectedRow[rowIdKey];
                                return (
                                    <TableRow
                                        key={getRowIndex(index)}
                                        className={cn(
                                            (onRowClick || onRowDoubleClick) && "cursor-pointer hover:bg-muted/50",
                                            isSelected && "bg-purple-100 hover:bg-purple-100/80 border-l-4 border-l-brand-purple",
                                            "animate-in fade-in slide-in-from-bottom-2 zoom-in-95 duration-500 ease-out"
                                        )}
                                        style={{
                                            animationDelay: `${index * 60}ms`,
                                            animationFillMode: 'both'
                                        }}
                                        onClick={() => onRowClick?.(row, getRowIndex(index))}
                                        onDoubleClick={() => onRowDoubleClick?.(row, getRowIndex(index))}
                                    >
                                        {columns.map((column, colIndex) => (
                                            <TableCell
                                                key={colIndex}
                                                className={cn(
                                                    column.className,
                                                    column.hideOnMobile && "hidden md:table-cell"
                                                )}
                                            >
                                                {renderCellContent(column, row, getRowIndex(index))}
                                            </TableCell>
                                        ))}
                                        {actions.length > 0 && (
                                            <TableCell>
                                                <TooltipProvider>
                                                    <div className="flex items-center gap-2">
                                                        {visibleActions(row).map((action, actionIndex) => (
                                                            <Tooltip key={actionIndex}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className={cn(
                                                                            "h-8 w-8 hover:bg-brand-purple/10 cursor-pointer",
                                                                            action.variant === "destructive" && "hover:bg-red-50 hover:text-red-600"

                                                                        )}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            action.onClick(row, getRowIndex(index));
                                                                        }}
                                                                        disabled={action.disabled?.(row)}
                                                                    >
                                                                        {action.icon}
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{action.label}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ))}
                                                    </div>
                                                </TooltipProvider>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
            {pagination && onPaginationChange && (
                <TablePagination
                    pagination={pagination}
                    onPaginationChange={onPaginationChange}
                />
            )}
        </div>
    );
}

export default TablaDynamic;