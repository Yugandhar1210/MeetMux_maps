import React, { useEffect, useState } from "react";
import { authApi, usersApi, connectionsApi } from "../utils/api";

export default function Profile() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    avatarUrl: "",
    bio: "",
    interests: "",
    lat: "",
    lng: "",
  });
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await authApi.me();
        const data = res.data?.user || res.data; // tolerate both shapes
        setMe(data);
        setForm({
          name: data?.name || "",
          avatarUrl: data?.avatarUrl || "",
          bio: data?.bio || "",
          interests: Array.isArray(data?.interests)
            ? data.interests.join(", ")
            : "",
          lat: data?.location?.lat ?? "",
          lng: data?.location?.lng ?? "",
        });
        try {
          const reqs = await connectionsApi.listRequests();
          setRequests(reqs.data || []);
        } catch {}
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    await usersApi.updateProfile({
      name: form.name,
      avatarUrl: form.avatarUrl,
      bio: form.bio,
      interests: form.interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      location: {
        lat: Number(form.lat),
        lng: Number(form.lng),
      },
    });
    const res = await authApi.me();
    const data = res.data?.user || res.data;
    setMe(data);
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{me?.name || "Your Profile"}</h1>
        <div className="space-x-2">
          <a href="/" className="px-3 py-2 border rounded">
            Home
          </a>
          <a href="/login" className="px-3 py-2 border rounded">
            Login
          </a>
          <a href="/register" className="px-3 py-2 border rounded">
            Sign Up
          </a>
          <button
            onClick={logout}
            className="px-3 py-2 bg-red-600 text-white rounded"
          >
            Logout
          </button>
        </div>
      </div>

      <form onSubmit={save} className="space-y-3 bg-white p-4 rounded shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col">
            <span className="text-sm">Name</span>
            <input
              className="border rounded px-2 py-1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm">Avatar URL</span>
            <input
              className="border rounded px-2 py-1"
              value={form.avatarUrl}
              onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
            />
          </label>
          <label className="flex flex-col md:col-span-2">
            <span className="text-sm">Bio</span>
            <textarea
              className="border rounded px-2 py-1"
              rows="3"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </label>
          <label className="flex flex-col md:col-span-2">
            <span className="text-sm">Interests (comma separated)</span>
            <input
              className="border rounded px-2 py-1"
              value={form.interests}
              onChange={(e) => setForm({ ...form, interests: e.target.value })}
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm">Latitude</span>
            <input
              className="border rounded px-2 py-1"
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm">Longitude</span>
            <input
              className="border rounded px-2 py-1"
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
            />
          </label>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded">
          Save Profile
        </button>
      </form>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">
          Notifications: Connection Requests
        </h2>
        {requests.length === 0 && (
          <p className="text-sm text-gray-500">No requests.</p>
        )}
        <ul className="space-y-2">
          {requests.map((r) => (
            <li
              key={r._id}
              className="flex items-center justify-between border rounded p-2"
            >
              <div>
                <div className="font-medium">{r.requester?.name}</div>
                <div className="text-xs text-gray-500">
                  {r.requester?.email}
                </div>
              </div>
              <div className="space-x-2">
                <button
                  className="px-3 py-1 rounded bg-green-600 text-white"
                  onClick={() => respond(r._id, "accept")}
                >
                  Accept
                </button>
                <button
                  className="px-3 py-1 rounded bg-gray-200"
                  onClick={() => respond(r._id, "reject")}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
