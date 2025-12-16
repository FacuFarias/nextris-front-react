import { useMutation } from '@tanstack/react-query';
import { crearCita } from '../../service/cita.service';

export const useCrearCita = () => {
    return useMutation({
        mutationFn: crearCita,
    });
};
