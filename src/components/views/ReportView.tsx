import { useState, useEffect } from 'preact/hooks';
import { getDraft, saveDraft } from '../../../src/modules/db';

export function ReportView() {
    const [draft, setDraft] = useState('');
    const [saveStatus, setSaveStatus] = useState('Draft empty');

    useEffect(() => {
        getDraft().then(val => {
            if (val) {
                setDraft(val);
                setSaveStatus('Loaded from IDB');
            }
        });
    }, []);

    const handleInput = (e: Event) => {
        const val = (e.target as HTMLTextAreaElement).value;
        setDraft(val);
        saveDraft(val).then(() => {
            setSaveStatus('Saved to IDB');
            setTimeout(() => setSaveStatus('Draft saved'), 2000);
        });
    };

    return (
        <div class="form-container">
            <h2><i class="bi bi-pencil-square"></i> Offline Report</h2>
            <textarea 
                value={draft}
                onInput={handleInput}
                placeholder="Draft your report here. It auto-saves to IndexedDB." 
                class="glass-input"
            ></textarea>
            <div class="form-actions">
                <span class="status-text">{saveStatus}</span>
                <button class="btn secondary"><i class="bi bi-send-fill"></i> Submit</button>
            </div>
        </div>
    );
}
