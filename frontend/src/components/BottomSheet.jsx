import React from "react";

export default function BottomSheet({
  mode,
  setMode,
  filters,
  setFilters, // events filters
  peopleFilters,
  setPeopleFilters, // NEW: people filters
  creating,
  setCreating,
  draft,
  setDraft,
  onCreateEvent,
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur border-t shadow p-3">
      <div className="flex items-center gap-2 mb-2">
        <button
          className={`px-3 py-1 rounded border ${
            mode === "people" ? "bg-blue-600 text-white" : "bg-white"
          }`}
          onClick={() => setMode("people")}
        >
          People
        </button>
        <button
          className={`px-3 py-1 rounded border ${
            mode === "events" ? "bg-blue-600 text-white" : "bg-white"
          }`}
          onClick={() => setMode("events")}
        >
          Events
        </button>
      </div>

      {mode === "events" ? (
        <div className="grid md:grid-cols-2 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="border rounded px-2 py-1"
              value={filters.type}
              onChange={(e) =>
                setFilters((f) => ({ ...f, type: e.target.value }))
              }
            >
              <option value="">All types</option>
              <option>Sports</option>
              <option>Music</option>
              <option>Food</option>
              <option>Tech</option>
              <option>Travel</option>
            </select>
            <select
              className="border rounded px-2 py-1"
              value={filters.createdBy}
              onChange={(e) =>
                setFilters((f) => ({ ...f, createdBy: e.target.value }))
              }
            >
              <option value="all">Created by: All</option>
              <option value="connections">Created by: Connections</option>
            </select>
            <select
              className="border rounded px-2 py-1"
              value={filters.timeOfDay}
              onChange={(e) =>
                setFilters((f) => ({ ...f, timeOfDay: e.target.value }))
              }
            >
              <option value="">Any time</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
            </select>
            <select
              className="border rounded px-2 py-1"
              value={filters.dateRange}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateRange: e.target.value }))
              }
            >
              <option value="">Any date</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="weekend">Weekend</option>
              <option value="nextweek">Next week</option>
            </select>
            <label className="flex items-center gap-1 text-sm ml-2">
              <input
                type="checkbox"
                checked={filters.heatmap}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, heatmap: e.target.checked }))
                }
              />
              Heatmap
            </label>
          </div>

          <div className="justify-self-end">
            {!creating ? (
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setCreating(true)}
              >
                + Create activity
              </button>
            ) : (
              <form
                className="grid sm:grid-cols-2 gap-2 items-end"
                onSubmit={(e) => {
                  e.preventDefault();
                  onCreateEvent();
                }}
              >
                <input
                  className="border rounded px-2 py-1"
                  placeholder="Name"
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, name: e.target.value }))
                  }
                />
                <select
                  className="border rounded px-2 py-1"
                  value={draft.activityType}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, activityType: e.target.value }))
                  }
                >
                  <option value="">Type</option>
                  <option>Sports</option>
                  <option>Music</option>
                  <option>Food</option>
                  <option>Tech</option>
                  <option>Travel</option>
                </select>
                <input
                  type="datetime-local"
                  className="border rounded px-2 py-1"
                  value={draft.startsAt}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, startsAt: e.target.value }))
                  }
                />
                <input
                  type="datetime-local"
                  className="border rounded px-2 py-1"
                  value={draft.endsAt}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, endsAt: e.target.value }))
                  }
                />
                <input
                  className="border rounded px-2 py-1"
                  placeholder="Lat"
                  value={draft.lat}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, lat: e.target.value }))
                  }
                />
                <input
                  className="border rounded px-2 py-1"
                  placeholder="Lng"
                  value={draft.lng}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, lng: e.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                    type="submit"
                  >
                    Create
                  </button>
                  <button
                    className="px-3 py-1 border rounded"
                    type="button"
                    onClick={() => setCreating(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="border rounded px-2 py-1"
            value={peopleFilters.activity}
            onChange={(e) =>
              setPeopleFilters((f) => ({ ...f, activity: e.target.value }))
            }
          >
            <option value="">All interests</option>
            <option>Sports</option>
            <option>Music</option>
            <option>Food</option>
            <option>Tech</option>
            <option>Travel</option>
          </select>
          <select
            className="border rounded px-2 py-1"
            value={peopleFilters.show}
            onChange={(e) =>
              setPeopleFilters((f) => ({ ...f, show: e.target.value }))
            }
          >
            <option value="all">All</option>
            <option value="online">Online</option>
            <option value="connections">Connections</option>
          </select>
          <label className="flex items-center gap-1 text-sm ml-2">
            <input
              type="checkbox"
              checked={peopleFilters.heatmap}
              onChange={(e) =>
                setPeopleFilters((f) => ({ ...f, heatmap: e.target.checked }))
              }
            />
            Heatmap
          </label>
        </div>
      )}
    </div>
  );
}
