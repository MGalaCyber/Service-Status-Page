"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface LastUpdateData {
    lastUpdated: string | null;
    nextCheckIn: number | null;
}

export function useLastUpdate() {
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<LastUpdateData>({
        lastUpdated: null,
        nextCheckIn: null,
    });

    useEffect(() => {
        let isMounted = true;
        let intervalId: NodeJS.Timeout | null = null;

        const fetchLastUpdate = async () => {
            try {
                const response = await fetch("/api/status/last-update", {
                    method: "GET",
                    cache: "no-store",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                if (isMounted) {
                    setData({
                        lastUpdated: result.lastUpdated,
                        nextCheckIn: result.nextCheckIn,
                    });
                    setError(null);
                    setLoading(false);
                }
            } catch (err) {
                toast({
                    title: "Last update fetch error",
                    description: `Failed to fetch last update:\n${err}`,
                    className: "bg-red-500 text-white border-none slide-in-from-right",
                });
                if (isMounted) {
                    setError(err instanceof Error ? err.message : "Unknown error");
                }
            }
        };

        fetchLastUpdate();
        intervalId = setInterval(fetchLastUpdate, 10000);

        return () => {
            isMounted = false;
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

    return {
        lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : null,
        nextCheckIn: data.nextCheckIn,
        loading,
        error,
    };
}
