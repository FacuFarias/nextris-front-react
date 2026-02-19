import { useState, useEffect, useRef } from "react";
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
import { ArrowUpDown, ArrowUp, ArrowDown, Search, X } from "lucide-react";
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
    maxHeight,
    perPageValue,
    onPerPageChange,
    perPageOptions,
    allColumns,
    visibleColumns,
    onToggleColumn,
    additionalControls,
    tableBackgroundImage,
    sortColumn: controlledSortColumn,
    sortDirection: controlledSortDirection,
    onSortChange,
    tableClassName,
    preserveTableHeight = false,
    stickyPagination = false,
}: DynamicTableProps<T>) {
    const isControlledSort = controlledSortColumn !== undefined && onSortChange !== undefined;

    const [internalSortConfig, setInternalSortConfig] = useState<{
        key: keyof T | string;
        direction: "asc" | "desc";
    } | null>(null);

    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [openFilterColumn, setOpenFilterColumn] = useState<string | null>(null);
    const filterInputRef = useRef<HTMLInputElement>(null);

    const sortConfig = isControlledSort
        ? (controlledSortColumn ? { key: controlledSortColumn, direction: controlledSortDirection || "asc" } : null)
        : internalSortConfig;
    const [bgRevealed, setBgRevealed] = useState(false);

    useEffect(() => {
        if (tableBackgroundImage) {
            const timer = setTimeout(() => setBgRevealed(true), 50);
            return () => clearTimeout(timer);
        }
    }, [tableBackgroundImage]);

    // Función para obtener el valor anidado de un objeto
    const getNestedValue = (obj: any, path: string): any => {
        return path.split(".").reduce((current, key) => current?.[key], obj);
    };

    // Cuando el ordenamiento es controlado (servidor), los datos ya vienen ordenados del backend
    // y no se debe aplicar ordenamiento client-side para no romper el orden global
    const sortedData = isControlledSort
        ? [...data]
        : [...data].sort((a, b) => {
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

    // Aplicar filtros por columna (client-side sobre datos visibles)
    const hasActiveFilters = Object.values(columnFilters).some(v => v.trim() !== "");
    const filteredData = hasActiveFilters
        ? sortedData.filter(row =>
            Object.entries(columnFilters).every(([key, filterValue]) => {
                if (!filterValue.trim()) return true;
                const cellValue = getNestedValue(row, key);
                if (cellValue === null || cellValue === undefined) return false;
                return String(cellValue).toLowerCase().includes(filterValue.trim().toLowerCase());
            })
        )
        : sortedData;

    // Aplicar paginación local SOLO si serverSide es explícitamente false
    // Por defecto (serverSide undefined o true), se asume que el backend ya envió los datos paginados
    const paginatedData = pagination && pagination.serverSide === false
        ? filteredData.slice((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize)
        : filteredData;

    // Ajustar el índice para la paginación
    const getRowIndex = (index: number) => {
        return pagination
            ? (pagination.page - 1) * pagination.pageSize + index
            : index;
    };

    const handleSort = (column: TableColumn<T>) => {
        if (!column.sortable) return;

        if (isControlledSort) {
            const columnKey = column.key as string;
            if (controlledSortColumn === columnKey) {
                if (controlledSortDirection === "asc") {
                    onSortChange(columnKey, "desc");
                } else {
                    onSortChange("", "asc");
                }
            } else {
                onSortChange(columnKey, "asc");
            }
        } else {
            setInternalSortConfig((current) => {
                if (current?.key === column.key) {
                    if (current.direction === "asc") {
                        return { key: column.key, direction: "desc" };
                    } else {
                        return null;
                    }
                }
                return { key: column.key, direction: "asc" };
            });
        }
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

    // Each button is w-8 (32px) + gap-1 (4px between buttons), plus 4px base
    const actionsColumnWidth = actions.length > 0 ? actions.length * 36 + 4 : 90;

    return (
        <div className={cn("space-y-4 mt-5 flex flex-col flex-1 min-h-0", className)}>
            <div
                className={cn(
                    "rounded-md border relative flex-1 overflow-y-auto overflow-x-auto table-scrollbar-purple",
                    maxHeight && "overflow-y-auto",
                    tableBackgroundImage && "bg-white/82 dark:bg-background/90"
                )}
                style={{
                    ...(maxHeight ? { maxHeight } : {}),
                    ...(tableBackgroundImage ? {
                        backgroundImage: `url(${tableBackgroundImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundBlendMode: 'overlay',
                    } : {}),
                }}
            >
                {tableBackgroundImage && (
                    <div
                        className={cn(
                            "absolute inset-0 z-1 bg-purple-50 dark:bg-purple-950/20 pointer-events-none transition-opacity duration-1000 ease-out",
                            bgRevealed ? "opacity-0" : "opacity-100"
                        )}
                    />
                )}
                <Table className={cn("relative z-2 w-full", tableClassName)}>
                    <TableHeader className="bg-brand-purple sticky top-0 z-3">
                        <TableRow className="bg-brand-purple hover:bg-brand-purple border-b-0">
                            {columns.map((column, index) => {
                                const colKey = column.key as string;
                                const filterActive = !!columnFilters[colKey]?.trim();
                                const isEditing = openFilterColumn === colKey;
                                return (
                                    <TableHead
                                        key={index}
                                        className={cn(
                                            "text-white py-0 px-2 text-xs group/header overflow-hidden",
                                            column.headerClassName,
                                            column.sortable && !isEditing &&
                                            "cursor-pointer select-none",
                                            column.hideOnMobile && "hidden md:table-cell"
                                        )}
                                        onClick={() => !isEditing && handleSort(column)}
                                    >
                                        <div className="flex items-center">
                                            {isEditing ? (
                                                <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        ref={filterInputRef}
                                                        type="text"
                                                        placeholder={`${column.label}...`}
                                                        value={columnFilters[colKey] || ""}
                                                        autoFocus
                                                        onChange={(e) => {
                                                            setColumnFilters(prev => ({
                                                                ...prev,
                                                                [colKey]: e.target.value
                                                            }));
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" || e.key === "Escape") {
                                                                setOpenFilterColumn(null);
                                                            }
                                                        }}
                                                        onBlur={() => setOpenFilterColumn(null)}
                                                        className="w-full text-xs bg-background/30 dark:bg-foreground/10 text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-white/50 border border-border dark:border-white/30 rounded px-2 py-0.5 outline-none focus:bg-background/40 dark:focus:bg-foreground/20"
                                                    />
                                                </div>
                                            ) : (
                                                <>
                                                    {filterActive ? (
                                                        <div className="flex items-center gap-1 flex-1 min-w-0">
                                                            <span className="text-yellow-300 truncate text-xs">{columnFilters[colKey]}</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setColumnFilters(prev => {
                                                                        const next = { ...prev };
                                                                        delete next[colKey];
                                                                        return next;
                                                                    });
                                                                }}
                                                                className="p-0.5 rounded hover:bg-background/20 dark:hover:bg-white/20 shrink-0"
                                                            >
                                                                <X className="h-3 w-3 text-yellow-300" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span>{column.label}</span>
                                                    )}
                                                    {column.filterable && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenFilterColumn(colKey);
                                                            }}
                                                            className={cn(
                                                                "ml-1 p-0.5 rounded hover:bg-background/20 dark:hover:bg-white/20 transition-all shrink-0",
                                                                filterActive
                                                                    ? "opacity-100"
                                                                    : "opacity-0 group-hover/header:opacity-100"
                                                            )}
                                                        >
                                                            <Search className={cn(
                                                                "h-3 w-3",
                                                                filterActive ? "text-yellow-300" : "text-white/70"
                                                            )} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            {!isEditing && (
                                                <span className="ml-auto shrink-0">
                                                    {getSortIcon(column)}
                                                </span>
                                            )}
                                        </div>
                                    </TableHead>
                                );
                            })}
                            {actions.length > 0 && (
                                <TableHead
                                    style={{ width: `${actionsColumnWidth}px`, minWidth: `${actionsColumnWidth}px` }}
                                    className="text-white py-2 px-3 text-sm"
                                >
                                    Acciones
                                </TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={
                                        columns.length +
                                        (showIndex ? 1 : 0) +
                                        (actions.length > 0 ? 1 : 0)
                                    }
                                    className="h-40"
                                >
                                    <div className="flex justify-center items-center">
                                        <span className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500 dark:border-purple-400"></span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : paginatedData.length === 0 ? (
                            <>
                                <TableRow className="bg-card dark:bg-transparent">
                                    <TableCell
                                        colSpan={
                                            columns.length +
                                            (showIndex ? 1 : 0) +
                                            (actions.length > 0 ? 1 : 0)
                                        }
                                        className="h-10 text-center text-muted-foreground "
                                    >
                                        {emptyMessage}
                                    </TableCell>
                                </TableRow>
                                {preserveTableHeight && pagination && pagination.pageSize > 1 &&
                                    Array.from({ length: pagination.pageSize - 1 }).map((_, index) => (
                                        <TableRow key={`empty-row-when-no-data-${index}`} className="bg-card dark:bg-transparent">
                                            <TableCell
                                                colSpan={
                                                    columns.length +
                                                    (showIndex ? 1 : 0) +
                                                    (actions.length > 0 ? 1 : 0)
                                                }
                                                className="py-2 px-3 text-xs"
                                            >
                                                &nbsp;
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </>
                        ) : (
                            <>
                                {paginatedData.map((row, index) => {
                                    const isSelected = selectedRow && row[rowIdKey] === selectedRow[rowIdKey];
                                    return (
                                        <TableRow
                                            key={getRowIndex(index)}
                                            className={cn(
                                                "bg-card dark:bg-transparent",
                                                (onRowClick || onRowDoubleClick) && "cursor-pointer hover:bg-muted/50 dark:hover:bg-muted",
                                                isSelected && "bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-100/80 dark:hover:bg-purple-900/40 border-l-4 border-l-brand-purple dark:border-l-purple-500",
                                                "animate-in fade-in duration-300 ease-out"
                                            )}
                                            style={{
                                                animationDelay: `${index * 40}ms`,
                                                animationFillMode: 'both'
                                            }}
                                            onClick={() => onRowClick?.(row, getRowIndex(index))}
                                            onDoubleClick={() => onRowDoubleClick?.(row, getRowIndex(index))}
                                        >
                                            {columns.map((column, colIndex) => (
                                                <TableCell
                                                    key={colIndex}
                                                    className={cn(
                                                        "py-2 px-3 text-xs overflow-hidden whitespace-nowrap",
                                                        column.className,
                                                        column.hideOnMobile && "hidden md:table-cell"
                                                    )}
                                                >
                                                    {renderCellContent(column, row, getRowIndex(index))}
                                                </TableCell>
                                            ))}
                                            {actions.length > 0 && (
                                                <TableCell className="p-0">
                                                    <TooltipProvider>
                                                        <div className="flex items-center gap-1">
                                                            {visibleActions(row).map((action, actionIndex) => (
                                                                action.component ? (
                                                                    <div key={actionIndex} onClick={(e) => e.stopPropagation()}>
                                                                        {action.component(row, getRowIndex(index))}
                                                                    </div>
                                                                ) : (
                                                                    <Tooltip key={actionIndex}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className={cn(
                                                                                    "h-8 w-8 hover:bg-brand-purple/10 dark:hover:bg-purple-800/30 cursor-pointer",
                                                                                    action.variant === "destructive" && "hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
                                                                                )}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    action.onClick?.(row, getRowIndex(index));
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
                                                                )
                                                            ))}
                                                        </div>
                                                    </TooltipProvider>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })}
                                {preserveTableHeight && pagination && paginatedData.length < pagination.pageSize &&
                                    Array.from({ length: pagination.pageSize - paginatedData.length }).map((_, index) => (
                                        <TableRow key={`empty-row-${index}`} className="bg-card dark:bg-transparent">
                                            <TableCell
                                                colSpan={
                                                    columns.length +
                                                    (showIndex ? 1 : 0) +
                                                    (actions.length > 0 ? 1 : 0)
                                                }
                                                className="py-2 px-3 text-xs"
                                            >
                                                &nbsp;
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </>
                        )}
                    </TableBody>
                </Table>
            </div>
            {pagination && onPaginationChange && (
                <div className={cn(
                    stickyPagination && "sticky bottom-0 z-4 bg-card/95 dark:bg-card/95 backdrop-blur-sm border-t border-border"
                )}>
                    <TablePagination
                        pagination={pagination}
                        onPaginationChange={onPaginationChange}
                        perPageValue={perPageValue}
                        onPerPageChange={onPerPageChange}
                        perPageOptions={perPageOptions}
                        columns={allColumns?.map(col => ({ key: col.key as string, label: col.label }))}
                        visibleColumns={visibleColumns}
                        onToggleColumn={onToggleColumn}
                        additionalControls={additionalControls}
                    />
                </div>
            )}
        </div>
    );
}

export default TablaDynamic;
