"use client";

import { useEffect, useMemo, useState } from "react";
import type { GitHubUser, GitHubRepo } from "../types/github";

export default function Home() {
  // State variables to handle user input and fetched data
  const [username, setUsername] = useState("");
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [summarizing, setSummarizing] = useState(false); // for AI button state

  // Load any saved notes for the selected user from local storage
  useEffect(() => {
    if (!user) return;
    const key = `note:user:${user.login}`;
    const saved = localStorage.getItem(key);
    setNote(saved ?? "");
  }, [user]);

  // Calculate total stars across all repositories
  const totalStars = useMemo(
    () => repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
    [repos]
  );

  // Fetch user data and their repositories from GitHub API
  async function fetchUser(u: string) {
    setLoading(true);
    setError(null);
    setUser(null);
    setRepos([]);
    try {
      const userRes = await fetch(`https://api.github.com/users/${u}`);
      if (!userRes.ok) throw new Error("User not found");
      const userJson: GitHubUser = await userRes.json();

      const repoRes = await fetch(
        `https://api.github.com/users/${u}/repos?per_page=100&sort=updated`
      );
      if (!repoRes.ok) throw new Error("Couldn’t fetch repositories");
      const repoJson: GitHubRepo[] = await repoRes.json();

      setUser(userJson);
      setRepos(repoJson);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Handle form submission when searching for a username
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    await fetchUser(username.trim());
  }

  // Save notes for the current user locally
  function saveNote() {
    if (!user) return;
    const key = `note:user:${user.login}`;
    localStorage.setItem(key, note);
  }

  // Call the AI summarize API
  async function generateSummary() {
    if (!user) return;
    try {
      setSummarizing(true);
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.login, repos }),
      });
      const data = await res.json();
      if (data?.summary) {
        alert(data.summary);
      } else if (data?.error) {
        alert(`Error: ${data.error}`);
      } else {
        alert("No summary available.");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to generate summary.");
    } finally {
      setSummarizing(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-bold mb-4">GitHub Profile Explorer</h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter a GitHub username (e.g., octocat)"
            className="flex-1 border rounded-xl px-4 py-2"
          />
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded-xl disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* User Information */}
        {user && (
          <section className="bg-white rounded-2xl shadow p-4 mb-6">
            <div className="flex items-center gap-4">
              <img
                src={user.avatar_url}
                alt={`${user.login} avatar`}
                className="w-20 h-20 rounded-full border"
              />
              <div className="flex-1">
                <a
                  href={user.html_url}
                  target="_blank"
                  className="text-xl font-semibold hover:underline"
                  rel="noreferrer"
                >
                  {user.name ?? user.login}
                </a>
                <p className="text-gray-600">{user.bio}</p>
                <div className="mt-2 text-sm text-gray-700">
                  <span className="mr-3">Followers: {user.followers}</span>
                  <span className="mr-3">Following: {user.following}</span>
                  <span>Public Repositories: {user.public_repos}</span>
                </div>
                <div className="mt-2 text-sm text-gray-700">
                  <span>Total Stars: {totalStars}</span>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Your Notes About This User</h3>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full border rounded-xl p-3"
                placeholder="Write personal notes (saved locally on your device)..."
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={saveNote}
                  className="bg-gray-900 text-white px-3 py-1.5 rounded-xl"
                >
                  Save Notes
                </button>
                <button
                  onClick={generateSummary}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl disabled:opacity-50"
                  disabled={summarizing}
                >
                  {summarizing ? "Generating..." : "Generate AI Summary"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Repository List */}
        {repos.length > 0 && (
          <section className="bg-white rounded-2xl shadow p-4">
            <h2 className="text-lg font-semibold mb-3">Repositories</h2>
            <ul className="space-y-3">
              {repos.map((repo) => (
                <li key={repo.id} className="border rounded-xl p-3">
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium hover:underline"
                  >
                    {repo.name}
                  </a>
                  {repo.description && (
                    <p className="text-sm text-gray-700 mt-1">
                      {repo.description}
                    </p>
                  )}
                  <div className="text-sm text-gray-600 mt-2">
                    {repo.stargazers_count} • Forks: {repo.forks_count} •{" "}
                    {repo.language ?? "Language not specified"}
                  </div>

                  {/* Per-repository note */}
                  <textarea
                    defaultValue={
                      user
                        ? localStorage.getItem(
                            `note:repo:${user.login}:${repo.name}`
                          ) ?? ""
                        : ""
                    }
                    onBlur={(e) => {
                      if (!user) return;
                      localStorage.setItem(
                        `note:repo:${user.login}:${repo.name}`,
                        e.target.value
                      );
                    }}
                    rows={2}
                    className="w-full border rounded-xl p-2 mt-2"
                    placeholder="Private note about this repository..."
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
