import { useEffect, useRef } from 'preact/hooks';
import L from 'leaflet';

export function MapView({ isActive }: { isActive: boolean }) {
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    useEffect(() => {
        if (!isActive || mapRef.current) return;

        // Initialize Map only when view becomes active
        const map = L.map('map-container').setView([35.6895, 139.6917], 15);
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19
        }).addTo(map);

        const myIcon = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 5px rgba(0,0,0,0.5);'></div>",
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        if ('geolocation' in navigator) {
            navigator.geolocation.watchPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                const latlng = new L.LatLng(latitude, longitude);
                
                if (!markerRef.current && mapRef.current) {
                    markerRef.current = L.marker(latlng, { icon: myIcon }).addTo(map)
                        .bindPopup('You are here (GPS)')
                        .openPopup();
                    map.setView(latlng, 16);
                } else if (markerRef.current) {
                    markerRef.current.setLatLng(latlng);
                }
            }, (err) => {
                console.warn('Geo err:', err);
            }, { enableHighAccuracy: true });
        }
        
    }, [isActive]);

    return <div id="map-container"></div>;
}
