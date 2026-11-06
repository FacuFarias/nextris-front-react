import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import { useAuth } from "@/context/AuthContext";
import { estudiosService } from "../services/estudios.service";
import type { Study } from "../types";

interface PatientCaseLink {
    case_url: string;
    expires_at: string;
    expires_hours: number;
}

export interface StudyShareState {
    study: Study;
    link?: PatientCaseLink;
    loading: boolean;
    error: string;
    qr: string;
    qrLoading: boolean;
    qrError: string;
    copyStatus: "copying" | "copied" | "failed";
    expired: boolean;
}

// Start during the tap, before waiting for the API, to preserve WebKit activation.
const copyLink = (url: string | Promise<string>): Promise<boolean> => {
    try {
        if (!navigator.clipboard) return Promise.resolve(false);
        if (typeof url === "string") return navigator.clipboard.writeText(url).then(() => true, () => false);
        const blob = url.then(value => new Blob([value], { type: "text/plain" }));
        void blob.catch(() => {});
        const operation = typeof navigator.clipboard.write === "function" && typeof ClipboardItem !== "undefined"
            ? navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })])
            : url.then(value => navigator.clipboard.writeText(value));
        return operation.then(() => true, () => false);
    } catch {
        return Promise.resolve(false);
    }
};

export const useStudyShare = () => {
    const { authData } = useAuth();
    const queryClient = useQueryClient();
    const [state, setState] = useState<StudyShareState | null>(null);
    const sequence = useRef(0);
    const pendingStudy = useRef<string | null>(null);
    useEffect(() => () => { sequence.current += 1; }, []);

    const update = (id: number, patch: Partial<StudyShareState>) => {
        if (sequence.current === id) setState(current => current ? { ...current, ...patch } : current);
    };
    const generateQr = async (id: number, url: string) => {
        update(id, { qrLoading: true, qrError: "" });
        try {
            const qr = await QRCode.toDataURL(url, { width: 320, margin: 4, errorCorrectionLevel: "M" });
            update(id, { qr, qrLoading: false });
        } catch {
            update(id, { qrLoading: false, qrError: "No se pudo generar el QR. Puedes seguir usando el enlace." });
        }
    };

    const start = (study: Study) => {
        if (pendingStudy.current === study.examination_id) return;
        const id = ++sequence.current;
        pendingStudy.current = study.examination_id;
        setState({ study, loading: true, error: "", qr: "", qrLoading: false, qrError: "", copyStatus: "copying", expired: false });
        const queryKey = ["patient-case-link", authData?.user.id, study.examination_id];
        const cached = queryClient.getQueryData<PatientCaseLink>(queryKey);
        if (cached && Date.parse(cached.expires_at) <= Date.now()) queryClient.removeQueries({ queryKey, exact: true });
        const linkPromise = queryClient.fetchQuery({
            queryKey,
            queryFn: async () => {
                const response = await estudiosService.createCaseLink(study.examination_id);
                if (!response.success || !response.data?.case_url) throw new Error(response.message || "No se pudo generar el enlace");
                if (!(Date.parse(response.data.expires_at) > Date.now())) throw new Error("El enlace recibido ya venció. Inténtalo de nuevo.");
                return response.data;
            },
            staleTime: Infinity,
            gcTime: Infinity, // AuthContext clears the query cache on logout/session changes.
            retry: false,
        });
        const urlPromise = linkPromise.then(link => link.case_url);
        // Handle rejection even when the clipboard is missing or rejects immediately.
        void urlPromise.catch(() => {});
        void copyLink(urlPromise).then(copied => update(id, { copyStatus: copied ? "copied" : "failed" }));
        void linkPromise.then(link => {
            update(id, { link, loading: false });
            if (sequence.current === id) void generateQr(id, link.case_url);
        }).catch((error: unknown) => {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            update(id, { loading: false, error: message || (error instanceof Error ? error.message : "No se pudo generar el enlace") });
        }).finally(() => {
            if (sequence.current === id) pendingStudy.current = null;
        });
    };

    const link = state?.link;
    useEffect(() => {
        if (!link) return;
        const timeout = window.setTimeout(() => {
            setState(current => current?.link === link ? { ...current, expired: true } : current);
        }, Math.min(Math.max(0, Date.parse(link.expires_at) - Date.now()), 2147483647));
        return () => window.clearTimeout(timeout);
    }, [link]);

    const copy = () => {
        if (!state?.link || state.expired) return;
        const id = sequence.current;
        update(id, { copyStatus: "copying" });
        void copyLink(state.link.case_url).then(copied => update(id, { copyStatus: copied ? "copied" : "failed" }));
    };
    return {
        state, start, copy,
        retryQr: () => { if (state?.link && !state.expired) void generateQr(sequence.current, state.link.case_url); },
        close: () => { sequence.current += 1; pendingStudy.current = null; setState(null); },
    };
};
