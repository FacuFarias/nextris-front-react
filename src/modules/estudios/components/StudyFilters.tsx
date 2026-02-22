import { Badge } from "@/components/ui/badge";

interface StudyFiltersProps {
    totalCount: number;
}

export const StudyFilters = ({ totalCount }: StudyFiltersProps) => {
    return (
        <div className="flex items-center gap-4 p-4 bg-white dark:bg-[#1a1b24] rounded-lg shadow-sm border dark:border-[rgba(255,255,255,0.07)] mb-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estudios con informe</span>
            <Badge variant="secondary" className="ml-auto dark:bg-purple-900/40 dark:text-purple-200">
                {totalCount} {totalCount === 1 ? "estudio" : "estudios"}
            </Badge>
        </div>
    );
};
