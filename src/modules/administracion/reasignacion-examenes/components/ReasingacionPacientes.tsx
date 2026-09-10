import React, { useState } from 'react'
import type { ReasignacionExamenes, ReasignacionExamenesPacientes } from '../types/reasignacion-examenes.type';
import { useReasignacionExamenesPacientes } from '../hooks/use-reasignacion-examenes';
import TablaDynamic from '@/components/TableDynamic';
import { pacienteEstudioColumns } from './columnsPacientes';
import { Modal, PrimaryButton, SecondaryButton } from '@/components';
import { formatDate } from '@/lib/fechaYhora';


interface ReasingacionPacientesProps {
    selectedEstudio: ReasignacionExamenes | null;
    handleSubmit: (data: any) => void;
}
export const ReasingacionPacientes = ({ selectedEstudio, handleSubmit }: ReasingacionPacientesProps) => {

    const { estudiosPacientes, isLoading } = useReasignacionExamenesPacientes();
    const [selectedPatient, setSelectedPatient] = React.useState<ReasignacionExamenesPacientes | null>(null);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const handleConfirmReassignment = () => {
        if (selectedEstudio && selectedPatient) {
            handleSubmit({
                estudio_id: selectedEstudio.guid,
                paciente_id: selectedPatient.guid
            });
            setSelectedPatient(null);
        }
    };

    return (
        <>
            <TablaDynamic<ReasignacionExamenesPacientes>
                data={(estudiosPacientes?.data || [])}
                columns={pacienteEstudioColumns}
                showIndex
                loading={isLoading}
                selectedRow={selectedPatient}
                rowIdKey="guid"
                onRowClick={(estudioPacientes: ReasignacionExamenesPacientes) => {
                    setSelectedPatient(estudioPacientes);
                }}
                onRowDoubleClick={(estudioPacientes: ReasignacionExamenesPacientes) => {
                    setSelectedPatient(estudioPacientes);
                }}
                pagination={{
                    page,
                    pageSize: perPage,
                    serverSide: false,
                    total: Array.isArray(estudiosPacientes?.data) ? estudiosPacientes.data.length : 0,
                }}
                onPaginationChange={(newPage) => {
                    setPage(newPage);
                }}
                perPageValue={perPage}
                onPerPageChange={(value) => {
                    setPerPage(value);
                    setPage(1);
                }}
                perPageOptions={[10, 20, 50, 100]}
                emptyMessage="Seleccione un paciente."
            />


            <Modal isOpen={selectedPatient !== null} onClose={() => setSelectedPatient(null)} title="Reasignar Estudio">

                <div className=" space-y-6">
                    {/* Sección de cards */}
                    <div className="space-y-4">
                        {/* Card del Estudio a Reasignar */}
                        <div className="bg-purple-50/60 dark:bg-transparent rounded-lg p-4 border border-dashed border-purple-300 dark:border-purple-500">
                            <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-400 mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Estudio a reasignar
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Nombre del paciente</p>
                                    <p className="text-sm text-gray-900 dark:text-gray-100 font-semibold mt-1">
                                        {selectedEstudio && selectedEstudio.patient_name || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Accesión N°</p>
                                    <p className="text-sm text-gray-900 dark:text-gray-100 font-semibold mt-1">
                                        {selectedEstudio && selectedEstudio.localacc || 'N/A'}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Descripción del estudio</p>
                                    <p className="text-sm text-gray-900 dark:text-gray-100 font-semibold mt-1">
                                        {selectedEstudio && selectedEstudio.study_description || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Fecha de realizado</p>
                                    <p className="text-sm text-gray-900 dark:text-gray-100 font-semibold mt-1">
                                        {selectedEstudio ? formatDate(selectedEstudio.createdon) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Flecha indicadora */}
                        <div className="flex justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </div>

                        {/* Card del Paciente Destino */}
                        <div className="bg-blue-50/60 dark:bg-transparent rounded-lg p-4 border border-dashed border-blue-300 dark:border-blue-500 mb-4">
                            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Paciente destino
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Nombre</p>
                                    <p className="text-sm text-gray-900 dark:text-gray-100 font-semibold mt-1">
                                        {selectedPatient && selectedPatient.name || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Apellido</p>
                                    <p className="text-sm text-gray-900 dark:text-gray-100 font-semibold mt-1">
                                        {selectedPatient && selectedPatient.surname || 'N/A'}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">DNI</p>
                                    <p className="text-sm text-gray-900 dark:text-gray-100 font-semibold mt-1">
                                        {selectedPatient && selectedPatient.nationalcode || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 justify-end">
                    <SecondaryButton
                        type="button"
                        onClick={() => setSelectedPatient(null)}
                    >
                        Cancelar
                    </SecondaryButton>
                    <PrimaryButton
                        type="button"
                        onClick={handleConfirmReassignment}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Confirmar Reasignación
                    </PrimaryButton>
                </div>
            </Modal>
        </>
    )
}
