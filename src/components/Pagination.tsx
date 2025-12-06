import { Button } from "@/components/ui/button";
import type { PaginationConfig } from "@/types/table";

import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

interface TablePaginationProps {
    pagination: PaginationConfig;
    onPaginationChange: (page: number, pageSize: number) => void;
}

export function TablePagination({
    pagination,
    onPaginationChange,
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

    if (total === 0) return null;

    return (
        <div className="flex items-center justify-between px-2 py-4">
            <div className="w-full flex justify-end space-x-2">
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
