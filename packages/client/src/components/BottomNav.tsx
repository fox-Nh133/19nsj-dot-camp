import type { ViewType } from '../App';

interface Props {
    currentView: ViewType;
    onViewChange: (v: ViewType) => void;
}

export function BottomNav({ currentView, onViewChange }: Props) {
    const navs: { id: ViewType; icon: string; label: string }[] = [
        { id: 'home', icon: 'bi-house-fill', label: 'Home' },
        { id: 'news', icon: 'bi-newspaper', label: 'News' },
        { id: 'map', icon: 'bi-map', label: 'Map' },
        { id: 'schedule', icon: 'bi-calendar3', label: 'Schedule' }
    ];

    return (
        <nav class="bottom-nav">
            {navs.map(nav => (
                <button 
                    key={nav.id}
                    class={`nav-item ${currentView === nav.id ? 'active' : ''}`}
                    onClick={() => onViewChange(nav.id)}
                >
                    <i class={`bi ${nav.icon}`}></i>
                    <span>{nav.label}</span>
                </button>
            ))}
        </nav>
    );
}
