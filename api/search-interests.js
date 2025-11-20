import fetch from "node-fetch";

export default async function handler(req, res) {
  // ให้รองรับเฉพาะ POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.body || {};

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "query is required (string)" });
  }

  const FB_API_VERSION = process.env.FB_API_VERSION || "v21.0";
  const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;

  if (!FB_ACCESS_TOKEN) {
    return res.status(500).json({ error: "FB_ACCESS_TOKEN is not set" });
  }

  const endpoint = `https://graph.facebook.com/${FB_API_VERSION}/search`;

  const params = new URLSearchParams({
    type: "adinterest",
    q: query,
    limit: "1000",
    access_token: FB_ACCESS_TOKEN,
  });

  try {
    const response = await fetch(`${endpoint}?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Failed to fetch interests",
        details: data,
      });
    }

    const interests =
      (data.data || []).map((item) => ({
        id: item.id,
        name: item.name,
        audience_size: item.audience_size || null,
        path: item.path || [],
      })) || [];

    return res.status(200).json({
      query,
      count: interests.length,
      interests,
    });
  } catch (err) {
    console.error("Error fetching interests:", err);
    return res.status(500).json({
      error: "Failed to fetch interests",
      details: err.message,
    });
  }
}