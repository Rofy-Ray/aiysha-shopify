import * as remixNode from "@remix-run/node";

export async function action({ request }) {
  console.log("[api/skin-shade] Endpoint hit");
  console.log("[api/skin-shade] Request method:", request.method);
  console.log("[api/skin-shade] Request headers:", JSON.stringify(Object.fromEntries(request.headers.entries())));

  const uploadHandler = remixNode.unstable_createMemoryUploadHandler({ maxPartSize: 5_000_000 });
  const formData = await remixNode.parseMultipartFormData(request, uploadHandler);
  if (!formData.has("selfie")) {
    console.error("[api/skin-shade] No image uploaded");
    return remixNode.json({ error: "No image uploaded" }, { status: 400 });
  }
  const image = formData.get("selfie");
  console.log("[api/skin-shade] Image received:", image && image.name);

  let imageBuffer;
  try {
    if (image && typeof image.arrayBuffer === "function") {
      // Modern File object (Remix/Node)
      const arr = await image.arrayBuffer();
      imageBuffer = Buffer.from(arr);
      console.log("[api/skin-shade] Image buffer created from arrayBuffer");
    } else if (image instanceof Buffer) {
      imageBuffer = image;
      console.log("[api/skin-shade] Image is already a Buffer");
    } else {
      imageBuffer = Buffer.from(image);
      console.log("[api/skin-shade] Image buffer created from fallback");
    }
  } catch (err) {
    console.error("[api/skin-shade] Error converting image to buffer:", err);
    return remixNode.json({ error: "Failed to process uploaded image." }, { status: 400 });
  }

  // Try to detect file type from the uploaded image object
  let imageFormat = "jpeg";
  if (image && image.type && image.type.startsWith("image/")) {
    imageFormat = image.type.split("/")[1];
    console.log("[api/skin-shade] Detected image format:", imageFormat);
  } else if (image && image.name) {
    const ext = image.name.split('.').pop();
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
      imageFormat = ext === "jpg" ? "jpeg" : ext;
    }
    console.log("[api/skin-shade] Detected image format (from name):", imageFormat);
  }
  const base64Image = imageBuffer.toString("base64");
  const base64ImageFormatted = `data:image/${imageFormat};base64,${base64Image}`;

  // Call LandingAI endpoint
  const apiKey = process.env.LANDINGAI_API_KEY;
  if (!apiKey) {
    console.error("[api/skin-shade] LANDINGAI_API_KEY is missing from environment variables.");
    return remixNode.json({ error: "Server misconfiguration: Missing LandingAI API key." }, { status: 500 });
  }
  const payload = { "image": base64ImageFormatted };
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  };
  try {
    console.log("[api/skin-shade] Sending request to LandingAI...");
    const resp = await fetch("https://reedfhc-webendpoint.sandbox.landing.ai/inference", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    console.log("[api/skin-shade] LandingAI response status:", resp.status);
    const contentType = resp.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await resp.json();
      console.log("[api/skin-shade] LandingAI response:", data);
    } else {
      const text = await resp.text();
      console.error("[api/skin-shade] LandingAI non-JSON response:", text);
      return remixNode.json({ error: "LandingAI returned non-JSON response", detail: text }, { status: resp.status });
    }
    if (!resp.ok) return remixNode.json({ error: data }, { status: resp.status });
    if (data && data.shade) {
      console.log("[api/skin-shade] Detected shade:", data.shade);
      return remixNode.json({ shade: data.shade });
    } else {
      console.error("[api/skin-shade] No shade detected", data);
      return remixNode.json({ error: "No shade detected" }, { status: 422 });
    }
  } catch (e) {
    console.error("[api/skin-shade] Error:", e.message, e.stack);
    return remixNode.json({ error: e.message }, { status: 500 });
  }
};

export const loader = () => remixNode.json({ ok: true });
