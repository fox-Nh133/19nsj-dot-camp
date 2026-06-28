import { useState, useEffect } from 'preact/hooks';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/views/HomeView';
import { MapView } from './components/views/MapView';
import { ReportView } from './components/views/ReportView';

export type ViewType = 'home' | 'map' | 'report';

export function App() {
    const [currentView, setCurrentView] = useState<ViewType>('home');
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

    useEffect(() => {
        const updateOnlineStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    return (
        <>
            <Header isOnline={isOnline} />
            <main class="app-content">
                <div class={`view ${currentView === 'home' ? 'active' : ''}`}>
                    <HomeView />
                </div>
                <div class={`view ${currentView === 'map' ? 'active' : ''}`}>
                    <MapView isActive={currentView === 'map'} />
                </div>
                <div class={`view ${currentView === 'report' ? 'active' : ''}`}>
                    <ReportView />
                </div>
            </main>
            <BottomNav currentView={currentView} onViewChange={setCurrentView} />
        </>
    );
}
