"use client";

import { useState, useEffect } from "react";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Pin, LogOut, Edit, MoreVerticalIcon, Loader2, Home } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { ManageIncidents } from "./manage-incidents";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime2Digit } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import * as z from "zod";

const serviceSchema = z.object({
    name: z.string().min(1, "Service name is required").max(100),
    domain: z.string().min(1, "Domain is required").url("Must be a valid URL"),
    description: z.string().max(500).optional().default(""),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function AdminDashboard() {
    const supabase = createClient();
    const { toast } = useToast();
    const router = useRouter();

    const [services, setServices] = useState<IService[]>([]);
    const [adminEmail, setAdminEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLogoutLoading, setIsLogoutLoading] = useState(false);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<IService | null>(null);
    const [editLoading, setEditLoading] = useState(false);

    const addForm = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            name: "",
            domain: "",
            description: "",
        },
    });

    const editForm = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceSchema),
    });

    useEffect(() => {
        const loadUser = async () => {
            const { data } = await supabase.auth.getUser();

            if (!data.user) {
                router.replace("/admin/login");
                return;
            }

            setAdminEmail(data.user.email ?? "");
            await fetchServices();
            setIsLoading(false);
        };

        loadUser();
    }, []);
    const handleLogout = async () => {
        setIsLogoutLoading(true);
        await supabase.auth.signOut();
        router.replace("/admin/login");
    };

    const fetchServices = async () => {
        try {
            const { data, error } = await supabase.from("services").select("*").order("is_pinned", { ascending: false }).order("name", { ascending: true });

            if (!error && data) {
                setServices(data);
            }
        } catch (err) {
            toast({
                title: "Error fetching services!",
                description: `Failed to fetch services:\n${err}`,
                className: "bg-red-500 text-white border-none slide-in-from-right",
            });
        }
    };

    const handleAddService = async (values: ServiceFormValues) => {
        setLoading(true);
        try {
            const { error } = await supabase.from("services").insert([
                {
                    name: values.name,
                    domain: values.domain,
                    description: values.description,
                    status: "operational",
                },
            ]);

            if (!error) {
                addForm.reset();
                await fetchServices();
            }
        } catch (err) {
            toast({
                title: "Error adding service!",
                description: `Failed to add service:\n${err}`,
                className: "bg-red-500 text-white border-none slide-in-from-right",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (service: IService) => {
        setEditingService(service);
        editForm.reset({
            name: service.name,
            domain: service.domain,
            description: service.description,
        });
        setEditDialogOpen(true);
    };
    const handleEditSubmit = async (values: ServiceFormValues) => {
        if (!editingService) return;

        setEditLoading(true);
        try {
            await supabase.from("services").update(values).eq("id", editingService.id);
            await fetchServices();
            setEditDialogOpen(false);
            setEditingService(null);
        } catch (err) {
            toast({
                title: "Error editing service!",
                description: `Failed to edit service:\n${err}`,
                className: "bg-red-500 text-white border-none slide-in-from-right",
            });
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteClick = (serviceId: string) => {
        setServiceToDelete(serviceId);
        setDeleteDialogOpen(true);
    };
    const handleConfirmDelete = async () => {
        if (!serviceToDelete) return;

        try {
            await supabase.from("services").delete().eq("id", serviceToDelete);
            await supabase.from("service_stats").delete().eq("service_id", serviceToDelete);
            await fetchServices();
            setDeleteDialogOpen(false);
            setServiceToDelete(null);
        } catch (err) {
            toast({
                title: "Error deleting service!",
                description: `Failed to delete service:\n${err}`,
                className: "bg-red-500 text-white border-none slide-in-from-right",
            });
        }
    };

    const handlePinService = async (serviceId: string, isPinned: boolean) => {
        try {
            await supabase.from("services").update({ is_pinned: !isPinned }).eq("id", serviceId);
            await fetchServices();
        } catch (err) {
            toast({
                title: "Error pinning service!",
                description: `Failed to pin service:\n${err}`,
                className: "bg-red-500 text-white border-none slide-in-from-right",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <div className="text-muted-foreground" suppressHydrationWarning>
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
                        <p className="mt-1 text-sm text-muted-foreground">{adminEmail}</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={"/"} className="flex items-center">
                            <Button className="gap-0">
                                <Home className="w-4 h-4 mr-2" />
                                Home
                            </Button>
                        </Link>
                        <Button onClick={handleLogout} disabled={isLogoutLoading} variant="destructive" className="gap-0">
                            <LogOut className="w-4 h-4 mr-2" />
                            {isLogoutLoading ? "Logging out..." : "Logout"}
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <Tabs defaultValue="services" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="services">Manage Services</TabsTrigger>
                        <TabsTrigger value="incidents">Manage Incidents</TabsTrigger>
                    </TabsList>

                    <TabsContent value="services" className="space-y-6 mt-6">
                        {/* Add New Service */}
                        <Card className="bg-card/50 border-dashed border-yellow-400 border-2 backdrop-blur">
                            <CardHeader>
                                <CardTitle>Add New Service</CardTitle>
                                <CardDescription>Add a new service to monitor</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...addForm}>
                                    <form onSubmit={addForm.handleSubmit(handleAddService)} className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <FormField
                                                control={addForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="gap-1">
                                                            Service Name<span className="text-red-500">*</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="API Server" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={addForm.control}
                                                name="domain"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="gap-1">
                                                            Domain/URL<span className="text-red-500">*</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="https://api.example.com" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={addForm.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Description</FormLabel>
                                                    <FormControl>
                                                        <Textarea placeholder="Service description" rows={8} className="min-h-25" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit" disabled={loading} className="w-full">
                                            {loading ? "Adding..." : "Add Service"}
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>

                        {/* Services List */}
                        <div className="space-y-3">
                            <h2 className="text-lg font-semibold">Services</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {services.map(service => (
                                    <Card key={service.id} className="bg-card/50 border-dashed border-zinc-700 backdrop-blur overflow-hidden">
                                        <CardContent>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-foreground">{service.name}</h3>
                                                        {service.is_pinned && (
                                                            <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
                                                                Pinned
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{service.domain}</p>
                                                    {service.description && <p className="text-sm text-muted-foreground mt-1">{service.description}</p>}
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
                                                            <DropdownMenuItem onSelect={() => handlePinService(service.id, service.is_pinned)}>
                                                                <Pin className="w-4 h-4 mr-2" />
                                                                {service.is_pinned ? "Unpin" : "Pin"}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => handleEditClick(service)}>
                                                                <Edit className="w-4 h-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => handleDeleteClick(service.id)} className="text-red-400 hover:text-red-400">
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuGroup>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <Separator className="mt-2 mb-2" />
                                            <div className="flex justify-between space-x-4">
                                                <span className="text-xs text-start text-muted-foreground">
                                                    Created at: <p className="text-zinc-200">{formatDateTime2Digit(new Date(service?.created_at || ""))}</p>
                                                </span>
                                                <div className="flex items-center">
                                                    <Separator orientation="vertical" className="h-full" />
                                                </div>
                                                <span className="text-xs text-end text-muted-foreground">
                                                    Updated at: <p className="text-zinc-200">{formatDateTime2Digit(new Date(service?.updated_at || ""))}</p>
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="incidents" className="space-y-6 mt-6">
                        <ManageIncidents />
                    </TabsContent>
                </Tabs>
            </main>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="border border-zinc-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Service?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the service and all associated statistics.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Service Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="min-w-2xl border border-zinc-700">
                    <DialogHeader>
                        <DialogTitle>Edit Service</DialogTitle>
                        <DialogDescription>Update service details</DialogDescription>
                    </DialogHeader>
                    {editingService && (
                        <Form {...editForm}>
                            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <FormField
                                        control={editForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="gap-1">
                                                    Service Name<span className="text-red-500">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Service name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={editForm.control}
                                        name="domain"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="gap-1">
                                                    Domain/URL<span className="text-red-500">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://example.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={editForm.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Service description" rows={8} className="min-h-25" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex gap-3 justify-end pt-2">
                                    <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={editLoading}>
                                        {editLoading ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
