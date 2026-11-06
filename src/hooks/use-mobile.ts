import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

export const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== "undefined" ? window.matchMedia(MOBILE_QUERY).matches : false
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia(MOBILE_QUERY);
        const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);

        setIsMobile(mediaQuery.matches);
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    return isMobile;
};
