declare global {
    module "*.css";

    type ITimeRangeTypes = "1h" | "24h" | "7d" | "30d" | "60d" | "90d";

    interface IStatEntry {
        timestamp: string;
        status: string;
        ping_ms: number;
        uptime_percentage: number;
        response_time_ms: number;
        request_count: number;
    }

    interface IService {
        id: string;
        name: string;
        domain: string;
        status: string;
        is_pinned: boolean;
        ping_ms?: number;
        description?: string;
        created_at?: Date;
        updated_at?: Date;
    }
}

export {};
