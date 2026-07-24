export const PROJECT_TIMEZONE = "Asia/Dhaka";

/**
 * Converts any Date object to a YYYY-MM-DD string formatted to the project timezone (Asia/Dhaka).
 */
export function formatToDhakaDateString(date: Date): string {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: PROJECT_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;

    return `${year}-${month}-${day}`;
}

/**
 * Returns the current date in YYYY-MM-DD format based on the project timezone (Asia/Dhaka).
 */
export function getDhakaToday(): string {
    return formatToDhakaDateString(new Date());
}

/**
 * Returns the first day of the current month in YYYY-MM-DD format based on the project timezone (Asia/Dhaka).
 */
export function getDhakaStartOfMonth(): string {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: PROJECT_TIMEZONE,
        year: "numeric",
        month: "2-digit"
    });
    const parts = formatter.formatToParts(new Date());
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;

    return `${year}-${month}-01`;
}

/**
 * Returns the current month's default filter range [defaultStartDate, defaultEndDate]
 */
export function getDefaultDateRange() {
    return {
        defaultStartDate: getDhakaStartOfMonth(),
        defaultEndDate: getDhakaToday()
    };
}
