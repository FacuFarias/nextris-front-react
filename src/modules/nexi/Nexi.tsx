import { useEffect, useRef, useState, type ReactNode } from "react";
import { Send, Bot, User, Sparkles, Loader2, FileText, Image as ImageIcon, ExternalLink } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/layouts/layout";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { getDicomViewerUrl } from "@/services/dicomViewer";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface ActionLink {
    label: string;
    url: string;
    type: "report" | "images" | "other";
    examId?: string;
}

const NEXI_INTRO = `Hola. Soy **Nexi**, tu asistente de inteligencia artificial integrada en NextRIS.

Puedo ayudarte con:
- Preguntas sobre estudios de diagnostico e imagenes medicas
- Interpretacion de terminologia medica
- Orientacion sobre flujos de trabajo en el sistema
- Redaccion y revision de informes radiologicos
- Consultas generales de medicina

En que puedo ayudarte hoy?`;

const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const URL_REGEX = /https?:\/\/\S+/gi;

const sanitizeUrl = (url: string) => {
    return url.trim().replace(/[)\],.;:!?]+$/g, "");
};

const extractExamIdFromUrl = (url: string) => {
    try {
        const parsed = new URL(url, window.location.origin);
        const fromQuery = parsed.searchParams.get("exam_id") || parsed.searchParams.get("exam_guid");
        if (fromQuery && /^[0-9a-f-]{36}$/i.test(fromQuery)) {
            return fromQuery;
        }
    } catch {
        // Ignore parse error and continue with regex fallback.
    }

    const match = url.match(/\/api\/reports\/([0-9a-f-]{36})\/pdf/i);
    return match?.[1] ?? undefined;
};

const classifyUrlType = (url: string, hint: string): ActionLink["type"] => {
    const safeUrl = sanitizeUrl(url).toLowerCase();
    const safeHint = (hint || "").toLowerCase();

    if (safeUrl.includes("studyinstanceuids=") || safeUrl.includes("viewer.nextris.cloud") || safeHint.includes("imagen") || safeHint.includes("visualizador") || safeHint.includes("viewer")) {
        return "images";
    }

    if (safeUrl.includes("/api/reports/") || safeHint.includes("reporte") || safeHint.includes("informe") || safeHint.includes("pdf")) {
        return "report";
    }

    return "other";
};

const extractActionLinks = (content: string): ActionLink[] => {
    const links: ActionLink[] = [];

    const markdownMatches = [...content.matchAll(MARKDOWN_LINK_REGEX)];
    markdownMatches.forEach((match) => {
        const label = (match[1] || "").trim();
        const url = sanitizeUrl(match[2] || "");
        if (!url) {
            return;
        }

        const type = classifyUrlType(url, label);
        links.push({
            label: type === "report" ? "Reporte" : type === "images" ? "Imagenes" : "Enlace",
            url,
            type,
            examId: extractExamIdFromUrl(url),
        });
    });

    const lines = content.split("\n");
    lines.forEach((line, idx) => {
        const urls = line.match(URL_REGEX);
        if (!urls) {
            return;
        }

        urls.forEach((rawUrl) => {
            const url = sanitizeUrl(rawUrl);
            if (!url) {
                return;
            }

            const current = line.toLowerCase();
            const previous = idx > 0 ? lines[idx - 1].toLowerCase() : "";
            const hint = `${previous} ${current}`;
            const type = classifyUrlType(url, hint);
            links.push({
                label: type === "report" ? "Reporte" : type === "images" ? "Imagenes" : "Enlace",
                url,
                type,
                examId: extractExamIdFromUrl(url),
            });
        });
    });

    const reportExamId = links.find((link) => link.type === "report" && link.examId)?.examId;
    if (reportExamId) {
        links.forEach((link) => {
            if (link.type === "images" && !link.examId) {
                link.examId = reportExamId;
            }
        });
    }

    const uniqueByUrl = new Map<string, ActionLink>();
    links.forEach((link) => {
        const key = `${link.type}|${link.url}`;
        if (!uniqueByUrl.has(key)) {
            uniqueByUrl.set(key, link);
        }
    });

    return [...uniqueByUrl.values()];
};

const stripActionLinkLines = (content: string) => {
    const cleaned = content
        .split("\n")
        .filter((line) => {
            const trimmed = line.trim();
            if (!trimmed) {
                return true;
            }
            if (MARKDOWN_LINK_REGEX.test(trimmed)) {
                MARKDOWN_LINK_REGEX.lastIndex = 0;
                return false;
            }
            MARKDOWN_LINK_REGEX.lastIndex = 0;
            if (/(reporte|informe|pdf|imagenes|imágenes|viewer)\s*:\s*https?:\/\//i.test(trimmed)) {
                return false;
            }

            // Remove standalone URL lines when the previous line indicates report/image link label.
            if (/^https?:\/\//i.test(trimmed)) {
                return false;
            }

            return true;
        })
        .join("\n");

    return cleaned.replace(/\n{3,}/g, "\n\n").trim();
};

export const Nexi = () => {
    const { authData } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "intro",
            role: "assistant",
            content: NEXI_INTRO,
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (!textarea) {
            return;
        }

        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(event.target.value);
        adjustTextareaHeight();
    };

    const sendMessage = async () => {
        const trimmedMessage = input.trim();
        if (!trimmedMessage || isLoading) {
            return;
        }

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            content: trimmedMessage,
            timestamp: new Date(),
        };

        setMessages((previous) => [...previous, userMessage]);
        setInput("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
        setIsLoading(true);

        try {
            const response = await api.post("/nexi/chat", {
                message: trimmedMessage,
                history: messages.map((message) => ({
                    role: message.role,
                    content: message.content,
                })),
            });

            const data = response.data;
            if (!data?.success && !data?.reply) {
                throw new Error(data?.error || data?.message || "Error al contactar con Nexi");
            }

            const assistantMessage: Message = {
                id: `nexi-${Date.now()}`,
                role: "assistant",
                content: data.reply ?? "No pude obtener una respuesta.",
                timestamp: new Date(),
            };

            setMessages((previous) => [...previous, assistantMessage]);
        } catch (error: unknown) {
            const axiosError = error as {
                response?: {
                    data?: {
                        error?: string;
                        message?: string;
                    };
                };
            };

            const errorMessage =
                axiosError.response?.data?.error ||
                axiosError.response?.data?.message ||
                (error instanceof Error
                    ? error.message
                    : "Lo siento, hubo un problema al procesar tu mensaje. Por favor, intenta de nuevo en unos momentos.");

            setMessages((previous) => [
                ...previous,
                {
                    id: `err-${Date.now()}`,
                    role: "assistant",
                    content: errorMessage,
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const openActionLink = async (link: ActionLink) => {
        const safeUrl = sanitizeUrl(link.url);
        if (!safeUrl) {
            return;
        }

        if (link.type === "images") {
            const examId = link.examId;
            const userId = authData?.user?.id;

            if (examId && userId) {
                const viewerWindow = window.open("", "_blank", "width=1400,height=900,resizable=yes,scrollbars=yes");
                if (!viewerWindow) {
                    return;
                }

                viewerWindow.document.write('<html><head><title>Cargando visor DICOM...</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1a1a2e;color:#fff"><p>Abriendo visor DICOM...</p></body></html>');

                try {
                    const data = await getDicomViewerUrl(userId, examId);
                    viewerWindow.location.href = data.viewer_url;
                    return;
                } catch {
                    viewerWindow.close();
                    window.alert("No se pudo abrir el visor con el metodo de Redaccion.");
                    return;
                }
            }

            window.alert("No se encontro exam_id para abrir imagenes con el metodo de Redaccion.");
            return;
        }

        if (link.type === "report") {
            try {
                const parsed = new URL(safeUrl, window.location.origin);
                const isPublicPdf = /\/api\/pdfs\//i.test(parsed.pathname);
                if (isPublicPdf) {
                    // Same behavior as Redaccion: open public PDF URL directly.
                    window.open(parsed.toString(), "_blank", "noopener,noreferrer");
                    return;
                }
            } catch (error) {
                const axiosError = error as {
                    response?: {
                        status?: number;
                        data?: { error?: string; msg?: string; message?: string };
                    };
                };
                const serverMessage =
                    axiosError.response?.data?.error ||
                    axiosError.response?.data?.msg ||
                    axiosError.response?.data?.message;
                const detail = serverMessage || "No se pudo abrir el reporte con autenticacion.";
                window.alert(detail);
                return;
            }

            window.alert("No se encontro un enlace de reporte valido en formato /api/pdfs (estilo Redaccion).");
            return;
        }

        window.open(safeUrl, "_blank", "noopener,noreferrer");
    };

    const renderLinkButton = (label: string, url: string, key: string, examId?: string) => {
        const loweredLabel = label.toLowerCase();
        const isReport = loweredLabel.includes("report");
        const isImages = loweredLabel.includes("imagen") || loweredLabel.includes("image");

        const buttonText = isReport ? "Reporte" : isImages ? "Imagenes" : "Enlace";
        const Icon = isReport ? FileText : isImages ? ImageIcon : ExternalLink;

        return (
            <button
                key={key}
                type="button"
                onClick={() => void openActionLink({
                    label: buttonText,
                    url,
                    type: isReport ? "report" : isImages ? "images" : "other",
                    examId: examId ?? extractExamIdFromUrl(url),
                })}
                className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                    "bg-background hover:bg-accent/40 border-border text-foreground"
                )}
            >
                <Icon className="w-3.5 h-3.5" />
                {buttonText}
            </button>
        );
    };

    const renderLine = (line: string, keyPrefix: string) => {
        const matches = [...line.matchAll(MARKDOWN_LINK_REGEX)];
        if (matches.length === 0) {
            return <span key={`${keyPrefix}-plain`}>{line}</span>;
        }

        // If the line only contains a markdown link plus optional bullets/separators, render just button(s).
        const lineWithoutLinks = line.replace(MARKDOWN_LINK_REGEX, "").trim();
        const isLinkOnlyLine = /^[-*•\s:|]*$/.test(lineWithoutLinks);

        if (isLinkOnlyLine) {
            return (
                <span key={`${keyPrefix}-buttons`} className="inline-flex flex-wrap gap-2">
                    {matches.map((match, idx) => renderLinkButton(match[1], match[2], `${keyPrefix}-btn-${idx}`))}
                </span>
            );
        }

        const parts: ReactNode[] = [];
        let lastIndex = 0;

        matches.forEach((match, idx) => {
            const fullMatch = match[0];
            const label = match[1];
            const url = match[2];
            const start = match.index ?? 0;

            if (start > lastIndex) {
                parts.push(
                    <span key={`${keyPrefix}-text-${idx}`}>{line.slice(lastIndex, start)}</span>
                );
            }

            parts.push(renderLinkButton(label, url, `${keyPrefix}-link-${idx}`));
            lastIndex = start + fullMatch.length;
        });

        if (lastIndex < line.length) {
            parts.push(
                <span key={`${keyPrefix}-tail`}>{line.slice(lastIndex)}</span>
            );
        }

        return <span key={`${keyPrefix}-mixed`} className="inline-flex flex-wrap items-center gap-2">{parts}</span>;
    };

    const renderContent = (content: string) => {
        const parts = content.split(/(\*\*[^*]+\*\*)/g);

        return parts.map((part, index) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={index}>{part.slice(2, -2)}</strong>;
            }

            return (
                <span key={index}>
                    {part.split("\n").map((line, lineIndex) => (
                        <span key={lineIndex}>
                            {lineIndex > 0 && <br />}
                            {renderLine(line, `${index}-${lineIndex}`)}
                        </span>
                    ))}
                </span>
            );
        });
    };

    return (
        <MainLayout isOverflow={false}>
            <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-foreground">Nexi</h1>
                        <p className="text-[11px] text-muted-foreground">Asistente IA · NextRIS</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[11px] text-muted-foreground">En linea</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    {messages.map((message) => {
                        const actionLinks = message.role === "assistant" ? extractActionLinks(message.content) : [];
                        const displayContent = message.role === "assistant" ? stripActionLinkLines(message.content) : message.content;

                        return (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex gap-2.5 max-w-3xl",
                                    message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}
                            >
                            <div
                                className={cn(
                                    "w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold mt-0.5",
                                    message.role === "assistant"
                                        ? "bg-gradient-to-br from-purple-500 to-purple-700"
                                        : "bg-gradient-to-br from-slate-500 to-slate-700"
                                )}
                            >
                                {message.role === "assistant" ? (
                                    <Bot className="w-3.5 h-3.5" />
                                ) : (
                                    <User className="w-3.5 h-3.5" />
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <div
                                    className={cn(
                                        "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                                        message.role === "assistant"
                                            ? "bg-card border border-border text-foreground rounded-tl-sm"
                                            : "bg-purple-600 text-white rounded-tr-sm"
                                    )}
                                >
                                    {displayContent ? renderContent(displayContent) : null}

                                    {message.role === "assistant" && actionLinks.length > 0 && (
                                        <div className={cn("flex flex-wrap gap-2", displayContent ? "mt-3" : "mt-0")}>
                                            {actionLinks.map((link, idx) => renderLinkButton(link.label, link.url, `${message.id}-action-${idx}`, link.examId))}
                                        </div>
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "text-[10px] text-muted-foreground",
                                        message.role === "user" ? "text-right" : "text-left"
                                    )}
                                >
                                    {message.role === "assistant" ? "Nexi" : authData?.user.username ?? "Tu"} · {formatTime(message.timestamp)}
                                </span>
                            </div>
                        </div>
                        );
                    })}

                    {isLoading && (
                        <div className="flex gap-2.5 max-w-3xl mr-auto">
                            <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-700 mt-0.5">
                                <Bot className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-card border border-border shadow-sm">
                                <div className="flex items-center gap-1.5">
                                    <Loader2 className="w-3.5 h-3.5 text-purple-500 animate-spin" />
                                    <span className="text-xs text-muted-foreground">Nexi esta escribiendo...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <div className="px-4 py-3 border-t border-border bg-card shrink-0">
                    <div className="flex items-end gap-2 max-w-3xl mx-auto">
                        <div className="flex-1 relative">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Escribi tu mensaje... (Enter para enviar, Shift+Enter para nueva linea)"
                                rows={1}
                                className={cn(
                                    "w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm",
                                    "text-foreground placeholder:text-muted-foreground",
                                    "focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500",
                                    "transition-all duration-200 max-h-40 overflow-y-auto"
                                )}
                            />
                        </div>
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || isLoading}
                            className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200",
                                input.trim() && !isLoading
                                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/30"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-muted-foreground mt-2">
                        Nexi puede cometer errores. Verifica siempre la informacion medica con fuentes confiables.
                    </p>
                </div>
            </div>
        </MainLayout>
    );
};
