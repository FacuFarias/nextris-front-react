import type React from "react";
export interface TableColumn<T = any> {
    key: keyof T | string;
    label: string;
    sortable?: boolean;
    render?: (value: any, row: T, index: number) => React.ReactNode;
    className?: string;
    headerClassName?: string;
    hideOnMobile?: boolean;
    filterable?: boolean;
}

export interface TableAction<T = any> {
    label: string;
    icon?: React.ReactNode;
    onClick?: (row: T, index: number) => void;
    component?: (row: T, index: number) => React.ReactNode;
    variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
    disabled?: (row: T) => boolean;
    hidden?: (row: T) => boolean;
}

export interface PaginationConfig {
    page: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
    pageSizeOptions?: number[];
    showQuickJumper?: boolean;
    showTotal?: boolean;
    serverSide?: boolean; // Por defecto true (paginación del servidor). Usar false para paginación del cliente
}

export interface PaginationProps {
    pagination?: PaginationConfig;
    onPaginationChange?: (page: number, pageSize: number) => void;
}

export interface DynamicTableProps<T = any> extends PaginationProps {
    data: T[];
    columns: TableColumn<T>[];
    actions?: TableAction<T>[];
    loading?: boolean;
    emptyMessage?: string | React.ReactNode;
    className?: string;
    showIndex?: boolean;
    onRowClick?: (row: T, index: number) => void;
    onRowDoubleClick?: (row: T, index: number) => void;
    selectedRow?: T | null;
    rowIdKey?: keyof T;
    maxHeight?: string; // Altura máxima para hacer scroll solo en la tabla
    perPageValue?: number;
    onPerPageChange?: (value: number) => void;
    perPageOptions?: number[];
    allColumns?: TableColumn<T>[]; // Todas las columnas para el selector
    visibleColumns?: string[];
    onToggleColumn?: (columnKey: string) => void;
    additionalControls?: React.ReactNode; // Controles adicionales en la barra de paginación
    tableBackgroundImage?: string; // URL de imagen de fondo para el área de la tabla (light mode)
    tableBackgroundImageDark?: string; // URL de imagen de fondo en dark mode (crossfade automático)
    sortColumn?: string; // Columna de ordenamiento controlada externamente
    sortDirection?: "asc" | "desc"; // Dirección de ordenamiento controlada externamente
    onSortChange?: (column: string, direction: "asc" | "desc") => void; // Callback para cambios de sort
    serverSideFiltering?: boolean;
    onColumnFiltersChange?: (filters: Record<string, string>) => void;
    tableClassName?: string;
    preserveTableHeight?: boolean;
    stickyPagination?: boolean;
    compactSpacing?: boolean;
}
