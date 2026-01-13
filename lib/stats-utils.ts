const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Maintain 90-day rolling window
 * Removes entries older than 90 days and adds new entry
 */
export function updateSlidingWindow(currentStats: IStatEntry[], newEntry: IStatEntry, maxAgeMs: number = NINETY_DAYS_MS): IStatEntry[] {
    const now = new Date(newEntry.timestamp).getTime();

    // Filter out entries older than 90 days
    const filtered = currentStats.filter(stat => {
        const entryTime = new Date(stat.timestamp).getTime();
        return now - entryTime <= maxAgeMs;
    });

    filtered.push(newEntry);

    // Sort by timestamp ascending
    return filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Get stats for a specific time range
 */
export function getStatsForTimeRange(allStats: IStatEntry[], rangeMs: number): IStatEntry[] {
    const now = new Date().getTime();
    return allStats.filter(stat => {
        const entryTime = new Date(stat.timestamp).getTime();
        return now - entryTime <= rangeMs;
    });
}

/**
 * Aggregate stats by time period based on range
 * Creates buckets for each period (1 minute for 1h, 1 hour for 24h, 1 day for 7d+)
 * Returns array with empty entries for missing data
 * Format: [ empty ][ empty ][ old ][ new ][ latest ]
 */
export function aggregateStatsByPeriod(stats: IStatEntry[], rangeMs: number): IStatEntry[] {
    if (!stats.length) return [];

    const now = Date.now();
    const windowStart = now - rangeMs;

    const periodMs =
        rangeMs <= 60 * 60 * 1000
            ? 60 * 1000 // 1h → 60 bars (1 per minute)
            : rangeMs <= 24 * 60 * 60 * 1000
            ? 60 * 60 * 1000 // 24h → 24 bars (1 per hour)
            : rangeMs <= 7 * 24 * 60 * 60 * 1000
            ? 24 * 60 * 60 * 1000 // 7d → 7 bars (1 per day)
            : rangeMs <= 30 * 24 * 60 * 60 * 1000
            ? 24 * 60 * 60 * 1000 // 30d → 30 bars (1 per day)
            : rangeMs <= 60 * 24 * 60 * 60 * 1000
            ? 24 * 60 * 60 * 1000 // 60d → 60 bars (1 per day)
            : 24 * 60 * 60 * 1000; // 90d → 90 bars (1 per day)

    const maxBars = Math.ceil(rangeMs / periodMs);
    const buckets = new Map<number, IStatEntry[]>();

    for (const stat of stats) {
        const time = new Date(stat.timestamp).getTime();
        if (time < windowStart) continue;

        const bucketIndex = Math.floor((time - windowStart) / periodMs);
        if (bucketIndex < 0 || bucketIndex >= maxBars) continue;

        if (!buckets.has(bucketIndex)) {
            buckets.set(bucketIndex, []);
        }
        buckets.get(bucketIndex)!.push(stat);
    }

    const statusPriority = ["offline", "degraded", "maintenance", "operational"];
    const result: IStatEntry[] = [];

    // ⬅️ OLDEST | ➡️ NEWEST
    for (let i = 0; i < maxBars; i++) {
        const entries = buckets.get(i);

        if (!entries) {
            result.push({
                timestamp: "",
                status: "",
                ping_ms: 0,
                response_time_ms: 0,
                request_count: 0,
                uptime_percentage: 0,
            });
            continue;
        }

        const worstStatus = statusPriority.find(s => entries.some(e => e.status === s)) || "operational";

        result.push({
            timestamp: entries[entries.length - 1].timestamp, // Most recent timestamp in bucket
            status: worstStatus,
            ping_ms: Math.max(...entries.map(e => e.ping_ms)),
            response_time_ms: Math.max(...entries.map(e => e.response_time_ms)),
            request_count: entries.reduce((a, b) => a + b.request_count, 0),
            uptime_percentage: Math.round((entries.filter(e => e.status === "operational").length / entries.length) * 100),
        });
    }

    return result;
}

/**
 * Calculate statistics from array
 */
export function calculateStatsMetrics(stats: IStatEntry[]) {
    if (stats.length === 0) {
        return {
            avgPing: 0,
            avgResponse: 0,
            avgUptime: 0,
            totalRequests: 0,
            successRate: 0,
        };
    }

    const avgPing = Math.round(stats.reduce((sum, s) => sum + s.ping_ms, 0) / stats.length);
    const avgResponse = Math.round(stats.reduce((sum, s) => sum + s.response_time_ms, 0) / stats.length);
    const avgUptime = Math.round(stats.reduce((sum, s) => sum + s.uptime_percentage, 0) / stats.length);
    const totalRequests = stats.reduce((sum, s) => sum + s.request_count, 0);
    const successCount = stats.filter(s => s.status === "operational").length;
    const successRate = Math.round((successCount / stats.length) * 100);

    return {
        avgPing,
        avgResponse,
        avgUptime,
        totalRequests,
        successRate,
    };
}
