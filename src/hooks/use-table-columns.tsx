import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { TableColumn } from '@/types/table';

interface UseTableColumnsOptions<T> {
    columns: TableColumn<T>[];
}

interface UseTableColumnsReturn<T> {
    visibleColumns: string[];
    toggleColumn: (columnKey: string) => void;
    filteredColumns: TableColumn<T>[];
}

/**
 * Hook simple para manejar la visibilidad de columnas en tablas
 */
export function useTableColumns<T = any>({
    columns,
}: UseTableColumnsOptions<T>): UseTableColumnsReturn<T> {
    const [visibleColumns, setVisibleColumns] = useState<string[]>(
        columns.map(col => col.key as string)
    );

    const toggleColumn = (columnKey: string) => {
        setVisibleColumns(prev => {
            if (prev.includes(columnKey)) {
                // No permitir que se desmarquen todas las columnas
                if (prev.length === 1) {
                    toast.error('Debe mantener al menos una columna visible');
                    return prev;
                }
                return prev.filter(key => key !== columnKey);
            } else {
                return [...prev, columnKey];
            }
        });
    };
    const filteredColumns = useMemo<TableColumn<T>[]>
        (() => {
            return columns.filter(col => visibleColumns.includes(col.key as string));
        }, [visibleColumns]);
    return {
        visibleColumns,
        toggleColumn,
        filteredColumns,
    };
}
