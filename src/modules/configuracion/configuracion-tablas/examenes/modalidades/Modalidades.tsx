export const Modalidades = () => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Modalidades</h2>
                    <p className="text-muted-foreground">Gestión de modalidades de exámenes</p>
                </div>
                <button className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90">
                    Nueva Modalidad
                </button>
            </div>

            <div className="border rounded-lg p-4">
                <p className="text-muted-foreground">Tabla de Modalidades</p>
            </div>
        </div>
    )
}
