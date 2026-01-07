export const PartesCuerpo = () => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Partes del Cuerpo</h2>
                    <p className="text-muted-foreground">Gestión de partes del cuerpo para exámenes</p>
                </div>
                <button className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90">
                    Nueva Parte del Cuerpo
                </button>
            </div>

            <div className="border rounded-lg p-4">
                <p className="text-muted-foreground">Tabla de Partes del Cuerpo</p>
            </div>
        </div>
    )
}
