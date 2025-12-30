import { MainLayout } from "@/layouts/layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Lock } from "lucide-react"
import { useState } from "react"

const informesPredefinidos = [
    { id: 1, titulo: "RMN TORAXICA" },
    { id: 2, titulo: "RMN PROSTATA" }
]

export const InformePredefinidos = () => {
    const [selectedInforme, setSelectedInforme] = useState<number | null>(null)
    const [bloqueados, setBloqueados] = useState({
        titulo: false,
        tecnica: false,
        hallazgos: false,
        impresiones: false,
        conclusiones: false
    })

    const toggleBloqueo = (campo: keyof typeof bloqueados) => {
        setBloqueados(prev => ({ ...prev, [campo]: !prev[campo] }))
    }

    return (
        <MainLayout>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-brand-purple p-2.5 rounded-lg">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-brand-purple">Informes Predefinidos</h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Lista de informes */}
                    <Card className="lg:col-span-1 h-fit">
                        <div className="p-4">
                            <h2 className="text-sm font-semibold text-brand-purple mb-3 flex items-center gap-2">
                                <div className="h-1 w-1 bg-brand-purple rounded-full"></div>
                                Lista de informes
                            </h2>
                            <div className="space-y-2">
                                {informesPredefinidos.map((informe) => (
                                    <button
                                        key={informe.id}
                                        onClick={() => setSelectedInforme(informe.id)}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-all ${selectedInforme === informe.id
                                            ? "bg-brand-purple text-white font-semibold shadow-md"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                    >
                                        {informe.titulo}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Formulario */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Título y tipo de estudio */}
                        <Card>
                            <div className="p-4">
                                <h2 className="text-sm font-semibold text-brand-purple mb-4 flex items-center gap-2">
                                    <div className="h-1 w-1 bg-brand-purple rounded-full"></div>
                                    Título y tipo de estudio
                                </h2>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Label htmlFor="titulo">Título del informe:</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Input
                                                id="titulo"
                                                placeholder="Título del informe"
                                                disabled={bloqueados.titulo}
                                                className="flex-1"
                                            />
                                            <button
                                                onClick={() => toggleBloqueo('titulo')}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${bloqueados.titulo
                                                    ? "bg-red-500 text-white hover:bg-red-600"
                                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                                    }`}
                                            >
                                                <Lock className="w-4 h-4" />
                                                Campo {bloqueados.titulo ? "bloqueado" : "desbloqueado"}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="tipo">Tipo de estudio:</Label>
                                        <Input
                                            id="tipo"
                                            placeholder="Tipo de estudio"
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Técnica de examen */}
                        <Card>
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-semibold text-brand-purple flex items-center gap-2">
                                        <div className="h-1 w-1 bg-brand-purple rounded-full"></div>
                                        Técnica de examen
                                    </h2>
                                    <button
                                        onClick={() => toggleBloqueo('tecnica')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${bloqueados.tecnica
                                            ? "bg-red-500 text-white hover:bg-red-600"
                                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                            }`}
                                    >
                                        <Lock className="w-4 h-4" />
                                        Campo {bloqueados.tecnica ? "bloqueado" : "desbloqueado"}
                                    </button>
                                </div>
                                <textarea
                                    disabled={bloqueados.tecnica}
                                    className="w-full min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Descripción de la técnica de examen..."
                                />
                            </div>
                        </Card>

                        {/* Hallazgos */}
                        <Card>
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-semibold text-brand-purple flex items-center gap-2">
                                        <div className="h-1 w-1 bg-brand-purple rounded-full"></div>
                                        Hallazgos
                                    </h2>
                                    <button
                                        onClick={() => toggleBloqueo('hallazgos')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${bloqueados.hallazgos
                                            ? "bg-red-500 text-white hover:bg-red-600"
                                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                            }`}
                                    >
                                        <Lock className="w-4 h-4" />
                                        Campo {bloqueados.hallazgos ? "bloqueado" : "desbloqueado"}
                                    </button>
                                </div>
                                <textarea
                                    disabled={bloqueados.hallazgos}
                                    className="w-full min-h-[150px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Hallazgos del estudio..."
                                />
                            </div>
                        </Card>

                        {/* Impresiones */}
                        <Card>
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-semibold text-brand-purple flex items-center gap-2">
                                        <div className="h-1 w-1 bg-brand-purple rounded-full"></div>
                                        Impresiones
                                    </h2>
                                    <button
                                        onClick={() => toggleBloqueo('impresiones')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${bloqueados.impresiones
                                            ? "bg-red-500 text-white hover:bg-red-600"
                                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                            }`}
                                    >
                                        <Lock className="w-4 h-4" />
                                        Campo {bloqueados.impresiones ? "bloqueado" : "desbloqueado"}
                                    </button>
                                </div>
                                <textarea
                                    disabled={bloqueados.impresiones}
                                    className="w-full min-h-[150px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Impresiones diagnósticas..."
                                />
                            </div>
                        </Card>

                        {/* Conclusiones */}
                        <Card>
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-semibold text-brand-purple flex items-center gap-2">
                                        <div className="h-1 w-1 bg-brand-purple rounded-full"></div>
                                        Conclusiones
                                    </h2>
                                    <button
                                        onClick={() => toggleBloqueo('conclusiones')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${bloqueados.conclusiones
                                            ? "bg-red-500 text-white hover:bg-red-600"
                                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                            }`}
                                    >
                                        <Lock className="w-4 h-4" />
                                        Campo {bloqueados.conclusiones ? "bloqueado" : "desbloqueado"}
                                    </button>
                                </div>
                                <textarea
                                    disabled={bloqueados.conclusiones}
                                    className="w-full min-h-[150px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Conclusiones del estudio..."
                                />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}
