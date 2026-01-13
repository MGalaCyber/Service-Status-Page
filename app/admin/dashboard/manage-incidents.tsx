"use client";

import { useState, useEffect } from "react";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CheckCircle2, AlertCircle, Clock, Trash2, RotateCcw, MoreVerticalIcon } from "lucide-react";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

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
}

export function ManageIncidents() {
    const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
    const [resolvedIncidents, setResolvedIncidents] = useState<Incident[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();
    const { toast } = useToast();

    const [resolvingDialogOpen, setResolvingDialogOpen] = useState(false);
    const [incidentToResolve, setIncidentToResolve] = useState<string | null>(null);
    const [reopeningDialogOpen, setReopeningDialogOpen] = useState(false);
    const [incidentToReopen, setIncidentToReopen] = useState<string | null>(null);
    const [deletingDialogOpen, setDeletingDialogOpen] = useState(false);
    const [incidentToDelete, setIncidentToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchIncidents();
        const subscription = supabase
            .channel("incidents_changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => {
                fetchIncidents();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchIncidents = async () => {
        setIsLoading(true);
        try {
            const { data: active, error: activeError } = await supabase.from("incidents").select(`*, service:services(name)`).is("resolved_at", null).order("started_at", { ascending: false });

            const { data: resolved, error: resolvedError } = await supabase.from("incidents").select(`*, service:services(name)`).not("resolved_at", "is", null).order("resolved_at", { ascending: false }).limit(30);

            if (!activeError && active) {
                setActiveIncidents(active);
            }
            if (!resolvedError && resolved) {
                setResolvedIncidents(resolved);
            }
        } catch (err) {
            toast({
                title: "Error fetching incidents!",
                description: `Failed to fetch incidents:\n${err}`,
                className: "bg-red-500 text-white border-none slide-in-from-right",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResolveClick = (incidentId: string) => {
        setIncidentToResolve(incidentId);
        setResolvingDialogOpen(true);
    };
    const handleResolveIncident = async () => {
        if (!incidentToResolve) return;

        setLoading(true);
        try {
            await supabase
                .from("incidents")
                .update({
                    status: "resolved",
                    resolved_at: new Date().toISOString(),
                })
                .eq("id", incidentToResolve);

            await supabase.from("incident_updates").insert({
                incident_id: incidentToResolve,
                message: "Incident resolved by admin",
                status: "resolved",
            });

            await fetchIncidents();
        } catch (err) {
            toast({
                title: "Error resolving incident!",
                description: `Failed to resolve incident:\n${err}`,
                className: "bg-red-500 text-white border-none slide-in-from-right",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReopenIncidentClick = (incidentId: string) => {
        setIncidentToReopen(incidentId);
        setReopeningDialogOpen(true);
    };
    const handleReopenIncident = async () => {
        if (!incidentToReopen) return;

        setLoading(true);
        try {
            await supabase
                .from("incidents")
                .update({
                    status: "investigating",
                    resolved_at: null,
                })
                .eq("id", incidentToReopen);

            await supabase.from("incident_updates").insert({
                incident_id: incidentToReopen,
                message: "Incident re-opened by admin",
                status: "investigating",
            });

            await fetchIncidents();
        } catch (err) {
            toast({
                title: "Error re-opening incident!",
                description: `Failed to re-open incident:\n${err}`,
                className: "bg-red-500 text-white border-none slide-in-from-right",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteIncidentClick = (incidentId: string) => {
        setIncidentToDelete(incidentId);
        setDeletingDialogOpen(true);
    };
    const handleDeleteIncident = async () => {
        if (!incidentToDelete) return;

        setLoading(true);
        try {
            await supabase.from("incident_updates").delete().eq("incident_id", incidentToDelete);
            await supabase.from("incidents").delete().eq("id", incidentToDelete);

            await fetchIncidents();
        } catch (err) {
            toast({
                title: "Error deleting incident!",
                description: `Failed to delete incident:\n${err}`,
                className: "bg-red-500 text-white border-none slide-in-from-right",
            });
        } finally {
            setLoading(false);
        }
    };

    const getDuration = (startedAt: string, resolvedAt: string | null) => {
        if (!resolvedAt) return formatDistanceToNow(new Date(startedAt), { addSuffix: false });

        const start = new Date(startedAt);
        const end = new Date(resolvedAt);
        const diffMs = end.getTime() - start.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${diffMins}m`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;

        return `${Math.floor(diffHours / 24)}d ${diffHours % 24}h`;
    };

    return (
        <div className="w-full">
            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active">Active Incidents ({activeIncidents.length})</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved ({resolvedIncidents.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4 mt-6">
                    {isLoading ? (
                        <Card className="bg-card/50 border border-zinc-700 backdrop-blur">
                            <CardContent>
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-6 w-30 lg:w-60 bg-muted" />
                                        <Skeleton className="h-4 w-20 lg:w-30 bg-muted" />
                                    </div>
                                    <Skeleton className="h-9 w-14 lg:w-40 bg-muted" />
                                </div>
                                <div className="space-y-4">
                                    <Skeleton className="h-3 w- w-40 lg:w-100 bg-muted" />
                                    <Skeleton className="h-3 w-40 lg:w-45 bg-muted" />
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {activeIncidents.length === 0 ? (
                                <Empty className="bg-card/50 border border-zinc-700 backdrop-blur">
                                    <EmptyHeader>
                                        <EmptyTitle>
                                            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
                                        </EmptyTitle>
                                        <EmptyDescription>No active incidents</EmptyDescription>
                                    </EmptyHeader>
                                </Empty>
                            ) : (
                                activeIncidents.map(incident => (
                                    <Card key={incident.id} className={`bg-card/50 border ${incident.impact === "critical" ? "border-red-500/30" : incident.impact === "major" ? "border-orange-500/30" : "border-yellow-500/30"} backdrop-blur`}>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <AlertCircle className="w-4 h-4 text-red-400" />
                                                            <h3 className="font-semibold text-foreground">{incident.title}</h3>
                                                            <Badge
                                                                variant="outline"
                                                                className={`${
                                                                    incident.impact === "critical" ? "text-red-400 border-red-500/30" : incident.impact === "major" ? "text-orange-400 border-orange-500/30" : "text-yellow-400 border-yellow-500/30"
                                                                }`}
                                                            >
                                                                {incident.impact.charAt(0).toUpperCase() + incident.impact.slice(1)}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{incident.service?.name}</p>
                                                        {incident.description && <p className="text-sm text-muted-foreground mt-2">{incident.description}</p>}
                                                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                                                            <Clock className="w-3 h-3" />
                                                            Started {formatDistanceToNow(new Date(incident.started_at), { addSuffix: true })} ({getDuration(incident.started_at, incident.resolved_at)})
                                                        </div>
                                                    </div>
                                                    <Button onClick={() => handleResolveClick(incident.id)} disabled={loading} className="text-green-400 hover:text-green-300" variant="outline">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Mark as resolved
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </>
                    )}
                </TabsContent>

                <TabsContent value="resolved" className="space-y-4 mt-6">
                    {isLoading ? (
                        <Card className="bg-card/50 border border-zinc-700 backdrop-blur">
                            <CardContent>
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-6 w-30 lg:w-60 bg-muted" />
                                        <Skeleton className="h-4 w-20 lg:w-30 bg-muted" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Skeleton className="h-9 w-14 lg:w-25 bg-muted" />
                                        <Skeleton className="h-9 w-14 lg:w-10 bg-muted" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Skeleton className="h-3 w- w-40 lg:w-100 bg-muted" />
                                    <Skeleton className="h-3 w-40 lg:w-45 bg-muted" />
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {resolvedIncidents.length === 0 ? (
                                <Empty className="bg-card/50 border border-zinc-700 backdrop-blur">
                                    <EmptyHeader>
                                        <EmptyTitle>
                                            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
                                        </EmptyTitle>
                                        <EmptyDescription>No resolved incidents</EmptyDescription>
                                    </EmptyHeader>
                                </Empty>
                            ) : (
                                resolvedIncidents.map(incident => (
                                    <Card key={incident.id} className="bg-card/50 border border-zinc-700 backdrop-blur">
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                            <h3 className="font-semibold text-foreground">{incident.title}</h3>
                                                            <Badge variant="outline" className="text-green-400 border-green-500/30">
                                                                Resolved
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{incident.service?.name}</p>
                                                        {incident.description && <p className="text-sm text-muted-foreground mt-2">{incident.description}</p>}
                                                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                                                            <Clock className="w-3 h-3" />
                                                            Resolved {formatDistanceToNow(new Date(incident.resolved_at!), { addSuffix: true })} ({getDuration(incident.started_at, incident.resolved_at)})
                                                        </div>
                                                    </div>
                                                    <DropdownMenu modal={false}>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button size="sm" variant="outline">
                                                                <MoreVerticalIcon />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="center">
                                                            <DropdownMenuLabel>Service Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuGroup>
                                                                <DropdownMenuItem onSelect={() => handleReopenIncidentClick(incident.id)}>
                                                                    <RotateCcw className="w-4 h-4 mr-1" />
                                                                    Re-open
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onSelect={() => handleDeleteIncidentClick(incident.id)} className="text-red-400 hover:text-red-400">
                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuGroup>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </>
                    )}
                </TabsContent>
            </Tabs>

            {/* Dialog for Marking Incident as Resolved */}
            <AlertDialog open={resolvingDialogOpen} onOpenChange={setResolvingDialogOpen}>
                <AlertDialogContent className="border border-zinc-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Mark Incident as Resolved?</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to mark this incident as resolved?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResolveIncident} className="bg-green-600 hover:bg-green-700">
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog for Reopening Incident */}
            <AlertDialog open={reopeningDialogOpen} onOpenChange={setReopeningDialogOpen}>
                <AlertDialogContent className="border border-zinc-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reopen Incident?</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to reopen this incident?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReopenIncident} className="bg-green-600 hover:bg-green-700">
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog for Deleting Incident */}
            <AlertDialog open={deletingDialogOpen} onOpenChange={setDeletingDialogOpen}>
                <AlertDialogContent className="border border-zinc-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Incident?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the incident.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteIncident} className="bg-red-600 hover:bg-red-700">
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
