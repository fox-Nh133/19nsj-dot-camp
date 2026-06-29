import { useState, useRef } from 'preact/hooks';
import { News, NewsCategory, WeatherData, EventData } from '@19nsj/schema';
import type { ViewType } from '../../App';

interface Props {
    isSyncing: boolean;
    newsList: News[];
    weather: WeatherData | null;
    events: EventData[];
    onSync: () => void;
    onNavigate: (view: ViewType) => void;
}

export function HomeView({ isSyncing, newsList, weather, events, onSync, onNavigate }: Props) {
    const latestNews = newsList.length > 0 ? newsList[0] : null;
    const displayedNews = newsList.slice(0, 3);
    const hasMoreNews = newsList.length > 3;

    const [activeIndex, setActiveIndex] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (!carouselRef.current) return;
        const container = carouselRef.current;
        const children = container.children;
        if (children.length === 0) return;
        
        let bestIndex = 0;
        let minDiff = Infinity;
        const containerLeft = container.getBoundingClientRect().left;

        for (let i = 0; i < children.length; i++) {
            const rect = children[i].getBoundingClientRect();
            const diff = Math.abs(rect.left - containerLeft);
            if (diff < minDiff) {
                minDiff = diff;
                bestIndex = i;
            }
        }
        
        setActiveIndex(bestIndex);
    };

    const scrollToSlide = (index: number) => {
        if (!carouselRef.current) return;
        const container = carouselRef.current;
        const children = container.children;
        if (children[index]) {
            children[index].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'start'
            });
        }
    };

    const getCategoryLabel = (category: NewsCategory) => {
        switch (category) {
            case NewsCategory.SAFETY:
                return '緊急・安全';
            case NewsCategory.PROGRAM:
                return 'プログラム';
            case NewsCategory.TRANSPORT:
                return '交通・移動';
            case NewsCategory.ANNOUNCEMENT:
                return 'お知らせ';
            default:
                return 'ニュース';
        }
    };
    
    // Sort events by startTime to find the next upcoming one
    const now = Date.now();
    const upcomingEvents = events.filter(e => e.startTime > now).sort((a, b) => a.startTime - b.startTime);
    const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : (events.length > 0 ? events[0] : null);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-300)' }}>
            {/* News Delivery Carousel */}
            {(() => {
                const totalSlides = displayedNews.length + (hasMoreNews ? 1 : 0);

                if (totalSlides <= 1) {
                    // 0〜1件: スクロール不要、ドット不要
                    return displayedNews.length === 1 ? (
                        <div class={`hero-card ${displayedNews[0].category === NewsCategory.SAFETY ? 'safety' : ''}`}
                            onClick={() => onNavigate('news')}
                        >
                            <div class="hero-badge">
                                <span class="pulse-dot" style={{ backgroundColor: displayedNews[0].category === NewsCategory.SAFETY ? '#FFF' : '#8EE04E' }}></span>
                                {getCategoryLabel(displayedNews[0].category)}
                            </div>
                            <h2 style={{ color: 'white', marginTop: 'var(--space-200)', marginBottom: 'var(--space-100)', fontSize: '1.125rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.3 }}>
                                {displayedNews[0].title}
                            </h2>
                            <p style={{ color: 'white', opacity: 0.9, lineHeight: 1.4, margin: 0, fontSize: '0.85rem' }}>
                                {new Date(displayedNews[0].createdAt).toLocaleDateString()} {new Date(displayedNews[0].createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                    ) : null; // 0件: 何も表示しない
                }

                // 2件以上: カルーセル + ドット
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-100)' }}>
                        <div 
                            ref={carouselRef}
                            class="news-carousel"
                            onScroll={handleScroll}
                        >
                            {displayedNews.map(news => (
                                <div 
                                    key={news.id}
                                    class={`hero-card ${news.category === NewsCategory.SAFETY ? 'safety' : ''}`}
                                    onClick={() => onNavigate('news')}
                                >
                                    <div class="hero-badge">
                                        <span class="pulse-dot" style={{ backgroundColor: news.category === NewsCategory.SAFETY ? '#FFF' : '#8EE04E' }}></span>
                                        {getCategoryLabel(news.category)}
                                    </div>
                                    <h2 style={{ color: 'white', marginTop: 'var(--space-200)', marginBottom: 'var(--space-100)', fontSize: '1.125rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.3 }}>
                                        {news.title}
                                    </h2>
                                    <p style={{ color: 'white', opacity: 0.9, lineHeight: 1.4, margin: 0, fontSize: '0.85rem' }}>
                                        {new Date(news.createdAt).toLocaleDateString()} {new Date(news.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            ))}
                            {hasMoreNews && (
                                <div class="hero-card more-news" onClick={() => onNavigate('news')}>
                                    <i class="bi bi-arrow-right-circle" style={{ fontSize: '2.5rem', color: 'var(--color-jamboree-green-dark)' }}></i>
                                    <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>他のニュースを表示する</span>
                                </div>
                            )}
                        </div>
                        {/* Carousel Indicator Dots */}
                        <div class="carousel-dots">
                            {Array.from({ length: totalSlides }).map((_, idx) => (
                                <button
                                    key={idx}
                                    class={`carousel-dot ${activeIndex === idx ? 'active' : ''}`}
                                    onClick={() => scrollToSlide(idx)}
                                    aria-label={`Go to slide ${idx + 1}`}
                                ></button>
                            ))}
                        </div>
                    </div>
                );
            })()}

            {/* Quick Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem' }}>Quick Actions</h3>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-200)' }}>
                <button class="bento-btn" onClick={onSync} disabled={isSyncing}>
                    {isSyncing ? <i class="bi bi-arrow-repeat spin"></i> : <i class="bi bi-arrow-repeat" style={{ color: 'var(--color-jamboree-green-dark)' }}></i>} 
                    <span>Manual Sync</span>
                </button>
                <button class="bento-btn" onClick={() => onNavigate('map')}>
                    <i class="bi bi-map" style={{ color: 'var(--color-danger)' }}></i> 
                    <span>View Map</span>
                </button>
            </div>

            {/* Weather Widget */}
            <div class="bento-card weather-widget" onClick={() => onNavigate('weather')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ color: 'var(--text-subtle)', marginBottom: 'var(--space-050)', fontSize: '0.875rem' }}>Hiroshima Plateau</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                            {weather?.current?.temp != null ? `${weather.current.temp}°C` : '24°C'}
                        </div>
                    </div>
                    <i class="bi bi-cloud-rain" style={{ fontSize: '2.5rem', color: 'var(--color-danger)' }}></i>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-200)', paddingTop: 'var(--space-200)', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-200)', fontWeight: 500, fontSize: '0.875rem' }}>
                        <span><i class="bi bi-arrow-up"></i> {weather?.tomorrow?.tempMax != null ? `${weather.tomorrow.tempMax}°` : '28°'}</span>
                        <span><i class="bi bi-arrow-down"></i> {weather?.tomorrow?.tempMin != null ? `${weather.tomorrow.tempMin}°` : '19°'}</span>
                    </div>
                    <span style={{ color: 'var(--color-jamboree-green-dark)', fontWeight: 600, fontSize: '0.875rem' }}>Weather Details</span>
                </div>
            </div>

            {/* Schedule Widget */}
            <div class="bento-card schedule-widget" onClick={() => onNavigate('schedule')} style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-100)', marginBottom: 'var(--space-200)' }}>
                    <span class="badge" style={{ background: 'var(--color-jamboree-green)', color: 'var(--text-main)' }}>NEXT UP</span>
                    <span style={{ color: 'var(--text-subtle)', fontSize: '0.875rem', fontWeight: 500 }}>In 15 minutes</span>
                </div>
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h3 style={{ color: 'var(--color-danger)', fontSize: '1.125rem', marginBottom: 'var(--space-100)' }}>
                        {nextEvent ? nextEvent.title : 'Opening Ceremony'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-050)', color: 'var(--text-subtle)', marginBottom: 'var(--space-300)', fontSize: '0.875rem' }}>
                        <i class="bi bi-geo-alt"></i> <span>{nextEvent ? nextEvent.location : 'Main Arena - Sub-camp Alpha'}</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--color-danger)', fontWeight: 'bold', fontSize: '1rem' }}>
                            {nextEvent ? new Date(nextEvent.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '09:00'}
                        </span>
                        <button class="btn btn-danger" style={{ borderRadius: 'var(--radius-md)' }}>Full Schedule</button>
                    </div>
                </div>
                <i class="bi bi-calendar3 schedule-watermark"></i>
            </div>



            {/* Mock: Badge Progress */}
            <div class="bento-card badge-widget" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 'var(--space-200)', background: 'var(--surface-green-light)', border: '1px solid var(--color-jamboree-green)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-jamboree-green-dark)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                    <i class="bi bi-award-fill"></i>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '2px' }}>Badge Progress</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: 'var(--space-100)' }}>3 of 8 Badges Collected</div>
                    <div class="progress-bar-bg" style={{ height: '6px', background: 'rgba(255,255,255,0.6)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: '37.5%', height: '100%', background: 'var(--color-jamboree-green-dark)' }}></div>
                    </div>
                </div>
            </div>

            {/* Mock: Camp Connectivity */}
            <div class="bento-card connectivity-widget" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-sunken)' }}>
                <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--space-100)' }}>Camp Connectivity</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-050)', color: 'var(--color-jamboree-green-dark)', fontWeight: 500, fontSize: '0.875rem' }}>
                        <i class="bi bi-wifi"></i> Strong Signal at Arena
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: 'var(--space-050)' }}>Current Latency</div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>24ms</div>
                </div>
            </div>
            
            {/* Safe area spacer for bottom nav */}
            <div style={{ height: 'var(--space-100)' }}></div>
        </div>
    );
}
