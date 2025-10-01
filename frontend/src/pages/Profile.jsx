import React, { useEffect, useMemo, useState } from "react";
import { authApi, usersApi, connectionsApi, eventsApi } from "../utils/api";

function formatDate(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return "";
  }
}

export default function Profile() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // Form state
  const [form, setForm] = useState({
    name: "",
    avatarUrl: "",
    bio: "",
    lat: "",
    lng: "",
  });
  const [interestsArr, setInterestsArr] = useState([]);
  const [interestInput, setInterestInput] = useState("");

  // Lists
  const [requests, setRequests] = useState([]);
  const [connectionsList, setConnectionsList] = useState([]);
  const [myEvents, setMyEvents] = useState({ created: [], joined: [] });

  // UI state
  const [saving, setSaving] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [reqAction, setReqAction] = useState({});
  const [leaving, setLeaving] = useState({});
  const [toast, setToast] = useState(null);

  const latValid = useMemo(
    () => form.lat === "" || !Number.isNaN(Number(form.lat)),
    [form.lat]
  );
  const lngValid = useMemo(
    () => form.lng === "" || !Number.isNaN(Number(form.lng)),
    [form.lng]
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await authApi.me();
        const data = res.data?.user || res.data;
        setMe(data);

        setForm({
          name: data?.name || "",
          avatarUrl: data?.avatarUrl || "",
          bio: data?.bio || "",
          lat: data?.location?.lat ?? "",
          lng: data?.location?.lng ?? "",
        });
        setInterestsArr(Array.isArray(data?.interests) ? data.interests : []);

        // Load data
        try {
          const [reqs, cons, events] = await Promise.all([
            connectionsApi.listRequests(),
            connectionsApi.listConnections(),
            eventsApi.mine(),
          ]);
          setRequests(reqs.data || []);
          setConnectionsList(cons.data || []);
          setMyEvents({
            created: events.data?.created || [],
            joined: events.data?.joined || [],
          });
        } catch {}
      } catch (e) {
        console.error(e);
        setToast({ type: "error", msg: "Failed to load profile" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const showToast = (t, msg) => {
    setToast({ type: t, msg });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 3000);
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!latValid || !lngValid) {
      showToast("error", "Please provide valid coordinates.");
      return;
    }
    setSaving(true);
    try {
      await usersApi.updateProfile({
        name: form.name,
        avatarUrl: form.avatarUrl,
        bio: form.bio,
        interests: interestsArr,
        location: {
          lat: form.lat === "" ? undefined : Number(form.lat),
          lng: form.lng === "" ? undefined : Number(form.lng),
        },
      });
      const res = await authApi.me();
      const data = res.data?.user || res.data;
      setMe(data);
      showToast("success", "Profile updated successfully!");
    } catch (e) {
      showToast("error", e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const addInterest = () => {
    const v = interestInput.trim();
    if (!v) return;
    if (!interestsArr.includes(v)) {
      setInterestsArr((a) => [...a, v]);
    }
    setInterestInput("");
  };

  const removeInterest = (i) => {
    setInterestsArr((a) => a.filter((x, idx) => idx !== i));
  };

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      showToast("error", "Geolocation not supported");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm((f) => ({
          ...f,
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6),
        }));
        try {
          await usersApi.updateProfile({
            location: { lat: latitude, lng: longitude },
          });
          showToast("success", "Location updated successfully!");
        } catch (e) {
          showToast(
            "error",
            e?.response?.data?.message || "Failed to update location"
          );
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
        showToast("error", "Unable to get your location");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const respond = async (requestId, action) => {
    setReqAction((m) => ({ ...m, [requestId]: action }));
    try {
      await connectionsApi.respondRequest({ requestId, action });
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
      if (action === "accept") {
        const cons = await connectionsApi.listConnections();
        setConnectionsList(cons.data || []);
      }
      showToast("success", `Request ${action}ed successfully!`);
    } catch (e) {
      showToast(
        "error",
        e?.response?.data?.message || "Failed to update request"
      );
    } finally {
      setReqAction((m) => {
        const x = { ...m };
        delete x[requestId];
        return x;
      });
    }
  };

  const leaveEvent = async (id) => {
    setLeaving((m) => ({ ...m, [id]: true }));
    try {
      await eventsApi.leave(id);
      const ev = await eventsApi.mine();
      setMyEvents({
        created: ev.data?.created || [],
        joined: ev.data?.joined || [],
      });
      showToast("success", "Left the activity successfully!");
    } catch (e) {
      showToast("error", e?.response?.data?.message || "Failed to leave");
    } finally {
      setLeaving((m) => {
        const x = { ...m };
        delete x[id];
        return x;
      });
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`toast ${
            toast.type === "success" ? "toast-success" : "toast-error"
          }`}
        >
          <span className="toast-icon">
            {toast.type === "success" ? "✅" : "❌"}
          </span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper">
            {form.avatarUrl ? (
              <img
                src={form.avatarUrl}
                alt={form.name || "Avatar"}
                className="profile-avatar-img"
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {String(form.name || "U")[0].toUpperCase()}
              </div>
            )}
            <div
              className={`profile-status ${
                me?.isOnline || me?.status === "online"
                  ? "status-online"
                  : "status-offline"
              }`}
              title={
                me?.isOnline || me?.status === "online" ? "Online" : "Offline"
              }
            />
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{me?.name || "Your Profile"}</h1>
            <p className="profile-email">{me?.email}</p>
            <div className="profile-interests">
              {interestsArr.slice(0, 3).map((interest, i) => (
                <span key={i} className="interest-chip">
                  {interest}
                </span>
              ))}
              {interestsArr.length > 3 && (
                <span className="interest-more">
                  +{interestsArr.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="profile-tabs">
        <div className="tab-buttons">
          {[
            { id: "profile", label: "Profile", icon: "👤" },
            {
              id: "connections",
              label: "Connections",
              icon: "🤝",
              count: connectionsList.length,
            },
            {
              id: "requests",
              label: "Requests",
              icon: "📨",
              count: requests.length,
            },
            {
              id: "activities",
              label: "Activities",
              icon: "🎯",
              count: myEvents.created.length + myEvents.joined.length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count > 0 && <span className="tab-count">{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {activeTab === "profile" && (
          <form onSubmit={onSave} className="profile-form">
            <h2 className="section-title">
              <span className="section-icon">✏️</span>
              Edit Profile
            </h2>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Avatar URL</label>
                <input
                  className="form-input"
                  value={form.avatarUrl}
                  onChange={(e) =>
                    setForm({ ...form, avatarUrl: e.target.value })
                  }
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="form-group form-group-wide">
                <label className="form-label">Bio</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell others about yourself..."
                />
              </div>

              {/* Interests */}
              <div className="form-group form-group-wide">
                <label className="form-label">Interests</label>
                <div className="interests-container">
                  {interestsArr.map((it, i) => (
                    <span key={`${it}-${i}`} className="interest-tag">
                      {it}
                      <button
                        type="button"
                        onClick={() => removeInterest(i)}
                        className="interest-remove"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  <div className="interest-input-group">
                    <input
                      className="interest-input"
                      placeholder="Add interest..."
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addInterest();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addInterest}
                      className="interest-add-btn"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input
                  className={`form-input ${
                    !latValid ? "form-input-error" : ""
                  }`}
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: e.target.value })}
                  placeholder="e.g., 17.6868"
                />
                {!latValid && (
                  <span className="form-error">Invalid latitude</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input
                  className={`form-input ${
                    !lngValid ? "form-input-error" : ""
                  }`}
                  value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: e.target.value })}
                  placeholder="e.g., 83.2185"
                />
                {!lngValid && (
                  <span className="form-error">Invalid longitude</span>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={saving}
                className={`btn-primary ${saving ? "btn-loading" : ""}`}
              >
                {saving ? (
                  <>
                    <span className="spinner"></span>
                    Saving...
                  </>
                ) : (
                  "💾 Save Profile"
                )}
              </button>
              <button
                type="button"
                onClick={useMyLocation}
                disabled={geoLoading}
                className={`btn-secondary ${geoLoading ? "btn-loading" : ""}`}
              >
                {geoLoading ? "📍 Locating..." : "📍 Use My Location"}
              </button>
            </div>
          </form>
        )}

        {activeTab === "connections" && (
          <div className="content-section">
            <h2 className="section-title">
              <span className="section-icon">🤝</span>
              Your Connections
              <span className="section-count">({connectionsList.length})</span>
            </h2>

            {connectionsList.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <p className="empty-text">No connections yet.</p>
                <p className="empty-subtext">
                  Start exploring to meet new people!
                </p>
              </div>
            ) : (
              <div className="connections-grid">
                {connectionsList.map((c) => {
                  const id = c?._id || c?.id || String(c);
                  const name = c?.name || c?.email || id;
                  const email = c?.email;
                  const avatar = c?.avatarUrl;
                  return (
                    <div key={id} className="connection-card">
                      <div className="connection-avatar">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={name}
                            className="connection-avatar-img"
                          />
                        ) : (
                          <div className="connection-avatar-placeholder">
                            {String(name)[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                      </div>
                      <div className="connection-info">
                        <div className="connection-name">{name}</div>
                        {email && (
                          <div className="connection-email">{email}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "requests" && (
          <div className="content-section">
            <h2 className="section-title">
              <span className="section-icon">📨</span>
              Connection Requests
              <span className="section-count">({requests.length})</span>
            </h2>

            {requests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p className="empty-text">No pending requests.</p>
              </div>
            ) : (
              <div className="requests-list">
                {requests.map((r) => {
                  const busy = !!reqAction[r._id];
                  return (
                    <div key={r._id} className="request-card">
                      <div className="request-info">
                        <div className="request-avatar">
                          {String(r.requester?.name || "U")[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="request-name">
                            {r.requester?.name}
                          </div>
                          <div className="request-email">
                            {r.requester?.email}
                          </div>
                        </div>
                      </div>
                      <div className="request-actions">
                        <button
                          className={`btn-primary ${busy ? "btn-loading" : ""}`}
                          disabled={busy}
                          onClick={() => respond(r._id, "accept")}
                        >
                          {reqAction[r._id] === "accept"
                            ? "Accepting..."
                            : "✅ Accept"}
                        </button>
                        <button
                          className={`btn-secondary ${
                            busy ? "btn-loading" : ""
                          }`}
                          disabled={busy}
                          onClick={() => respond(r._id, "reject")}
                        >
                          {reqAction[r._id] === "reject"
                            ? "Rejecting..."
                            : "❌ Decline"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "activities" && (
          <div className="activities-sections">
            {/* Created Activities */}
            <div className="content-section">
              <h3 className="section-title">
                <span className="section-icon">🎯</span>
                Activities You Created
                <span className="section-count">
                  ({myEvents.created.length})
                </span>
              </h3>

              {myEvents.created.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎪</div>
                  <p className="empty-text">No activities created yet.</p>
                </div>
              ) : (
                <div className="activities-grid">
                  {myEvents.created.map((ev) => (
                    <div
                      key={ev._id}
                      className="activity-card activity-created"
                    >
                      <div className="activity-header">
                        <span className="activity-indicator activity-indicator-blue"></span>
                        <h4 className="activity-name">{ev.name}</h4>
                        <span className="activity-type">{ev.activityType}</span>
                      </div>
                      <p className="activity-date">{formatDate(ev.startsAt)}</p>
                      <div className="activity-participants">
                        👥 {(ev.participants || []).length}/{ev.capacity || 0}
                      </div>
                      <span className="activity-badge activity-badge-organizer">
                        Organizer
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Joined Activities */}
            <div className="content-section">
              <h3 className="section-title">
                <span className="section-icon">🎭</span>
                Activities You Joined
                <span className="section-count">
                  ({myEvents.joined.length})
                </span>
              </h3>

              {myEvents.joined.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎭</div>
                  <p className="empty-text">No activities joined yet.</p>
                </div>
              ) : (
                <div className="activities-grid">
                  {myEvents.joined.map((ev) => (
                    <div key={ev._id} className="activity-card activity-joined">
                      <div className="activity-header">
                        <span className="activity-indicator activity-indicator-amber"></span>
                        <h4 className="activity-name">{ev.name}</h4>
                        <span className="activity-type">{ev.activityType}</span>
                      </div>
                      <p className="activity-date">{formatDate(ev.startsAt)}</p>
                      <button
                        className={`btn-danger ${
                          leaving[ev._id] ? "btn-loading" : ""
                        }`}
                        disabled={!!leaving[ev._id]}
                        onClick={() => leaveEvent(ev._id)}
                      >
                        {leaving[ev._id] ? "Leaving..." : "🚪 Leave Activity"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
