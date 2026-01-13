"use client";

import { useState, useEffect } from "react";

import { useRealtimeServices } from "@/hooks/use-realtime-services";
import { Card, CardContent } from "@/components/ui/card";

export default function StatusSummary() {
    const { services } = useRealtimeServices();
    const [summary, setSummary] = useState({
        totalServices: 0,
        operationalServices: 0,
        degradedServices: 0,
        offlineServices: 0,
    });

    useEffect(() => {
        if (services.length > 0) {
            const counts = {
                totalServices: services.length,
                operationalServices: services.filter(s => s.status === "operational").length,
                degradedServices: services.filter(s => s.status === "degraded").length,
                offlineServices: services.filter(s => s.status === "offline").length,
            };
            setSummary(counts);
        }
    }, [services]);

    const allOperational = summary.offlineServices === 0 && summary.degradedServices === 0;

    return (
        <Card className="bg-card/50 border border-zinc-700 backdrop-blur mb-6">
            <CardContent>
                <div className="flex items-center flex-col sm:flex-row sm:justify-between lg:flex-row lg:justify-between gap-2 text-center sm:text-left">
                    <div className="text-center sm:text-left lg:text-start">
                        <p className="text-sm text-muted-foreground">System Status</p>
                        <p className={`text-2xl font-bold mt-1 ${allOperational ? "text-green-400" : "text-yellow-400"}`}>{allOperational ? "All Systems Operational" : "Degraded Performance"}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-foreground">{summary.totalServices}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-400">{summary.operationalServices}</p>
                            <p className="text-xs text-muted-foreground">Operational</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-400">{summary.degradedServices}</p>
                            <p className="text-xs text-muted-foreground">Degraded</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-400">{summary.offlineServices}</p>
                            <p className="text-xs text-muted-foreground">Offline</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
