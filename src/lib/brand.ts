import nextrisLogo from "@/assets/logo/logo5.png";
import cdivetLogo from "@/assets/logo/cdivet-logo.png";
import cdivetLogoDark from "@/assets/logo/cdivet-logo-dark.png";
import cdivetMark from "@/assets/logo/cdivet-mark.png";
import medicoImg from "@/assets/auth/medico.jpg";
import pacientesImg from "@/assets/auth/pacientes.jpg";
import veterinariaImg from "@/assets/auth/veterinaria.jpg";
import responsablesImg from "@/assets/auth/responsables.jpg";

const cdivet = import.meta.env.VITE_BRAND === "cdivet";

/** Marca de la instalación, definida al compilar. Sin VITE_BRAND se usa NextRIS. */
export const brand = {
    name: cdivet ? "CDIVET" : "NextRIS",
    logo: cdivet ? cdivetLogo : nextrisLogo,
    logoDark: cdivet ? cdivetLogoDark : nextrisLogo,
    mark: cdivet ? cdivetMark : nextrisLogo,
    icon: cdivet ? "/cdivet-icon.png" : null,
    veterinary: cdivet,
    productLogo: nextrisLogo,
    loginImage: {
        staff: cdivet ? veterinariaImg : medicoImg,
        patient: cdivet ? responsablesImg : pacientesImg,
    },
};
