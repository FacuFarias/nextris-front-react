import { MainLayout } from "@/layouts/layout";
import { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PatientsTable } from "./components/PatientsTable";
import { type Patient } from "./components/columns";

// Datos de ejemplo (mock data)
const mockPatients: Patient[] = [
    {
        id: 1,
        nombre: "Sabine",
        apellido: "Carvalho",
        dni: "542423434",
        sexo: "F",
        fechaNac: "03/11/2025",
        telefono: "",
        email: "facufarias93@gmail.com",
        tarjeta: "542423434",
        estudios: 0,
    },
    {
        id: 2,
        nombre: "Lucia",
        apellido: "Díaz",
        dni: "39876543",
        sexo: "F",
        fechaNac: "11/06/1994",
        telefono: "",
        email: "lucia.diaz@gmail.com",
        tarjeta: "39876543",
        estudios: 0,
    },
    {
        id: 3,
        nombre: "Patricia",
        apellido: "Domínguez",
        dni: "23124124",
        sexo: "F",
        fechaNac: "02/11/2025",
        telefono: "02644818397",
        email: "facufarias93@gmail.com",
        tarjeta: "37742243",
        estudios: 0,
    },
    {
        id: 4,
        nombre: "Facunditos",
        apellido: "Fanasss",
        dni: "37742243",
        sexo: "M",
        fechaNac: "20/10/2025",
        telefono: "",
        email: "facufarias93@gmail.com",
        tarjeta: "37742243",
        estudios: 0,
    },
    {
        id: 5,
        nombre: "Carlos",
        apellido: "Fernández",
        dni: "32456789",
        sexo: "M",
        fechaNac: "09/03/1987",
        telefono: "",
        email: "carlos.fernandez@yahoo.com",
        tarjeta: "32456789",
        estudios: 0,
    },
    {
        id: 6,
        nombre: "María",
        apellido: "González",
        dni: "28123456",
        sexo: "F",
        fechaNac: "15/07/1990",
        telefono: "02644123456",
        email: "maria.gonzalez@gmail.com",
        tarjeta: "28123456",
        estudios: 2,
    },
    {
        id: 7,
        nombre: "Juan",
        apellido: "Pérez",
        dni: "35678901",
        sexo: "M",
        fechaNac: "22/03/1985",
        telefono: "",
        email: "juan.perez@hotmail.com",
        tarjeta: "35678901",
        estudios: 1,
    },
    {
        id: 8,
        nombre: "Ana",
        apellido: "Martínez",
        dni: "41234567",
        sexo: "F",
        fechaNac: "08/12/1998",
        telefono: "02644987654",
        email: "ana.martinez@outlook.com",
        tarjeta: "41234567",
        estudios: 3,
    },
    {
        id: 9,
        nombre: "Roberto",
        apellido: "Silva",
        dni: "29876543",
        sexo: "M",
        fechaNac: "30/05/1992",
        telefono: "",
        email: "roberto.silva@gmail.com",
        tarjeta: "29876543",
        estudios: 0,
    },
];

export const BuscarPaciente = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [patients] = useState<Patient[]>(mockPatients);

    // Filtrar pacientes según el término de búsqueda
    const filteredPatients = patients.filter((patient) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            patient.nombre.toLowerCase().includes(searchLower) ||
            patient.apellido.toLowerCase().includes(searchLower) ||
            patient.dni.includes(searchTerm) ||
            patient.email.toLowerCase().includes(searchLower)
        );
    });

    return (
        <MainLayout>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm">
                {/* Header */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="bg-brand-purple p-2 sm:p-3 rounded-lg">
                        <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-brand-purple">Pacientes</h1>
                </div>

                {/* Barra de búsqueda */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Buscar paciente o historial..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 sm:pl-10 border-purple-300 focus:border-purple-500 focus:ring-purple-500 text-sm sm:text-base"
                        />
                    </div>
                    <Button className="bg-brand-purple hover:bg-purple-700 text-white w-full sm:w-auto">
                        <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        AGREGAR
                    </Button>
                </div>

                {/* Resultados */}
                <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">RESULTADOS</h2>
                    <PatientsTable data={filteredPatients} />
                </div>
            </div>
        </MainLayout>
    );
};
