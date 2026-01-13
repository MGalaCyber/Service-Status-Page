"use client";

import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { useRealtimeIncidents } from "@/hooks/use-realtime-incidents";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime2Digit } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "../ui/skeleton";

export default function PreviousIncidentsView() {
    const { incidents, loading } = useRealtimeIncidents("resolved");

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case "minor":
                return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            case "degraded":
                return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
            case "major":
                return "bg-red-500/20 text-red-400 border-red-500/30";
            default:
                return "bg-gray-500/20 text-gray-400 border-gray-500/30";
        }
    };

    const calculateDuration = (start: string, end: string | null) => {
        if (!end) return "Ongoing";

        const startTime = new Date(start);
        const endTime = new Date(end);
        const diff = endTime.getTime() - startTime.getTime();

        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}m`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ${minutes % 60}m`;

        const days = Math.floor(hours / 24);

        return `${days}d ${hours % 24}h`;
    };

    if (loading) {
        return (
            <Card className="bg-card/50 border border-zinc-700 backdrop-blur">
                <CardContent>
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-6 w-30 lg:w-60 bg-muted" />
                            <Skeleton className="h-4 w-20 lg:w-30 bg-muted" />
                        </div>
                        <div className="flex flex-col space-y-1 items-end shrink-0">
                            <Skeleton className="h-6 w-14 lg:w-20 bg-muted" />
                            <Skeleton className="h-4 w-8 lg:w-10 bg-muted" />
                        </div>
                    </div>
                    <Skeleton className="h-3 w-40 lg:w-45 bg-muted" />
                </CardContent>
            </Card>
        );
    }

    if (incidents.length === 0) {
        return (
            <Empty className="bg-card/50 border border-zinc-700 backdrop-blur">
                <EmptyHeader>
                    <EmptyTitle>404 - Not Found</EmptyTitle>
                    <EmptyDescription>No previous incidents</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <div className="space-y-3">
            {incidents.map(incident => (
                <Card key={incident.id} className="bg-card/50 border border-zinc-700 backdrop-blur">
                    <CardContent>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground truncate">{incident.title}</h3>
                                <p className="text-sm text-muted-foreground">{incident.service?.name || "Unknown Service"}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatDateTime2Digit(new Date(incident.started_at))} - {formatDateTime2Digit(new Date(incident.resolved_at!))}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <Badge className={`border ${getImpactColor(incident.impact)}`}>{incident.impact.charAt(0).toUpperCase() + incident.impact.slice(1)}</Badge>
                                <p className="text-xs text-muted-foreground">{calculateDuration(incident.started_at, incident.resolved_at)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
