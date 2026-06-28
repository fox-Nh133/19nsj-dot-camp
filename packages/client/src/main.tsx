import { render } from 'preact';
import { App } from './App';
import './style.css';
import { setupDB } from './modules/db';

setupDB();

if ('serviceWorker' in navigator) {
    try {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('SW Registered'));
    } catch (e) {
        console.warn('SW Registration failed', e);
    }
}

render(<App />, document.getElementById('app')!);
