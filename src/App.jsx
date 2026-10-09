import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { io } from 'socket.io-client';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Helper component to smoothly re-center the map when device updates
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

function App() {
  const [locations, setLocations] = useState({});

  useEffect(() => {
    // 1. Fetch existing locations on load
    axios.get(`${BACKEND_URL}/api/locations`)
      .then((response) => {
        const initialMap = {};
        const data = response.data;

        // Handle both array and object responses from backend
        const list = Array.isArray(data) ? data : (data.locations || []);
        
        list.forEach((loc) => {
          const devId = loc.device_id || loc.deviceId;
          if (devId) {
            initialMap[devId] = {
              device_id: devId,
              latitude: parseFloat(loc.latitude),
              longitude: parseFloat(loc.longitude)
            };
          }
        });
        setLocations(initialMap);
      })
      .catch((err) => console.error("Error fetching locations:", err));

    // 2. Connect to Socket.IO
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log("Connected to Backend Socket at:", BACKEND_URL);
    });

    // Handle incoming socket updates
    socket.on('locationUpdate', (data) => {
      console.log("Received live location data:", data);
      const devId = data.device_id || data.deviceId;
      
      if (devId) {
        setLocations((prev) => ({
          ...prev,
          [devId]: {
            device_id: devId,
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude)
          }
        }));
      }
    });

    return () => socket.disconnect();
  }, []);

  const deviceList = Object.values(locations);
  
  // Set center dynamically to first device location, or fallback
  const mapCenter = deviceList.length > 0 
    ? [deviceList[0].latitude, deviceList[0].longitude] 
    : [37.422, -122.084]; // Default to Palo Alto / Emulator coordinates

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <header style={{
        position: 'absolute',
        top: 10,
        left: 50,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '10px 20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>MTF Live Tracking Dashboard</h2>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#333', fontWeight: 'bold' }}>
          Active Devices: {deviceList.length}
        </p>
      </header>

      <MapContainer 
        center={mapCenter} 
        zoom={13} 
        style={{ width: '100%', height: '100%' }}
      >
        <RecenterMap center={mapCenter} />
        
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