import React, { createContext, useContext, useEffect, useState } from "react";

interface FacilityContextType {
    selectedFacilityId: string;
    setSelectedFacilityId: (facilityId: string) => void;
    clearSelectedFacilityId: () => void;
}

const FacilityContext = createContext<FacilityContextType | undefined>(undefined);

const STORAGE_KEY = "activeFacilityId";

export const FacilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedFacilityId, setSelectedFacilityIdState] = useState<string>("");

    useEffect(() => {
        const storedFacilityId = localStorage.getItem(STORAGE_KEY) || "";
        setSelectedFacilityIdState(storedFacilityId);
    }, []);

    const setSelectedFacilityId = (facilityId: string) => {
        const safeFacilityId = String(facilityId || "").trim();
        setSelectedFacilityIdState(safeFacilityId);
        if (safeFacilityId) {
            localStorage.setItem(STORAGE_KEY, safeFacilityId);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    const clearSelectedFacilityId = () => {
        setSelectedFacilityIdState("");
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <FacilityContext.Provider
            value={{
                selectedFacilityId,
                setSelectedFacilityId,
                clearSelectedFacilityId,
            }}
        >
            {children}
        </FacilityContext.Provider>
    );
};

export const useFacility = () => {
    const context = useContext(FacilityContext);
    if (!context) {
        throw new Error("useFacility must be used within a FacilityProvider");
    }
    return context;
};
