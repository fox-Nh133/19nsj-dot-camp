import { EventData } from '@19nsj/schema';
import { useState } from 'preact/hooks';

interface Props {
    events: EventData[];
}

export function ScheduleView({ events }: Props) {
    const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');

    const formatTime = (unixSec: number) => {
        return new Date(unixSec * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Placeholder data to match mockup if events are empty or for visual test
    const displayEvents = events.length > 0 ? events : [
        {
            id: 1,
            title: '開会式',
            startTime: 1691193600, // example time
            endTime: 1691199000,
            location: 'メインアリーナ',
            description: '',
            category: '全体集会' // Mock extended property
        },
        {
            id: 2,
            title: 'スキルワークショップ：ロープワーク',
            startTime: 1691200800,
            endTime: 1691208000,
            location: 'サブキャンプBエリア',
            description: '',
            category: 'アクティビティ'
        },
        {
            id: 3,
            title: '大キャンプファイヤー',
            startTime: 1691229600,
            endTime: 1691236800,
            location: '中央広場',
            description: '',
            category: '交流'
        }
    ];

    const getCategoryBadge = (category?: string) => {
        if (!category) return null;
        return <span style={{ padding: '4px 12px', background: 'rgba(139, 197, 63, 0.15)', color: 'var(--secondary)', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600 }}>{category}</span>;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-300)', paddingBottom: 'var(--space-400)' }}>
            {/* Segmented Control */}
            <div class="segment-control">
                <button 
                    class={`segment-btn ${activeTab === 'my' ? 'active' : ''}`}
                    onClick={() => setActiveTab('my')}
                >
                    マイ・スケジュール
                </button>
                <button 
                    class={`segment-btn ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    すべてのイベント
                </button>
            </div>

            {/* Date Header */}
            <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: 'var(--space-050)' }}>8月 5日 (月)</h2>
                <p class="text-subtle">Day 3 - 冒険の始まり</p>
            </div>
            
            {/* Timeline */}
            <div class="timeline-container">
                {displayEvents.map((event, index) => (
                    <div key={event.id} class="timeline-item">
                        <div class={`timeline-marker ${index === 0 ? 'primary' : ''}`}></div>
                        <div class="bento-card" style={{ padding: 'var(--space-200)', gap: 'var(--space-100)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-subtle)', fontWeight: 600, fontSize: '0.875rem' }}>
                                    {event.startTime > 100000 ? `${formatTime(event.startTime)} - ${formatTime(event.endTime)}` : '09:00 - 10:30'}
                                </span>
                                {(event as any).category && <span class="badge badge-default">{(event as any).category}</span>}
                            </div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--text-main)', marginTop: 'var(--space-050)' }}>{event.title}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-100)', color: 'var(--text-subtle)', fontSize: '0.875rem', marginTop: 'var(--space-050)' }}>
                                <i class="bi bi-geo-alt"></i>
                                <span>{event.location}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
