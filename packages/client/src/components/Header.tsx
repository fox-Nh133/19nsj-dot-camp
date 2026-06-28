export function Header({ isOnline, onOpenSettings }: { isOnline: boolean, onOpenSettings: () => void }) {
    return (
        <header class="app-header">
            <div class="logo">
                <i class="bi bi-compass-fill" style={{ color: 'var(--color-primary)' }}></i> 19NSJ
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-200)', alignItems: 'center' }}>
                <div class={`sync-status ${isOnline ? 'online' : 'offline'}`} style={{ display: 'none' /* hidden for cleaner look */}}>
                    <i class="bi bi-cloud-check"></i> <span>{isOnline ? 'Online' : 'Offline'}</span>
                </div>
                <button 
                    class="btn btn-subtle"
                    onClick={onOpenSettings}
                    style={{ padding: 'var(--space-100)', height: '40px', width: '40px', borderRadius: '50%', fontSize: '1.25rem' }}
                >
                    <i class="bi bi-gear-fill"></i>
                </button>
            </div>
        </header>
    );
}
