export const GestionPacientes = () => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Gestión de Pacientes</h2>
                    <p className="text-muted-foreground">Administración de pacientes</p>
                </div>
                <button className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90">
                    Nuevo Paciente
                </button>
            </div>

            <div className="border rounded-lg p-4">
                <p className="text-muted-foreground">Tabla de Pacientes</p>
            </div>
        </div>
    )
}
