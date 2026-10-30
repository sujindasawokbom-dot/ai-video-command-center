export default async (request) => {
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);
  const apiKey = Netlify.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ error: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Netlify" }, 503);
  try {
    const { prompt, image } = await request.json();
    if (!prompt || typeof prompt !== "string") return json({ error: "ไม่พบ Prompt สำหรับสร้างภาพ" }, 400);
    if (image?.data && image.data.length > 4500000) return json({ error: "รูปสินค้าใหญ่เกินไป กรุณาเลือกรูปที่เล็กกว่า 3 MB" }, 413);
    const parts = [{ text: "Create a genuine visual storyboard preview for this exact video prompt. Return ONE landscape 16:9 image divided into exactly three clear vertical panels, showing beginning, middle, and ending moments in order. Use cinematic realistic commercial photography, consistent people, setting, lighting and product across panels. If a product reference image is attached, preserve that exact product's appearance and make it the clear subject. Show plausible use only; do not invent logos, text, labels, or product features. This is a storyboard preview image, not a finished video. Video prompt: " + prompt }];
    if (image?.data && image?.mimeType) parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=" + encodeURIComponent(apiKey), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "16:9", imageSize: "1K" } } })
    });
    const result = await response.json();
    if (!response.ok) return json({ error: result.error?.message || "บริการสร้างภาพตอบกลับผิดพลาด" }, 502);
    const outputParts = result.candidates?.[0]?.content?.parts || [];
    const generated = outputParts.find(part => part.inlineData?.data || part.inline_data?.data);
    if (!generated) return json({ error: "AI ไม่ได้ส่งภาพกลับมา กรุณาลองอีกครั้ง" }, 502);
    const inline = generated.inlineData || generated.inline_data;
    return json({ image: { mimeType: inline.mimeType || inline.mime_type || "image/png", data: inline.data } });
  } catch (error) {
    return json({ error: error.message || "สร้างภาพ storyboard ไม่สำเร็จ" }, 500);
  }
};

export const config = { path: "/api/storyboard" };
