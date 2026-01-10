import { MainLayout } from "@/layouts/layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Institucional
import { Facilities } from "./institucional/facilities"
import { Locations } from "./institucional/locations"
import { InformacionBasica } from "./institucional/informacion-basica"
import { FlujoTrabajo } from "./institucional/flujo-trabajo"
import { ServidorSmtp } from "./institucional/servidor-smtp"
import { DatosBackend } from "./institucional/datos-backend"
import { WhatsApp } from "./institucional/whatsapp"

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

export const ConfiguracionTablas = () => {
    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Configuración</h1>
                    <p className="text-muted-foreground">Administra la configuración del sistema</p>
                </div>

                <Tabs defaultValue="institucional" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger
                            value="institucional"
                            className="data-[state=active]:bg-brand-purple data-[state=active]:text-white"
                        >
                            INSTITUCIONAL
                        </TabsTrigger>
                        <TabsTrigger
                            value="examenes"
                            className="data-[state=active]:bg-brand-purple data-[state=active]:text-white"
                        >
                            EXÁMENES
                        </TabsTrigger>
                        <TabsTrigger
                            value="equipos"
                            className="data-[state=active]:bg-brand-purple data-[state=active]:text-white"
                        >
                            EQUIPOS
                        </TabsTrigger>
                        <TabsTrigger
                            value="usuarios"
                            className="data-[state=active]:bg-brand-purple data-[state=active]:text-white"
                        >
                            USUARIOS/PERSONAL
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab Institucional */}
                    <TabsContent value="institucional" className="space-y-4">
                        <Tabs defaultValue="facilities" className="w-full">
                            <TabsList className="w-full justify-start flex-wrap h-auto">
                                <TabsTrigger value="facilities" className="data-[state=active]:bg-brand-purple data-[state=active]:text-white">Instituciones</TabsTrigger>
                                <TabsTrigger value="locations" className="data-[state=active]:bg-brand-purple data-[state=active]:text-white">Ubicaciones</TabsTrigger>
                                <TabsTrigger value="informacion" className="data-[state=active]:bg-brand-purple data-[state=active]:text-white">Información Básica</TabsTrigger>
                                <TabsTrigger value="flujo" className="data-[state=active]:bg-brand-purple data-[state=active]:text-white">Flujo de Trabajo</TabsTrigger>
                            </TabsList>

                            <TabsContent value="facilities">
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                                    <Facilities />
                                </div>
                            </TabsContent>

                            <TabsContent value="locations">
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                                    <Locations />
                                </div>
                            </TabsContent>

                            <TabsContent value="informacion">
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                                    <InformacionBasica />
                                </div>
                            </TabsContent>

                            <TabsContent value="flujo">
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                                    <FlujoTrabajo />
                                </div>
                            </TabsContent>

                            <TabsContent value="smtp">
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                                    <ServidorSmtp />
                                </div>
                            </TabsContent>

                            <TabsContent value="backend">
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                                    <DatosBackend />
                                </div>
                            </TabsContent>

                            <TabsContent value="whatsapp">
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                                    <WhatsApp />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </TabsContent>

                    {/* Tab Exámenes */}
                    <TabsContent value="examenes" className="space-y-4">
                        <Tabs defaultValue="tipos-estudio" className="w-full">
                            <TabsList className="w-full justify-start flex-wrap h-auto">
                                <TabsTrigger value="tipos-estudio" className="data-[state=active]:bg-brand-purple data-[state=active]:text-white">Tipos de Estudio</TabsTrigger>
                                <TabsTrigger value="modalidades" className="data-[state=active]:bg-brand-purple data-[state=active]:text-white">Modalidades</TabsTrigger>
                                <TabsTrigger value="partes-cuerpo" className="data-[state=active]:bg-brand-purple data-[state=active]:text-white">Partes del Cuerpo</TabsTrigger>
                            </TabsList>

                            <TabsContent value="tipos-estudio">
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                                    <TiposEstudio />
                                </div>
                            </TabsContent>

                            <TabsContent value="modalidades">
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                                    <Modalidades />
                                </div>
                            </TabsContent>

                            <TabsContent value="partes-cuerpo">
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                                    <PartesCuerpo />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </TabsContent>

                    {/* Tab Equipos */}
                    <TabsContent value="equipos" className="space-y-4">
                        <Tabs defaultValue="maquinas" className="w-full">
                            <TabsList className="w-full justify-start flex-wrap h-auto">
                                <TabsTrigger value="maquinas" className="data-[state=active]:bg-brand-purple data-[state=active]:text-white">Máquinas</TabsTrigger>
                                <TabsTrigger value="agendas-maquinas" className="data-[state=active]:bg-brand-purple data-[state=active]:text-white">Agendas de Máquinas</TabsTrigger>
                            </TabsList>

                            <TabsContent value="maquinas">
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                                    <Maquinas />
                                </div>
                            </TabsContent>

                            <TabsContent value="agendas-maquinas">
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                                    <AgendasMaquinas />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </TabsContent>

                    {/* Tab Usuarios/Personal */}
                    <TabsContent value="usuarios" className="space-y-4">
                        <Tabs defaultValue="gestion-usuarios" className="w-full">
                            <TabsList className="w-full justify-start flex-wrap h-auto">
                                <TabsTrigger value="gestion-usuarios" className="data-[state=active]:bg-brand-purple data-[state=active]:text-white">Gestión de Usuarios</TabsTrigger>
                                <TabsTrigger value="gestion-pacientes" className="data-[state=active]:bg-brand-purple data-[state=active]:text-white">Gestión de Pacientes</TabsTrigger>
                                <TabsTrigger value="medicos-solicitantes" className="data-[state=active]:bg-brand-purple data-[state=active]:text-white">Médicos Solicitantes</TabsTrigger>
                                <TabsTrigger value="agenda-medicos" className="data-[state=active]:bg-brand-purple data-[state=active]:text-white">Agenda de Médicos</TabsTrigger>
                            </TabsList>

                            <TabsContent value="gestion-usuarios">
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                                    <GestionUsuarios />
                                </div>
                            </TabsContent>

                            <TabsContent value="gestion-pacientes">
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                                    <GestionPacientes />
                                </div>
                            </TabsContent>

                            <TabsContent value="medicos-solicitantes">
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                                    <MedicosSolicitantes />
                                </div>
                            </TabsContent>

                            <TabsContent value="agenda-medicos">
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                                    <AgendaMedicos />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    )
}
