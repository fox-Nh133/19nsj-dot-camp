import { useState, useEffect } from 'preact/hooks';
import { getSetting, saveSetting } from '../../modules/db';

interface Props {
    onBack: () => void;
}

export function SettingsView({ onBack }: Props) {
    const [apiEndpoint, setApiEndpoint] = useState('http://localhost:8787/api/v1/sync.bin');
    const [gpsHighAccuracy, setGpsHighAccuracy] = useState('standard'); // 'eco', 'standard', 'high'
    const [loraKiosk, setLoraKiosk] = useState(false);
    const [pushNotif, setPushNotif] = useState(true);
    const [saveStatus, setSaveStatus] = useState('');

    useEffect(() => {
        getSetting('api_endpoint').then(val => {
            if (val) setApiEndpoint(val);
        });
        getSetting('gps_accuracy').then(val => {
            if (val) setGpsHighAccuracy(val);
        });
        getSetting('lora_kiosk').then(val => {
            if (val) setLoraKiosk(val === 'true');
        });
        getSetting('push_notif').then(val => {
            if (val) setPushNotif(val === 'true');
        });
    }, []);

    const triggerSaveStatus = () => {
        setSaveStatus('Settings auto-saved');
        setTimeout(() => setSaveStatus(''), 2000);
    };

    const handleSaveEndpoint = (e: Event) => {
        const val = (e.target as HTMLInputElement).value;
        setApiEndpoint(val);
        saveSetting('api_endpoint', val).then(triggerSaveStatus);
    };

    const handleToggleLora = () => {
        const nextVal = !loraKiosk;
        setLoraKiosk(nextVal);
        saveSetting('lora_kiosk', String(nextVal)).then(triggerSaveStatus);
    };

    const handleTogglePush = () => {
        const nextVal = !pushNotif;
        setPushNotif(nextVal);
        saveSetting('push_notif', String(nextVal)).then(triggerSaveStatus);
    };

    const handleGpsChange = (mode: string) => {
        setGpsHighAccuracy(mode);
        saveSetting('gps_accuracy', mode).then(triggerSaveStatus);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-base)' }}>
            {/* Custom Header */}
            <header style={{
                position: 'fixed', top: 0, left: 0, right: 0, height: '64px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 var(--space-200)', background: 'var(--surface)',
                borderBottom: '1px solid var(--border-color)', zIndex: 100
            }}>
                <button class="btn btn-subtle" onClick={onBack} style={{ padding: 'var(--space-100)', height: '40px', width: '40px', borderRadius: '50%', fontSize: '1.5rem' }}>
                    <i class="bi bi-arrow-left"></i>
                </button>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>設定</h1>
                <button class="btn btn-subtle" style={{ padding: 'var(--space-100)', height: '40px', width: '40px', borderRadius: '50%', fontSize: '1.25rem' }}>
                    <i class="bi bi-gear-fill"></i>
                </button>
            </header>

            <div style={{ padding: '80px var(--space-200) 100px', display: 'flex', flexDirection: 'column', gap: 'var(--space-400)' }}>
                
                {/* Data Sync Section */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-100)' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>データ同期 (Data Sync)</h2>
                    <div class="bento-card" style={{ gap: 'var(--space-300)' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: 'var(--space-100)', fontWeight: 600 }}>Sync Endpoint (同期先URL)</label>
                            <input 
                                type="text" 
                                value={apiEndpoint} 
                                onInput={handleSaveEndpoint}
                                placeholder="https://api.19nsj.scout.or.jp/v1/sync"
                                style={{
                                    width: '100%', padding: 'var(--space-100) var(--space-200)', background: 'var(--surface)',
                                    border: '2px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
                                    color: 'var(--text-main)', fontSize: '0.875rem', transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = 'var(--border-color)'}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-200)' }}>
                            <div>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>Local LoRa Kiosk Mode</h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Switch to offline mesh network sync</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked={loraKiosk} onChange={handleToggleLora} />
                                <span class="toggle-slider primary"></span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-200)' }}>
                            <div>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>Manual Sync (手動同期)</h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Last synced: 10 mins ago</p>
                            </div>
                            <button class="btn btn-default" style={{ fontSize: '0.875rem' }}>
                                <i class="bi bi-arrow-repeat"></i> Sync Now
                            </button>
                        </div>
                    </div>
                </section>

                {/* Location Section */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-100)' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>位置情報設定 (Location)</h2>
                    <div class="bento-card" style={{ gap: 'var(--space-200)' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-subtle)', lineHeight: 1.4 }}>
                            Adjust GPS polling frequency based on your activity and battery needs.
                        </p>
                        <div>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 'var(--space-100)' }}>GPS Precision (GPS精度)</h3>
                            <div class="segment-control">
                                <button 
                                    class={`segment-btn ${gpsHighAccuracy === 'eco' ? 'active-solid' : ''}`}
                                    onClick={() => handleGpsChange('eco')}
                                >節電優先</button>
                                <button 
                                    class={`segment-btn ${gpsHighAccuracy === 'standard' ? 'active-solid' : ''}`}
                                    onClick={() => handleGpsChange('standard')}
                                >標準</button>
                                <button 
                                    class={`segment-btn ${gpsHighAccuracy === 'high' ? 'active-solid' : ''}`}
                                    onClick={() => handleGpsChange('high')}
                                >高精度</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Notifications Section */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-100)' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>通知設定 (Notifications)</h2>
                    <div class="bento-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>プッシュ通知の有効化</h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>重要なアップデートや緊急情報を通知します</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked={pushNotif} onChange={handleTogglePush} />
                                <span class="toggle-slider primary"></span>
                            </label>
                        </div>
                    </div>
                </section>
            </div>

            {/* Save Status Toast */}
            {saveStatus && (
                <div style={{
                    position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--text-main)', color: 'white', padding: 'var(--space-100) var(--space-300)',
                    borderRadius: '24px', fontSize: '0.875rem', zIndex: 2000, boxShadow: 'var(--elevation-overlay)',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <i class="bi bi-check-circle" style={{ marginRight: '8px' }}></i>{saveStatus}
                </div>
            )}
        </div>
    );
}
