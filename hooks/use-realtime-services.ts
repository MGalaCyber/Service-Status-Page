"use client";

import { useState, useEffect } from "react";

export function useRealtimeServices() {
    const [services, setServices] = useState<IService[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        let pollInterval: NodeJS.Timeout | null = null;
        let retryCount = 0;
        const MAX_RETRIES = 3;

        const fetchServices = async () => {
            if (!isMounted) return;

            try {
                const url = new URL("/api/status/services", window.location.origin);
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
                    setServices(Array.isArray(data) ? data : []);
                    setError(null);
                    setLoading(false);
                    retryCount = 0;
                }
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : "Failed to fetch services";

                if (isMounted) {
                    retryCount++;
                    if (retryCount <= MAX_RETRIES) {
                        setError(`Retrying... (${retryCount}/${MAX_RETRIES})`);
                    } else {
                        setError(errorMsg);
                        setLoading(false);
                    }
                }
            }
        };

        fetchServices();
        pollInterval = setInterval(fetchServices, 5000);

        return () => {
            isMounted = false;
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, []);

    return { services, loading, error };
}
