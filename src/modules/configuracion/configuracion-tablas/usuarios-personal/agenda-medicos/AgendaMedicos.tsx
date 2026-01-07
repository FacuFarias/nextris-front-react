export const AgendaMedicos = () => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Agenda de Médicos</h2>
                    <p className="text-muted-foreground">Gestión de agendas de médicos</p>
                </div>
                <button className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90">
                    Nueva Agenda
                </button>
            </div>

            <div className="border rounded-lg p-4">
                <p className="text-muted-foreground">Calendario de Agendas de Médicos</p>
            </div>
        </div>
    )
}
