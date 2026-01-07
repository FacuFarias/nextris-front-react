export const GestionUsuarios = () => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
                    <p className="text-muted-foreground">Administración de usuarios del sistema</p>
                </div>
                <button className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90">
                    Nuevo Usuario
                </button>
            </div>

            <div className="border rounded-lg p-4">
                <p className="text-muted-foreground">Tabla de Usuarios</p>
            </div>
        </div>
    )
}
