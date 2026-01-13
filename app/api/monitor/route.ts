import { NextResponse } from "next/server";

import { updateSlidingWindow } from "@/lib/stats-utils";
import { supabaseAdmin } from "@/lib/supabase-server";

async function checkService(domain: string) {
    const startTime = Date.now();

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(domain, {
            method: "HEAD",
            signal: controller.signal,
            redirect: "follow",
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        return {
            status: response.ok ? "operational" : "degraded",
            ping_ms: responseTime,
            response_time_ms: responseTime,
            request_count: 1,
            uptime_percentage: response.ok ? 100 : 50,
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;

        return {
            status: "offline",
            ping_ms: Math.min(responseTime, 8000),
            response_time_ms: Math.min(responseTime, 8000),
            request_count: 0,
            uptime_percentage: 0,
        };
    }
}

export async function GET(request: Request) {
    try {
        const secret = request.headers.get("authorization")?.replace("Bearer ", "");
        if (secret !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = supabaseAdmin;

        // Get all services
        const { data: services, error: servicesError } = await supabase.from("services").select("*");

        if (servicesError || !services) {
            console.error("❌ Failed to fetch services:", servicesError);
            return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
        }

        console.log(`🔃 Starting monitoring for ${services.length} services`);

        for (const service of services) {
            try {
                const result = await checkService(service.domain);
                console.log(`📋 ${service.name} (${service.domain}): ${result.status}`);

                const { data: currentStatsRow } = await supabase.from("service_stats").select("stats").eq("service_id", service.id).single();

                const currentStats = currentStatsRow?.stats ?? [];

                const newEntry = {
                    timestamp: new Date().toISOString(),
                    status: result.status,
                    ping_ms: result.ping_ms,
                    response_time_ms: result.response_time_ms,
                    request_count: result.request_count,
                    uptime_percentage: result.uptime_percentage,
                };

                const updatedStats = updateSlidingWindow(currentStats, newEntry);

                const { error: statsError } = await supabase.from("service_stats").upsert(
                    {
                        service_id: service.id,
                        stats: updatedStats,
                        oldest_timestamp: updatedStats.length > 0 ? updatedStats[0].timestamp : null,
                        newest_timestamp: newEntry.timestamp,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "service_id" }
                );

                if (statsError) {
                    console.error(`❌ Error upserting stats for ${service.id}:`, statsError);
                } else {
                    console.log(`✔️ Stats upserted for ${service.id}. Total entries: ${updatedStats.length}`);
                }

                const lastStatus = currentStats.length > 0 ? currentStats[currentStats.length - 1].status : service.status;

                const { error: updateError } = await supabase
                    .from("services")
                    .update({
                        status: result.status,
                        ping_ms: result.ping_ms,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", service.id);

                if (updateError) {
                    console.error(`❌ Error updating service ${service.id}:`, updateError);
                }

                if (lastStatus === "operational" && result.status !== "operational") {
                    const { data: existingIncident } = await supabase.from("incidents").select("id").eq("service_id", service.id).is("resolved_at", null).single();

                    if (!existingIncident) {
                        await supabase.from("incidents").insert([
                            {
                                service_id: service.id,
                                title: `${service.name} is ${result.status}`,
                                description: `The service became ${result.status} at ${new Date().toLocaleString()}`,
                                status: "investigating",
                                impact: result.status === "offline" ? "major" : "degraded",
                                started_at: new Date().toISOString(),
                            },
                        ]);
                        console.log(`📃 Incident created for ${service.name}`);
                    }
                }

                if (lastStatus !== "operational" && result.status === "operational") {
                    const { data: activeIncident } = await supabase.from("incidents").select("id").eq("service_id", service.id).is("resolved_at", null).single();

                    if (activeIncident) {
                        await supabase
                            .from("incidents")
                            .update({
                                status: "resolved",
                                resolved_at: new Date().toISOString(),
                            })
                            .eq("id", activeIncident.id);

                        await supabase.from("incident_updates").insert([
                            {
                                incident_id: activeIncident.id,
                                message: "Service has been restored to operational status",
                                status: "resolved",
                                created_at: new Date().toISOString(),
                            },
                        ]);
                        console.log(`📃 Incident resolved for ${service.name}`);
                    }
                }
            } catch (serviceError) {
                console.error(`❌ Error monitoring service ${service.id}:`, serviceError);
            }
        }

        return NextResponse.json({
            success: true,
            servicesChecked: services.length,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error(`❌ Monitoring error:`, error);
        return NextResponse.json({ error: "Monitoring failed", details: String(error) }, { status: 500 });
    }
}
