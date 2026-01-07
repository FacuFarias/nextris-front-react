import { useFacilities } from "./hooks/useFacilities";

export const Facilities = () => {

    const { facilities } = useFacilities();

    console.log(facilities)
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Facilities</h2>
                    <p className="text-muted-foreground">Gestión de instalaciones médicas</p>
                </div>
                <button className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90">
                    Nueva Facility
                </button>
            </div>

            <div className="border rounded-lg p-4">
                {/* Aquí irá la tabla de facilities */}
                <p className="text-muted-foreground">Tabla de Facilities</p>
            </div>
        </div>
    )
}
