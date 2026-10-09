import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { io } from 'socket.io-client';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon missing issue in React Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const BACKEND_URL = "https://mtf-backend.onrender.com";

function App() {
  const [locations, setLocations] = useState({});

  useEffect(() => {
    // Fetch initial positions
    axios.get(`${BACKEND_URL}/api/locations`)
      .then((response) => {
        const initialMap = {};
        response.data.forEach((loc) => {
          initialMap[loc.device_id] = loc;
        });
        setLocations(initialMap);
      })
      .catch((err) => console.error("Error fetching locations:", err));

    // Listen to real-time WebSockets
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('locationUpdate', (data) => {
      setLocations((prev) => ({
        ...prev,
        [data.deviceId]: {
          device_id: data.deviceId,
          latitude: data.latitude,
          longitude: data.longitude,
          created_at: new Date().toISOString()
        }
      }));
    });

    return () => socket.disconnect();
  }, []);

  const deviceList = Object.values(locations);
  const defaultCenter = deviceList.length > 0 
    ? [deviceList[0].latitude, deviceList[0].longitude] 
    : [20.5937, 78.9629];

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <header style={{
        position: 'absolute',
        top: 10,
        left: 50,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '10px 20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ margin: 0 }}>MTF Live Tracking Dashboard</h2>
        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
          Active Devices: {deviceList.length}
        </p>
      </header>

      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {deviceList.map((dev) => (
          <Marker key={dev.device_id} position={[dev.latitude, dev.longitude]}>
            <Popup>
              <strong>Device:</strong> {dev.device_id}<br />
              <strong>Lat:</strong> {dev.latitude}<br />
              <strong>Lng:</strong> {dev.longitude}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default App;