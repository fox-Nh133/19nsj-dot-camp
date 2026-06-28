export function Header({ isOnline }: { isOnline: boolean }) {
    return (
        <header class="app-header glass">
            <div class="logo">
                <i class="bi bi-compass-fill"></i> 19NSJ
            </div>
            <div class={`sync-status ${isOnline ? 'online' : 'offline'}`}>
                <i class="bi bi-cloud-check"></i> <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
        </header>
    );
}
