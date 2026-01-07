import TablaDynamic from "@/components/TableDynamic";
import { useLocations } from "./hooks/useLocations";
import { useState } from "react";
import { locationColumns } from "./components/columns";

export const Locations = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const { locations, isLoading } = useLocations();


    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Locations</h2>
                    <p className="text-muted-foreground">Gestión de ubicaciones</p>
                </div>
                <button className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90">
                    Nueva Location
                </button>
            </div>

            {isLoading ? (
                <div className='flex justify-center items-center h-40'>
                    <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                </div>
            ) : (
                <TablaDynamic
                    data={locations?.data || []}
                    columns={locationColumns}
                    showIndex
                    pagination={{
                        page,
                        pageSize,
                        serverSide: false,
                        total: locations?.data.length || 0,
                    }}
                    onPaginationChange={handlePaginationChange}
                />
            )}
        </div>
    )
}
