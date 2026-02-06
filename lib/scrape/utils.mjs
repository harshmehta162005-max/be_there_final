import crypto from "crypto";
import * as chrono from "chrono-node";

export const DEFAULT_TIMEZONE = "Australia/Sydney";

export function normalizeText(value) {
    if (!value) return "";
    return value.replace(/\s+/g, " ").trim();
}

export function absoluteUrl(baseUrl, href) {
    if (!href) return "";
    try {
        return new URL(href, baseUrl).toString();
    } catch {
        return href;
    }
}

export function parseDateTime(text) {
    if (!text) return null;
    const parsed = chrono.parseDate(text, new Date(), { forwardDate: true });
    if (!parsed) return null;
    return parsed.getTime();
}

export function hashEvent(payload) {
    return crypto
        .createHash("sha256")
        .update(JSON.stringify(payload))
        .digest("hex");
}

export function buildDedupeKey(sourceName, sourceEventId, sourceUrl) {
    if (sourceEventId) return `${sourceName}:${sourceEventId}`;
    return `${sourceName}:${sourceUrl}`;
}

export function safeArray(value) {
    return Array.isArray(value) ? value : [];
}
