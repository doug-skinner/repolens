const raw = process.env.REPOLENS_STALE_DAYS;
export const STALE_DAYS = raw !== undefined ? Number(raw) : 14;
