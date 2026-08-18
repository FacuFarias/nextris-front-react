import { useState, useRef, useEffect, useCallback } from "react"
import { MainLayout } from "@/layouts/layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, FlaskConical, Monitor, Users, Settings } from "lucide-react"

// Institucional
import { Locations } from "./institucional/locations"
import { InformacionBasica } from "./institucional/informacion-basica"
import { ObrasSociales } from "./institucional/obras-sociales"
import { Tags } from "./institucional/tags"

// Exámenes
import { TiposEstudio } from "./examenes/tipos-estudio"
import { Modalidades } from "./examenes/modalidades"
import { PartesCuerpo } from "./examenes/partes-cuerpo"

// Equipos
import { Maquinas } from "./equipos/maquinas"
import { AgendasMaquinas } from "./equipos/agendas-maquinas"

// Usuarios/Personal
import { GestionUsuarios } from "./usuarios-personal/gestion-usuarios"
import { GestionPacientes } from "./usuarios-personal/gestion-pacientes"
import { MedicosSolicitantes } from "./usuarios-personal/medicos-solicitantes"
import { AgendaMedicos } from "./usuarios-personal/agenda-medicos"
import { GruposEstudio } from "./examenes/grupos-estudio/GruposEstudio"
import { ObraSocial } from "./examenes/obra-social/ObraSocial"

const mainTabs = [
    { value: "institucional", label: "Institucional", icon: Building2 },
    { value: "examenes", label: "Examenes", icon: FlaskConical },
    { value: "equipos", label: "Equipos", icon: Monitor },
    { value: "usuarios", label: "Usuarios / Personal", icon: Users },
]

const subTabClass = "px-3 py-1.5 text-xs font-medium rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none relative z-[1]"

const AnimatedSubTabs = ({
    defaultValue,
    tabs,
    children,
}: {
    defaultValue: string
    tabs: { value: string; label: string }[]
    children: React.ReactNode
}) => {
    const [activeSubTab, setActiveSubTab] = useState(defaultValue)
    const listRef = useRef<HTMLDivElement>(null)
    const refs = useRef<Map<string, HTMLButtonElement>>(new Map())
    const [pill, setPill] = useState({ left: 0, top: 0, width: 0, height: 0 })

    const updatePill = useCallback(() => {
        const el = refs.current.get(activeSubTab)
        const container = listRef.current
        if (el && container) {
            const cr = container.getBoundingClientRect()
            const tr = el.getBoundingClientRect()
            setPill({
                left: tr.left - cr.left,
                top: tr.top - cr.top,
                width: tr.width,
                height: tr.height,
            })
        }
    }, [activeSubTab])

    useEffect(() => {
        updatePill()
    }, [updatePill])

    useEffect(() => {
        window.addEventListener("resize", updatePill)
        return () => window.removeEventListener("resize", updatePill)
    }, [updatePill])

    return (
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
            <TabsList
                ref={listRef}
                className="relative bg-gray-50 dark:bg-[#2a2e32]  border-b border-gray-200 dark:border-gray-700 rounded-none h-auto p-1 px-2 justify-start gap-1 w-full"
            >
                {tabs.map((tab) => (
                    <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        ref={(el) => {
                            if (el) refs.current.set(tab.value, el)
                        }}
                        className={subTabClass}
                    >
                        {tab.label}
                    </TabsTrigger>
                ))}
                <div
                    className="absolute rounded-full bg-brand-purple transition-all duration-300 ease-in-out z-0"
                    style={{ left: pill.left, top: pill.top, width: pill.width, height: pill.height }}
                />
            </TabsList>
            {children}
        </Tabs>
    )
}

export const ConfiguracionTablas = () => {
    const [activeTab, setActiveTab] = useState("institucional")
    const tabsListRef = useRef<HTMLDivElement>(null)
    const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
    const [indicator, setIndicator] = useState({ left: 0, width: 0 })

    const updateIndicator = useCallback(() => {
        const activeEl = tabRefs.current.get(activeTab)
        const container = tabsListRef.current
        if (activeEl && container) {
            const containerRect = container.getBoundingClientRect()
            const tabRect = activeEl.getBoundingClientRect()
            setIndicator({
                left: tabRect.left - containerRect.left,
                width: tabRect.width,
            })
        }
    }, [activeTab])

    useEffect(() => {
        updateIndicator()
    }, [updateIndicator])

    useEffect(() => {
        window.addEventListener("resize", updateIndicator)
        return () => window.removeEventListener("resize", updateIndicator)
    }, [updateIndicator])

    return (
        <MainLayout>
            <div className="page-dark-gradient rounded-lg p-3 sm:p-6 shadow-sm z-10 h-full flex flex-col overflow-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-brand-purple p-2 rounded-lg">
                        <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-brand-purple dark:text-purple-400">Configuracion</h1>
                        <p className="text-sm text-muted-foreground dark:text-foreground">Administra la configuracion del sistema</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                    {/* Pestañas principales con indicador animado */}
                    <div className="relative shrink-0">
                        <TabsList
                            ref={tabsListRef}
                            className="bg-transparent border-b border-gray-200 dark:border-gray-700 rounded-none h-auto p-0 justify-start gap-0 w-full"
                        >
                            {mainTabs.map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    ref={(el) => {
                                        if (el) tabRefs.current.set(tab.value, el)
                                    }}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-transparent data-[state=active]:text-brand-purple dark:data-[state=active]:text-purple-400 data-[state=active]:bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-transparent shadow-none"
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {/* Indicador deslizante */}
                        <div
                            className="absolute bottom-0 h-0.5 bg-brand-purple dark:bg-purple-500 transition-all duration-300 ease-in-out"
                            style={{ left: indicator.left, width: indicator.width }}
                        />
                    </div>

                    {/* Tab Institucional */}
                    <TabsContent value="institucional" className="flex-1 mt-0">
                        <AnimatedSubTabs
                            defaultValue="datos-institucionales"
                            tabs={[
                                { value: "datos-institucionales", label: "Datos Institucionales" },
                                { value: "locations", label: "Ubicaciones" },
                                { value: "obras-sociales", label: "Obras Sociales" },
                                { value: "tags", label: "Tags" },
                            ]}
                        >
                            <TabsContent value="datos-institucionales" className="p-4">
                                <InformacionBasica />
                            </TabsContent>
                            <TabsContent value="locations" className="p-4">
                                <Locations />
                            </TabsContent>
                            <TabsContent value="obras-sociales" className="p-4">
                                <ObrasSociales />
                            </TabsContent>
                            <TabsContent value="tags" className="p-4">
                                <Tags />
                            </TabsContent>
                        </AnimatedSubTabs>
                    </TabsContent>

                    {/* Tab Examenes */}
                    <TabsContent value="examenes" className="flex-1 mt-0">
                        <AnimatedSubTabs
                            defaultValue="tipos-estudio"
                            tabs={[
                                { value: "tipos-estudio", label: "Tipos de Estudio" },
                                { value: "modalidades", label: "Modalidades" },
                                { value: "partes-cuerpo", label: "Partes del Cuerpo" },
                                { value: "grupos-estudio", label: "Grupos de Estudio" },
                                { value: "obra-social", label: "Obra Social" },
                            ]}
                        >
                            <TabsContent value="tipos-estudio" className="p-4">
                                <TiposEstudio />
                            </TabsContent>
                            <TabsContent value="modalidades" className="p-4">
                                <Modalidades />
                            </TabsContent>
                            <TabsContent value="partes-cuerpo" className="p-4">
                                <PartesCuerpo />
                            </TabsContent>
                            <TabsContent value="grupos-estudio" className="p-4">
                                <GruposEstudio />
                            </TabsContent>
                            <TabsContent value="obra-social" className="p-4">
                                <ObraSocial />
                            </TabsContent>
                        </AnimatedSubTabs>
                    </TabsContent>

                    {/* Tab Equipos */}
                    <TabsContent value="equipos" className="flex-1 mt-0">
                        <AnimatedSubTabs
                            defaultValue="maquinas"
                            tabs={[
                                { value: "maquinas", label: "Maquinas" },
                                { value: "agendas-maquinas", label: "Agendas de Maquinas" },
                            ]}
                        >
                            <TabsContent value="maquinas" className="p-4">
                                <Maquinas />
                            </TabsContent>
                            <TabsContent value="agendas-maquinas" className="p-4">
                                <AgendasMaquinas />
                            </TabsContent>
                        </AnimatedSubTabs>
                    </TabsContent>

                    {/* Tab Usuarios/Personal */}
                    <TabsContent value="usuarios" className="flex-1 mt-0">
                        <AnimatedSubTabs
                            defaultValue="gestion-usuarios"
                            tabs={[
                                { value: "gestion-usuarios", label: "Gestion de Usuarios" },
                                { value: "gestion-pacientes", label: "Gestion de Pacientes" },
                                { value: "medicos-solicitantes", label: "Medicos Solicitantes" },
                                { value: "agenda-medicos", label: "Agenda de Medicos" },
                            ]}
                        >
                            <TabsContent value="gestion-usuarios" className="p-4">
                                <GestionUsuarios />
                            </TabsContent>
                            <TabsContent value="gestion-pacientes" className="p-4">
                                <GestionPacientes />
                            </TabsContent>
                            <TabsContent value="medicos-solicitantes" className="p-4">
                                <MedicosSolicitantes />
                            </TabsContent>
                            <TabsContent value="agenda-medicos" className="p-4">
                                <AgendaMedicos />
                            </TabsContent>
                        </AnimatedSubTabs>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    )
}
