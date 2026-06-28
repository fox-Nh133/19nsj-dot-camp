import { useState } from 'preact/hooks';

export function HomeView() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [lastSyncText, setLastSyncText] = useState('No recent news.');

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncProgress(0);
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            setSyncProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    setIsSyncing(false);
                    setLastSyncText(`Data synced at ${new Date().toLocaleTimeString()} (Simulated)`);
                }, 500);
            }
        }, 100);
    };

    return (
        <>
            <div class="hero">
                <h1>Welcome to 19NSJ</h1>
                <p>Your ultimate offline survival kit.</p>
            </div>
            <div class="card-grid">
                <div class="card glass interactive">
                    <i class="bi bi-newspaper card-icon"></i>
                    <h3>News</h3>
                    <p>{lastSyncText}</p>
                </div>
                <div class="card glass interactive">
                    <i class="bi bi-cloud-sun card-icon"></i>
                    <h3>Weather</h3>
                    <p>28°C / Clear</p>
                </div>
            </div>
            <button class="btn primary" onClick={handleSync} disabled={isSyncing}>
                {isSyncing ? (
                    <><i class="bi bi-hourglass-split"></i> Syncing...</>
                ) : (
                    <><i class="bi bi-arrow-repeat"></i> Manual Sync</>
                )}
            </button>

            {/* Sync Progress Bar */}
            <div class="progress-bar" style={{ opacity: isSyncing ? 1 : 0 }}>
                <div class="progress-fill" style={{ width: `${syncProgress}%` }}></div>
            </div>
        </>
    );
}
