/**
 * AnalyticsContext
 *
 * Wraps PostHog and exposes a thin, typed interface for the rest of the app.
 * PostHog is initialised lazily — if VITE_POSTHOG_KEY is not set the provider
 * is a no-op, so development works without a PostHog project.
 *
 * Session ID: a random UUID is generated per browser session (sessionStorage)
 * and forwarded to the backend as X-Session-ID so both sides share the same
 * session bucket.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import posthog from "posthog-js";

declare global {
  interface Window {
    posthog?: typeof posthog;
    __PosthogExtensions__?: {
      loadExternalDependency?: (...args: unknown[]) => void;
    };
  }
}

// ─── types ────────────────────────────────────────────────────────────────────

interface AnalyticsContextType {
  /** Track an arbitrary event by name with optional properties. */
  track: (event: string, properties?: Record<string, unknown>) => void;
  /** Associate all future events with a user identity. */
  identify: (userId: string, properties?: Record<string, unknown>) => void;
  /** Clear user identity (call on logout). */
  reset: () => void;
  /** The session UUID shared with the backend via X-Session-ID header. */
  sessionId: string;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(
  undefined
);

// ─── session ID helpers ───────────────────────────────────────────────────────

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const SESSION_KEY = "nextris_session_id";

function getOrCreateSessionId(): string {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return stored;
    const id = generateUUID();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return generateUUID();
  }
}

// ─── provider ─────────────────────────────────────────────────────────────────

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
}) => {
  const sessionId = useRef<string>(getOrCreateSessionId());
  const posthogReady = useRef(false);

  useEffect(() => {
    const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
    const hostRaw =
      (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ||
      "https://app.posthog.com";
    const host = /^https?:\/\//i.test(hostRaw)
      ? hostRaw
      : `https://${hostRaw}`;

    if (!key) {
      // No-op mode — PostHog won't be initialised
      return;
    }

    // Hard block optional external dependency fetches (toolbar/remote assets).
    // This avoids noisy 404s such as us-assets.i.posthog.com from older SDK flows.
    window.__PosthogExtensions__ = window.__PosthogExtensions__ || {};
    window.__PosthogExtensions__.loadExternalDependency = () => {
      // intentionally noop
    };

    posthog.init(key, {
      api_host: host,
      // Capture page views manually so we control them alongside route changes
      capture_pageview: false,
      // Keep instrumentation deterministic and avoid SDK plugin downloads.
      // We keep pageview/login/manual events and backend request analytics.
      autocapture: false,
      // Avoid loading optional remote config/assets that can return 404
      // in some deployments and create noisy false alarms in DevTools.
      disable_external_dependency_loading: true,
      // Avoid noisy /flags calls (401 in some cloud setups) when flags are not used.
      advanced_disable_feature_flags: true,
      // Explicitly disable optional modules that can fetch remote assets.
      disable_surveys: true,
      // Respect user privacy
      respect_dnt: true,
      // Disable rrweb/recording script loading to prevent external asset 404 noise.
      disable_session_recording: true,
      // Suppress console noise in production
      loaded: () => {
        posthogReady.current = true;
      },
    });

    // Register the session ID as a super property so every event carries it
    posthog.register({ nextris_session_id: sessionId.current });

    // Expose SDK for manual browser-console verification.
    window.posthog = posthog;

    // Startup heartbeat to quickly validate ingestion in PostHog.
    posthog.capture("analytics_boot", {
      host: window.location.host,
      path: window.location.pathname,
    });

    return () => {
      // posthog.reset() would clear distinct_id — skip it on hot-reload
    };
  }, []);

  const track: AnalyticsContextType["track"] = (event, properties) => {
    try {
      posthog.capture(event, properties);
    } catch {
      // silent
    }
  };

  const identify: AnalyticsContextType["identify"] = (userId, properties) => {
    try {
      posthog.identify(userId, properties);
    } catch {
      // silent
    }
  };

  const reset: AnalyticsContextType["reset"] = () => {
    try {
      posthog.reset();
    } catch {
      // silent
    }
  };

  return (
    <AnalyticsContext.Provider
      value={{ track, identify, reset, sessionId: sessionId.current }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};

// ─── hook ─────────────────────────────────────────────────────────────────────

export const useAnalytics = (): AnalyticsContextType => {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error("useAnalytics must be used inside AnalyticsProvider");
  return ctx;
};
