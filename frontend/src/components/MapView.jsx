import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import useSocket from "../hooks/useSocket";
import { authApi, usersApi, connectionsApi } from "../utils/api";
import "leaflet/dist/leaflet.css";

// Simple avatar-like DivIcon (uses first letter)
function avatarIcon(label = "U", color = "#2563eb") {
  return L.divIcon({
    className: "",
    html: `
      <div style="width:32px;height:32px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);">
        ${label}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function HeatmapLayer({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    let heatLayer;
    let cancelled = false;

    (async () => {
      try {
        await import("leaflet.heat");
        if (cancelled) return;
        const valid = Array.isArray(points)
          ? points.filter(
              (p) =>
                p &&
                p.length >= 2 &&
                Number.isFinite(p[0]) &&
                Number.isFinite(p[1])
            )
          : [];
        if (valid.length) {
          heatLayer = L.heatLayer(valid, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
          });
          heatLayer.addTo(map);
        }
      } catch (err) {
        console.error("Failed to load leaflet.heat", err);
      }
    })();

    return () => {
      cancelled = true;
      if (heatLayer) map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

export default function MapView() {
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [filter, setFilter] = useState("all"); // all | live | connections
  const [connections, setConnections] = useState([]);
  const [activity, setActivity] = useState(""); // optional activity filter
  const [meId, setMeId] = useState(null);
  const socket = useSocket();
  const [heatmap, setHeatmap] = useState(false);

  // Initial fetch: nearby users + connections
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setNeedsAuth(true);
          return;
        }
        const meRes = await authApi.me();
        setMe(meRes.data || null);

        const [near, cons] = await Promise.all([
          usersApi.nearby({ lat: 17.6868, lng: 83.2185, radius: 3000 }),
          connectionsApi.listConnections(),
        ]);
        setUsers(Array.isArray(near.data) ? near.data : []);
        setConnections(
          cons.data?.map((c) => c.requester?._id || c.receiver?._id) || []
        );
      } catch (e) {
        if (e?.response?.status === 401) {
          setNeedsAuth(true);
        } else {
          console.error(e);
        }
      }
    })();
  }, []);

  // Live updates via socket
  useEffect(() => {
    if (!socket) return;
    const onLoc = (data) => {
      setUsers((prev) => {
        const idx = prev.findIndex(
          (u) => (u._id || u.userId) === (data.userId || data._id)
        );
        const base = {
          ...(idx >= 0 ? prev[idx] : {}),
          _id: data.userId || data._id,
          lat: data.lat,
          lng: data.lng,
          isOnline: true,
        };
        const arr = [...prev];
        if (idx >= 0) arr[idx] = base;
        else arr.push(base);
        return arr;
      });
    };
    socket.on("location-update", onLoc);
    return () => socket.off("location-update", onLoc);
  }, [socket]);

  const filteredUsers = useMemo(() => {
    let list = users
      .map((u) => {
        const lat = Number(u.location?.lat ?? u.lat);
        const lng = Number(u.location?.lng ?? u.lng);
        return { ...u, lat, lng };
      })
      .filter((u) => Number.isFinite(u.lat) && Number.isFinite(u.lng));

    if (activity)
      list = list.filter(
        (u) => Array.isArray(u.interests) && u.interests.includes(activity)
      );
    if (filter === "live")
      list = list.filter((u) => u.isOnline || u.status === "online");
    else if (filter === "connections")
      list = list.filter((u) => connections.includes(u._id));
    return list;
  }, [users, filter, activity, connections]);

  const meLat = Number(me?.location?.lat);
  const meLng = Number(me?.location?.lng);
  const showMe = Number.isFinite(meLat) && Number.isFinite(meLng);

  const heatPoints = useMemo(
    () => filteredUsers.map((u) => [u.lat, u.lng, 0.8]),
    [filteredUsers]
  );

  const sendConnect = async (targetId) => {
    try {
      await connectionsApi.sendRequest(targetId);
      alert("Request sent");
    } catch (e) {
      console.error(e);
      alert("Failed to send request");
    }
  };

  return (
    <div className="relative h-[calc(100vh-56px)] w-full">
      {needsAuth && (
        <div className="absolute z-[1100] inset-0 bg-white/80 backdrop-blur flex items-center justify-center">
          <div className="bg-white rounded shadow p-4 text-center">
            <div className="mb-2 font-medium">
              Please log in to view people on the map.
            </div>
            <div className="space-x-2">
              <a href="/login" className="px-3 py-2 border rounded">
                Login
              </a>
              <a href="/register" className="px-3 py-2 border rounded">
                Sign Up
              </a>
            </div>
          </div>
        </div>
      )}
      <div className="absolute z-[1000] top-4 left-4 bg-white rounded shadow px-3 py-2 space-x-2 flex items-center">
        <select
          className="border rounded px-2 py-1"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="live">Live</option>
          <option value="connections">Connections</option>
        </select>
        <select
          className="border rounded px-2 py-1"
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
        >
          <option value="">Any activity</option>
          <option>Sports</option>
          <option>Tech</option>
          <option>Food</option>
          <option>Travel</option>
          <option>Music</option>
        </select>
        <button
          className="px-2 py-1 border rounded"
          onClick={() => setHeatmap((h) => !h)}
        >
          {heatmap ? "Markers" : "Heatmap"}
        </button>
        <a className="px-2 py-1 border rounded" href="/profile">
          Profile
        </a>
        <a className="px-2 py-1 border rounded" href="/">
          Home
        </a>
      </div>

      <MapContainer
        center={[17.6868, 83.2185]}
        zoom={14}
        className="h-full w-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {showMe && (
          <Marker
            position={[meLat, meLng]}
            icon={avatarIcon(
              String((me?.name || "Y")[0]).toUpperCase(),
              "#16a34a"
            )}
          >
            <Popup>
              <div className="font-medium">
                {me?.name} <span className="text-xs text-green-600">(You)</span>
              </div>
              <div className="text-xs text-gray-500">
                {(me?.interests || []).join(", ")}
              </div>
            </Popup>
          </Marker>
        )}
        {!heatmap &&
          filteredUsers.map((u) => {
            const id = u._id || u.userId;
            const label = String((u.name || "U")[0]).toUpperCase();
            return (
              <Marker
                key={id}
                position={[u.lat, u.lng]}
                icon={avatarIcon(label, "#2563eb")}
              >
                <Popup>
                  <div className="space-y-1">
                    <div className="font-medium">{u.name || id}</div>
                    <div className="text-xs text-gray-500">
                      {(u.interests || []).join(", ")}
                    </div>
                    <button
                      className="mt-1 px-2 py-1 text-sm bg-blue-600 text-white rounded"
                      onClick={() => sendConnect(id)}
                    >
                      Connect
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        {heatmap && (
          <HeatmapLayer
            points={filteredUsers.map((u) => [u.lat, u.lng, 0.8])}
          />
        )}
      </MapContainer>
    </div>
  );
}
