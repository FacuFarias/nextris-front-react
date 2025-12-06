import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { columns, type Patient } from "./columns";

interface PatientsTableProps {
    data: Patient[];
}

export const PatientsTable = ({ data }: PatientsTableProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Calcular índices para la paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(data.length / itemsPerPage);

    const handlePageChange = (pageNumber: number) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const handleItemsPerPageChange = (value: string) => {
        setItemsPerPage(Number(value));
        setCurrentPage(1);
    };

    return (
        <div className="space-y-4">
            {/* Tabla */}
            <div className="rounded-lg overflow-x-auto border border-gray-200">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-brand-purple hover:bg-brand-purple">
                            {columns.map((column) => (
                                <TableHead
                                    key={String(column.key)}
                                    className={`text-white font-semibold text-center text-sm px-3 py-3 ${column.hideOnMobile ? "hidden lg:table-cell" : ""
                                        }`}
                                >
                                    {column.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentItems.length > 0 ? (
                            currentItems.map((patient, index) => (
                                <TableRow
                                    key={patient.id}
                                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                                >
                                    {columns.map((column) => (
                                        <TableCell
                                            key={String(column.key)}
                                            className={`text-center text-gray-700 py-3 px-3 text-sm ${column.hideOnMobile ? "hidden lg:table-cell" : ""
                                                }`}
                                        >
                                            {column.render
                                                ? column.render(patient[column.key as keyof Patient], patient)
                                                : patient[column.key as keyof Patient] || "-"}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="text-center py-8 text-gray-500"
                                >
                                    No se encontraron pacientes
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Paginación */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Filas por página:</span>
                    <Select
                        value={String(itemsPerPage)}
                        onValueChange={handleItemsPerPageChange}
                        disabled={false}
                    >
                        <SelectTrigger className="w-[60px] sm:w-[70px]" disabled={false}>
                            <SelectValue placeholder="5" />
                        </SelectTrigger>
                        <SelectContent side="top" align="start">
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                        {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, data.length)} de {data.length}
                    </span>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-7 w-7 sm:h-8 sm:w-8 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                        >
                            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "ghost"}
                                size="icon"
                                onClick={() => handlePageChange(pageNum)}
                                className={
                                    currentPage === pageNum
                                        ? "h-7 w-7 sm:h-8 sm:w-8 bg-brand-purple hover:bg-brand-purple text-white text-xs sm:text-sm"
                                        : "h-7 w-7 sm:h-8 sm:w-8 text-gray-600 hover:bg-gray-100 text-xs sm:text-sm"
                                }
                            >
                                {pageNum}
                            </Button>
                        ))}

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="h-7 w-7 sm:h-8 sm:w-8 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                        >
                            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
