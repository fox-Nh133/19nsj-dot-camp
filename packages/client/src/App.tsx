import { useState, useEffect } from 'preact/hooks';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { NewsView } from './components/views/NewsView';
import { WeatherView } from './components/views/WeatherView';
import { ScheduleView } from './components/views/ScheduleView';
import { MapView } from './components/views/MapView';
import { SettingsView } from './components/views/SettingsView';
import { SyncData, News, WeatherData, EventData } from '@19nsj/schema';
import { fetchAndMergeSyncData } from './api';

export type ViewType = 'news' | 'weather' | 'map' | 'schedule' | 'settings';

export function App() {
    const [currentView, setCurrentView] = useState<ViewType>('news');
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

    // Hoisted sync state
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [newsList, setNewsList] = useState<News[]>([]);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [eventList, setEventList] = useState<EventData[]>([]);
    const [lastSyncText, setLastSyncText] = useState('No recent news.');

    useEffect(() => {
        const updateOnlineStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncProgress(0);
        
        try {
            const currentData: SyncData = {
                timestamp: Date.now(),
                weather,
                news: newsList,
                events: eventList
            };

            const mergedData = await fetchAndMergeSyncData(
                weather || newsList.length > 0 || eventList.length > 0 ? currentData : null, 
                setSyncProgress
            );

            setWeather(mergedData.weather);
            setNewsList(mergedData.news);
            setEventList(mergedData.events);
            setLastSyncText(`Data synced at ${new Date(mergedData.timestamp).toLocaleTimeString()}`);
        } catch (error) {
            console.error('Sync failed', error);
            setLastSyncText('Sync failed. Check network or settings.');
        } finally {
            setTimeout(() => {
                setIsSyncing(false);
            }, 300);
        }
    };

    return (
        <>
            {currentView !== 'settings' && (
                <Header isOnline={isOnline} onOpenSettings={() => setCurrentView('settings')} />
            )}
            <main class="app-content">
                <div class={`view ${currentView === 'news' ? 'active' : ''}`}>
                    <NewsView 
                        isSyncing={isSyncing}
                        syncProgress={syncProgress}
                        newsList={newsList}
                        lastSyncText={lastSyncText}
                        onSync={handleSync}
                    />
                </div>
                <div class={`view ${currentView === 'weather' ? 'active' : ''}`}>
                    <WeatherView weather={weather} />
                </div>
                <div class={`view ${currentView === 'schedule' ? 'active' : ''}`}>
                    <ScheduleView events={eventList} />
                </div>
                <div class={`view ${currentView === 'map' ? 'active' : ''}`}>
                    <MapView isActive={currentView === 'map'} />
                </div>
                <div class={`view ${currentView === 'settings' ? 'active' : ''}`}>
                    <SettingsView onBack={() => setCurrentView('news')} />
                </div>
            </main>
            <BottomNav currentView={currentView} onViewChange={setCurrentView} />
        </>
    );
}
