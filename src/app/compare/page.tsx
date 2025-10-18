"use client";

import { useState } from "react";

type UserLite = {
  login: string;
  avatar_url: string;
  html_url: string;
  followers: number;
  following: number;
  public_repos: number;
};

async function getUser(u: string): Promise<UserLite> {
  const res = await fetch(`https://api.github.com/users/${u}`);
  if (!res.ok) throw new Error("User not found");
  const j = await res.json();
  return {
    login: j.login,
    avatar_url: j.avatar_url,
    html_url: j.html_url,
    followers: j.followers,
    following: j.following,
    public_repos: j.public_repos,
  };
}

export default function Compare() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [ua, setUa] = useState<UserLite | null>(null);
  const [ub, setUb] = useState<UserLite | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setErr(null);
    setLoading(true);
    try {
      const [ua1, ub1] = await Promise.all([getUser(a.trim()), getUser(b.trim())]);
      setUa(ua1);
      setUb(ub1);
    } catch (e: any) {
      setErr(e.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-bold mb-4">Compare GitHub Users</h1>

        <div className="flex gap-2 mb-4">
          <input className="border rounded-xl px-3 py-2 flex-1" placeholder="username A" value={a} onChange={(e)=>setA(e.target.value)} />
          <input className="border rounded-xl px-3 py-2 flex-1" placeholder="username B" value={b} onChange={(e)=>setB(e.target.value)} />
          <button onClick={run} className="bg-black text-white px-4 py-2 rounded-xl" disabled={loading}>
            {loading ? "Comparing..." : "Compare"}
          </button>
        </div>

        {err && <div className="bg-red-100 text-red-800 p-3 rounded-xl mb-4">{err}</div>}

        <div className="grid md:grid-cols-2 gap-4">
          {[ua, ub].map((u, i) => (
            <div key={i} className="bg-white rounded-2xl shadow p-4">
              {!u ? (
                <p className="text-gray-500">No data yet</p>
              ) : (
                <div className="flex items-center gap-3">
                  <img src={u.avatar_url} className="w-16 h-16 rounded-full border" />
                  <div>
                    <a className="font-semibold hover:underline" href={u.html_url} target="_blank" rel="noreferrer">
                      {u.login}
                    </a>
                    <div className="text-sm text-gray-700">Followers: {u.followers} · Following: {u.following}</div>
                    <div className="text-sm text-gray-700">Public repos: {u.public_repos}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {ua && ub && (
          <div className="mt-4 bg-white rounded-2xl shadow p-4">
            <h2 className="font-semibold mb-2">Summary</h2>
            <ul className="list-disc list-inside text-sm text-gray-800">
              <li>{ua.login} vs {ub.login}: followers {ua.followers} vs {ub.followers}</li>
              <li>Public repos: {ua.public_repos} vs {ub.public_repos}</li>
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
