import { News, NewsCategory } from '@19nsj/schema';
import { useState } from 'preact/hooks';

interface Props {
    isSyncing: boolean;
    syncProgress: number;
    newsList: News[];
    lastSyncText: string;
    onSync: () => Promise<void>;
}

export function NewsView({ isSyncing, syncProgress, newsList, lastSyncText, onSync }: Props) {
    const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'ALL'>('ALL');

    const getCategoryBadge = (category: NewsCategory) => {
        switch (category) {
            case NewsCategory.SAFETY:
                return <span class="badge badge-danger">緊急・安全</span>;
            case NewsCategory.PROGRAM:
                return <span class="badge badge-primary">プログラム</span>;
            case NewsCategory.TRANSPORT:
                return <span class="badge badge-warning">交通・移動</span>;
            case NewsCategory.ANNOUNCEMENT:
                return <span class="badge badge-success">お知らせ</span>;
            default:
                return null;
        }
    };

    const categories = [
        { id: 'ALL', label: 'すべて' },
        { id: NewsCategory.SAFETY, label: '緊急・安全' },
        { id: NewsCategory.PROGRAM, label: 'プログラム' },
        { id: NewsCategory.ANNOUNCEMENT, label: 'お知らせ' },
    ];

    const filteredNews = selectedCategory === 'ALL' 
        ? newsList 
        : newsList.filter(n => n.category === selectedCategory);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-300)' }}>
            {/* Sync Status Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>News</h2>
                <button class="btn btn-default" onClick={onSync} disabled={isSyncing}>
                    {isSyncing ? <i class="bi bi-hourglass-split"></i> : <i class="bi bi-arrow-repeat"></i>} Sync
                </button>
            </div>

            {/* Sync Progress Bar */}
            <div class="progress-bar" style={{ opacity: isSyncing ? 1 : 0 }}>
                <div class="progress-fill" style={{ width: `${syncProgress}%`, background: 'var(--color-primary)', boxShadow: '0 0 10px var(--color-primary)' }}></div>
            </div>

            {/* Category Chips */}
            <div class="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', gap: 'var(--space-100)', paddingBottom: 'var(--space-050)' }}>
                {categories.map(c => (
                    <button 
                        key={c.id} 
                        class={`chip ${selectedCategory === c.id ? 'active' : 'inactive'}`}
                        onClick={() => setSelectedCategory(c.id as any)}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {/* News List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-200)' }}>
                {filteredNews.length > 0 ? (
                    filteredNews.map(news => (
                        <article key={news.id} style={{ paddingBottom: 'var(--space-200)', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-100)', marginBottom: 'var(--space-050)' }}>
                                <span class="text-caption">{new Date(news.createdAt).toLocaleString()}</span>
                                {getCategoryBadge(news.category)}
                            </div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4 }}>{news.title}</h3>
                        </article>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: 'var(--space-400) 0', color: 'var(--text-subtle)' }}>
                        <i class="bi bi-inbox" style={{ fontSize: '2rem', marginBottom: 'var(--space-100)', display: 'block' }}></i>
                        {lastSyncText}
                    </div>
                )}
            </div>
        </div>
    );
}
