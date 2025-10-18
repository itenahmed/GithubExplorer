import OpenAI from "openai";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { username, bio, repos } = await req.json();

    // Normalize to the minimal fields we actually need
    const cleaned = (Array.isArray(repos) ? repos : []).map((r: any) => ({
      name: String(r?.name ?? ""),
      description: r?.description ? String(r.description) : null,
      stars: Number(r?.stargazers_count ?? 0),
      language: r?.language ? String(r.language) : null,
    }));

    // Derive simple stats the model can reference
    const totalStars = cleaned.reduce((s, r) => s + (r.stars || 0), 0);
    const langCounts = cleaned.reduce<Record<string, number>>((acc, r) => {
      if (r.language) acc[r.language] = (acc[r.language] ?? 0) + 1;
      return acc;
    }, {});
    const topLanguages = Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([lang, count]) => `${lang} (${count})`)
      .join(", ");

    // Pick up to 3 notable repos by stars
    const notable = [...cleaned]
      .sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0))
      .slice(0, 3);

    const bullets =
      cleaned
        .slice(0, 20)
        .map(
          (r) =>
            `- ${r.name}: ${r.description ?? "no description"}${
              r.language ? ` [${r.language}]` : ""
            } (★ ${r.stars})`
        )
        .join("\n") || "- no repositories provided";

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
You are given pre-fetched GitHub data. Do not say you lack access to the internet or external databases.
Write a concise, professional 4–6 sentence profile summary for "${username}" using ONLY the data below.

Bio (may be empty): ${bio ?? "—"}
Top languages (by count): ${topLanguages || "—"}
Total stars across repos: ${totalStars}

Notable repos (by stars, up to 3):
${notable.map((r) => `• ${r.name}${r.stars ? ` (★ ${r.stars})` : ""}`).join("\n") || "• —"}

Repository sample:
${bullets}

Guidelines:
- Be neutral and factual.
- Mention top languages and overall focus you infer from descriptions.
- Reference one or two notable repositories if available.
- If data is sparse, state that briefly without apologizing.
`;

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    const text = resp.choices[0]?.message?.content?.trim() || "";
    return new Response(JSON.stringify({ summary: text }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? "error" }), {
      status: 500,
    });
  }
}
