import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const FB_API_VERSION = process.env.FB_API_VERSION || "v21.0";
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;

// health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "FB Interest API is running" });
});

// helper เรียก Marketing API หา interests
async function searchInterests(query) {
  const params = new URLSearchParams({
    type: "adinterest",
    q: query,          // คำค้น เช่น "tennis", "skincare"
    limit: "200",      // ดึงสูงสุด 200 รายการ (จะเพิ่ม/ลดก็ได้)
    access_token: FB_ACCESS_TOKEN,
  });

  const url = `https://graph.facebook.com/${FB_API_VERSION}/search?${params.toString()}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.error) {
    throw data.error;
  }

  // map ให้สะอาด เอาเฉพาะ field ที่ใช้จริง
  return (data.data || []).map((i) => ({
    id: i.id,
    name: i.name,
    audience_size: i.audience_size,
    path: i.path, // กลุ่มหมวดหมู่ interest
  }));
}

// endpoint หลัก: /search-interests
app.post("/search-interests", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "query is required (string)" });
    }

    const interests = await searchInterests(query);

    res.json({
      query,
      count: interests.length,
      interests,
    });
  } catch (error) {
    console.error("FB Interest API Error:", error);
    res.status(500).json({
      error: "Failed to search interests",
      details: error,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});