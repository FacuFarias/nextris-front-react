import { useState, useEffect, useRef } from "react";
import type { DragEvent, MouseEvent as ReactMouseEvent } from "react";
import { useTheme } from "@/context/ThemeContext";
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
import { ArrowUp, ArrowDown, Search, X, GripVertical, Copy, Check } from "lucide-react";
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
    onRowContextMenu,
    pagination,
    onPaginationChange,
    selectedRow,
    selectedRowIds,
    rowIdKey = 'guid' as keyof T,
    maxHeight,
    perPageValue,
    onPerPageChange,
    perPageOptions,
    allColumns,
    visibleColumns,
    onToggleColumn,
    fixedColumnKeys = [],
    onColumnOrderChange,
    additionalControls,
    tableBackgroundImage,
    tableBackgroundImageDark,
    sortColumn: controlledSortColumn,
    sortDirection: controlledSortDirection,
    onSortChange,
    serverSideFiltering = false,
    onColumnFiltersChange,
    tableClassName,
    preserveTableHeight = false,
    stickyPagination = false,
    compactSpacing = false,
}: DynamicTableProps<T>) {
    const getColumnKey = (column: TableColumn<T>) => String(column.key);
    const isControlledSort = controlledSortColumn !== undefined && onSortChange !== undefined;

    const [internalSortConfig, setInternalSortConfig] = useState<{
        key: keyof T | string;
        direction: "asc" | "desc";
    } | null>(null);

    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [openFilterColumn, setOpenFilterColumn] = useState<string | null>(null);
    const filterInputRef = useRef<HTMLInputElement>(null);
    const tableFrameRef = useRef<HTMLDivElement>(null);
    const tableHeaderRef = useRef<HTMLTableSectionElement>(null);
    const [internalVisibleColumns, setInternalVisibleColumns] = useState<string[]>(() =>
        columns.map((column) => getColumnKey(column))
    );
    const [minVisibleRows, setMinVisibleRows] = useState<number>(pagination?.pageSize ?? 0);

    useEffect(() => {
        const nextColumnKeys = columns.map((column) => getColumnKey(column));
        setInternalVisibleColumns((prev) => {
            const kept = prev.filter((key) => nextColumnKeys.includes(key));
            const newKeys = nextColumnKeys.filter((key) => !kept.includes(key));
            return [...kept, ...newKeys];
        });
    }, [columns]);

    const sortConfig = isControlledSort
        ? (controlledSortColumn ? { key: controlledSortColumn, direction: controlledSortDirection || "asc" } : null)
        : internalSortConfig;
    const [bgRevealed, setBgRevealed] = useState(false);
    const [dragState, setDragState] = useState<{ sourceKey: string | null; targetKey: string | null }>({ sourceKey: null, targetKey: null });
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
    const [resizingColumnKey, setResizingColumnKey] = useState<string | null>(null);
    const [copiedCellKey, setCopiedCellKey] = useState<string | null>(null);
    const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resizeStateRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';
    const hasBgImage = !!(tableBackgroundImage || tableBackgroundImageDark);
    const uniqueColumnsByKey = (sourceColumns: TableColumn<T>[]) => Array.from(
        new Map(sourceColumns.map((column) => [getColumnKey(column), column])).values()
    );
    const effectiveAllColumns = uniqueColumnsByKey(allColumns ?? columns);
    const requestedVisibleColumns = visibleColumns ?? internalVisibleColumns;
    const availableColumnKeys = new Set(columns.map(getColumnKey));
    const effectiveVisibleColumns = [
        ...Array.from(new Set(fixedColumnKeys.filter((key) => availableColumnKeys.has(key)))),
        ...Array.from(new Set(requestedVisibleColumns.filter(
            (key) => !fixedColumnKeys.includes(key) && availableColumnKeys.has(key)
        )))
    ];
    const columnsByKey = new Map(uniqueColumnsByKey(columns).map((column) => [getColumnKey(column), column]));
    const renderColumns = effectiveVisibleColumns
        .map((key) => columnsByKey.get(key))
        .filter((column): column is TableColumn<T> => Boolean(column));

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

    const handleCopyCell = (cellKey: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedCellKey(cellKey);
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = setTimeout(() => setCopiedCellKey(null), 1500);
    };

    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        };
    }, []);

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
    const filteredData = serverSideFiltering
        ? sortedData
        : hasActiveFilters
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
        const isSortable = column.sortable !== false;
        if (!isSortable) return;

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
        const isSortable = column.sortable !== false;
        if (!isSortable) return null;

        if (sortConfig?.key === column.key) {
            return sortConfig.direction === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
                <ArrowDown className="ml-2 h-4 w-4" />
            );
        }
        return null;
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

    const getCellTextValue = (column: TableColumn<T>, row: T): string => {
        const value = getNestedValue(row, column.key as string);
        if (value === null || value === undefined) return "";
        return String(value);
    };

    const renderCopyableCell = (column: TableColumn<T>, row: T, children: React.ReactNode) => {
        const cellKey = `${String(row[rowIdKey])}-${String(column.key)}`;
        const textValue = getCellTextValue(column, row);
        const isCopied = copiedCellKey === cellKey;

        if (!textValue || column.key === "_selection") {
            return children;
        }

        return (
            <div className="group/cell relative flex items-center min-w-0">
                <div className="min-w-0 flex-1">{children}</div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCell(cellKey, textValue);
                    }}
                    className={cn(
                        "ml-1 shrink-0 p-0.5 rounded transition-opacity cursor-pointer",
                        "opacity-0 group-hover/cell:opacity-100",
                        "hover:bg-purple-100 dark:hover:bg-purple-900/40",
                        isCopied && "opacity-100"
                    )}
                    title="Copiar"
                >
                    {isCopied ? (
                        <Check className="h-3 w-3 text-green-500" />
                    ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                </button>
            </div>
        );
    };

    const handleToggleColumn = (columnKey: string) => {
        if (fixedColumnKeys.includes(columnKey)) return;

        if (onToggleColumn) {
            onToggleColumn(columnKey);
            return;
        }

        setInternalVisibleColumns((prev) => {
            const allKeys = effectiveAllColumns.map((column) => getColumnKey(column));
            const currentlyVisible = prev.includes(columnKey);

            if (currentlyVisible && prev.length > 1) {
                return prev.filter((key) => key !== columnKey);
            }

            if (!currentlyVisible && allKeys.includes(columnKey)) {
                return [...prev, columnKey];
            }

            return prev;
        });
    };

    const handleColumnDrop = (event: DragEvent, targetKey: string) => {
        event.preventDefault();

        const sourceKey = event.dataTransfer.getData("text/plain");
        const sourceIsFixed = fixedColumnKeys.includes(sourceKey);
        const targetIsFixed = fixedColumnKeys.includes(targetKey);

        if (!sourceKey || sourceKey === targetKey || sourceIsFixed || targetIsFixed) {
            setDragState({ sourceKey: null, targetKey: null });
            return;
        }

        const sourceIndex = effectiveVisibleColumns.indexOf(sourceKey);
        const targetIndex = effectiveVisibleColumns.indexOf(targetKey);
        if (sourceIndex < 0 || targetIndex < 0) {
            setDragState({ sourceKey: null, targetKey: null });
            return;
        }

        const nextColumnKeys = [...effectiveVisibleColumns];
        const [movedColumn] = nextColumnKeys.splice(sourceIndex, 1);
        const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
        nextColumnKeys.splice(adjustedTargetIndex, 0, movedColumn);

        if (onColumnOrderChange) {
            onColumnOrderChange(nextColumnKeys);
        } else {
            setInternalVisibleColumns(nextColumnKeys);
        }

        setOpenFilterColumn(null);
        setDragState({ sourceKey: null, targetKey: null });
    };

    const handleResizeStart = (event: ReactMouseEvent<HTMLSpanElement>, columnKey: string) => {
        event.preventDefault();
        event.stopPropagation();

        const header = event.currentTarget.parentElement;
        if (!header) return;

        resizeStateRef.current = {
            key: columnKey,
            startX: event.clientX,
            startWidth: header.getBoundingClientRect().width,
        };
        setResizingColumnKey(columnKey);
    };

    useEffect(() => {
        if (!resizingColumnKey) return;

        const handleResizeMove = (event: globalThis.MouseEvent) => {
            const resizeState = resizeStateRef.current;
            if (!resizeState) return;

            const nextWidth = Math.max(56, Math.round(resizeState.startWidth + event.clientX - resizeState.startX));
            setColumnWidths((previous) => ({ ...previous, [resizeState.key]: nextWidth }));
        };

        const handleResizeEnd = () => {
            resizeStateRef.current = null;
            setResizingColumnKey(null);
        };

        window.addEventListener("mousemove", handleResizeMove);
        window.addEventListener("mouseup", handleResizeEnd);

        return () => {
            window.removeEventListener("mousemove", handleResizeMove);
            window.removeEventListener("mouseup", handleResizeEnd);
        };
    }, [resizingColumnKey]);

    const getColumnWidthStyle = (columnKey: string) => {
        const width = columnWidths[columnKey];
        return width ? { width: `${width}px`, minWidth: `${width}px` } : undefined;
    };

    const renderResizeHandle = (column: TableColumn<T>) => {
        const columnKey = getColumnKey(column);
        if (fixedColumnKeys.includes(columnKey) || column.resizable === false) return null;

        return (
            <span
                role="separator"
                aria-orientation="vertical"
                aria-label={`Ajustar ancho de ${column.label || columnKey}`}
                className={cn(
                    "absolute right-0 top-0 z-10 h-full w-1 cursor-col-resize",
                    "hover:bg-white/45",
                    resizingColumnKey === columnKey && "bg-white/60"
                )}
                onMouseDown={(event) => handleResizeStart(event, columnKey)}
                onClick={(event) => event.stopPropagation()}
            />
        );
    };

    const indexColumnWidth = 56;

    // Each button is w-8 (32px) + gap-1 (4px between buttons), plus 4px base.
    // Keep a minimum width so the header label "Acciones" is fully visible.
    const actionsColumnWidth = actions.length > 0 ? Math.max(actions.length * 36 + 16, 140) : 140;

    useEffect(() => {
        if (!preserveTableHeight || !pagination) return;

        const recalculateVisibleRows = () => {
            const frame = tableFrameRef.current;
            if (!frame) return;

            const headerHeight = tableHeaderRef.current?.getBoundingClientRect().height ?? 0;
            const sampleRow = frame.querySelector("tbody tr[data-row-kind='measure']") as HTMLTableRowElement | null;
            const rowHeight = sampleRow?.getBoundingClientRect().height ?? 36;

            if (rowHeight <= 0) return;

            const availableBodyHeight = frame.clientHeight - headerHeight;
            const fittedRows = Math.max(1, Math.floor(availableBodyHeight / rowHeight));
            const nextRows = Math.min(pagination.pageSize, fittedRows);

            setMinVisibleRows((prev) => (prev === nextRows ? prev : nextRows));
        };

        recalculateVisibleRows();

        if (typeof ResizeObserver !== "undefined" && tableFrameRef.current) {
            const resizeObserver = new ResizeObserver(() => recalculateVisibleRows());
            resizeObserver.observe(tableFrameRef.current);
            return () => resizeObserver.disconnect();
        }

        window.addEventListener("resize", recalculateVisibleRows);
        return () => window.removeEventListener("resize", recalculateVisibleRows);
    }, [preserveTableHeight, pagination?.pageSize, paginatedData.length]);

    const fillerRowsWhenEmpty = preserveTableHeight && pagination
        ? Math.max(0, minVisibleRows - 1)
        : 0;

    const fillerRowsWithData = preserveTableHeight && pagination
        ? Math.max(0, minVisibleRows - paginatedData.length)
        : 0;

    return (
        <div
            className={cn(
                "flex flex-col flex-1 min-h-0",
                compactSpacing ? "mt-0 gap-0" : "mt-5 space-y-4",
                className
            )}
        >
            {/* Contenedor externo: fondo fijo + borde. NO tiene overflow para que la imagen no scrollee */}
            <div
                ref={tableFrameRef}
                className={cn(
                    "rounded-xl border border-border/70 dark:border-[rgba(139,92,246,0.28)] relative flex-1 overflow-hidden backdrop-blur-sm bg-card/90 dark:bg-[linear-gradient(180deg,rgba(18,12,38,0.96),rgba(11,8,24,0.96))] shadow-[0_14px_34px_rgba(6,8,20,0.16)] dark:shadow-[0_18px_45px_rgba(6,4,16,0.65),inset_0_1px_0_rgba(255,255,255,0.05)]",
                    (tableBackgroundImage || tableBackgroundImageDark) && "bg-white/82 dark:bg-background/78"
                )}
                style={maxHeight ? { maxHeight } : {}}
            >
                {/* Capa light — queda fija, no scrollea */}
                {tableBackgroundImage && (
                    <div
                        className="absolute inset-0 pointer-events-none transition-opacity duration-700 ease-in-out"
                        style={{
                            backgroundImage: `url(${tableBackgroundImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundBlendMode: 'overlay',
                            opacity: isDark && tableBackgroundImageDark ? 0 : 1,
                        }}
                    />
                )}
                {/* Capa dark — queda fija, no scrollea */}
                {tableBackgroundImageDark && (
                    <div
                        className="absolute inset-0 pointer-events-none transition-opacity duration-700 ease-in-out"
                        style={{
                            backgroundImage: `url(${tableBackgroundImageDark})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundBlendMode: 'overlay',
                            opacity: isDark ? 1 : 0,
                        }}
                    />
                )}
                {/* Máscara permanente: blanca en light, negra en dark */}
                {(tableBackgroundImage || tableBackgroundImageDark) && (
                    <div className="absolute inset-0 z-1 bg-white/78 pointer-events-none transition-[background-color] duration-700 ease-in-out dark:bg-[#0f0820]/75" />
                )}
                {/* Máscara de reveal inicial (fade out al cargar) */}
                {(tableBackgroundImage || tableBackgroundImageDark) && (
                    <div
                        className={cn(
                            "absolute inset-0 z-1 bg-purple-50/80 dark:bg-[#0a0b14]/65 pointer-events-none transition-opacity duration-1200 ease-out",
                            bgRevealed ? "opacity-0" : "opacity-100"
                        )}
                    />
                )}
                {/* Contenedor interno: aquí ocurre el scroll, encima del fondo fijo */}
                <div className="relative z-2 h-full overflow-y-auto overflow-x-hidden table-scrollbar-purple">
                    <Table containerClassName="!overflow-visible" className={cn("w-full table-fixed select-none", tableClassName)}>
                    <TableHeader ref={tableHeaderRef} className="sticky top-0 z-20 bg-[linear-gradient(90deg,#6a1bb0,#4a148c)] dark:bg-[linear-gradient(90deg,#4a157a,#2d0d52)] border-b border-white/10 shadow-[0_6px_18px_rgba(32,12,62,0.35)]">
                        <TableRow className="bg-transparent hover:bg-transparent border-b-0">
                            {renderColumns.length > 0 && (() => {
                                const [firstColumn] = renderColumns;
                                const firstColKey = String(firstColumn.key);
                                return (
                                    <TableHead
                                        key={0}
                                        style={getColumnWidthStyle(firstColKey)}
                                        draggable={!fixedColumnKeys.includes(firstColKey)}
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData("text/plain", firstColKey);
                                            setDragState({ sourceKey: firstColKey, targetKey: null });
                                        }}
                                        onDragOver={(e) => {
                                            if (fixedColumnKeys.includes(firstColKey) || fixedColumnKeys.includes(dragState.sourceKey || "")) return;
                                            e.preventDefault();
                                            if (dragState.sourceKey !== firstColKey) {
                                                setDragState((prev) => ({ ...prev, targetKey: firstColKey }));
                                            }
                                        }}
                                        onDragLeave={() => {
                                            setDragState((prev) => ({ ...prev, targetKey: null }));
                                        }}
                                        onDrop={(e) => {
                                            handleColumnDrop(e, firstColKey);
                                        }}
                                        onDragEnd={() => {
                                            setDragState({ sourceKey: null, targetKey: null });
                                        }}
                                        className={cn(
                                            "relative text-white/95 text-left py-0 px-2 text-xs group/header overflow-hidden tracking-[0.015em]",
                                            firstColumn.headerClassName,
                                            firstColumn.sortable !== false &&
                                            "cursor-pointer select-none",
                                            firstColumn.hideOnMobile && "hidden md:table-cell",
                                            dragState.sourceKey === firstColKey && "opacity-50",
                                            dragState.targetKey === firstColKey && "bg-white/20"
                                        )}
                                        onClick={() => firstColumn.sortable !== false && handleSort(firstColumn)}
                                    >
                                        <div className="flex items-center min-w-0 gap-1">
                                            {!fixedColumnKeys.includes(firstColKey) && (
                                                <GripVertical className="h-3 w-3 shrink-0 opacity-40 cursor-grab active:cursor-grabbing" />
                                            )}
                                            {(() => {
                                                const colKey = String(firstColumn.key);
                                                const filterActive = !!columnFilters[colKey]?.trim();
                                                const isEditing = openFilterColumn === colKey;
                                                if (isEditing) {
                                                    return (
                                                        <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                                                            <input
                                                                ref={filterInputRef}
                                                                type="text"
                                                                placeholder={`${firstColumn.label}...`}
                                                                value={columnFilters[colKey] || ""}
                                                                autoFocus
                                                                onChange={(e) => {
                                                                    const nextFilters = { ...columnFilters, [colKey]: e.target.value };
                                                                    setColumnFilters(nextFilters);
                                                                    onColumnFiltersChange?.(nextFilters);
                                                                }}
                                                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setOpenFilterColumn(null); }}
                                                                onBlur={() => setOpenFilterColumn(null)}
                                                                className="w-full text-xs bg-white/25 dark:bg-white/10 text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-white/60 border border-white/30 dark:border-white/25 rounded px-2 py-0.5 outline-none focus:bg-white/35 dark:focus:bg-white/20"
                                                            />
                                                        </div>
                                                    );
                                                }
                                                if (firstColumn.headerRender) {
                                                    return firstColumn.headerRender();
                                                }
                                                return (
                                                    <>
                                                        {filterActive ? (
                                                            <div className="flex items-center gap-1 flex-1 min-w-0">
                                                                <span className="text-yellow-300 truncate text-xs">{columnFilters[colKey]}</span>
                                                                <button onClick={(e) => { e.stopPropagation(); const next = { ...columnFilters }; delete next[colKey]; setColumnFilters(next); onColumnFiltersChange?.(next); }} className="p-0.5 rounded hover:bg-white/20 dark:hover:bg-white/20 shrink-0">
                                                                    <X className="h-3 w-3 text-yellow-300" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="truncate min-w-0 text-xs">{firstColumn.label}</span>
                                                        )}
                                                        {firstColumn.filterable !== false && (
                                                            <button onClick={(e) => { e.stopPropagation(); setOpenFilterColumn(colKey); }} className={cn("ml-1 p-0.5 rounded hover:bg-white/20 dark:hover:bg-white/20 transition-all shrink-0", filterActive ? "opacity-100" : "opacity-0 group-hover/header:opacity-100")}>
                                                                <Search className={cn("h-3 w-3", filterActive ? "text-yellow-300" : "text-white/70")} />
                                                            </button>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <span className="ml-auto shrink-0">{getSortIcon(firstColumn)}</span>
                                        {renderResizeHandle(firstColumn)}
                                    </TableHead>
                                );
                            })()}
                            {actions.length > 0 && (
                                <TableHead
                                    style={{ width: `${actionsColumnWidth}px`, minWidth: `${actionsColumnWidth}px` }}
                                    className="text-white/95 text-left py-2 px-2 text-sm"
                                >
                                    Acciones
                                </TableHead>
                            )}
                            {showIndex && (
                                <TableHead
                                    style={{ width: `${indexColumnWidth}px`, minWidth: `${indexColumnWidth}px`, maxWidth: `${indexColumnWidth}px` }}
                                    className="text-white/95 py-2 px-2 text-xs text-center"
                                >
                                    #
                                </TableHead>
                            )}
                            {renderColumns.slice(1).map((column, index) => {
                                const colKey = column.key as string;
                                const isReorderable = !fixedColumnKeys.includes(colKey);
                                const filterActive = !!columnFilters[colKey]?.trim();
                                const isEditing = openFilterColumn === colKey;
                                const isSortable = column.sortable !== false;
                                const isFilterable = column.filterable !== false;
                                const isDragSource = dragState.sourceKey === colKey;
                                const isDragTarget = dragState.targetKey === colKey;
                                return (
                                    <TableHead
                                        key={index}
                                        style={getColumnWidthStyle(colKey)}
                                        draggable={isReorderable}
                                        onDragStart={(e) => {
                                            if (!isReorderable) return;
                                            e.dataTransfer.setData("text/plain", colKey);
                                            setDragState({ sourceKey: colKey, targetKey: null });
                                        }}
                                        onDragOver={(e) => {
                                            if (!isReorderable || fixedColumnKeys.includes(dragState.sourceKey || "")) return;
                                            e.preventDefault();
                                            if (dragState.sourceKey !== colKey) {
                                                setDragState((prev) => ({ ...prev, targetKey: colKey }));
                                            }
                                        }}
                                        onDragLeave={() => {
                                            setDragState((prev) => ({ ...prev, targetKey: null }));
                                        }}
                                        onDrop={(e) => {
                                            handleColumnDrop(e, colKey);
                                        }}
                                        onDragEnd={() => {
                                            setDragState({ sourceKey: null, targetKey: null });
                                        }}
                                        className={cn(
                                            "relative text-white/95 py-0 px-2 text-xs group/header overflow-hidden tracking-[0.015em]",
                                            column.headerClassName,
                                            isSortable && !isEditing &&
                                            "cursor-pointer select-none",
                                            column.hideOnMobile && "hidden md:table-cell",
                                            isDragSource && "opacity-50",
                                            isDragTarget && "bg-white/20"
                                        )}
                                        onClick={() => !isEditing && isSortable && handleSort(column)}
                                    >
                                        <div className="flex items-center min-w-0 gap-1">
                                            {isReorderable && (
                                                <GripVertical className="h-3 w-3 shrink-0 opacity-40 cursor-grab active:cursor-grabbing" />
                                            )}
                                            {isEditing ? (
                                                <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        ref={filterInputRef}
                                                        type="text"
                                                        placeholder={`${column.label}...`}
                                                        value={columnFilters[colKey] || ""}
                                                        autoFocus
                                                        onChange={(e) => {
                                                            const nextFilters = {
                                                                ...columnFilters,
                                                                [colKey]: e.target.value,
                                                            };
                                                            setColumnFilters(nextFilters);
                                                            onColumnFiltersChange?.(nextFilters);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" || e.key === "Escape") {
                                                                setOpenFilterColumn(null);
                                                            }
                                                        }}
                                                        onBlur={() => setOpenFilterColumn(null)}
                                                        className="w-full text-xs bg-white/25 dark:bg-white/10 text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-white/60 border border-white/30 dark:border-white/25 rounded px-2 py-0.5 outline-none focus:bg-white/35 dark:focus:bg-white/20"
                                                    />
                                                </div>
                                            ) : column.headerRender ? (
                                                column.headerRender()
                                            ) : (
                                                <>
                                                    {filterActive ? (
                                                        <div className="flex items-center gap-1 flex-1 min-w-0">
                                                            <span className="text-yellow-300 truncate text-xs">{columnFilters[colKey]}</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const next = { ...columnFilters };
                                                                    delete next[colKey];
                                                                    setColumnFilters(next);
                                                                    onColumnFiltersChange?.(next);
                                                                }}
                                                                className="p-0.5 rounded hover:bg-white/20 dark:hover:bg-white/20 shrink-0"
                                                            >
                                                                <X className="h-3 w-3 text-yellow-300" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="truncate min-w-0 text-xs">{column.label}</span>
                                                    )}
                                                    {isFilterable && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenFilterColumn(colKey);
                                                            }}
                                                            className={cn(
                                                                "ml-1 p-0.5 rounded hover:bg-white/20 dark:hover:bg-white/20 transition-all shrink-0",
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
                                        {renderResizeHandle(column)}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={
                                        renderColumns.length +
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
                                <TableRow className="bg-card/70 dark:bg-[#17122b]/72">
                                    <TableCell
                                        colSpan={
                                            renderColumns.length +
                                            (showIndex ? 1 : 0) +
                                            (actions.length > 0 ? 1 : 0)
                                        }
                                        className="h-10 text-center text-muted-foreground "
                                    >
                                        {emptyMessage}
                                    </TableCell>
                                </TableRow>
                                {preserveTableHeight && pagination && fillerRowsWhenEmpty > 0 &&
                                    Array.from({ length: fillerRowsWhenEmpty }).map((_, index) => (
                                        <TableRow key={`empty-row-when-no-data-${index}`} data-row-kind="measure" className="bg-card/70 dark:bg-transparent">
                                            <TableCell
                                                colSpan={
                                                    renderColumns.length +
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
                                    const isInSelectedSet = selectedRowIds?.has(String(row[rowIdKey]));
                                    return (
                                        <TableRow
                                            key={getRowIndex(index)}
                                            data-row-kind="measure"
                                            className={cn(
                                                "transition-colors duration-150",
                                                hasBgImage
                                                    ? "bg-transparent"
                                                    : "bg-card/65 odd:bg-card/75 dark:bg-[#140f27]/58 dark:odd:bg-[#1a1331]/65",
                                                (onRowClick || onRowDoubleClick) && hasBgImage && "cursor-pointer hover:bg-white/30 dark:hover:bg-purple-900/25",
                                                (onRowClick || onRowDoubleClick) && !hasBgImage && "cursor-pointer hover:bg-purple-100/40 dark:hover:bg-[#2a1848]/75",
                                                isSelected && "bg-purple-100/85 dark:bg-[#3a2060]/78 hover:bg-purple-100/90 dark:hover:bg-[#472676]/85 border-l-4 border-l-brand-purple dark:border-l-purple-300 dark:shadow-[inset_4px_0_12px_rgba(168,85,247,0.28)]",
                                                isInSelectedSet && !isSelected && "bg-purple-100/50 dark:bg-purple-900/30 hover:bg-purple-100/60 dark:hover:bg-purple-900/40",
                                                "animate-in fade-in duration-300 ease-out"
                                            )}
                                            style={{
                                                animationDelay: `${index * 40}ms`,
                                                animationFillMode: 'both'
                                            }}
                                            onClick={(e) => onRowClick?.(row, getRowIndex(index), e)}
                                            onDoubleClick={(e) => onRowDoubleClick?.(row, getRowIndex(index), e)}
                                            onMouseDown={(e) => {
                                                if (e.button !== 2 || !onRowContextMenu) return;
                                                e.preventDefault();
                                                onRowContextMenu(row, getRowIndex(index), e);
                                            }}
                                            onContextMenu={(e) => {
                                                if (onRowContextMenu) e.preventDefault();
                                            }}
                                        >
                                            {renderColumns.length > 0 && (() => {
                                                const [firstColumn] = renderColumns;
                                                return (
                                                    <TableCell
                                                        key={0}
                                                        style={getColumnWidthStyle(getColumnKey(firstColumn))}
                                                        className={cn(
                                                            "py-2 px-3 text-xs overflow-hidden whitespace-nowrap text-ellipsis",
                                                            firstColumn.className,
                                                            firstColumn.hideOnMobile && "hidden md:table-cell"
                                                        )}
                                                    >
                                                        {renderCopyableCell(firstColumn, row, renderCellContent(firstColumn, row, getRowIndex(index)))}
                                                    </TableCell>
                                                );
                                            })()}
                                            {actions.length > 0 && (
                                                <TableCell
                                                    style={{ width: `${actionsColumnWidth}px`, minWidth: `${actionsColumnWidth}px` }}
                                                    className="py-1 px-2 overflow-visible"
                                                >
                                                    <TooltipProvider>
                                                        <div className="flex items-center justify-start gap-1 w-max min-w-full whitespace-nowrap">
                                                            {actions.map((action, actionIndex) => {
                                                                const isHidden = action.hidden?.(row) ?? false;

                                                                if (isHidden) {
                                                                    return <div key={actionIndex} className="h-8 w-8 shrink-0" aria-hidden="true" />;
                                                                }

                                                                return action.component ? (
                                                                    <div key={actionIndex} className="h-8 w-8 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                                        {action.component(row, getRowIndex(index))}
                                                                    </div>
                                                                ) : (
                                                                    <Tooltip key={actionIndex}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className={cn(
                                                                                    "h-8 w-8 shrink-0 hover:bg-brand-purple/15 dark:hover:bg-purple-800/45 cursor-pointer",
                                                                                    action.variant === "destructive" && "hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
                                                                                )}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    action.onClick?.(row, getRowIndex(index));
                                                                                }}
                                                                                disabled={action.disabled?.(row)}
                                                                            >
                                                                                {typeof action.icon === "function" ? action.icon(row) : action.icon}
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="top" align="center" sideOffset={6}>
                                                                            <p>{typeof action.label === "function" ? action.label(row) : action.label}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                );
                                                            })}
                                                        </div>
                                                    </TooltipProvider>
                                                </TableCell>
                                            )}
                                            {showIndex && (
                                                <TableCell
                                                    style={{ width: `${indexColumnWidth}px`, minWidth: `${indexColumnWidth}px`, maxWidth: `${indexColumnWidth}px` }}
                                                    className="py-2 px-2 text-xs text-center text-muted-foreground"
                                                >
                                                    {getRowIndex(index) + 1}
                                                </TableCell>
                                            )}
                                            {renderColumns.slice(1).map((column, colIndex) => (
                                                <TableCell
                                                    key={colIndex + 1}
                                                    style={getColumnWidthStyle(getColumnKey(column))}
                                                    className={cn(
                                                        "py-2 px-3 text-xs overflow-hidden whitespace-nowrap text-ellipsis",
                                                        column.className,
                                                        column.hideOnMobile && "hidden md:table-cell"
                                                    )}
                                                >
                                                    {renderCopyableCell(column, row, renderCellContent(column, row, getRowIndex(index)))}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    );
                                })}
                                {preserveTableHeight && pagination && fillerRowsWithData > 0 &&
                                    Array.from({ length: fillerRowsWithData }).map((_, index) => (
                                        <TableRow key={`empty-row-${index}`} data-row-kind="measure" className={hasBgImage ? "bg-transparent" : "bg-card/65 dark:bg-transparent"}>
                                            <TableCell
                                                colSpan={
                                                    renderColumns.length +
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
                </div>{/* fin contenedor scroll interno */}
            </div>{/* fin contenedor fondo fijo */}
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
                        columns={effectiveAllColumns.map(col => ({ key: col.key as string, label: col.label }))}
                        visibleColumns={effectiveVisibleColumns}
                        onToggleColumn={handleToggleColumn}
                        fixedColumnKeys={fixedColumnKeys}
                        additionalControls={additionalControls}
                    />
                </div>
            )}
        </div>
    );
}

export default TablaDynamic;
