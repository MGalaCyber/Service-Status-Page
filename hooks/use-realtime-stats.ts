"use client";

import { useState, useEffect } from "react";

export function useRealtimeStats(serviceId: string) {
    const [stats, setStats] = useState<IStatEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!serviceId) {
            setStats([]);
            setLoading(false);
            return;
        }

        let isMounted = true;
        let pollInterval: NodeJS.Timeout | null = null;

        const fetchStats = async () => {
            if (!isMounted) return;

            try {
                setLoading(true);
                const url = new URL("/api/status/stats", window.location.origin);
                url.searchParams.set("serviceId", serviceId);
                url.searchParams.set("_t", Date.now().toString());

                const response = await fetch(url.toString(), {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (isMounted) {
                    setStats(Array.isArray(data) ? data : []);
                    setError(null);
                    setLoading(false);
                }
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : "Failed to fetch stats";

                if (isMounted) {
                    setError(errorMsg);
                }
            }
        };

        fetchStats();
        pollInterval = setInterval(fetchStats, 10000);

        return () => {
            isMounted = false;
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [serviceId]);

    return { stats, loading, error };
}
