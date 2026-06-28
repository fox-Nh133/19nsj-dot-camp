import { WeatherData, WeatherCode } from '@19nsj/schema';

interface Props {
    weather: WeatherData | null;
}

export function WeatherView({ weather }: Props) {
    const getWeatherName = (code: WeatherCode) => {
        switch (code) {
            case WeatherCode.CLEAR: return '晴れ';
            case WeatherCode.CLOUDY: return '曇り';
            case WeatherCode.RAIN: return '雨';
            case WeatherCode.HEAVY_RAIN: return '大雨';
            case WeatherCode.THUNDER: return '雷雨';
            default: return '不明';
        }
    };

    const getWeatherIcon = (code: WeatherCode) => {
        switch (code) {
            case WeatherCode.CLEAR: return 'bi-sun-fill';
            case WeatherCode.CLOUDY: return 'bi-clouds-fill';
            case WeatherCode.RAIN: return 'bi-cloud-rain-fill';
            case WeatherCode.HEAVY_RAIN: return 'bi-cloud-lightning-rain-fill';
            case WeatherCode.THUNDER: return 'bi-lightning-fill';
            default: return 'bi-cloud-fill';
        }
    };

    if (!weather || !weather.current) {
        return (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                <i class="bi bi-cloud-slash" style={{ fontSize: '2rem', marginBottom: '8px', display: 'block' }}></i>
                No weather data available. Please sync.
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-300)' }}>
            {/* Header Section */}
            <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: 'var(--space-050)' }}>天気予報</h2>
                <p class="text-subtle">ジャンボリー会場 (珠洲市) の気象情報</p>
            </div>

            {/* Severe Weather Alert (Example mock condition for HEAVY_RAIN) */}
            {weather.current.code === WeatherCode.HEAVY_RAIN && (
                <div style={{ background: 'var(--color-danger)', color: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--space-200)', display: 'flex', gap: 'var(--space-200)', alignItems: 'flex-start' }}>
                    <i class="bi bi-exclamation-triangle-fill" style={{ fontSize: '1.5rem', marginTop: '2px' }}></i>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-050)' }}>
                        <h3 style={{ fontWeight: 600, fontSize: '1.125rem', color: 'white' }}>大雨警戒アラート</h3>
                        <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>強い雨が予想されます。テントの設営状況を確認し、安全を確保してください。</p>
                    </div>
                </div>
            )}

            {/* Current Weather Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-200)' }}>
                <div class="bento-card" style={{ flexDirection: 'column', gap: 'var(--space-300)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-300)' }}>
                        <i class={`bi ${getWeatherIcon(weather.current.code)}`} style={{ fontSize: '5rem', color: 'var(--color-primary)' }}></i>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '4rem', fontWeight: 'bold', lineHeight: 1, color: 'var(--text-main)' }}>
                                {(weather.current.temp / 10).toFixed(0)}°
                            </span>
                            <span style={{ fontSize: '1.25rem', color: 'var(--text-subtle)', marginTop: 'var(--space-100)' }}>
                                {getWeatherName(weather.current.code)}
                            </span>
                        </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-200)' }}>
                        <div class="bento-card-small">
                            <i class="bi bi-droplet-half" style={{ color: 'var(--text-subtle)', fontSize: '1.25rem' }}></i>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span class="text-caption">湿度</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{weather.current.humidity}%</span>
                            </div>
                        </div>
                        <div class="bento-card-small">
                            <i class="bi bi-wind" style={{ color: 'var(--text-subtle)', fontSize: '1.25rem' }}></i>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span class="text-caption">風速</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{(weather.current.windSpeed / 10).toFixed(1)}m/s</span>
                            </div>
                        </div>
                        <div class="bento-card-small">
                            <i class="bi bi-cloud-rain" style={{ color: 'var(--text-subtle)', fontSize: '1.25rem' }}></i>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span class="text-caption">降水確率</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{weather.tomorrow?.pop ?? 0}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 24 Hour Forecast */}
            {weather.hourly && weather.hourly.temps.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-100)' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)' }}>24時間予報</h3>
                    <div class="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', gap: 'var(--space-100)', paddingBottom: 'var(--space-100)' }}>
                        {weather.hourly.temps.map((temp, i) => (
                            <div key={i} class="bento-card" style={{ flexShrink: 0, width: '80px', padding: 'var(--space-100)', alignItems: 'center', gap: 'var(--space-100)' }}>
                                <span class="text-caption">{i === 0 ? '現在' : `+${i}h`}</span>
                                <i class={`bi ${getWeatherIcon(weather.hourly!.codes[i])}`} style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}></i>
                                <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-main)' }}>{(temp / 10).toFixed(0)}°</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
