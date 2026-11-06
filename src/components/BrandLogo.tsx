import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Logo de la marca con fondo transparente: usa la variante clara en modo oscuro. */
export const BrandLogo = ({ className }: { className?: string }) => (
    <>
        <img src={brand.logo} alt={brand.name} className={cn(className, "dark:hidden")} />
        <img src={brand.logoDark} alt={brand.name} className={cn(className, "hidden dark:block")} />
    </>
);
