import { Country, State, City } from "country-state-city";

/**
 * Parse and validate location slug (format: city-state)
 * @param {string} slug - The URL slug (e.g., "gurugram-haryana")
 * @returns {Object} - { city, state, isValid }
 */
export function parseLocationSlug(slug) {
    if (!slug || typeof slug !== "string") {
        return { city: null, state: null, country: null, isValid: false };
    }

    const parts = slug.split("-");
    if (parts.length < 2) {
        return { city: null, state: null, country: null, isValid: false };
    }

    const countries = Country.getAllCountries();
    const countrySlugMap = new Map(
        countries.map((c) => [c.name.toLowerCase().replace(/\s+/g, "-"), c])
    );

    // Match longest country suffix (if present)
    let matchedCountry = null;
    let matchedCountryParts = 0;
    for (let i = 1; i <= parts.length; i += 1) {
        const countrySlug = parts.slice(parts.length - i).join("-");
        const countryObj = countrySlugMap.get(countrySlug);
        if (countryObj) {
            matchedCountry = countryObj;
            matchedCountryParts = i;
            break;
        }
    }

    const country = matchedCountry?.name || "India";
    const countryCode = matchedCountry?.isoCode || "IN";

    const locationParts = matchedCountry
        ? parts.slice(0, parts.length - matchedCountryParts)
        : parts.slice();

    const states = State.getStatesOfCountry(countryCode);
    const stateSlugMap = new Map(
        states.map((s) => [s.name.toLowerCase().replace(/\s+/g, "-"), s])
    );

    // Find the longest suffix of parts that matches a state slug
    let matchedState = null;
    let matchedStateParts = 0;
    for (let i = 1; i < locationParts.length; i += 1) {
        const stateSlug = locationParts.slice(i).join("-");
        const stateObj = stateSlugMap.get(stateSlug);
        if (stateObj) {
            matchedState = stateObj;
            matchedStateParts = locationParts.length - i;
            break;
        }
    }

    if (!matchedState) {
        // Fallback: treat first part as city and rest as state
        const fallbackCity =
            locationParts[0].charAt(0).toUpperCase() + locationParts[0].slice(1);
        const fallbackState = locationParts
            .slice(1)
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join(" ");
        return { city: fallbackCity, state: fallbackState, country, isValid: true };
    }

    const cityParts = locationParts.slice(
        0,
        locationParts.length - matchedStateParts
    );
    if (cityParts.length === 0) {
        return { city: null, state: null, country: null, isValid: false };
    }

    const cityName = cityParts
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");
    const stateName = matchedState.name;

    // Validate city exists in that state
    const cities = City.getCitiesOfState(countryCode, matchedState.isoCode);
    const cityExists = cities.some(
        (c) => c.name.toLowerCase() === cityName.toLowerCase()
    );

    if (!cityExists) {
        return { city: null, state: null, country: null, isValid: false };
    }

    return { city: cityName, state: stateName, country, isValid: true };
}

/**
 * Create location slug from city and state
 * @param {string} city - City name
 * @param {string} state - State name
 * @returns {string} - URL slug (e.g., "gurugram-haryana")
 */
export function createLocationSlug(city, state, country) {
    if (!city || !state) return "";

    const citySlug = city.toLowerCase().replace(/\s+/g, "-");
    const stateSlug = state.toLowerCase().replace(/\s+/g, "-");
    const countrySlug = country
        ? country.toLowerCase().replace(/\s+/g, "-")
        : null;

    return countrySlug ? `${citySlug}-${stateSlug}-${countrySlug}` : `${citySlug}-${stateSlug}`;
}
