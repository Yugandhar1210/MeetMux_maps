import React from "react";

export default function BottomSheet({
  mode,
  setMode,
  filters,
  setFilters,
  peopleFilters,
  setPeopleFilters,
  creating,
  setCreating,
  draft,
  setDraft,
  onCreateEvent,
  isOpen,
  setIsOpen,
}) {
  return (
    <>
      {/* Menu Toggle Button */}
      <button
        className={`sidebar-toggle ${isOpen ? "sidebar-toggle-open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Close menu" : "Open menu"}
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
        {/* Header */}
        <div className="sidebar-header">
          <h2 className="sidebar-title">
            <span className="sidebar-title-icon">🗺️</span>
            Map Controls
          </h2>
          <button
            className="sidebar-close"
            onClick={() => setIsOpen(false)}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="sidebar-content">
          {/* Mode Toggle */}
          <div className="sidebar-section">
            <div className="tab-buttons">
              <button
                className={`tab-button ${mode === "people" ? "active" : ""}`}
                onClick={() => setMode("people")}
              >
                👥 People
              </button>
              <button
                className={`tab-button ${mode === "events" ? "active" : ""}`}
                onClick={() => setMode("events")}
              >
                🎯 Events
              </button>
            </div>
          </div>

          {mode === "events" ? (
            <div className="sidebar-section">
              {/* Filters */}
              <div className="filters-section">
                <h3 className="section-label">
                  <span className="section-icon">🔍</span>
                  Filters
                </h3>

                <div className="filter-group">
                  <label className="filter-label">Activity Type</label>
                  <select
                    className="filter-select"
                    value={filters.type}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, type: e.target.value }))
                    }
                  >
                    <option value="">🏷️ All types</option>
                    <option value="Sports">⚽ Sports</option>
                    <option value="Music">🎵 Music</option>
                    <option value="Food">🍕 Food</option>
                    <option value="Tech">💻 Tech</option>
                    <option value="Travel">✈️ Travel</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Created By</label>
                  <select
                    className="filter-select"
                    value={filters.createdBy}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, createdBy: e.target.value }))
                    }
                  >
                    <option value="all">👤 All users</option>
                    <option value="connections">🤝 Connections</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Time of Day</label>
                  <select
                    className="filter-select"
                    value={filters.timeOfDay}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, timeOfDay: e.target.value }))
                    }
                  >
                    <option value="">🕐 Any time</option>
                    <option value="morning">🌅 Morning</option>
                    <option value="afternoon">☀️ Afternoon</option>
                    <option value="evening">🌇 Evening</option>
                    <option value="night">🌙 Night</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Date Range</label>
                  <select
                    className="filter-select"
                    value={filters.dateRange}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, dateRange: e.target.value }))
                    }
                  >
                    <option value="">📅 Any date</option>
                    <option value="today">📍 Today</option>
                    <option value="tomorrow">➡️ Tomorrow</option>
                    <option value="weekend">🎉 Weekend</option>
                    <option value="nextweek">📆 Next week</option>
                  </select>
                </div>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.heatmap}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, heatmap: e.target.checked }))
                    }
                  />
                  <span className="checkbox-text">🔥 Show Heatmap</span>
                </label>
              </div>

              {/* Create Activity */}
              <div className="sidebar-section">
                <h3 className="section-label">
                  <span className="section-icon">✨</span>
                  Create Activity
                </h3>

                {!creating ? (
                  <button
                    className="create-button"
                    onClick={() => setCreating(true)}
                  >
                    <span className="button-icon">➕</span>
                    New Activity
                  </button>
                ) : (
                  <form
                    className="create-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      onCreateEvent();
                    }}
                  >
                    <div className="form-group">
                      <label className="form-label">Activity Name</label>
                      <input
                        className="form-input"
                        placeholder="Enter activity name"
                        value={draft.name}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, name: e.target.value }))
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <select
                        className="form-input"
                        value={draft.activityType}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            activityType: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select type</option>
                        <option value="Sports">Sports</option>
                        <option value="Music">Music</option>
                        <option value="Food">Food</option>
                        <option value="Tech">Tech</option>
                        <option value="Travel">Travel</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Start Time</label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={draft.startsAt}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, startsAt: e.target.value }))
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">End Time</label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={draft.endsAt}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, endsAt: e.target.value }))
                        }
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Latitude</label>
                        <input
                          className="form-input"
                          placeholder="17.6868"
                          value={draft.lat}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, lat: e.target.value }))
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Longitude</label>
                        <input
                          className="form-input"
                          placeholder="83.2185"
                          value={draft.lng}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, lng: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div className="form-buttons">
                      <button className="btn-primary" type="submit">
                        🚀 Create
                      </button>
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => setCreating(false)}
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="sidebar-section">
              <h3 className="section-label">
                <span className="section-icon">👥</span>
                People Filters
              </h3>

              <div className="filter-group">
                <label className="filter-label">Interest</label>
                <select
                  className="filter-select"
                  value={peopleFilters.activity}
                  onChange={(e) =>
                    setPeopleFilters((f) => ({
                      ...f,
                      activity: e.target.value,
                    }))
                  }
                >
                  <option value="">🎯 All interests</option>
                  <option value="Sports">⚽ Sports</option>
                  <option value="Music">🎵 Music</option>
                  <option value="Food">🍕 Food</option>
                  <option value="Tech">💻 Tech</option>
                  <option value="Travel">✈️ Travel</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Show</label>
                <select
                  className="filter-select"
                  value={peopleFilters.show}
                  onChange={(e) =>
                    setPeopleFilters((f) => ({ ...f, show: e.target.value }))
                  }
                >
                  <option value="all">👥 All people</option>
                  <option value="online">🟢 Online only</option>
                  <option value="connections">🤝 Connections only</option>
                </select>
              </div>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={peopleFilters.heatmap}
                  onChange={(e) =>
                    setPeopleFilters((f) => ({
                      ...f,
                      heatmap: e.target.checked,
                    }))
                  }
                />
                <span className="checkbox-text">🔥 Show Heatmap</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
