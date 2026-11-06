import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, UserPlus, ArrowLeft, Check } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import type { PacsStudy } from "../hooks/use-studies-by-location"
import { formatDate } from "@/lib/fechaYhora"
import { DateInput } from "@/components/ui/date-input"

interface PatientSearchResult {
  guid: string
  patientid: string
  surname: string
  name: string
  nationalcode: string
  gender: string
  birthdate: string | null
}

interface ReasignarImagenModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  study: PacsStudy | null
  onSuccess: () => void
}

type ModalStep = "search" | "confirm" | "dicom_confirm"

export const ReasignarImagenModal = ({ open, onOpenChange, study, onSuccess }: ReasignarImagenModalProps) => {
  const [step, setStep] = useState<ModalStep>("search")
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null)
  const [isReassigning, setIsReassigning] = useState(false)

  // New patient form state
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)
  const [newPatientNombre, setNewPatientNombre] = useState("")
  const [newPatientApellido, setNewPatientApellido] = useState("")
  const [newPatientDni, setNewPatientDni] = useState("")
  const [newPatientPatientId, setNewPatientPatientId] = useState("")
  const [newPatientFechaNac, setNewPatientFechaNac] = useState("")
  const [newPatientSexo, setNewPatientSexo] = useState<string>("")
  const [isCreatingPatient, setIsCreatingPatient] = useState(false)

  const resetState = useCallback(() => {
    setStep("search")
    setSearchTerm("")
    setSearchResults([])
    setSelectedPatient(null)
    setShowNewPatientForm(false)
    setNewPatientNombre("")
    setNewPatientApellido("")
    setNewPatientDni("")
    setNewPatientPatientId("")
    setNewPatientFechaNac("")
    setNewPatientSexo("")
  }, [])

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return
    setIsSearching(true)
    try {
      const { data } = await api.post("/patients/search", { search_term: searchTerm.trim() })
      if (data.success && Array.isArray(data.data)) {
        setSearchResults(data.data)
      } else {
        setSearchResults([])
      }
    } catch {
      toast.error("Error al buscar pacientes")
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [searchTerm])

  const handleSelectPatient = useCallback((patient: PatientSearchResult) => {
    setSelectedPatient(patient)
    setStep("confirm")
  }, [])

  const handleCreateAndSelectPatient = useCallback(async () => {
    if (!newPatientNombre.trim() || !newPatientApellido.trim()) {
      toast.error("Nombre y apellido son requeridos")
      return
    }
    setIsCreatingPatient(true)
    try {
      const { data } = await api.post("/patients/quick", {
        nombre: newPatientNombre.trim(),
        apellido: newPatientApellido.trim(),
        dni: newPatientDni.trim(),
        patient_id: newPatientPatientId.trim(),
        fecha_nac: newPatientFechaNac || null,
        sexo: newPatientSexo || "I",
      })
      if (data.success && data.guid) {
        const newPatient: PatientSearchResult = {
          guid: data.guid,
          patientid: newPatientPatientId.trim() || newPatientDni || data.guid.substring(0, 8),
          surname: newPatientApellido.trim(),
          name: newPatientNombre.trim(),
          nationalcode: newPatientDni,
          gender: newPatientSexo || "I",
          birthdate: newPatientFechaNac || null,
        }
        setSelectedPatient(newPatient)
        setStep("confirm")
        toast.success("Paciente creado correctamente")
      } else if (data.existing_patient) {
        setSelectedPatient({
          guid: data.existing_patient.guid,
          patientid: data.existing_patient.patientid,
          surname: data.existing_patient.surname,
          name: data.existing_patient.name,
          nationalcode: newPatientDni,
          gender: "",
          birthdate: null,
        })
        setStep("confirm")
        toast.warning("El paciente ya existía, se usará el registro existente")
      } else {
        toast.error(data.error || "No se pudo crear el paciente")
      }
    } catch {
      toast.error("Error al crear el paciente")
    } finally {
      setIsCreatingPatient(false)
    }
  }, [newPatientNombre, newPatientApellido, newPatientDni, newPatientPatientId, newPatientFechaNac, newPatientSexo])

  const handleConfirmReassign = useCallback(async (modifyDicom: boolean = false) => {
    if (!study || !selectedPatient) return
    setIsReassigning(true)
    try {
      const { data } = await api.post("/dicom/studies/reassign", {
        study_pk: study.pk,
        patient_guid: selectedPatient.guid,
        modify_dicom: modifyDicom,
      })
      if (data.success) {
        toast.success(data.message || "Estudio reasignado correctamente")
        onOpenChange(false)
        resetState()
        onSuccess()
      } else {
        toast.error(data.message || "No se pudo reasignar el estudio")
      }
    } catch {
      toast.error("Error al reasignar el estudio")
    } finally {
      setIsReassigning(false)
    }
  }, [study, selectedPatient, onOpenChange, resetState, onSuccess])

  const handleGoToDicomConfirm = useCallback(() => {
    setStep("dicom_confirm")
  }, [])

  const handleClose = useCallback(() => {
    onOpenChange(false)
    resetState()
  }, [onOpenChange, resetState])

  if (!study) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reasignar imágenes a otro paciente</DialogTitle>
          <DialogDescription>
            Estudio: {study.study_desc || "—"} | Acc. Nº: {study.accession_no || "—"} | Paciente actual: {study.patient_name}
          </DialogDescription>
        </DialogHeader>

        {step === "search" && (
          <div className="space-y-4">
            {/* Search section */}
            {!showNewPatientForm ? (
              <>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nombre, apellido, DNI o PatientID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-9"
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={isSearching || !searchTerm.trim()}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
                  </Button>
                </div>

                {/* Results */}
                <div className="border rounded-lg overflow-hidden">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-500">Apellido</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-500">Nombre</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-500">DNI</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-500">Sexo</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-500">Nacimiento</th>
                            <th className="px-3 py-2 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {searchResults.map((patient) => (
                            <tr
                              key={patient.guid}
                              className="hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-colors"
                              onClick={() => handleSelectPatient(patient)}
                            >
                              <td className="px-3 py-2 font-medium">{patient.surname}</td>
                              <td className="px-3 py-2">{patient.name}</td>
                              <td className="px-3 py-2">{patient.nationalcode || "—"}</td>
                              <td className="px-3 py-2">{patient.gender === "M" ? "M" : patient.gender === "F" ? "F" : "—"}</td>
                              <td className="px-3 py-2">{patient.birthdate ? formatDate(patient.birthdate) : "—"}</td>
                              <td className="px-3 py-2">
                                <Check className="h-4 w-4 text-transparent group-hover:text-purple-500" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : searchTerm && !isSearching ? (
                    <div className="py-8 text-center text-gray-500">
                      No se encontraron pacientes
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-400">
                     Ingrese un término de búsqueda para encontrar pacientes
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <span className="text-sm text-gray-500">¿No encuentra el paciente?</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewPatientForm(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Crear nuevo paciente
                  </Button>
                </div>
              </>
            ) : (
              /* New patient form */
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowNewPatientForm(false)}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Volver a búsqueda
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-nombre">Nombre *</Label>
                    <Input
                      id="new-nombre"
                      placeholder="Juan"
                      value={newPatientNombre}
                      onChange={(e) => setNewPatientNombre(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-apellido">Apellido *</Label>
                    <Input
                      id="new-apellido"
                      placeholder="Pérez"
                      value={newPatientApellido}
                      onChange={(e) => setNewPatientApellido(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-dni">DNI</Label>
                    <Input
                      id="new-dni"
                      placeholder="12345678"
                      value={newPatientDni}
                      onChange={(e) => setNewPatientDni(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-patient-id">Patient ID</Label>
                    <Input
                      id="new-patient-id"
                      placeholder="NR00000001"
                      value={newPatientPatientId}
                      onChange={(e) => setNewPatientPatientId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-sexo">Sexo</Label>
                    <Select value={newPatientSexo} onValueChange={setNewPatientSexo}>
                      <SelectTrigger id="new-sexo">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Femenino</SelectItem>
                        <SelectItem value="I">Indeterminado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-fecha-nac">Fecha de nacimiento</Label>
                    <DateInput
                      id="new-fecha-nac"
                      value={newPatientFechaNac}
                      onChange={(value) => setNewPatientFechaNac(value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleCreateAndSelectPatient}
                    disabled={isCreatingPatient || !newPatientNombre.trim() || !newPatientApellido.trim()}
                  >
                    {isCreatingPatient ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Crear y seleccionar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === "confirm" && selectedPatient && (
          <div className="space-y-4">
            {/* Source study card */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2">Estudio a reasignar</h3>
              <div className="grid grid-cols-1 gap-2 text-sm min-[420px]:grid-cols-2">
                <div>
                  <span className="text-gray-500">Paciente actual:</span>
                  <p className="font-medium">{study.patient_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Acc. Nº:</span>
                  <p className="font-medium">{study.accession_no || "—"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Descripción:</span>
                  <p className="font-medium">{study.study_desc || "—"}</p>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            {/* Target patient card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">Paciente destino</h3>
              <div className="grid grid-cols-1 gap-2 text-sm min-[420px]:grid-cols-2">
                <div>
                  <span className="text-gray-500">Nombre:</span>
                  <p className="font-medium">{selectedPatient.surname}, {selectedPatient.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">DNI:</span>
                  <p className="font-medium">{selectedPatient.nationalcode || "—"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Sexo:</span>
                  <p className="font-medium">{selectedPatient.gender === "M" ? "Masculino" : selectedPatient.gender === "F" ? "Femenino" : "—"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Nacimiento:</span>
                  <p className="font-medium">{selectedPatient.birthdate ? formatDate(selectedPatient.birthdate) : "—"}</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setStep("search"); setSelectedPatient(null); }}>
                Cancelar
              </Button>
              <Button onClick={handleGoToDicomConfirm} disabled={isReassigning}>
                Confirmar reasignación
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "dicom_confirm" && selectedPatient && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                ¿Modificar tags DICOM en el PACS?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                La reasignación en NextRIS ya está lista. ¿Desea también actualizar los
                datos del paciente en los tags DICOM de la imagen en el PACS?
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Al modificar los tags DICOM se actualizará: Patient ID, Patient Name, sexo y fecha de
                nacimiento en las tablas del PACS (<code>public.patient</code>, <code>public.person_name</code>, <code>public.dicomattrs</code>).
                El estudio se vinculará al registro PACS del paciente.
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setStep("confirm")} disabled={isReassigning}>
                Cancelar
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleConfirmReassign(false)}
                disabled={isReassigning}
              >
                {isReassigning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Reasignando...
                  </>
                ) : (
                  "Solo reasignar en NextRIS"
                )}
              </Button>
              <Button
                onClick={() => handleConfirmReassign(true)}
                disabled={isReassigning}
              >
                {isReassigning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Reasignando...
                  </>
                ) : (
                  "Sí, modificar también los tags DICOM"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
