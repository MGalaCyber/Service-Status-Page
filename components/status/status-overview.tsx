"use client";

import { useState, useEffect } from "react";

import { useRealtimeServices } from "@/hooks/use-realtime-services";
import { Card, CardContent } from "@/components/ui/card";
import { SquareArrowOutUpRight } from "lucide-react";
import StatusIndicator from "../ui/status-indicator";
import ServiceStatusBar from "./service-status-bar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";

export default function StatusOverview() {
    const { services } = useRealtimeServices();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (services.length > 0) {
            setLoading(false);
        }
    }, [services]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "operational":
                return "bg-green-500/20 text-green-400 border-green-500/30";
            case "degraded":
                return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
            case "offline":
                return "bg-red-500/20 text-red-400 border-red-500/30";
            case "maintenance":
                return "bg-purple-500/20 text-purple-400 border-purple-500/30";
            default:
                return "bg-gray-500/20 text-gray-400 border-gray-500/30";
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <h2 className="flex items-center gap-3 text-lg font-semibold text-foreground">
                    <Skeleton className="h-6 w-30 lg:w-40 bg-muted" />
                    <Skeleton className="flex-1 h-2 w-screen bg-muted" />
                </h2>
                <div>
                    <Card className="bg-card/50 border border-zinc-700 backdrop-blur transition-all hover:bg-card/70">
                        <CardContent>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="space-y-1">
                                            <Skeleton className="h-6 w-30 lg:w-sm bg-muted" />
                                            <Skeleton className="h-3 w-20 lg:w-50 bg-muted" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-4 w-25 lg:w-70 bg-muted" />
                                </div>
                                <div className="flex flex-col space-y-1 items-end shrink-0">
                                    <Skeleton className="h-5 w-25 lg:w-35 bg-muted" />
                                    <Skeleton className="h-4 w-10 lg:w-20 bg-muted" />
                                </div>
                            </div>
                            {/* 90-day uptime bar */}
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between gap-4">
                                    <Skeleton className="h-4 w-16 lg:w-25 bg-muted" />
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: 6 }, (_, i) => (
                                            <Skeleton key={i} className="h-6 w-7 lg:w-10 bg-muted" />
                                        ))}
                                    </div>
                                </div>
                                <Skeleton className="h-12 w-full bg-muted" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const pinnedServices = services.filter(s => s.is_pinned);
    const regularServices = services.filter(s => !s.is_pinned);

    return (
        <div className="space-y-6">
            {/* Pinned Services */}
            {pinnedServices.length > 0 && (
                <div className="space-y-4">
                    <h2 className="flex items-center gap-3 text-lg font-semibold text-foreground">
                        <span>Pinned Services</span>
                        <Separator className="flex-1 bg-zinc-500 p-0.5" />
                    </h2>
                    <div className="space-y-3">
                        {pinnedServices.map(service => (
                            <div key={service.id} className="border-dashed border-border">
                                <ServiceStatusCard service={service} statusColor={getStatusColor(service.status)} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Regular Services */}
            <div className="space-y-4">
                {pinnedServices.length > 0 && (
                    <h2 className="flex items-center gap-3 text-lg font-semibold text-foreground">
                        <span>All Services</span>
                        <Separator className="flex-1 bg-zinc-500 p-0.5" />
                    </h2>
                )}
                <div className="space-y-3">
                    {regularServices.map(service => (
                        <ServiceStatusCard key={service.id} service={service} statusColor={getStatusColor(service.status)} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function ServiceStatusCard({ service, statusColor }: { service: IService; statusColor: string }) {
    return (
        <Card className="bg-card/50 border border-zinc-700 backdrop-blur transition-all hover:bg-card/70">
            <CardContent>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <div>
                                <h3 className="font-semibold text-foreground">{service.name}</h3>
                                <Link href={service.domain} target="_blank" className="text-sm text-muted-foreground hover:underline flex items-center justify-between gap-1">
                                    <p>{service.domain}</p>
                                    <SquareArrowOutUpRight className="h-3 w-3" />
                                </Link>
                            </div>
                        </div>
                        {service.description && <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>}
                    </div>
                    <div className="text-right shrink-0">
                        <Badge className={`border ${statusColor} mb-2 gap-1.5 flex items-center justify-center`}>
                            <StatusIndicator state={service.status} size="sm" />
                            {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                        </Badge>
                        <p className="text-xs text-muted-foreground">{service.ping_ms}ms</p>
                    </div>
                </div>
                {/* 90-day uptime bar */}
                <div className="mt-4">
                    <ServiceStatusBar serviceId={service.id} />
                </div>
            </CardContent>
        </Card>
    );
}
