import nextrisLogo from "@/assets/logo/logo5.png";
import cdivetLogo from "@/assets/logo/cdivet-logo.png";
import cdivetMark from "@/assets/logo/cdivet-mark.png";

const cdivet = import.meta.env.VITE_BRAND === "cdivet";

/** Marca de la instalación, definida al compilar. Sin VITE_BRAND se usa NextRIS. */
export const brand = {
    name: cdivet ? "CDIVET" : "NextRIS",
    logo: cdivet ? cdivetLogo : nextrisLogo,
    mark: cdivet ? cdivetMark : nextrisLogo,
    icon: cdivet ? "/cdivet-icon.png" : null,
    veterinary: cdivet,
};
