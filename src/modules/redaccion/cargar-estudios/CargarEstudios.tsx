import { MainLayout } from "@/layouts/layout"
import { UploadCloud, FolderOpen, FileText, Sparkles, Rocket, CheckCircle, Loader2, RefreshCw, Archive, Calendar, Unlink2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect, useCallback } from "react"
import { Progress } from "@/components/ui/progress"
import { useCargarEstudios, useEstudiosNoVinculados } from "./hooks/use-cargar-estudios"
import { Badge } from "@/components/ui/badge"
import { DesvincularImagenTab, VincularImagenTab } from "./components"
import { api } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"
import { useAppConfig } from "@/context/AppConfigContext"
import { toast } from "sonner"

export const CargarEstudios = () => {
    const [files, setFiles] = useState<File[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadedCount, setUploadedCount] = useState(0)
    const [totalFiles, setTotalFiles] = useState(0)
    const { config } = useAppConfig();

    const { data: facilityPlanData } = useQuery({
        queryKey: ["facility-plan", config?.id?.toString() || "1", "cargar-estudios"],
        queryFn: async () => {
            const response = await api.get(`/config/facilities/${config?.id?.toString() || "1"}/plan`);
            return response.data?.data || null;
        },
        enabled: Boolean(config?.id?.toString() || "1"),
        staleTime: 60 * 1000,
    });

    const receiveMonthlyLimit: number | null = facilityPlanData?.plan?.max_receive_monthly ?? null;
    const receivedCount: number = facilityPlanData?.usage_monthly?.received_count ?? 0;
    const isReceiveLimitReached =
        typeof receiveMonthlyLimit === "number"
        && receiveMonthlyLimit >= 0
        && receivedCount >= receiveMonthlyLimit;
    const { estudiosNoVinculadosData, isLoading, error, refetchEstudiosNoVinculados } = useEstudiosNoVinculados({
        include_linked: true,
        include_pacs: false,
    });
    const cargarEstudiosMutation = useCargarEstudios();

    // Estados para animación de tabs
    const [activeTab, setActiveTab] = useState("cargar-dicom")
    const tabsListRef = useRef<HTMLDivElement>(null)
    const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
    const [indicator, setIndicator] = useState({ left: 0, width: 0 })

    // Replica el estilo de tabs de Admision Espontanea (linea inferior animada).
    const updatePill = useCallback(() => {
        const el = tabRefs.current.get(activeTab)
        const container = tabsListRef.current
        if (el && container) {
            const cr = container.getBoundingClientRect()
            const tr = el.getBoundingClientRect()
            setIndicator({
                left: tr.left - cr.left,
                width: tr.width,
            })
        }
    }, [activeTab])

    useEffect(() => {
        updatePill()
    }, [updatePill])

    useEffect(() => {
        window.addEventListener("resize", updatePill)
        return () => window.removeEventListener("resize", updatePill)
    }, [updatePill])

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        if (isReceiveLimitReached || isUploading) {
            return
        }
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (isReceiveLimitReached) {
            return
        }
        const droppedFiles = Array.from(e.dataTransfer.files)
        setFiles(droppedFiles)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isReceiveLimitReached) {
            return
        }
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files)
            setFiles(selectedFiles)
        }
    }

    // Simula la subida de un archivo a la API
    const uploadFile = async (file: File): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            cargarEstudiosMutation.mutate(
                { file },
                {
                    onSuccess: () => {
                        resolve(true);
                    },
                    onError: (error) => {
                        reject(error);
                    }
                }
            );
        })
    }

    // Sube todos los archivos uno por uno
    const uploadFiles = async (filesToUpload: File[]) => {
        if (filesToUpload.length === 0) return
        if (isReceiveLimitReached) {
            toast.error(`Límite mensual alcanzado (${receivedCount}/${receiveMonthlyLimit}). No puedes subir más estudios DICOM este mes.`)
            setFiles([])
            return
        }

        setIsUploading(true)
        setUploadedCount(0)
        setTotalFiles(filesToUpload.length)
        setUploadProgress(0)

        for (let i = 0; i < filesToUpload.length; i++) {
            await uploadFile(filesToUpload[i])
            const newCount = i + 1
            setUploadedCount(newCount)
            setUploadProgress((newCount / filesToUpload.length) * 100)
        }

        setIsUploading(false)
        // Resetear después de completar
        setTimeout(() => {
            setFiles([])
            setUploadProgress(0)
            setUploadedCount(0)
            setTotalFiles(0)
        }, 2000)
    }

    // Auto-subir cuando se detecten archivos
    useEffect(() => {
        if (files.length > 0 && !isUploading) {
            uploadFiles(files)
        }
    }, [files])

    const handleButtonClick = () => {
        if (isReceiveLimitReached) {
            return
        }
        fileInputRef.current?.click()
    }



    return (
        <MainLayout>
            <div className="page-dark-gradient rounded-lg p-3 sm:p-6 shadow-sm z-10 flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Header con Tabs integrados */}
                <div className="flex flex-col flex-1 min-h-0">
                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1 min-h-0">
                        <TabsList
                            ref={tabsListRef}
                            className="relative w-full justify-start gap-0 overflow-x-auto overscroll-x-contain rounded-none border-b border-gray-200 bg-transparent p-0 dark:border-gray-700 [&>[data-slot=tabs-trigger]]:flex-none"
                        >
                            <TabsTrigger
                                value="cargar-dicom"
                                ref={(el) => {
                                    if (el) tabRefs.current.set("cargar-dicom", el)
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-transparent data-[state=active]:text-brand-purple dark:data-[state=active]:text-purple-400 data-[state=active]:bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-transparent shadow-none"
                            >
                                Cargar Estudio Dicom
                            </TabsTrigger>
                            <TabsTrigger
                                value="vincular-imagen"
                                ref={(el) => {
                                    if (el) tabRefs.current.set("vincular-imagen", el)
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-transparent data-[state=active]:text-brand-purple dark:data-[state=active]:text-purple-400 data-[state=active]:bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-transparent shadow-none"
                            >
                                Vincular Imagen
                            </TabsTrigger>
                            <TabsTrigger
                                value="desvincular-imagen"
                                ref={(el) => {
                                    if (el) tabRefs.current.set("desvincular-imagen", el)
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-transparent data-[state=active]:text-brand-purple dark:data-[state=active]:text-purple-400 data-[state=active]:bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-transparent shadow-none"
                            >
                                <span className="inline-flex items-center gap-1">
                                    <Unlink2 className="w-3.5 h-3.5" />
                                    Desvincular Imagen
                                </span>
                            </TabsTrigger>
                            {/* Indicador lineal animado */}
                            <div
                                className="absolute bottom-0 h-0.5 bg-brand-purple transition-all duration-300 ease-in-out"
                                style={{ left: indicator.left, width: indicator.width }}
                            />
                        </TabsList>

                        <TabsContent value="cargar-dicom" className="mt-6 overflow-y-auto">
                            {/* Header del tab */}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <UploadCloud className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Cargar Estudio DICOM</h2>
                                </div>
                                <p className="text-gray-600 text-sm dark:text-gray-200">Arrastra archivos DICOM aquí o haz clic para seleccionar</p>
                            </div>
                            {isReceiveLimitReached && (
                                <div className="mt-3 rounded-lg border border-red-500/70 bg-red-500/15 px-4 py-3 text-sm text-red-200">
                                    <strong className="font-semibold">Límite alcanzado:</strong> ya se llegó al máximo mensual de carga DICOM para esta institución ({receivedCount}/{receiveMonthlyLimit}).
                                </div>
                            )}
                            <>
                                        <div
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            className={`border-2 border-dashed rounded-lg p-12 transition-all mt-3 ${isReceiveLimitReached
                                                ? 'border-red-500/60 bg-red-500/5 opacity-70 cursor-not-allowed'
                                                : isDragging
                                                ? 'border-brand-purple bg-transparent'
                                                : 'border-gray-300 bg-transparent'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                {/* Icono de nube */}
                                                <div className="bg-brand-purple/10 p-6 rounded-full">
                                                    <UploadCloud className="w-16 h-16 text-brand-purple dark:text-purple-400" />
                                                </div>

                                                {/* Texto principal */}
                                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                                    Arrastra archivos DICOM aquí
                                                </h3>

                                                {/* Contador */}
                                                <div className="text-3xl font-bold text-gray-400 dark:text-gray-500">
                                                    0
                                                </div>

                                                {/* Botón de selección */}
                                                <Button
                                                    onClick={handleButtonClick}
                                                    disabled={isUploading || isReceiveLimitReached}
                                                    className="bg-brand-purple hover:bg-brand-purple/90 text-white px-6 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isUploading ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <FolderOpen className="w-5 h-5" />
                                                    )}
                                                    {isUploading ? 'SUBIENDO...' : isReceiveLimitReached ? 'LÍMITE ALCANZADO' : 'SELECCIONAR ARCHIVOS DICOM'}
                                                </Button>

                                                {/* Input oculto */}
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    multiple
                                                    accept=".dcm,.dicom,.dic"
                                                    onChange={handleFileSelect}
                                                    disabled={isReceiveLimitReached}
                                                    className="hidden"
                                                />

                                                {/* Información */}
                                                <div className="mt-4 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4" />
                                                        <span>Solo archivos DICOM (.dcm, .dicom, .dic)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Sparkles className="w-4 h-4" />
                                                        <span>Puedes seleccionar múltiples archivos</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Rocket className="w-4 h-4" />
                                                        <span>Se enviarán automáticamente al PACS</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Barra de progreso */}
                                        {(isUploading || uploadProgress > 0) && (
                                            <div className="mt-6 bg-white dark:bg-[#2a2e32] border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        {uploadProgress === 100 ? (
                                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                                        ) : (
                                                            <Loader2 className="w-5 h-5 text-brand-purple animate-spin" />
                                                        )}
                                                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                                                            {uploadProgress === 100 ? '¡Carga completada!' : 'Cargando archivos...'}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        {uploadedCount} / {totalFiles} archivos
                                                    </span>
                                                </div>
                                                <Progress value={uploadProgress} className="h-2" />
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                    {uploadProgress.toFixed(0)}% completado
                                                </p>
                                            </div>
                                        )}

                                        {/* Lista de Archivos DICOM Subidos */}
                                        <div className="mt-8">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-2">
                                                    <Archive className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Archivos DICOM Subidos</h2>
                                                </div>
                                                <Button
                                                    onClick={() => refetchEstudiosNoVinculados()}
                                                    disabled={isLoading}
                                                    variant="outline"
                                                    className="flex items-center gap-2 bg-brand-purple text-white hover:bg-brand-purple/90 hover:text-white"
                                                >
                                                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                                    Actualizar
                                                </Button>
                                            </div>

                                            {/* Lista de estudios */}
                                            <div className="space-y-3">
                                                {isLoading ? (
                                                    <div className="flex items-center justify-center py-12">
                                                        <Loader2 className="w-8 h-8 animate-spin text-brand-purple dark:text-purple-400" />
                                                    </div>
                                                ) : error ? (
                                                    <div className="text-center py-12 text-red-500 dark:text-red-400">
                                                        Error al cargar los archivos
                                                    </div>
                                                ) : estudiosNoVinculadosData?.data?.data?.length === 0 ? (
                                                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                                        No hay archivos DICOM subidos
                                                    </div>
                                                ) : (
                                                    estudiosNoVinculadosData?.data?.data?.map((estudio) => (
                                                        <div
                                                            key={estudio.guid}
                                                            className="bg-transparent border border-gray-200/70 dark:border-gray-700/70 rounded-lg p-4 hover:bg-white/5 transition-colors"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-start gap-3 flex-1">
                                                                    <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-1" />
                                                                    <div className="flex-1">
                                                                        <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                                                                            {estudio.patient_name} - {estudio.patient_id} - {estudio.study_description || 'Sin descripción'}
                                                                        </h3>
                                                                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                                                                            <div className="flex items-center gap-1">
                                                                                <Archive className="w-3 h-3 text-orange-500" />
                                                                                <span>{estudio.file_size_mb} MB</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                <Calendar className="w-3 h-3 text-gray-500" />
                                                                                <span>{new Date(estudio.upload_date).toLocaleDateString()}</span>
                                                                            </div>

                                                                            <Badge variant="outline" className="text-xs">
                                                                                {estudio.modality}
                                                                            </Badge>
                                                                            {estudio.islinked ? (
                                                                                <Badge className="text-xs bg-green-600 text-white hover:bg-green-600">
                                                                                    Cargado y vinculado
                                                                                </Badge>
                                                                            ) : (
                                                                                <Badge variant="outline" className="text-xs border-amber-400 text-amber-500">
                                                                                    Cargado sin vincular
                                                                                </Badge>
                                                                            )}
                                                                            <div className="flex items-center gap-1">
                                                                                <span>{estudio.study_instance_uid}</span>
                                                                            </div>
                                                                        </div>
                                                                        {estudio.islinked && (
                                                                            <div className="mt-2 text-xs text-green-500 dark:text-green-400">
                                                                                Vinculado a orden: {estudio.linked_order_accession || estudio.linked_examination_guid || 'N/D'}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </>


                        </TabsContent>

                        <TabsContent value="vincular-imagen" className="mt-6 overflow-y-auto">
                            <VincularImagenTab />
                        </TabsContent>

                        <TabsContent value="desvincular-imagen" className="mt-6 overflow-y-auto">
                            <DesvincularImagenTab />
                        </TabsContent>
                    </Tabs>

                </div>


            </div>
        </MainLayout>
    )
}
