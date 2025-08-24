// pages/api/download-form.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.query;
  if (!url || typeof url !== "string") {
    console.error("Invalid URL parameter:", url);
    return res.status(400).json({ error: "Valid URL is required" });
  }

  if (!url.startsWith("http")) {
    console.error("URL does not start with http:", url);
    return res.status(400).json({ error: `Invalid URL format: ${url}` });
  }

  try {
    console.log("Fetching URL:", url);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY || ""}`,
      },
    });
    if (!response.ok) {
      console.error("Fetch failed:", url, response.status, response.statusText);
      throw new Error(
        `Failed to fetch file from ${url}: ${response.statusText}`
      );
    }

    const buffer = await response.arrayBuffer();
    const contentType =
      response.headers.get("content-type") || "application/octet-stream";
    const filename = url.split("/").pop() || "form.docx";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    console.error("Error downloading form:", errorMessage);
    res.status(500).json({ error: `Failed to download form: ${errorMessage}` });
  }
}
