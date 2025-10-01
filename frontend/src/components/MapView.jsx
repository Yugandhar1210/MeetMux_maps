import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"; // add useMap
import L from "leaflet";
import useSocket from "../hooks/useSocket";
import { eventsApi, authApi, usersApi, connectionsApi } from "../utils/api";
import "leaflet/dist/leaflet.css";
import BottomSheet from "../components/BottomSheet";

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

// Add this helper component to capture map instance
function MapController({ setMap }) {
  const map = useMap();

  useEffect(() => {
    if (map) {
      setMap(map);
    }
  }, [map, setMap]);

  return null;
}

export default function MapView() {
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [filter, setFilter] = useState("all"); // all | live | connections
  const [connections, setConnections] = useState([]); // store user objects
  const [connectionIds, setConnectionIds] = useState(new Set()); // fast lookup
  const [activity, setActivity] = useState(""); // optional activity filter
  const [meId, setMeId] = useState(null);
  const [map, setMap] = useState(null); // NEW: hold map instance
  const [selfPos, setSelfPos] = useState(null);
  const [mode, setMode] = useState("people");
  const [peopleFilters, setPeopleFilters] = useState({
    activity: "", // interest type
    show: "all", // all | online | connections
    heatmap: false,
  });
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    type: "",
    createdBy: "all",
    timeOfDay: "",
    dateRange: "",
    heatmap: false,
  });
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    activityType: "",
    startsAt: "",
    endsAt: "",
    lat: "",
    lng: "",
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const socket = useSocket();
  const [heatmap, setHeatmap] = useState(false);
  const [connectionsList, setConnectionsList] = useState([]);

  // Initial fetch: nearby users + connections + profile
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return setNeedsAuth(true);

        const meRes = await authApi.me();
        const meObj = meRes.data?.user || meRes.data;
        setMe(meObj);
        setMeId(meObj?._id || null);

        const plat = Number(meObj?.location?.lat);
        const plng = Number(meObj?.location?.lng);
        if (Number.isFinite(plat) && Number.isFinite(plng))
          setSelfPos({ lat: plat, lng: plng });

        const near = await usersApi.nearby({
          lat: 17.6868,
          lng: 83.2185,
          radius: 3000,
        });
        setUsers(Array.isArray(near.data) ? near.data : []);

        // handle 404 gracefully
        try {
          const cons = await connectionsApi.listConnections();
          const list = Array.isArray(cons.data) ? cons.data : [];
          setConnections(list);
          setConnectionIds(new Set(list.map((u) => u?._id).filter(Boolean)));
        } catch {}
      } catch (e) {
        if (e?.response?.status === 401) setNeedsAuth(true);
        else console.error(e);
      }
    })();
  }, []);

  // Load connections when component mounts
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const res = await connectionsApi.listConnections();
        setConnectionsList(res.data || []);
      } catch (error) {
        console.error("Failed to load connections:", error);
      }
    };

    loadConnections();
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

  // compute filtered users per peopleFilters
  const filteredUsers = useMemo(() => {
    let list = users
      .map((u) => {
        const lat = Number(u.location?.lat ?? u.lat);
        const lng = Number(u.location?.lng ?? u.lng);
        return { ...u, lat, lng };
      })
      .filter((u) => Number.isFinite(u.lat) && Number.isFinite(u.lng));

    if (peopleFilters.activity) {
      list = list.filter(
        (u) =>
          Array.isArray(u.interests) &&
          u.interests.includes(peopleFilters.activity)
      );
    }
    if (peopleFilters.show === "online") {
      list = list.filter((u) => u.isOnline || u.status === "online");
    } else if (peopleFilters.show === "connections") {
      list = list.filter((u) => connectionIds.has(u._id));
    }
    return list;
  }, [users, peopleFilters, connectionIds]);

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
      alert(e?.response?.data?.message || "Failed to send request");
    }
  };

  // NEW: relocate handler - FIXED VERSION
  const relocateToUser = () => {
    const lat = Number(me?.location?.lat);
    const lng = Number(me?.location?.lng);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setSelfPos({ lat, lng });
      if (map) {
        map.flyTo([lat, lng], 15, { duration: 0.75 });
      }
      return;
    }

    // If no saved location, get current geolocation
    if (!("geolocation" in navigator)) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos = { lat: latitude, lng: longitude };

        setSelfPos(newPos);

        // Update map view
        if (map) {
          map.flyTo([latitude, longitude], 15, { duration: 0.75 });
        }

        // Update user profile with new location
        try {
          await usersApi.updateProfile({
            location: { lat: latitude, lng: longitude },
          });

          // Update local me state
          setMe((prev) => ({
            ...prev,
            location: { lat: latitude, lng: longitude },
          }));

          console.log("Location updated successfully");
        } catch (e) {
          console.error("Failed to update location:", e);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(
          "Unable to get your location. Please check your browser permissions."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const DEFAULT_EVENTS_CENTER = { lat: 12.9539456, lng: 77.4661253 }; // Bangalore

  // fetch events when filters change (in events mode)
  useEffect(() => {
    (async () => {
      if (mode !== "events") return;
      try {
        const lat = Number(me?.location?.lat);
        const lng = Number(me?.location?.lng);

        // Build only supported params; do NOT send createdBy: "all"
        const params = {};
        if (filters.type) params.activityType = filters.type; // backend usually expects 'activityType'
        if (filters.createdBy === "connections")
          params.createdBy = "connections";
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          params.lat = lat;
          params.lng = lng;
          params.radius = 20000; // 20km
        } else {
          params.lat = DEFAULT_EVENTS_CENTER.lat;
          params.lng = DEFAULT_EVENTS_CENTER.lng;
          params.radius = 20000;
        }

        let res = await eventsApi.list(params);
        const payload1 = res?.data;
        let list = Array.isArray(payload1)
          ? payload1
          : Array.isArray(payload1?.data)
          ? payload1.data
          : Array.isArray(payload1?.events)
          ? payload1.events
          : Array.isArray(payload1?.items)
          ? payload1.items
          : [];

        // Fallback: if empty, try without any params (some backends ignore/over-filter queries)
        if (list.length === 0) {
          const res2 = await eventsApi.list();
          const payload2 = res2?.data;
          list = Array.isArray(payload2)
            ? payload2
            : Array.isArray(payload2?.data)
            ? payload2.data
            : Array.isArray(payload2?.events)
            ? payload2.events
            : Array.isArray(payload2?.items)
            ? payload2.items
            : [];
        }

        console.log("Events fetched:", list.length, list[0]);
        setEvents(list);
      } catch (e) {
        console.error("Failed to fetch events:", e);
      }
    })();
  }, [
    mode,
    filters.type,
    filters.createdBy, // exclude time/date; handled client-side
    me?.location?.lat,
    me?.location?.lng,
  ]);

  // create event
  const onCreateEvent = async () => {
    try {
      const body = {
        name: draft.name,
        activityType: draft.activityType,
        description: "",
        startsAt: draft.startsAt,
        endsAt: draft.endsAt,
        location: {
          lat: Number(draft.lat || me?.location?.lat),
          lng: Number(draft.lng || me?.location?.lng),
        },
      };
      await eventsApi.create(body);
      setCreating(false);
      setDraft({
        name: "",
        activityType: "",
        startsAt: "",
        endsAt: "",
        lat: "",
        lng: "",
      });
      // refresh list
      const res = await eventsApi.list({
        lat: me?.location?.lat,
        lng: me?.location?.lng,
        radius: 5000,
        createdBy: filters.createdBy,
      });
      setEvents(res.data || []);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to create activity");
    }
  };

  // Add this filtering logic where you filter events
  const filteredEvents = events.filter((ev) => {
    // Filter by creator
    if (filters.createdBy === "connections") {
      // Check if event creator is in user's connections
      const creatorId = ev.createdBy?._id || ev.createdBy;
      const isConnection = connections.some(
        (conn) => (conn._id || conn.id) === creatorId
      );
      if (!isConnection) return false;
    }

    // Filter by type
    if (filters.type && ev.activityType !== filters.type) return false;

    // Filter by time of day
    if (filters.timeOfDay) {
      const startTime = new Date(ev.startsAt);
      const hour = startTime.getHours();

      switch (filters.timeOfDay) {
        case "morning":
          if (hour < 6 || hour >= 12) return false;
          break;
        case "afternoon":
          if (hour < 12 || hour >= 17) return false;
          break;
        case "evening":
          if (hour < 17 || hour >= 21) return false;
          break;
        case "night":
          if (hour < 21 && hour >= 6) return false;
          break;
      }
    }

    // Filter by date range
    if (filters.dateRange) {
      const startDate = new Date(ev.startsAt);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      switch (filters.dateRange) {
        case "today":
          if (startDate.toDateString() !== today.toDateString()) return false;
          break;
        case "tomorrow":
          if (startDate.toDateString() !== tomorrow.toDateString())
            return false;
          break;
        case "weekend":
          const dayOfWeek = startDate.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) return false; // 0 = Sunday, 6 = Saturday
          break;
        case "nextweek":
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          if (startDate > nextWeek) return false;
          break;
      }
    }

    return true;
  });

  // Helper: is current user in event participants (or the creator)
  const isJoined = (ev) => {
    const myId = me?._id || me?.id;
    if (!myId) return false;

    const creatorId =
      ev.createdBy?._id || ev.createdBy || ev.creator?._id || ev.creator?.id;
    if (creatorId && creatorId === myId) return true;

    if (Array.isArray(ev.participants)) {
      return ev.participants.some((p) => {
        const pid = p?._id || p?.id || p;
        return pid === myId;
      });
    }
    return false;
  };

  // marker palette
  const colorForPerson = (id) => {
    if (!id) return "#2563eb";
    if (id === meId) return "#ff0000ff"; // me: red
    return connectionIds.has(id) ? "#16a34a" : "#2563eb"; // connections green, others blue
  };

  // events legend + map render
  return (
    <div className="relative h-[calc(100vh-56px)] w-full">
      {/* Legend - moved to bottom right */}
      <div className="map-legend">
        {mode === "people" ? (
          <>
            <span className="legend-item">
              <span
                className="legend-dot"
                style={{ background: "#ff0000ff" }}
              ></span>
              <span className="legend-text">You</span>
            </span>
            <span className="legend-item">
              <span
                className="legend-dot"
                style={{ background: "#16a34a" }}
              ></span>
              <span className="legend-text">Connections</span>
            </span>
            <span className="legend-item">
              <span
                className="legend-dot"
                style={{ background: "#2563eb" }}
              ></span>
              <span className="legend-text">Others</span>
            </span>
          </>
        ) : (
          <>
            <span className="legend-item">
              <span
                className="legend-dot"
                style={{ background: "#f59e0b" }}
              ></span>
              <span className="legend-text">Events</span>
            </span>
            <span className="legend-item">
              <span
                className="legend-dot"
                style={{ background: "#fa15f2ff" }}
              ></span>
              <span className="legend-text">Joined</span>
            </span>
          </>
        )}
      </div>

      {/* Locate button - styled to match */}
      <button
        className="locate-button"
        onClick={relocateToUser}
        title="Find my location"
      >
        <span className="locate-icon">📍</span>
        <span>Locate me</span>
      </button>

      <MapContainer
        center={[12.9539456, 77.4661253]} // Bangalore center to see seeded events
        zoom={12} // valid zoom (Leaflet max ~19)
        className="h-full w-full"
      >
        <MapController setMap={setMap} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* NEW: your marker (red) */}
        {selfPos && (
          <Marker
            position={[selfPos.lat, selfPos.lng]}
            icon={avatarIcon(
              String(me?.name?.[0] || "Y").toUpperCase(),
              "#ff0000ff"
            )}
          >
            <Popup>
              <div className="font-medium">
                {me?.name || "You"}{" "}
                <span className="text-xs text-red-600">(You)</span>
              </div>
              <div className="text-xs text-gray-500">
                {Array.isArray(me?.interests) ? me.interests.join(", ") : ""}
              </div>
            </Popup>
          </Marker>
        )}

        {/* people markers or heatmap */}
        {mode === "people" &&
          !peopleFilters.heatmap &&
          filteredUsers
            .filter((u) => (u._id || u.userId) !== meId)
            .map((u) => {
              const id = u._id || u.userId;
              const color =
                id === meId
                  ? "#ff0000ff"
                  : connectionIds.has(id)
                  ? "#16a34a"
                  : "#2563eb";
              const label = String((u.name || "U")[0]).toUpperCase();
              return (
                <Marker
                  key={id}
                  position={[u.lat, u.lng]}
                  icon={avatarIcon(label, color)}
                >
                  <Popup>
                    <div className="font-medium">
                      {u.name}{" "}
                      {connectionIds.has(id) && (
                        <span className="text-xs text-green-600">
                          • Connection
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(u.interests || []).join(", ")}
                    </div>
                    {!connectionIds.has(id) && id !== meId && (
                      <button
                        className="mt-1 px-2 py-1 text-sm bg-blue-600 text-white rounded"
                        onClick={() => sendConnect(id)}
                      >
                        Connect
                      </button>
                    )}
                  </Popup>
                </Marker>
              );
            })}
        {mode === "people" && peopleFilters.heatmap && (
          <HeatmapLayer
            points={filteredUsers
              .map((u) => [u.lat, u.lng, 0.6])
              .filter((p) => p.every(Number.isFinite))}
          />
        )}

        {/* events mode markers or heatmap */}
        {mode === "events" &&
          !filters.heatmap &&
          filteredEvents.map((ev) => {
            const lat = Number(ev.location?.lat);
            const lng = Number(ev.location?.lng);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

            const joined = isJoined(ev);
            // joined = pink, default = orange
            const markerColor = joined ? "#fa15eeff" : "#f59e0b";

            // Use first letter of Activity Type
            const label = String(ev.activityType?.[0] || "E").toUpperCase();

            return (
              <Marker
                key={ev._id}
                position={[lat, lng]}
                icon={avatarIcon(label, markerColor)}
              >
                <Popup>
                  <div className="font-medium">{ev.name}</div>
                  <div className="text-xs text-gray-600">{ev.activityType}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(ev.startsAt).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    By {ev.createdBy?.name || ev.creator?.name || "Someone"} ·{" "}
                    {ev.participants?.length || 0}/{ev.capacity}
                  </div>

                  {/* If already joined, no join button */}
                  {!joined ? (
                    <div className="mt-2 flex gap-2">
                      <button
                        className="px-2 py-1 text-sm bg-blue-600 text-white rounded"
                        onClick={async () => {
                          try {
                            await eventsApi.join(ev._id);
                            alert("Joined");
                            // optionally refetch or update local state here
                          } catch (e) {
                            alert(e?.response?.data?.message || "Join failed");
                          }
                        }}
                      >
                        Join
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs font-medium text-yellow-700">
                      ✓ You joined this event
                    </div>
                  )}
                </Popup>
              </Marker>
            );
          })}
        {mode === "events" && filters.heatmap && (
          <HeatmapLayer
            points={events
              .map((ev) => [
                Number(ev.location?.lat),
                Number(ev.location?.lng),
                0.9,
              ])
              .filter((p) => p.every(Number.isFinite))}
          />
        )}

        {/* ...existing heatmap for people if applicable... */}
      </MapContainer>

      {/* Sidebar (was BottomSheet) */}
      <BottomSheet
        mode={mode}
        setMode={setMode}
        filters={filters}
        setFilters={setFilters}
        peopleFilters={peopleFilters}
        setPeopleFilters={setPeopleFilters}
        creating={creating}
        setCreating={setCreating}
        draft={draft}
        setDraft={setDraft}
        onCreateEvent={onCreateEvent}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
    </div>
  );
}
