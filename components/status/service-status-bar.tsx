"use client";

import { useState, useEffect } from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getStatsForTimeRange, aggregateStatsByPeriod } from "@/lib/stats-utils";
import { useRealtimeStats } from "@/hooks/use-realtime-stats";
import { useMediaQuery } from "@/hooks/use-mobile";

export default function ServiceStatusBar({ serviceId }: { serviceId: string }) {
    const isMobile = useMediaQuery("(max-width: 768px)");

    const [openPopover, setOpenPopover] = useState<number | null>(null);
    const [displayStats, setDisplayStats] = useState<IStatEntry[]>([]);
    const [viewMode, setViewMode] = useState<ITimeRangeTypes>("90d");
    const { stats } = useRealtimeStats(serviceId);

    useEffect(() => {
        if (stats.length > 0) {
            processStats(stats);
        }
    }, [stats, viewMode]);

    const getTimeRangeMs = (range: ITimeRangeTypes): number => {
        const ranges: { [key in ITimeRangeTypes]: number } = {
            "1h": 60 * 60 * 1000,
            "24h": 24 * 60 * 60 * 1000,
            "7d": 7 * 24 * 60 * 60 * 1000,
            "30d": 30 * 24 * 60 * 60 * 1000,
            "60d": 60 * 24 * 60 * 60 * 1000,
            "90d": 90 * 24 * 60 * 60 * 1000,
        };
        return ranges[range];
    };

    const processStats = (allStats: IStatEntry[]) => {
        const rangeMs = getTimeRangeMs(viewMode);
        const filtered = getStatsForTimeRange(allStats, rangeMs);
        const aggregated = aggregateStatsByPeriod(filtered, rangeMs);
        setDisplayStats(aggregated);
    };

    const formatDetailedTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case "operational":
                return "bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30";
            case "degraded":
                return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30";
            case "offline":
                return "bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30";
            case "maintenance":
                return "bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-500/30";
            default:
                return "bg-gray-500/20 text-gray-700 dark:text-gray-400 border border-gray-500/30";
        }
    };

    const getBarColor = (status: string) => {
        if (!status) return "bg-gray-500/50 hover:bg-gray-400/50 transition-colors duration-200";
        switch (status) {
            case "operational":
                return "bg-green-500/80 hover:bg-green-400/80 transition-colors duration-200";
            case "degraded":
                return "bg-yellow-500/80 hover:bg-yellow-400/80 transition-colors duration-200";
            case "offline":
                return "bg-red-500/80 hover:bg-red-400/80 transition-colors duration-200";
            case "maintenance":
                return "bg-purple-500/80 hover:bg-purple-400/80 transition-colors duration-200";
            default:
                return "bg-gray-500/50 hover:bg-gray-400/50 transition-colors duration-200";
        }
    };

    const TooltipContent_ = ({ stat }: { stat: IStatEntry }) => (
        <div className="space-y-2 text-sm">
            <div>
                <p className="font-mono text-center text-xs sm:text-[0.80rem] lg:text-base font-semibold text-foreground">{stat.timestamp ? formatDetailedTime(stat.timestamp) : "No Monitoring Data"}</p>
            </div>

            <div className="border-t border-border pt-2">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusBadgeColor(stat.status)}`}>{stat.status || "Unknown"}</span>
                </div>
            </div>

            <div className="border-t border-border pt-2 space-y-1">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Uptime:</span>
                    <span className="text-xs font-semibold text-green-500">{Math.round(stat.uptime_percentage)}%</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Ping:</span>
                    <span className="text-xs font-mono text-blue-400">{stat.ping_ms}ms</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Response:</span>
                    <span className="text-xs font-mono text-purple-400">{stat.response_time_ms}ms</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Requests:</span>
                    <span className="text-xs font-mono text-yellow-400">{stat.request_count}</span>
                </div>
            </div>
        </div>
    );

    const renderBars = () => {
        const maxBars = viewMode === "1h" ? 60 : viewMode === "24h" ? 24 : viewMode === "7d" ? 7 : viewMode === "30d" ? 30 : viewMode === "60d" ? 60 : 90;

        const bars = [...displayStats];
        while (bars.length < maxBars) {
            bars.unshift({
                timestamp: "",
                status: "",
                ping_ms: 0,
                response_time_ms: 0,
                request_count: 0,
                uptime_percentage: 0,
            });
        }

        return bars.slice(-maxBars).map((stat, idx) => {
            if (isMobile && stat.timestamp) {
                return (
                    <Popover key={idx} open={openPopover === idx} onOpenChange={open => setOpenPopover(open ? idx : null)}>
                        <PopoverTrigger asChild>
                            <div className={`flex-1 flex justify-center min-w-0 h-8 cursor-pointer transition-all duration-200 rounded-sm ${getBarColor(stat.status)}`} style={{ flex: "1 1 0%" }} />
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 border border-zinc-600">
                            <TooltipContent_ stat={stat} />
                        </PopoverContent>
                    </Popover>
                );
            }

            return (
                <TooltipProvider key={idx}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className={`flex-1 flex justify-center min-w-0 h-8 cursor-help transition-all duration-200 rounded-sm bg-gray-600/40 ${getBarColor(stat.status)}`} style={{ flex: "1 1 0%" }} />
                        </TooltipTrigger>
                        {stat.timestamp ? (
                            <TooltipContent className="bg-background border border-zinc-600 max-w-xs">
                                <TooltipContent_ stat={stat} />
                            </TooltipContent>
                        ) : (
                            <TooltipContent className="bg-background border border-zinc-600 max-w-xs">
                                <TooltipContent_ stat={{ timestamp: "", status: "", ping_ms: 0, response_time_ms: 0, request_count: 0, uptime_percentage: 0 }} />
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
            );
        });
    };

    const timeRanges: ITimeRangeTypes[] = ["1h", "24h", "7d", "30d", "60d", "90d"];
    const timeRangeLabels: { [key in ITimeRangeTypes]: string } = {
        "1h": "Last 1 Hour",
        "24h": "Last 24 Hours",
        "7d": "Last 7 Days",
        "30d": "Last 30 Days",
        "60d": "Last 60 Days",
        "90d": "Last 90 Days",
    };

    return (
        <div className="space-y-3 w-full">
            <div className="flex items-center gap-2 justify-between flex-wrap">
                <span className="text-xs text-muted-foreground font-medium">{timeRangeLabels[viewMode]}</span>
                <div className="flex gap-1 flex-wrap">
                    {timeRanges.map(range => (
                        <button
                            key={range}
                            onClick={() => setViewMode(range)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${viewMode === range ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-0.5 px-2 py-3 bg-muted/20 rounded border border-border overflow-hidden w-full">{renderBars()}</div>
        </div>
    );
}
