"use client";

import { useState, useEffect, useMemo } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PreviousIncidentsView from "@/components/status/previous-incidents-view";
import StatusOverview from "@/components/status/status-overview";
import IncidentsView from "@/components/status/incidents-view";
import StatusSummary from "@/components/status/status-summary";
import { useLastUpdate } from "@/hooks/use-last-update";
import StatsView from "@/components/status/stats-view";
import { formatDateTime2Digit } from "@/lib/utils";
import { Config, Site } from "@/lib/config";
import { Eye } from "lucide-react";

export default function StatusPage() {
    const yearNow = useMemo(() => new Date().getFullYear(), []);

    const { lastUpdated, nextCheckIn } = useLastUpdate();
    const [activeTab, setActiveTab] = useState("status");
    const [countdown, setCountdown] = useState(0);

    const [visitorToday, setVisitorToday] = useState("00");
    const [visitorWeekly, setVisitorWeekly] = useState("00");
    const [visitorMonthly, setVisitorMonthly] = useState("00");
    const [visitorYearly, setVisitorYearly] = useState("00");
    const [visitorTotal, setVisitorTotal] = useState("00");

    useEffect(() => {
        if (!nextCheckIn) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((nextCheckIn - now) / 1000));
            setCountdown(remaining);
        }, 1000);

        return () => clearInterval(interval);
    }, [nextCheckIn]);

    useEffect(() => {
        fetch(`https://visitorcounter.galaxd.com/api/hit/${Config.VisitorID}`)
            .then(response => response.json())
            .then(data => {
                if (data.status) {
                    setVisitorToday(data.data.today.toLocaleString());
                    setVisitorWeekly(data.data.weekly.toLocaleString());
                    setVisitorMonthly(data.data.monthly.toLocaleString());
                    setVisitorYearly(data.data.yearly.toLocaleString());
                    setVisitorTotal(data.data.total.toLocaleString());
                }
            });
    }, []);

    const visitor = `${visitorToday} • ${visitorWeekly} • ${visitorMonthly} • ${visitorYearly} • ${visitorTotal}`;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex items-center flex-col sm:flex-row sm:justify-between lg:flex-row lg:justify-between">
                        <div className="text-center sm:text-left lg:text-left">
                            <h1 className="text-3xl font-bold text-foreground">{Site.Title}</h1>
                            <p className="mt-1 text-sm text-muted-foreground">{Site.Home.description}</p>
                        </div>
                        <div className="text-center sm:text-right lg:text-right">
                            <p className="text-xs text-muted-foreground">Last updated: {lastUpdated ? formatDateTime2Digit(lastUpdated) : "—"}</p>
                            <p className="text-xs text-muted-foreground">Next check: in {countdown}s</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Status Summary */}
                <StatusSummary />

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="status">Status</TabsTrigger>
                        <TabsTrigger value="stats">Statistics</TabsTrigger>
                        <TabsTrigger value="incidents">Incidents</TabsTrigger>
                        <TabsTrigger value="previous">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="status" className="space-y-4 mt-6">
                        <StatusOverview />
                    </TabsContent>

                    <TabsContent value="stats" className="space-y-4 mt-6">
                        <StatsView />
                    </TabsContent>

                    <TabsContent value="incidents" className="space-y-4 mt-6">
                        <IncidentsView />
                    </TabsContent>

                    <TabsContent value="previous" className="space-y-4 mt-6">
                        <PreviousIncidentsView />
                    </TabsContent>
                </Tabs>
            </main>

            {/* Footer */}
            <footer className="border-t border-border bg-card mt-12">
                <div className="mx-auto px-4 py-4 space-y-1">
                    <div className="text-center text-xs text-muted-foreground">
                        <span className="border-b border-zinc-800">
                            © 2026 ‒ {yearNow}{" "}
                            <a href={Site.Authors[0].url} className="text-white">
                                {Site.Authors[0].name}
                            </a>
                            . All rights reserved.
                        </span>
                    </div>
                    <div className="flex justify-center items-center text-muted-foreground text-xs">
                        <Eye className="mr-2 h-3 w-3" />
                        <span>{visitor}</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
