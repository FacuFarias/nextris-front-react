export const TiposEstudio = () => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Tipos de Estudio</h2>
                    <p className="text-muted-foreground">Gestión de tipos de estudios médicos</p>
                </div>
                <button className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90">
                    Nuevo Tipo de Estudio
                </button>
            </div>

            <div className="border rounded-lg p-4">
                <p className="text-muted-foreground">Tabla de Tipos de Estudio</p>
            </div>
        </div>
    )
}
