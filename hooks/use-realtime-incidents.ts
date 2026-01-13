"use client";

import { useState, useEffect } from "react";

interface Incident {
    id: string;
    service_id: string;
    title: string;
    description: string;
    status: string;
    impact: string;
    started_at: string;
    resolved_at: string | null;
    service?: { name: string };
    updates?: IncidentUpdate[];
}

interface IncidentUpdate {
    id: string;
    message: string;
    status: string;
    created_at: string;
}

export function useRealtimeIncidents(filter: "active" | "resolved" = "active") {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        let pollInterval: NodeJS.Timeout | null = null;

        const fetchIncidents = async () => {
            if (!isMounted) return;

            try {
                const url = new URL("/api/status/incidents", window.location.origin);
                url.searchParams.set("filter", filter);
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
                    setIncidents(Array.isArray(data) ? data : []);
                    setError(null);
                    setLoading(false);
                }
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : "Failed to fetch incidents";

                if (isMounted) {
                    setError(errorMsg);
                }
            }
        };

        fetchIncidents();
        pollInterval = setInterval(fetchIncidents, 5000);

        return () => {
            isMounted = false;
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [filter]);

    return { incidents, loading, error };
}
