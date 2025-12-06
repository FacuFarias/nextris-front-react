import type React from "react";
export interface TableColumn<T = any> {
    key: keyof T | string;
    label: string;
    sortable?: boolean;
    render?: (value: any, row: T, index: number) => React.ReactNode;
    className?: string;
    headerClassName?: string;
    hideOnMobile?: boolean;
}

export interface TableAction<T = any> {
    label: string;
    icon?: React.ReactNode;
    onClick: (row: T, index: number) => void;
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
    emptyMessage?: string;
    className?: string;
    showIndex?: boolean;
    onRowClick?: (row: T, index: number) => void;
    onRowDoubleClick?: (row: T, index: number) => void;
}
