import { useMutation } from '@tanstack/react-query';
import { crearCita } from '../services/cita.service';

export const useCrearCita = () => {
    return useMutation({
        mutationFn: crearCita,
    });
};
