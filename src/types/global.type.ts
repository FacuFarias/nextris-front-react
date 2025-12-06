// Tipo genérico para respuestas paginadas
export interface PaginatedResponse<T> {
    data: {
        page: number;
        patients: T[];
        per_page: number;
        total: number;
    };
    success: boolean;
}

export interface ApiPaginatedResponse<T> {
    data: {
        page: number;
        data: T[];
        per_page: number;
        total: number;
    };
    success: boolean;
}
