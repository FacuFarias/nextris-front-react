import TablaDynamic from "@/components/TableDynamic";
import { useBodyParts } from "./hooks/useBodyParts";
import { useState } from "react";
import { bodyPartColumns } from "./components/columns";

export const PartesCuerpo = () => {

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const { bodyParts, isLoading } = useBodyParts();


    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold">Partes del Cuerpo</h2>
                <p className="text-muted-foreground">Gestión de partes del cuerpo para exámenes</p>
            </div>

            {isLoading ? (
                <div className='flex justify-center items-center h-40'>
                    <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                </div>
            ) : (
                <TablaDynamic
                    data={Array.isArray(bodyParts?.data) ? bodyParts.data : []}
                    columns={bodyPartColumns}
                    showIndex

                    pagination={{
                        page,
                        pageSize,
                        serverSide: false,
                        total: Array.isArray(bodyParts?.data) ? bodyParts.data.length : 0,
                    }}
                    onPaginationChange={handlePaginationChange}
                />
            )}
        </div>
    );
};
