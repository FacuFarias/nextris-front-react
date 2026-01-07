import { MainLayout } from "@/layouts/layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"

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
                                <TabsTrigger value="facilities" className="data-[state=active]:bg-brand-purple data-[state=active]:text-white">Facilities</TabsTrigger>
                                <TabsTrigger value="locations" className="data-[state=active]:bg-brand-purple data-[state=active]:text-white">Locations</TabsTrigger>
                                <TabsTrigger value="informacion" className="data-[state=active]:bg-brand-purple data-[state=active]:text-white">Información Básica</TabsTrigger>
                                <TabsTrigger value="flujo" className="data-[state=active]:bg-brand-purple data-[state=active]:text-white">Flujo de Trabajo</TabsTrigger>
                                <TabsTrigger value="smtp" className="data-[state=active]:bg-brand-purple data-[state=active]:text-white">Servidor SMTP</TabsTrigger>
                                <TabsTrigger value="backend" className="data-[state=active]:bg-brand-purple data-[state=active]:text-white">Datos Backend</TabsTrigger>
                                <TabsTrigger value="whatsapp" className="data-[state=active]:bg-brand-purple data-[state=active]:text-white">WhatsApp</TabsTrigger>
                            </TabsList>

                            <TabsContent value="facilities">
                                <Card className="p-6">
                                    <Facilities />
                                </Card>
                            </TabsContent>

                            <TabsContent value="locations">
                                <Card className="p-6">
                                    <Locations />
                                </Card>
                            </TabsContent>

                            <TabsContent value="informacion">
                                <Card className="p-6">
                                    <InformacionBasica />
                                </Card>
                            </TabsContent>

                            <TabsContent value="flujo">
                                <Card className="p-6">
                                    <FlujoTrabajo />
                                </Card>
                            </TabsContent>

                            <TabsContent value="smtp">
                                <Card className="p-6">
                                    <ServidorSmtp />
                                </Card>
                            </TabsContent>

                            <TabsContent value="backend">
                                <Card className="p-6">
                                    <DatosBackend />
                                </Card>
                            </TabsContent>

                            <TabsContent value="whatsapp">
                                <Card className="p-6">
                                    <WhatsApp />
                                </Card>
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
                                <Card className="p-6">
                                    <TiposEstudio />
                                </Card>
                            </TabsContent>

                            <TabsContent value="modalidades">
                                <Card className="p-6">
                                    <Modalidades />
                                </Card>
                            </TabsContent>

                            <TabsContent value="partes-cuerpo">
                                <Card className="p-6">
                                    <PartesCuerpo />
                                </Card>
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
                                <Card className="p-6">
                                    <Maquinas />
                                </Card>
                            </TabsContent>

                            <TabsContent value="agendas-maquinas">
                                <Card className="p-6">
                                    <AgendasMaquinas />
                                </Card>
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
                                <Card className="p-6">
                                    <GestionUsuarios />
                                </Card>
                            </TabsContent>

                            <TabsContent value="gestion-pacientes">
                                <Card className="p-6">
                                    <GestionPacientes />
                                </Card>
                            </TabsContent>

                            <TabsContent value="medicos-solicitantes">
                                <Card className="p-6">
                                    <MedicosSolicitantes />
                                </Card>
                            </TabsContent>

                            <TabsContent value="agenda-medicos">
                                <Card className="p-6">
                                    <AgendaMedicos />
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    )
}
