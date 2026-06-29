import { useState, useEffect } from 'preact/hooks';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/views/HomeView';
import { NewsView } from './components/views/NewsView';
import { WeatherView } from './components/views/WeatherView';
import { ScheduleView } from './components/views/ScheduleView';
import { MapView } from './components/views/MapView';
import { SettingsView } from './components/views/SettingsView';
import { SyncData, News, WeatherData, EventData } from '@19nsj/schema';
import { fetchAndMergeSyncData } from './api';

export type ViewType = 'home' | 'news' | 'weather' | 'map' | 'schedule' | 'settings';

export function App() {
    const [currentView, setCurrentView] = useState<ViewType>('home');
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

    // Hoisted sync state
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [newsList, setNewsList] = useState<News[]>([
        {
            id: -1,
            createdAt: Date.now(),
            title: '第19回日本スカウトジャンボリーへようこそ！',
            category: 4 // ANNOUNCEMENT
        },
        {
            id: -2,
            createdAt: Date.now(),
            title: 'アプリの使い方：下のメニューからニュース・天気・スケジュール・マップにアクセスできます',
            category: 4 // ANNOUNCEMENT
        },
        {
            id: -3,
            createdAt: Date.now(),
            title: '最新情報を受け取るには「Manual Sync」ボタンでデータを同期してください',
            category: 4 // ANNOUNCEMENT
        },
    ]);
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
                <div class={`view ${currentView === 'home' ? 'active' : ''}`}>
                    <HomeView 
                        isSyncing={isSyncing}
                        newsList={newsList}
                        weather={weather}
                        events={eventList}
                        onSync={handleSync}
                        onNavigate={setCurrentView}
                    />
                </div>
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
                    <SettingsView onBack={() => setCurrentView('home')} />
                </div>
            </main>
            <BottomNav currentView={currentView} onViewChange={setCurrentView} />
        </>
    );
}
