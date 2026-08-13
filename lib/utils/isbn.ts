
export function normalizeISBN(isbn: string): string | null {
    if (!isbn) return null;

    // Remove all non-alphanumeric characters (keep X for ISBN-10)
    const clean = isbn.replace(/[^0-9X]/gi, '').toUpperCase();

    // 13-digit ISBN (starts with 978 or 979) -> Return as is
    if (clean.length === 13) {
        return clean;
    }

    // 10-digit ISBN -> Convert to 13
    if (clean.length === 10) {
        return convertISBN10to13(clean);
    }

    // Pass through others (ASIN often 10 chars but usually alphanumeric. ISBN-10 is numbers + X)
    // If it looks like ASIN (alphanumeric), we return as is (uppercase)
    if (clean.length === 10) {
        return clean;
    }

    // If it's something else (e.g. 8 digits ISSN), return raw clean
    return clean.length > 0 ? clean : null;
}

function convertISBN10to13(isbn10: string): string {
    const prefix = "978";
    const core = isbn10.substring(0, 9);
    const combined = prefix + core;

    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(combined[i]);
        sum += (i % 2 === 0) ? digit : digit * 3;
    }

    const remainder = sum % 10;
    const checkDigit = (10 - remainder) % 10;

    return combined + checkDigit;
}
