const VIEWER_WINDOW_NAME = "PacsViewer";
const VIEWER_WRAPPER_PATH = "/viewer-wrapper.html";
const VIEWER_WRAPPER_VERSION = "2";
const VIEWER_CHANNEL_NAME = "nextris-dicom-viewer-v1";
const VIEWER_GEOMETRY_KEY = "nextris.dicomViewer.geometry.v1";
const HANDSHAKE_TIMEOUT_MS = 5_000;
const STUDY_UID_PATTERN = /^[0-9]+(?:\.[0-9]+)+$/;

interface ViewerGeometry {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ViewerReadyMessage {
    type: "VIEWER_READY";
    viewerId: string;
    replyTo?: string;
}

interface StudyAcceptedMessage {
    type: "STUDY_ACCEPTED";
    viewerId: string;
    requestId: string;
    replyTo: string;
}

interface ViewerClosedMessage {
    type: "VIEWER_CLOSED";
    viewerId: string;
}

type ViewerMessage = ViewerReadyMessage | StudyAcceptedMessage | ViewerClosedMessage;

export interface ViewerWindowTicket {
    intentId: number;
    created: boolean;
}

export interface ViewerStudyRequest {
    studyInstanceUID: string;
    viewerUrl: string;
}

export type OpenStudyResult = "accepted" | "superseded";

interface PendingStudyRequest extends ViewerStudyRequest {
    intentId: number;
    requestId: string;
    sent: boolean;
    resolve: (result: OpenStudyResult) => void;
    reject: (error: Error) => void;
    timeoutId: number;
}

const sourceId = createId();
let channel: BroadcastChannel | null = null;
let viewerWindowRef: Window | null = null;
let readyViewerId: string | null = null;
let latestIntentId = 0;
let pendingRequest: PendingStudyRequest | null = null;
let acceptedStudyInCurrentWindow = false;
let studyDispatchedToCurrentWindow = false;

function createId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isViewerMessage(value: unknown): value is ViewerMessage {
    if (!isRecord(value) || typeof value.type !== "string") return false;

    if (value.type === "VIEWER_READY") {
        return typeof value.viewerId === "string"
            && (value.replyTo === undefined || typeof value.replyTo === "string");
    }

    if (value.type === "STUDY_ACCEPTED") {
        return typeof value.viewerId === "string"
            && typeof value.requestId === "string"
            && typeof value.replyTo === "string";
    }

    if (value.type === "VIEWER_CLOSED") {
        return typeof value.viewerId === "string";
    }

    return false;
}

function getChannel(): BroadcastChannel {
    if (channel) return channel;

    channel = new BroadcastChannel(VIEWER_CHANNEL_NAME);
    channel.addEventListener("message", handleChannelMessage);
    return channel;
}

function handleChannelMessage(event: MessageEvent<unknown>): void {
    if (!isViewerMessage(event.data)) return;

    const message = event.data;
    if (message.type === "VIEWER_READY") {
        if (message.replyTo && message.replyTo !== sourceId) return;

        readyViewerId = message.viewerId;
        sendPendingRequest();
        return;
    }

    if (message.type === "STUDY_ACCEPTED") {
        if (message.replyTo !== sourceId || !pendingRequest) return;
        if (message.viewerId !== readyViewerId || message.requestId !== pendingRequest.requestId) return;

        const request = pendingRequest;
        pendingRequest = null;
        window.clearTimeout(request.timeoutId);
        acceptedStudyInCurrentWindow = true;
        focusViewerWindow();
        request.resolve("accepted");
        return;
    }

    if (message.type === "VIEWER_CLOSED" && message.viewerId === readyViewerId) {
        readyViewerId = null;
        acceptedStudyInCurrentWindow = false;
        studyDispatchedToCurrentWindow = false;
        viewerWindowRef = null;
    }
}

function isValidStudyRequest(request: ViewerStudyRequest): boolean {
    if (request.studyInstanceUID.length > 64 || !STUDY_UID_PATTERN.test(request.studyInstanceUID)) {
        return false;
    }

    try {
        const viewerUrl = new URL(request.viewerUrl);
        const validProtocol = viewerUrl.protocol === "https:" || viewerUrl.protocol === "http:";
        const validPath = viewerUrl.pathname.endsWith("/set-token.html")
            || viewerUrl.pathname.endsWith("/viewer");
        return validProtocol && validPath;
    } catch {
        return false;
    }
}

function readStoredGeometry(): ViewerGeometry | null {
    try {
        const rawValue = localStorage.getItem(VIEWER_GEOMETRY_KEY);
        if (!rawValue) return null;

        const parsed: unknown = JSON.parse(rawValue);
        if (!isRecord(parsed)) return null;

        const geometry = {
            x: Number(parsed.x),
            y: Number(parsed.y),
            width: Number(parsed.width),
            height: Number(parsed.height),
        };

        if (!Object.values(geometry).every(Number.isFinite)) return null;
        if (geometry.width < 640 || geometry.height < 480) return null;
        if (geometry.width > 10_000 || geometry.height > 10_000) return null;
        if (Math.abs(geometry.x) > 100_000 || Math.abs(geometry.y) > 100_000) return null;

        return geometry;
    } catch {
        return null;
    }
}

function getCurrentScreenBounds(): ViewerGeometry {
    const currentScreen = window.screen as Screen & {
        availLeft?: number;
        availTop?: number;
    };
    const x = Number.isFinite(currentScreen.availLeft) ? currentScreen.availLeft! : 0;
    const y = Number.isFinite(currentScreen.availTop) ? currentScreen.availTop! : 0;
    const width = currentScreen.availWidth || currentScreen.width || 1400;
    const height = currentScreen.availHeight || currentScreen.height || 900;

    return { x, y, width, height };
}

function intersectsScreen(geometry: ViewerGeometry, screenBounds: ViewerGeometry): boolean {
    const visibleWidth = Math.min(geometry.x + geometry.width, screenBounds.x + screenBounds.width)
        - Math.max(geometry.x, screenBounds.x);
    const visibleHeight = Math.min(geometry.y + geometry.height, screenBounds.y + screenBounds.height)
        - Math.max(geometry.y, screenBounds.y);

    return visibleWidth >= 100 && visibleHeight >= 100;
}

function getSafeGeometry(): ViewerGeometry {
    const storedGeometry = readStoredGeometry();
    const currentScreen = getCurrentScreenBounds();
    const isExtended = (window.screen as Screen & { isExtended?: boolean }).isExtended;

    if (storedGeometry && (isExtended !== false || intersectsScreen(storedGeometry, currentScreen))) {
        return storedGeometry;
    }

    const width = Math.min(1400, currentScreen.width);
    const height = Math.min(900, currentScreen.height);

    return {
        x: Math.round(currentScreen.x + Math.max(0, (currentScreen.width - width) / 2)),
        y: Math.round(currentScreen.y + Math.max(0, (currentScreen.height - height) / 2)),
        width: Math.round(width),
        height: Math.round(height),
    };
}

function buildWindowFeatures(): string {
    const geometry = getSafeGeometry();

    return [
        "toolbar=no",
        "location=no",
        "directories=no",
        "status=no",
        "menubar=no",
        "scrollbars=yes",
        "resizable=yes",
        "titlebar=no",
        `width=${Math.round(geometry.width)}`,
        `height=${Math.round(geometry.height)}`,
        `left=${Math.round(geometry.x)}`,
        `top=${Math.round(geometry.y)}`,
    ].join(",");
}

function getWrapperUrl(): URL {
    const url = new URL(VIEWER_WRAPPER_PATH, window.location.origin);
    url.searchParams.set("bridge", VIEWER_WRAPPER_VERSION);
    return url;
}

function ensureViewerWrapper(viewerWindow: Window): boolean {
    const wrapperUrl = getWrapperUrl();

    try {
        const currentUrl = new URL(viewerWindow.location.href);
        const isNewWindow = currentUrl.href === "about:blank";
        const isExpectedWrapper = currentUrl.origin === wrapperUrl.origin
            && currentUrl.pathname === wrapperUrl.pathname
            && currentUrl.searchParams.get("bridge") === VIEWER_WRAPPER_VERSION;

        if (!isExpectedWrapper) {
            viewerWindow.location.replace(wrapperUrl.href);
        }

        return isNewWindow;
    } catch {
        // Una ventana homónima de otro origen se recupera navegándola al wrapper seguro.
        viewerWindow.location.href = wrapperUrl.href;
        return false;
    }
}

function supersedePendingRequest(): void {
    if (!pendingRequest) return;

    const request = pendingRequest;
    pendingRequest = null;
    window.clearTimeout(request.timeoutId);
    request.resolve("superseded");
}

function sendPendingRequest(): void {
    if (!pendingRequest || pendingRequest.sent || !readyViewerId) return;
    if (pendingRequest.intentId !== latestIntentId) {
        supersedePendingRequest();
        return;
    }

    pendingRequest.sent = true;
    studyDispatchedToCurrentWindow = true;
    getChannel().postMessage({
        type: "OPEN_STUDY",
        sourceId,
        targetViewerId: readyViewerId,
        requestId: pendingRequest.requestId,
        studyInstanceUID: pendingRequest.studyInstanceUID,
        viewerUrl: pendingRequest.viewerUrl,
    });
}

function focusViewerWindow(): void {
    if (!viewerWindowRef || viewerWindowRef.closed) return;

    try {
        viewerWindowRef.focus();
    } catch {
        // El foco es best-effort y puede ser rechazado por políticas del navegador.
    }
}

export function prepareViewerWindow(): ViewerWindowTicket | null {
    supersedePendingRequest();
    const intentId = ++latestIntentId;
    getChannel();

    if (viewerWindowRef?.closed) {
        viewerWindowRef = null;
        readyViewerId = null;
        acceptedStudyInCurrentWindow = false;
        studyDispatchedToCurrentWindow = false;
    }

    let created = false;
    if (!viewerWindowRef) {
        viewerWindowRef = window.open("", VIEWER_WINDOW_NAME, buildWindowFeatures());
        if (!viewerWindowRef) return null;
        created = ensureViewerWrapper(viewerWindowRef);
    } else {
        ensureViewerWrapper(viewerWindowRef);
    }

    readyViewerId = null;
    focusViewerWindow();
    getChannel().postMessage({ type: "VIEWER_PING", sourceId });

    return { intentId, created };
}

export function openStudyInViewer(
    ticket: ViewerWindowTicket,
    request: ViewerStudyRequest,
): Promise<OpenStudyResult> {
    if (ticket.intentId !== latestIntentId) {
        return Promise.resolve("superseded");
    }
    if (!isValidStudyRequest(request)) {
        return Promise.reject(new Error("Los datos recibidos para abrir el visor no son válidos"));
    }

    return new Promise((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
            if (!pendingRequest || pendingRequest.intentId !== ticket.intentId) return;

            pendingRequest = null;
            reject(new Error("El visor no respondió durante la inicialización"));
        }, HANDSHAKE_TIMEOUT_MS);

        pendingRequest = {
            ...request,
            intentId: ticket.intentId,
            requestId: createId(),
            sent: false,
            resolve,
            reject,
            timeoutId,
        };

        sendPendingRequest();
    });
}

export function cancelPreparedViewer(ticket: ViewerWindowTicket): void {
    if (ticket.intentId !== latestIntentId || !ticket.created) return;
    if (acceptedStudyInCurrentWindow || studyDispatchedToCurrentWindow) return;
    if (!viewerWindowRef || viewerWindowRef.closed) return;

    viewerWindowRef.close();
    viewerWindowRef = null;
    readyViewerId = null;
}

function disposeChannel(): void {
    supersedePendingRequest();
    channel?.removeEventListener("message", handleChannelMessage);
    channel?.close();
    channel = null;
}

function handlePageHide(): void {
    disposeChannel();
}

window.addEventListener("pagehide", handlePageHide);

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        window.removeEventListener("pagehide", handlePageHide);
        disposeChannel();
    });
}
