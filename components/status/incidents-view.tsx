"use client";

import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { useRealtimeIncidents } from "@/hooks/use-realtime-incidents";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime2Digit } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "../ui/skeleton";

export default function IncidentsView() {
    const { incidents, loading } = useRealtimeIncidents("active");

    const getStatusColor = (status: string) => {
        switch (status) {
            case "investigating":
                return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
            case "identified":
                return "bg-orange-500/20 text-orange-400 border-orange-500/30";
            case "monitoring":
                return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            case "resolved":
                return "bg-green-500/20 text-green-400 border-green-500/30";
            default:
                return "bg-gray-500/20 text-gray-400 border-gray-500/30";
        }
    };

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

    if (loading) {
        return (
            <Card className="bg-card/50 border border-zinc-700 backdrop-blur">
                <CardContent>
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-6 w-30 lg:w-60 bg-muted" />
                            <Skeleton className="h-4 w-20 lg:w-30 bg-muted" />
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-6 w-14 lg:w-30 bg-muted" />
                            <Skeleton className="h-6 w-14 lg:w-30 bg-muted" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-3 w- w-40 lg:w-100 bg-muted" />
                        <Skeleton className="h-3 w-40 lg:w-45 bg-muted" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (incidents.length === 0) {
        return (
            <Empty className="bg-card/50 border border-zinc-700 backdrop-blur">
                <EmptyHeader>
                    <EmptyTitle>404 - Not Found</EmptyTitle>
                    <EmptyDescription>No active incidents</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <div className="space-y-4">
            {incidents.map(incident => (
                <Card key={incident.id} className="bg-card/50 border border-zinc-700 backdrop-blur">
                    <CardContent>
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                                <h3 className="font-semibold text-foreground">{incident.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{incident.service?.name || "Unknown Service"}</p>
                            </div>
                            <div className="flex gap-2">
                                <Badge className={`border ${getStatusColor(incident.status)}`}>{incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}</Badge>
                                <Badge className={`border ${getImpactColor(incident.impact)}`}>{incident.impact.charAt(0).toUpperCase() + incident.impact.slice(1)}</Badge>
                            </div>
                        </div>
                        {incident.description && <p className="text-sm text-muted-foreground mb-4">{incident.description}</p>}
                        <p className="text-xs text-muted-foreground">Started: {formatDateTime2Digit(new Date(incident.started_at))}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
