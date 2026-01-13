// Run monitoring every 1 minutes
const MONITORING_INTERVAL = 60 * 1000; // 1 minutes
const API_BASE = process.env.MONITORING_API_URL || "http://localhost:3000";

async function runMonitoring() {
    try {
        const response = await fetch(`${API_BASE}/api/cron/monitor`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();
        console.log(`[${new Date().toISOString()}] Monitoring run:`, data.servicesChecked);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Monitoring error:`, error);
    }
}

// Run immediately and then at intervals
runMonitoring();
setInterval(runMonitoring, MONITORING_INTERVAL);

console.log(`Monitoring service started. Checking every ${MONITORING_INTERVAL / 1000 / 60} minutes.`);
