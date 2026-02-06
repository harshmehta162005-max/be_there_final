import { load } from "cheerio";
import {
    absoluteUrl,
    buildDedupeKey,
    DEFAULT_TIMEZONE,
    hashEvent,
    normalizeText,
    parseDateTime,
} from "./utils.mjs";

const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

async function fetchHtml(url) {
    const res = await fetch(url, {
        headers: {
            "user-agent": USER_AGENT,
            accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        },
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status}`);
    }
    return await res.text();
}

async function fetchDetailImage(event) {
    try {
        const html = await fetchHtml(event.sourceUrl);
        const $ = load(html);
        const ogImage =
            $('meta[property="og:image"]').attr("content") ||
            $('meta[name="og:image"]').attr("content") ||
            $('meta[property="og:image:secure_url"]').attr("content") ||
            $('meta[name="twitter:image"]').attr("content") ||
            $('meta[property="twitter:image"]').attr("content");
        if (ogImage) {
            return absoluteUrl(event.sourceUrl, ogImage);
        }

        const ldEvents = parseLdJsonEvents($);
        for (const node of ldEvents) {
            const image =
                (Array.isArray(node.image) ? node.image[0] : node.image) || null;
            if (image) return absoluteUrl(event.sourceUrl, image);
        }

        const preloadImage = $('link[rel="preload"][as="image"]').attr("href");
        if (preloadImage) {
            return absoluteUrl(event.sourceUrl, preloadImage);
        }

        const firstImg =
            $("img").first().attr("src") || $("img").first().attr("data-src");
        if (firstImg) {
            return absoluteUrl(event.sourceUrl, firstImg);
        }
    } catch {
        return null;
    }
    return null;
}

async function enrichEventImages(events) {
    const enriched = [];
    const concurrency = 4;
    let index = 0;

    async function worker() {
        while (index < events.length) {
            const current = events[index];
            index += 1;
            const imageUrl = await fetchDetailImage(current);
            if (imageUrl) {
                enriched.push({
                    ...current,
                    imageUrl,
                    contentHash: hashEvent({
                        ...current,
                        imageUrl,
                    }),
                });
            } else {
                enriched.push(current);
            }
        }
    }

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);
    return enriched;
}

function toEvent({
    title,
    description,
    startDate,
    endDate,
    venueName,
    address,
    imageUrl,
    sourceName,
    sourceUrl,
    sourceEventId,
    category,
    tags,
}) {
    const payload = {
        title,
        description,
        startDate,
        endDate,
        venueName,
        address,
        city: "Sydney",
        country: "Australia",
        timezone: DEFAULT_TIMEZONE,
        imageUrl,
        sourceName,
        sourceUrl,
        sourceEventId,
        category,
        tags,
    };

    return {
        ...payload,
        contentHash: hashEvent(payload),
        dedupeKey: buildDedupeKey(sourceName, sourceEventId, sourceUrl),
    };
}

function parseLdJsonEvents($) {
    const events = [];
    $("script[type='application/ld+json']").each((_, el) => {
        const raw = $(el).text();
        if (!raw) return;
        try {
            const data = JSON.parse(raw.trim());
            const nodes = Array.isArray(data) ? data : [data];
            for (const node of nodes) {
                if (!node) continue;
                if (node["@type"] === "Event") {
                    events.push(node);
                }
                if (node["@graph"]) {
                    for (const item of node["@graph"]) {
                        if (item?.["@type"] === "Event") events.push(item);
                    }
                }
            }
        } catch {
            return;
        }
    });
    return events;
}

function normalizeLdEvent(node, sourceName, fallbackUrl) {
    const title = normalizeText(node.name);
    const description = normalizeText(node.description || node.summary || title);
    const startDate = node.startDate ? new Date(node.startDate).getTime() : null;
    const endDate = node.endDate ? new Date(node.endDate).getTime() : undefined;
    const imageUrl = Array.isArray(node.image) ? node.image[0] : node.image;
    const url = node.url || fallbackUrl;
    const venueName = normalizeText(node.location?.name || node.location?.address?.name);
    const address =
        normalizeText(
            node.location?.address?.streetAddress ||
                node.location?.address?.addressLocality ||
                node.location?.address?.addressRegion
        ) || undefined;
    const eventId = node.identifier || node["@id"];

    if (!title || !startDate || !url) return null;
    return toEvent({
        title,
        description,
        startDate,
        endDate,
        venueName,
        address,
        imageUrl,
        sourceName,
        sourceUrl: url,
        sourceEventId: eventId,
    });
}

export async function scrapeEventbriteSydney() {
    const sourceName = "Eventbrite";
    const baseUrl = "https://www.eventbrite.com/d/australia--sydney/events/";
    const html = await fetchHtml(baseUrl);
    const $ = load(html);
    const results = [];

    $(".search-event-card-wrapper, .eds-event-card-content__content").each(
        (_, el) => {
            const card = $(el).closest("section, div");
            const title = normalizeText(
                card.find(".eds-event-card__formatted-name--is-clamped").text()
            );
            const dateText = normalizeText(
                card.find(".eds-event-card-content__sub-title").first().text()
            );
            const venueText = normalizeText(
                card.find(".eds-event-card-content__sub-title").eq(1).text()
            );
            const url =
                card
                    .find("a.eds-event-card-content__action-link")
                    .attr("href") || card.find("a").attr("href");
            const imageUrl =
                card.find("img").attr("src") || card.find("img").attr("data-src");
            const eventId =
                card.find("[data-event-id]").attr("data-event-id") ||
                card.attr("data-event-id");

            if (!title || !url) return;
            const startDate = parseDateTime(dateText);
            if (!startDate) return;

            results.push(
                toEvent({
                    title,
                    description: title,
                    startDate,
                    venueName: venueText || "Sydney",
                    imageUrl,
                    sourceName,
                    sourceUrl: absoluteUrl(baseUrl, url),
                    sourceEventId: eventId,
                })
            );
        }
    );

    const ldEvents = parseLdJsonEvents($);
    for (const node of ldEvents) {
        const event = normalizeLdEvent(node, sourceName, baseUrl);
        if (event) results.push(event);
    }

    return results;
}

export async function scrapeMeetupSydney() {
    const sourceName = "Meetup";
    const baseUrl = "https://www.meetup.com/find/?location=au--sydney&source=EVENTS";
    const html = await fetchHtml(baseUrl);
    const $ = load(html);
    const results = [];

    $("li, article").each((_, el) => {
        const card = $(el);
        const title = normalizeText(card.find("h2, h3").first().text());
        const url =
            card.find("a").first().attr("href") ||
            card.find("a").attr("data-event-url");
        const dateText = normalizeText(card.find("time").first().text());
        const venueText = normalizeText(card.find("[data-event-location]").text());
        const imageRaw =
            card.find("img").first().attr("src") ||
            card.find("img").first().attr("data-src");
        const imageUrl =
            imageRaw && !imageRaw.startsWith("/images/fallbacks/")
                ? absoluteUrl(baseUrl, imageRaw)
                : undefined;
        const eventId = card.attr("data-eventid");

        if (!title || !url) return;
        const startDate = parseDateTime(dateText);
        if (!startDate) return;

        results.push(
            toEvent({
                title,
                description: title,
                startDate,
                venueName: venueText || "Sydney",
                imageUrl,
                sourceName,
                sourceUrl: absoluteUrl(baseUrl, url),
                sourceEventId: eventId,
            })
        );
    });

    const ldEvents = parseLdJsonEvents($);
    for (const node of ldEvents) {
        const event = normalizeLdEvent(node, sourceName, baseUrl);
        if (event) results.push(event);
    }

    return results;
}

export async function scrapeTimeoutSydney() {
    const sourceName = "Time Out Sydney";
    const baseUrl = "https://www.timeout.com/sydney/things-to-do";
    const html = await fetchHtml(baseUrl);
    const $ = load(html);
    const results = [];

    $("a.card, article.card, a._card").each((_, el) => {
        const card = $(el);
        const title = normalizeText(card.find("h3, h2").first().text());
        const url = card.attr("href");
        const dateText = normalizeText(card.find("time").first().text());
        const imageRaw =
            card.find("img").attr("src") || card.find("img").attr("data-src");
        const imageUrl =
            imageRaw && !imageRaw.startsWith("/images/fallbacks/")
                ? absoluteUrl(baseUrl, imageRaw)
                : undefined;

        if (!title || !url) return;
        const startDate = parseDateTime(dateText);
        if (!startDate) return;

        results.push(
            toEvent({
                title,
                description: title,
                startDate,
                venueName: "Sydney",
                imageUrl,
                sourceName,
                sourceUrl: absoluteUrl(baseUrl, url),
            })
        );
    });

    const ldEvents = parseLdJsonEvents($);
    for (const node of ldEvents) {
        const event = normalizeLdEvent(node, sourceName, baseUrl);
        if (event) results.push(event);
    }

    return results;
}

export async function scrapeWhatsOnSydney() {
    const sourceName = "What's On Sydney";
    const baseUrl = "https://whatson.cityofsydney.nsw.gov.au/events";
    const html = await fetchHtml(baseUrl);
    const $ = load(html);
    const results = [];

    $("a.card, article.card, .event-card").each((_, el) => {
        const card = $(el);
        const title = normalizeText(card.find("h3, h2").first().text());
        const url = card.attr("href") || card.find("a").attr("href");
        const dateText = normalizeText(card.find("time").first().text());
        const venueText = normalizeText(card.find(".location, .event-location").text());
        const imageRaw =
            card.find("img").attr("src") || card.find("img").attr("data-src");
        const imageUrl =
            imageRaw && !imageRaw.startsWith("/images/fallbacks/")
                ? absoluteUrl(baseUrl, imageRaw)
                : undefined;

        if (!title || !url) return;
        const startDate = parseDateTime(dateText);
        if (!startDate) return;

        results.push(
            toEvent({
                title,
                description: title,
                startDate,
                venueName: venueText || "Sydney",
                imageUrl,
                sourceName,
                sourceUrl: absoluteUrl(baseUrl, url),
            })
        );
    });

    const ldEvents = parseLdJsonEvents($);
    for (const node of ldEvents) {
        const event = normalizeLdEvent(node, sourceName, baseUrl);
        if (event) results.push(event);
    }

    return results;
}

export async function scrapeSydneySources() {
    const runStartedAt = Date.now();
    const results = [];

    const sources = [
        scrapeEventbriteSydney,
        scrapeMeetupSydney,
        scrapeTimeoutSydney,
        scrapeWhatsOnSydney,
    ];

    for (const source of sources) {
        try {
            const events = await source();
            results.push(...events);
        } catch (error) {
            console.error(`Scrape error (${source.name}):`, error);
        }
    }

    const enriched = await enrichEventImages(results);
    return { events: enriched, runStartedAt };
}
