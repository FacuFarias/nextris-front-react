import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";

interface StudyFiltersProps {
    status: "reported" | "pending" | "all";
    onStatusChange: (status: "reported" | "pending" | "all") => void;
    totalCount: number;
}

export const StudyFilters = ({ status, onStatusChange, totalCount }: StudyFiltersProps) => {
    return (
        <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border">
            <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>

            <Select value={status} onValueChange={onStatusChange}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todos los estudios" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos los estudios</SelectItem>
                    <SelectItem value="reported">Con informe</SelectItem>
                    <SelectItem value="pending">Sin informe</SelectItem>
                </SelectContent>
            </Select>

            <Badge variant="secondary" className="ml-auto">
                {totalCount} {totalCount === 1 ? "estudio" : "estudios"}
            </Badge>
        </div>
    );
};
