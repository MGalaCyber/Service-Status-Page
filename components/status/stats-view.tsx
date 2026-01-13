"use client";

import { useState, useEffect } from "react";

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRealtimeServices } from "@/hooks/use-realtime-services";
import { useRealtimeStats } from "@/hooks/use-realtime-stats";
import { Skeleton } from "../ui/skeleton";
import { Clock, Filter } from "lucide-react";

interface ChartData {
    timestamp: string;
    responseTime: number;
    requestCount: number;
    uptime: number;
    ping: number;
}

export default function StatsView() {
    const [selectedService, setSelectedService] = useState<string>("");
    const [timeRange, setTimeRange] = useState<ITimeRangeTypes>("90d");
    const timeRanges = ["1h", "24h", "7d", "30d", "60d", "90d"] as const;
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [stats, setStats] = useState({
        uptime: 100,
        avgResponse: 0,
        avgPing: 0,
        totalRequests: 0,
        incidents: 0,
    });
    const { services } = useRealtimeServices();
    const { stats: rawStats } = useRealtimeStats(selectedService);

    useEffect(() => {
        if (services.length > 0 && !selectedService) {
            setSelectedService(services[0].id);
        }
    }, [services, selectedService]);

    useEffect(() => {
        if (!rawStats || rawStats.length === 0) return;
        processStats(rawStats);
    }, [rawStats, timeRange]);

    const getTimeRangeDays = (range: ITimeRangeTypes): number => {
        switch (range) {
            case "1h":
                return 1 / 24;
            case "24h":
                return 1;
            case "7d":
                return 7;
            case "30d":
                return 30;
            case "60d":
                return 60;
            case "90d":
                return 90;
            default:
                return 30;
        }
    };

    const aggregateData = (stats: IStatEntry[]): ChartData[] => {
        const now = Date.now();
        const buckets = new Map<number, IStatEntry[]>();

        stats.forEach(stat => {
            const time = new Date(stat.timestamp).getTime();
            const diffMinutes = Math.floor((now - time) / (60 * 1000));

            if (timeRange === "1h") {
                if (diffMinutes < 0 || diffMinutes >= 60) return;

                const index = 59 - diffMinutes;

                if (!buckets.has(index)) buckets.set(index, []);
                buckets.get(index)!.push(stat);
            } else if (timeRange === "24h") {
                const diffHours = Math.floor((now - time) / (60 * 60 * 1000));
                if (diffHours < 0 || diffHours >= 24) return;

                const index = 23 - diffHours;

                if (!buckets.has(index)) buckets.set(index, []);
                buckets.get(index)!.push(stat);
            } else {
                const diffDays = Math.floor((now - time) / (24 * 60 * 60 * 1000));
                if (diffDays < 0 || diffDays >= 30) return;

                const index = 29 - diffDays;

                if (!buckets.has(index)) buckets.set(index, []);
                buckets.get(index)!.push(stat);
            }
        });

        const maxBars = timeRange === "1h" ? 60 : timeRange === "24h" ? 24 : 30;

        const result: ChartData[] = [];

        for (let i = 0; i < maxBars; i++) {
            const entries = buckets.get(i);

            if (!entries || entries.length === 0) {
                result.push({
                    timestamp: timeRange === "1h" ? `${String(Math.floor(i)).padStart(2, "0")}` : "",
                    responseTime: 0,
                    requestCount: 0,
                    uptime: 0,
                    ping: 0,
                });
                continue;
            }

            const avgResponse = entries.reduce((s, e) => s + e.response_time_ms, 0) / entries.length;
            const totalRequests = entries.reduce((s, e) => s + e.request_count, 0);
            const avgUptime = entries.reduce((s, e) => s + e.uptime_percentage, 0) / entries.length;
            const avgPing = entries.reduce((s, e) => s + e.ping_ms, 0) / entries.length;
            const date = new Date(now - (maxBars - 1 - i) * (timeRange === "1h" ? 60_000 : timeRange === "24h" ? 3_600_000 : 86_400_000));

            result.push({
                timestamp:
                    timeRange === "1h"
                        ? date.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                          })
                        : timeRange === "24h"
                        ? date.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              hour12: false,
                          })
                        : date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                          }),
                responseTime: Math.round(avgResponse),
                requestCount: totalRequests,
                uptime: Math.round(avgUptime * 100) / 100,
                ping: Math.round(avgPing),
            });
        }

        return result;
    };

    const processStats = (allStats: IStatEntry[]) => {
        const now = new Date();
        const daysAgo = getTimeRangeDays(timeRange);
        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        const filteredStats = allStats.filter(stat => new Date(stat.timestamp) >= cutoffDate).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const aggregated = aggregateData(filteredStats);
        setChartData(aggregated);

        if (filteredStats.length > 0) {
            const avgUptime = filteredStats.reduce((sum, s) => sum + s.uptime_percentage, 0) / filteredStats.length;
            const avgResponse = filteredStats.reduce((sum, s) => sum + s.response_time_ms, 0) / filteredStats.length;
            const avgPing = filteredStats.reduce((sum, s) => sum + s.ping_ms, 0) / filteredStats.length;
            const totalRequests = filteredStats.reduce((sum, s) => sum + s.request_count, 0);
            const incidents = filteredStats.filter(s => s.status !== "operational").length;

            setStats({
                uptime: avgUptime,
                avgResponse: Math.round(avgResponse),
                avgPing: Math.round(avgPing),
                totalRequests,
                incidents,
            });
        }
    };

    if (services.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center gap-2">
                    <Skeleton className="h-9 w-full bg-muted" />
                    <Skeleton className="h-9 w-20 bg-muted" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {Array.from({ length: 5 }, (_, i) => (
                        <Card key={i} className="bg-card/50 border border-zinc-700 backdrop-blur">
                            <CardContent className="space-y-2">
                                <Skeleton className="h-5 w-20 bg-muted" />
                                <Skeleton className="h-8 w-40 lg:w-30 bg-muted" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {Array.from({ length: 2 }, (_, i) => (
                        <Card key={i} className="bg-card/50 border border-zinc-700 backdrop-blur">
                            <CardHeader>
                                <Skeleton className="h-6 w-40 lg:w-50 bg-muted" />
                                <Skeleton className="h-4 w-70 bg-muted" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-75 w-full bg-muted" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card className="bg-card/50 border border-zinc-700 backdrop-blur">
                    <CardHeader>
                        <Skeleton className="h-6 w-40 lg:w-50 bg-muted" />
                        <Skeleton className="h-4 w-70 bg-muted" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-56 w-full bg-muted" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between gap-2">
                {/* Service Selector */}
                <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger className="w-full border border-zinc-700 flex items-center text-center overflow-hidden">
                        <div className="flex items-center gap-2 flex-1">
                            <Filter className="h-4 w-4" />
                            <SelectValue placeholder="Select a service" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="border border-zinc-700">
                        <SelectGroup>
                            <SelectLabel>Services</SelectLabel>
                            {services.map(service => (
                                <SelectItem key={service.id} value={service.id}>
                                    <div className="flex items-center gap-2">
                                        <span>{service.name}</span>
                                        <span className="text-xs text-muted-foreground">{service.domain}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>

                {/* Time Range Selector */}
                <Select value={timeRange} onValueChange={value => setTimeRange(value as (typeof timeRanges)[number])}>
                    <SelectTrigger className="w-30 sm:w-28 text-xs border border-zinc-700 flex items-center text-center overflow-hidden">
                        <div className="flex items-center gap-2 flex-1">
                            <Clock className="h-4 w-4" />
                            <SelectValue placeholder="Range" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="border border-zinc-700">
                        <SelectGroup>
                            <SelectLabel>Time Range</SelectLabel>
                            {timeRanges.map(range => (
                                <SelectItem key={range} value={range} className="text-xs">
                                    {range}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatsCard title="Uptime" value={`${stats.uptime.toFixed(2)}%`} color="text-green-400" />
                <StatsCard title="Avg Response" value={`${stats.avgResponse}ms`} color="text-blue-400" />
                <StatsCard title="Avg Ping" value={`${stats.avgPing}ms`} color="text-purple-400" />
                <StatsCard title="Total Requests" value={stats.totalRequests.toString()} color="text-yellow-400" />
                <StatsCard title="Incidents" value={stats.incidents.toString()} color="text-red-400" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Response Time Chart */}
                <Card className="bg-card/50 border border-zinc-700 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="text-lg">Response Time ({timeRange})</CardTitle>
                        <CardDescription>Average response time per day</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(200, 70%, 50%)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(200, 70%, 50%)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 25%)" vertical horizontal />
                                <XAxis dataKey="timestamp" interval="preserveStartEnd" minTickGap={0} tick={{ fontSize: 10 }} stroke="hsl(0, 0%, 60%)" />
                                <YAxis stroke="hsl(0, 0%, 60%)" style={{ fontSize: "12px" }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(0, 0%, 12%)",
                                        border: "1px solid hsl(0, 0%, 25%)",
                                        borderRadius: "6px",
                                    }}
                                    labelStyle={{ color: "hsl(0, 0%, 95%)" }}
                                    formatter={value => `${value}ms`}
                                />
                                <Area type="monotone" dataKey="responseTime" stroke="hsl(200, 70%, 50%)" fillOpacity={1} fill="url(#colorResponse)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Request Volume Chart */}
                <Card className="bg-card/50 border border-zinc-700 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="text-lg">Request Volume ({timeRange})</CardTitle>
                        <CardDescription>Total requests per day</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 25%)" vertical horizontal />
                                <XAxis dataKey="timestamp" interval="preserveStartEnd" minTickGap={0} tick={{ fontSize: 10 }} stroke="hsl(0, 0%, 60%)" />
                                <YAxis stroke="hsl(0, 0%, 60%)" style={{ fontSize: "12px" }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(0, 0%, 12%)",
                                        border: "1px solid hsl(0, 0%, 25%)",
                                        borderRadius: "6px",
                                    }}
                                    labelStyle={{ color: "hsl(0, 0%, 95%)" }}
                                    formatter={value => `${value} requests`}
                                />
                                <Bar dataKey="requestCount" fill="hsl(60, 70%, 60%)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* 90-Day Uptime Trend */}
            <Card className="bg-card/50 border border-zinc-700 backdrop-blur">
                <CardHeader>
                    <CardTitle className="text-lg">Uptime Trend ({timeRange})</CardTitle>
                    <CardDescription>Service availability over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(140, 70%, 50%)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(140, 70%, 50%)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 25%)" vertical horizontal />
                            <XAxis dataKey="timestamp" interval="preserveStartEnd" minTickGap={0} tick={{ fontSize: 10 }} stroke="hsl(0, 0%, 60%)" />
                            <YAxis stroke="hsl(0, 0%, 60%)" style={{ fontSize: "12px" }} domain={[0, 100]} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(0, 0%, 12%)",
                                    border: "1px solid hsl(0, 0%, 25%)",
                                    borderRadius: "6px",
                                }}
                                labelStyle={{ color: "hsl(0, 0%, 95%)" }}
                                formatter={value => `${value}%`}
                            />
                            <Area type="monotone" dataKey="uptime" stroke="hsl(140, 70%, 60%)" fillOpacity={1} fill="url(#colorUptime)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

function StatsCard({ title, value, color }: { title: string; value: string; color: string }) {
    return (
        <Card className="bg-card/50 border border-zinc-700 backdrop-blur">
            <CardContent>
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className={`text-2xl font-bold ${color} mt-2`}>{value}</p>
            </CardContent>
        </Card>
    );
}
