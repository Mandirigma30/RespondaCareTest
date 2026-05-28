"use client";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icon issue in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const colorMap: Record<string, string> = {
  critical: "#e53e3e",
  high: "#ed8936",
  medium: "#ecc94b",
  low: "#718096",
};

interface Incident {
  id: string;
  label: string;
  type: string;
  lat: number;
  lng: number;
  icon: string;
}

interface MapViewProps {
  incidents: Incident[];
}

export default function MapView({ incidents }: MapViewProps) {
  const center: [number, number] = [14.601, 120.983];

  return (
    <MapContainer
      center={center}
      zoom={15}
      className="w-full h-full"
      style={{ background: "#1a1d23", minHeight: "calc(100vh - 65px)" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="map-dark"
      />
      {incidents.map((inc) => {
        const color = colorMap[inc.type] ?? "#8b1a1a";
        const customIcon = L.divIcon({
          html: `<div style="
            width:42px;height:42px;
            background:${color};
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:18px;
            border:2px solid rgba(255,255,255,0.3);
            box-shadow:0 0 12px ${color}66;
          ">${inc.icon}</div>`,
          iconSize: [42, 42],
          iconAnchor: [21, 21],
          className: "",
        });

        return (
          <Marker key={inc.id} position={[inc.lat, inc.lng]} icon={customIcon}>
            <Popup>
              <div className="text-sm font-semibold">{inc.label}</div>
              <div className="text-xs text-gray-500">{inc.id}</div>
            </Popup>
            {inc.type === "critical" && (
              <Circle
                center={[inc.lat, inc.lng]}
                radius={80}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.08, weight: 1 }}
              />
            )}
          </Marker>
        );
      })}
    </MapContainer>
  );
}
