import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { GripVertical } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { acknowledgeAssistantCommand, callAssistantHandler, currentAssistantView } from './commands';
import type { AssistantCommand, AssistantResult } from './commands';

const BASE = '/assistant-bridge';
const CHILD_SESSION = 'nextris-assistant-child';
const HANDOFF_CHANNEL = 'nextris-mcp-window-link';
type Link = { tabId: string; owner: string };
type PanelPosition = { left: number; top: number };
const reportKinds = new Set(['report_header', 'report_context', 'report_edit', 'report_undo', 'report_save', 'report_sign']);

function accessToken() {
    try { return JSON.parse(localStorage.getItem('authData') || '{}').access_token as string | undefined; }
    catch { return undefined; }
}

async function bridgeRequest(path: string, method = 'GET', payload?: unknown, owner?: string, tokenOverride?: string) {
    let token = tokenOverride || accessToken();
    if (!token) throw new Error('no_session');
    const send = () => fetch(`${BASE}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, ...(owner ? { 'x-bridge-owner': owner } : {}), ...(payload ? { 'Content-Type': 'application/json' } : {}) },
        body: payload ? JSON.stringify(payload) : undefined,
        cache: 'no-store',
        keepalive: method === 'DELETE' || path.endsWith('/release'),
    });
    let response = await send();
    if (response.status === 403) {
        await api.get('/auth/me');
        token = accessToken();
        response = await send();
    }
    if (!response.ok) throw new Error(`bridge_${response.status}`);
    return response.json();
}

export function BridgeWidget() {
    const { authData } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const panelRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
    const [position, setPosition] = useState<PanelPosition | null>(null);
    const [dragging, setDragging] = useState(false);
    const [code, setCode] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'offline' | 'suspended'>('idle');
    const link = useRef<Link | null>(null);
    const stopped = useRef(false);
    const pathname = useRef(location.pathname);
    const childWindow = useRef<Window | null>(null);
    const childNonce = useRef<string | null>(null);
    const claimPending = useRef(false);
    const handoffTicket = useRef<{ nonce: string; ticket: string; expires: number } | null>(null);
    const handoffPending = useRef<{ nonce: string; promise: Promise<string> } | null>(null);
    const handoffChannel = useRef<BroadcastChannel | null>(null);
    const pollToken = useRef(0);
    const lastToken = useRef(accessToken());
    useEffect(() => { const token = accessToken(); if (token) lastToken.current = token; });
    useEffect(() => { pathname.current = location.pathname; }, [location.pathname]);
    useEffect(() => {
        if (currentAssistantView(location.pathname) === 'worklist') sessionStorage.removeItem(CHILD_SESSION);
    }, [location.pathname]);
    const enabled = import.meta.env.VITE_MCP_BRIDGE_ENABLED === 'true'
        && authData?.user?.user_type?.toLowerCase() === 'sysadmin';
    const isChild = currentAssistantView(location.pathname) === 'editor'
        && Boolean(window.opener || sessionStorage.getItem(CHILD_SESSION));

    const execute = useCallback(async (command: AssistantCommand): Promise<AssistantResult> => {
        const current = currentAssistantView(pathname.current);
        if (reportKinds.has(command.kind)) return current === 'editor'
            ? callAssistantHandler('editor', command) : { status: 'not_in_editor', view: current };
        if (command.kind === 'context') return current === 'other'
            ? { status: 'ok', view: 'other' } : callAssistantHandler(current, command);
        if (current === 'editor') return command.kind === 'worklist'
            ? callAssistantHandler('editor', command) : { status: 'editor_active', view: 'editor' };
        if (command.kind === 'editor' && current === 'worklist') return callAssistantHandler('worklist', command);
        if (command.kind === 'worklist' && current === 'worklist') return callAssistantHandler('worklist', command);
        if (current !== 'worklist') navigate('/worklist');
        return callAssistantHandler('worklist', command);
    }, [navigate]);

    const stop = useCallback((remove = true) => {
        stopped.current = true;
        pollToken.current += 1;
        const current = link.current;
        link.current = null;
        setCode(null);
        setStatus('idle');
        if (current && remove) void bridgeRequest(`/tabs/${current.tabId}`, 'DELETE', undefined, current.owner, lastToken.current).catch(() => {});
    }, []);

    const poll = useCallback(async (current: Link) => {
        const token = ++pollToken.current;
        while (!stopped.current && token === pollToken.current && link.current?.tabId === current.tabId) {
            try {
                const state = await bridgeRequest(`/tabs/${current.tabId}/state?view=${currentAssistantView(pathname.current)}`, 'GET', undefined, current.owner);
                if (!state.active) {
                    setStatus('suspended');
                    if (childWindow.current?.closed) {
                        await bridgeRequest(`/tabs/${current.tabId}/reclaim`, 'POST', {}, current.owner);
                        childWindow.current = null;
                    } else await new Promise(resolve => setTimeout(resolve, 700));
                    continue;
                }
                if (childWindow.current?.closed) {
                    await bridgeRequest(`/tabs/${current.tabId}/reclaim`, 'POST', {}, current.owner).catch(() => {});
                    childWindow.current = null;
                    handoffTicket.current = null;
                }
                setStatus('connected');
                const next = await bridgeRequest(`/tabs/${current.tabId}/next`, 'GET', undefined, current.owner);
                if (!next.command || stopped.current || token !== pollToken.current) continue;
                const started = performance.now();
                const result: AssistantResult = await execute(next.command).catch(() => ({ status: 'error' }));
                if (reportKinds.has(next.command.kind) || next.command.kind === 'editor') {
                    result.browserMs = Math.round((performance.now() - started) * 10) / 10;
                }
                await bridgeRequest(`/tabs/${current.tabId}/result`, 'POST', { id: next.command.id, result }, current.owner);
                acknowledgeAssistantCommand(next.command.id);
            } catch (error) {
                if (String(error).includes('bridge_409')) continue;
                if (!stopped.current) setStatus('offline');
                break;
            }
        }
    }, [execute]);

    const connect = useCallback(async () => {
        sessionStorage.removeItem(CHILD_SESSION);
        stop();
        stopped.current = false;
        setStatus('connecting');
        const owner = crypto.randomUUID();
        try {
            const created = await bridgeRequest('/tabs', 'POST', { owner, view: currentAssistantView(pathname.current) });
            if (stopped.current) return;
            link.current = { tabId: created.tabId, owner };
            setCode(created.code);
            setStatus('connected');
            void poll(link.current);
        } catch { setStatus('offline'); }
    }, [poll, stop]);

    const issueTicket = useCallback(async (nonce: string) => {
        const current = link.current;
        if (!current || currentAssistantView(pathname.current) !== 'worklist') return null;
        let ticket = handoffTicket.current?.nonce === nonce && handoffTicket.current.expires > Date.now()
            ? handoffTicket.current.ticket : null;
        if (!ticket) {
            if (handoffPending.current?.nonce === nonce) ticket = await handoffPending.current.promise;
            else {
                const promise = bridgeRequest(`/tabs/${current.tabId}/handoff`, 'POST', { nonce }, current.owner)
                    .then(result => String(result.ticket));
                handoffPending.current = { nonce, promise };
                try { ticket = await promise; }
                finally { if (handoffPending.current?.promise === promise) handoffPending.current = null; }
            }
            if (link.current?.tabId !== current.tabId) return null;
            handoffTicket.current = { nonce, ticket, expires: Date.now() + 13_000 };
        }
        return { tabId: current.tabId, nonce, ticket };
    }, []);

    const claimTicket = useCallback(async (data: Record<string, unknown>) => {
        if (link.current || claimPending.current || data.nonce !== childNonce.current
            || typeof data.tabId !== 'string' || typeof data.ticket !== 'string') return;
        claimPending.current = true;
        const owner = crypto.randomUUID();
        try {
            await bridgeRequest(`/tabs/${data.tabId}/claim`, 'POST', { nonce: data.nonce, ticket: data.ticket, owner });
            stopped.current = false;
            link.current = { tabId: data.tabId, owner };
            sessionStorage.setItem(CHILD_SESSION, JSON.stringify(link.current));
            setCode(null);
            setStatus('connected');
            void poll(link.current);
        } catch { setStatus('offline'); }
        finally { claimPending.current = false; }
    }, [poll]);

    useEffect(() => {
        if (!enabled) return;
        const handleMessage = async (event: MessageEvent) => {
            if (event.origin !== window.location.origin || !event.data || typeof event.data !== 'object') return;
            const data = event.data as Record<string, unknown>;
            const current = link.current;
            if (data.type === 'nextris-mcp-ready' && !isChild && current && event.source && data.nonce && typeof data.nonce === 'string') {
                if (childWindow.current?.closed) {
                    await bridgeRequest(`/tabs/${current.tabId}/reclaim`, 'POST', {}, current.owner).catch(() => {});
                    childWindow.current = null;
                    handoffTicket.current = null;
                }
                if (childWindow.current && childWindow.current !== event.source) return;
                childWindow.current = event.source as Window;
                childNonce.current = data.nonce;
                try {
                    const offer = await issueTicket(data.nonce);
                    if (offer) (event.source as Window).postMessage({ type: 'nextris-mcp-ticket', ...offer }, event.origin);
                } catch { /* The popup can still show its own pairing code. */ }
            }
            if (data.type === 'nextris-mcp-ticket' && isChild && event.source === window.opener && data.nonce === childNonce.current) {
                await claimTicket(data);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [enabled, isChild, issueTicket, claimTicket]);

    useEffect(() => {
        if (!enabled || typeof BroadcastChannel === 'undefined') return;
        const channel = new BroadcastChannel(HANDOFF_CHANNEL);
        handoffChannel.current = channel;
        channel.onmessage = (event: MessageEvent) => {
            const data = event.data as Record<string, unknown> | null;
            if (!data || typeof data !== 'object') return;
            if (data.type === 'nextris-mcp-ready' && typeof data.nonce === 'string'
                && currentAssistantView(pathname.current) === 'worklist') {
                void issueTicket(data.nonce).then(offer => {
                    if (offer) channel.postMessage({ type: 'nextris-mcp-ticket', ...offer });
                }).catch(() => {});
            }
            if (data.type === 'nextris-mcp-ticket' && currentAssistantView(pathname.current) === 'editor')
                void claimTicket(data);
        };
        return () => { handoffChannel.current = null; channel.close(); };
    }, [enabled, issueTicket, claimTicket]);

    useEffect(() => {
        if (!enabled || currentAssistantView(location.pathname) !== 'editor') return;
        let cancelled = false;
        let timer: number | undefined;
        const recover = async () => {
            try {
                const saved = JSON.parse(sessionStorage.getItem(CHILD_SESSION) || 'null') as Link | null;
                if (saved?.tabId && saved.owner) {
                    const state = await bridgeRequest(`/tabs/${saved.tabId}/state`, 'GET', undefined, saved.owner);
                    if (state.active && !cancelled) {
                        link.current = saved;
                        stopped.current = false;
                        setStatus('connected');
                        void poll(saved);
                        return;
                    }
                }
            } catch { sessionStorage.removeItem(CHILD_SESSION); }
            if (cancelled) return;
            childNonce.current = crypto.randomUUID();
            const announce = () => {
                if (link.current) { if (timer) clearInterval(timer); return; }
                const message = { type: 'nextris-mcp-ready', nonce: childNonce.current };
                if (window.opener && !window.opener.closed) window.opener.postMessage(message, window.location.origin);
                else handoffChannel.current?.postMessage(message);
            };
            timer = window.setInterval(announce, 800);
            announce();
        };
        void recover();
        return () => { cancelled = true; if (timer) window.clearInterval(timer); };
    }, [enabled, location.pathname, poll]);

    useEffect(() => {
        const onPageHide = () => {
            const current = link.current;
            stopped.current = true;
            pollToken.current += 1;
            if (!current) return;
            let saved: Link | null = null;
            try { saved = JSON.parse(sessionStorage.getItem(CHILD_SESSION) || 'null') as Link | null; } catch { /* Ignore invalid session state. */ }
            if (saved?.tabId === current.tabId && saved.owner === current.owner)
                void bridgeRequest(`/tabs/${current.tabId}/release`, 'POST', {}, current.owner).catch(() => {});
            else void bridgeRequest(`/tabs/${current.tabId}?promote=true`, 'DELETE', undefined, current.owner, lastToken.current).catch(() => {});
        };
        window.addEventListener('pagehide', onPageHide);
        return () => window.removeEventListener('pagehide', onPageHide);
    }, []);
    useEffect(() => {
        if (enabled || !link.current) return;
        sessionStorage.removeItem(CHILD_SESSION);
        const timer = window.setTimeout(stop, 0);
        return () => window.clearTimeout(timer);
    }, [enabled, stop]);
    useEffect(() => () => { stopped.current = true; pollToken.current += 1; }, []);
    const constrainPosition = useCallback((next: PanelPosition): PanelPosition => {
        const bounds = panelRef.current?.getBoundingClientRect();
        const margin = 8;
        return {
            left: Math.max(margin, Math.min(next.left, window.innerWidth - (bounds?.width ?? 0) - margin)),
            top: Math.max(margin, Math.min(next.top, window.innerHeight - (bounds?.height ?? 0) - margin)),
        };
    }, []);

    useEffect(() => {
        if (!enabled) return;
        const keepVisible = () => setPosition(current => current ? constrainPosition(current) : current);
        window.addEventListener('resize', keepVisible);
        const observer = new ResizeObserver(keepVisible);
        if (panelRef.current) observer.observe(panelRef.current);
        return () => {
            window.removeEventListener('resize', keepVisible);
            observer.disconnect();
        };
    }, [enabled, constrainPosition]);

    const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.button !== 0 || !event.isPrimary) return;
        const bounds = panelRef.current?.getBoundingClientRect();
        if (!bounds) return;
        event.preventDefault();
        dragRef.current = {
            pointerId: event.pointerId,
            offsetX: event.clientX - bounds.left,
            offsetY: event.clientY - bounds.top,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        setPosition({ left: bounds.left, top: bounds.top });
        setDragging(true);
    };
    const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        setPosition(constrainPosition({ left: event.clientX - drag.offsetX, top: event.clientY - drag.offsetY }));
    };
    const stopDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (dragRef.current?.pointerId !== event.pointerId) return;
        dragRef.current = null;
        setDragging(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    };
    if (!enabled) return null;
    return (
        <div
            ref={panelRef}
            style={position ? { left: position.left, top: position.top, right: 'auto', bottom: 'auto' } : undefined}
            className="fixed bottom-4 right-4 z-[100] max-h-[calc(100dvh-1rem)] max-w-[min(16rem,calc(100vw-1rem))] overflow-y-auto rounded-lg border border-border bg-card p-3 text-xs text-foreground shadow-lg"
            role="status"
        >
            <div
                className={`mb-2 flex touch-none select-none items-center gap-1.5 font-semibold ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                title="Mantén presionado y arrastra para mover el panel"
                onPointerDown={startDrag}
                onPointerMove={moveDrag}
                onPointerUp={stopDrag}
                onPointerCancel={stopDrag}
                onLostPointerCapture={stopDrag}
            >
                <GripVertical className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                NextRIS MCP · Sysadmin
            </div>
            {code && status === 'connected' && <div className="mb-2">Código temporal: <strong className="select-all font-mono">{code}</strong></div>}
            {status === 'suspended' && <div className="mb-2">Control en el redactor.</div>}
            {status === 'offline' && <div className="mb-2">MCP desconectado. Vuelve a vincular esta pestaña.</div>}
            {(status === 'idle' || status === 'offline' || Boolean(code)) && <button type="button" className="rounded bg-violet-700 px-2 py-1 text-white" onClick={() => void connect()}>
                {status === 'connected' ? 'Nuevo código' : 'Vincular esta pestaña'}
            </button>}
            {status === 'connected' && <button type="button" className="ml-2 underline" onClick={() => { sessionStorage.removeItem(CHILD_SESSION); stop(); }}>Desconectar</button>}
        </div>
    );
}
