import { MainLayout } from "@/layouts/layout"
import { UploadCloud, FolderOpen, FileText, Sparkles, Rocket, CheckCircle, Loader2, RefreshCw, Archive, Calendar } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect, useCallback } from "react"
import { DireccionSelector } from "@/components"
import { Progress } from "@/components/ui/progress"
import { useCargarEstudios, useEstudiosNoVinculados } from "./hooks/use-cargar-estudios"
import { Badge } from "@/components/ui/badge"
import { VincularImagenTab } from "./components"

export const CargarEstudios = () => {
    const [files, setFiles] = useState<File[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedDireccion, setSelectedDireccion] = useState<string>("");
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadedCount, setUploadedCount] = useState(0)
    const [totalFiles, setTotalFiles] = useState(0)
    const { estudiosNoVinculadosData, isLoading, error, refetchEstudiosNoVinculados } = useEstudiosNoVinculados({ location_id: selectedDireccion });
    const cargarEstudiosMutation = useCargarEstudios();

    // Estados para animación de tabs
    const [activeTab, setActiveTab] = useState("cargar-dicom")
    const tabsListRef = useRef<HTMLDivElement>(null)
    const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
    const [pill, setPill] = useState({ left: 0, top: 0, width: 0, height: 0 })

    const handleDireccionChange = (direccionId: string) => {
        setSelectedDireccion(direccionId);
        /*  fetchPacientesDireccion(
             { uuid: direccionId, searchTerm: debouncedSearch },
         ); */
    };

    // Función para actualizar la posición de la píldora animada
    const updatePill = useCallback(() => {
        const el = tabRefs.current.get(activeTab)
        const container = tabsListRef.current
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
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const droppedFiles = Array.from(e.dataTransfer.files)
        setFiles(droppedFiles)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files)
            setFiles(selectedFiles)
        }
    }

    // Simula la subida de un archivo a la API
    const uploadFile = async (file: File): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            cargarEstudiosMutation.mutate(
                { file, location_id: selectedDireccion },
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
        fileInputRef.current?.click()
    }



    return (
        <MainLayout>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10  overflow-y-auto">
                {/* Header con Tabs integrados */}
                <div className="mb-6">
                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList
                            ref={tabsListRef}
                            className="relative bg-gray-50 border-b border-gray-200 rounded-lg h-auto p-1 px-2 justify-start gap-1 w-auto inline-flex"
                        >
                            <TabsTrigger
                                value="cargar-dicom"
                                ref={(el) => {
                                    if (el) tabRefs.current.set("cargar-dicom", el)
                                }}
                                className="px-3 py-1.5 text-xs font-medium rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-100 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none relative z-1"
                            >
                                Cargar Estudio Dicom
                            </TabsTrigger>
                            <TabsTrigger
                                value="vincular-imagen"
                                ref={(el) => {
                                    if (el) tabRefs.current.set("vincular-imagen", el)
                                }}
                                className="px-3 py-1.5 text-xs font-medium rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-100 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none relative z-1"
                            >
                                Vincular Imagen
                            </TabsTrigger>
                            {/* Píldora animada */}
                            <div
                                className="absolute rounded-full bg-brand-purple transition-all duration-300 ease-in-out z-0"
                                style={{ left: pill.left, top: pill.top, width: pill.width, height: pill.height }}
                            />
                        </TabsList>

                        <TabsContent value="cargar-dicom" className="mt-6">
                            {/* Header del tab */}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <UploadCloud className="w-5 h-5 text-gray-700" />
                                    <h2 className="text-xl font-semibold text-gray-800">Cargar Estudio DICOM</h2>
                                </div>
                                <p className="text-gray-600 text-sm">Arrastra archivos DICOM aquí o haz clic para seleccionar</p>
                            </div>
                            <DireccionSelector
                                selectedDireccion={selectedDireccion}
                                onDireccionChange={handleDireccionChange}
                                isRow={true}
                            />
                            {
                                selectedDireccion && (
                                    <>
                                        <div
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            className={`border-2 border-dashed rounded-lg p-12 transition-all mt-3 ${isDragging
                                                ? 'border-brand-purple bg-purple-50'
                                                : 'border-gray-300 bg-white'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                {/* Icono de nube */}
                                                <div className="bg-brand-purple/10 p-6 rounded-full">
                                                    <UploadCloud className="w-16 h-16 text-brand-purple" />
                                                </div>

                                                {/* Texto principal */}
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    Arrastra archivos DICOM aquí
                                                </h3>

                                                {/* Contador */}
                                                <div className="text-3xl font-bold text-gray-400">
                                                    0
                                                </div>

                                                {/* Botón de selección */}
                                                <Button
                                                    onClick={handleButtonClick}
                                                    disabled={isUploading}
                                                    className="bg-brand-purple hover:bg-brand-purple/90 text-white px-6 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isUploading ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <FolderOpen className="w-5 h-5" />
                                                    )}
                                                    {isUploading ? 'SUBIENDO...' : 'SELECCIONAR ARCHIVOS DICOM'}
                                                </Button>

                                                {/* Input oculto */}
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    multiple
                                                    accept=".dcm,.dicom,.dic"
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                />

                                                {/* Información */}
                                                <div className="mt-4 space-y-1 text-sm text-gray-600">
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
                                            <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        {uploadProgress === 100 ? (
                                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                                        ) : (
                                                            <Loader2 className="w-5 h-5 text-brand-purple animate-spin" />
                                                        )}
                                                        <span className="font-semibold text-gray-700">
                                                            {uploadProgress === 100 ? '¡Carga completada!' : 'Cargando archivos...'}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-gray-600">
                                                        {uploadedCount} / {totalFiles} archivos
                                                    </span>
                                                </div>
                                                <Progress value={uploadProgress} className="h-2" />
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {uploadProgress.toFixed(0)}% completado
                                                </p>
                                            </div>
                                        )}

                                        {/* Lista de Archivos DICOM Subidos */}
                                        <div className="mt-8">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-2">
                                                    <Archive className="w-5 h-5 text-gray-700" />
                                                    <h2 className="text-xl font-semibold text-gray-800">Archivos DICOM Subidos</h2>
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
                                                        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
                                                    </div>
                                                ) : error ? (
                                                    <div className="text-center py-12 text-red-500">
                                                        Error al cargar los archivos
                                                    </div>
                                                ) : estudiosNoVinculadosData?.data?.data?.length === 0 ? (
                                                    <div className="text-center py-12 text-gray-500">
                                                        No hay archivos DICOM subidos
                                                    </div>
                                                ) : (
                                                    estudiosNoVinculadosData?.data?.data?.map((estudio) => (
                                                        <div
                                                            key={estudio.guid}
                                                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-start gap-3 flex-1">
                                                                    <FileText className="w-5 h-5 text-gray-400 mt-1" />
                                                                    <div className="flex-1">
                                                                        <h3 className="font-medium text-gray-800 mb-1">
                                                                            {estudio.patient_name} - {estudio.patient_id} - {estudio.study_description || 'Sin descripción'}
                                                                        </h3>
                                                                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
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
                                                                            <div className="flex items-center gap-1">
                                                                                <span>{estudio.study_instance_uid}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )
                            }



                        </TabsContent>

                        <TabsContent value="vincular-imagen" className="mt-6">
                            <VincularImagenTab />
                        </TabsContent>
                    </Tabs>

                </div>


            </div>
        </MainLayout>
    )
}
