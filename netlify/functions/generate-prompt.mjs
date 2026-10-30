const json = (statusCode, payload) => new Response(JSON.stringify(payload), { status: statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

export default async function handler(request) {
  if (request.method !== 'POST') return json(405, { error: 'รองรับเฉพาะคำขอ POST' });
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
  if (!apiKey) return json(503, { error: 'ยังไม่ได้ตั้งค่า API key ใน Netlify (GEMINI_API_KEY)' });
  let input;
  try { input = await request.json(); } catch { return json(400, { error: 'อ่านข้อมูลคำขอไม่สำเร็จ' }); }
  const brief = String(input.brief || '').trim();
  if (!brief && !input.image?.data) return json(400, { error: 'กรุณาใส่หัวข้อหรือเลือกรูปสินค้า' });
  const prompt = [
    'คุณเป็นผู้กำกับโฆษณาและผู้เขียน prompt วิดีโอระดับมืออาชีพ สร้าง prompt ภาษาอังกฤษฉบับเดียวสำหรับโมเดลสร้างวิดีโอ โดยคิดจากโจทย์และรูปสินค้าที่แนบ (ถ้ามี) อย่าคาดเดาสรรพคุณสินค้า ถ้ารูปไม่ชัดให้บรรยายเฉพาะสิ่งที่เห็น',
    '', 'ข้อมูลผู้ใช้:', 'หัวข้อ: ' + (brief || 'วิเคราะห์สินค้าในรูปและสร้างโฆษณาที่ไม่กล่าวอ้างเกินจริง'),
    'ระยะเวลา: ' + String(input.duration || '10') + ' วินาที', 'สัดส่วน: ' + String(input.ratio || '9:16'),
    'ประเภท: ' + String(input.kind || 'โฆษณาสินค้า'), 'สถานที่ที่ต้องการ: ' + String(input.location || 'ให้เลือกฉากที่เข้ากับสินค้า'),
    'การกระทำ: ' + String(input.action || 'ให้คิดการสาธิตที่สมจริงและชัดเจน'), 'แนวภาพ: ' + String(input.style || 'ให้เลือกแนวภาพที่เหมาะสม'),
    'กล้อง: ' + String(input.camera || 'เลือกมุมกล้องและการเคลื่อนที่ที่เหมาะสม'), 'ข้อจำกัด: ' + String(input.restrictions || 'ห้ามสร้างข้อมูลสินค้า โลโก้ หรือข้อความที่ไม่มีต้นฉบับ'),
    'คำสั่งเพิ่มเติม: ' + String(input.extra || 'ไม่มี'), '',
    'ให้ผลลัพธ์เป็น prompt พร้อมใช้ ระบุฉาก 3 ช่วงตามเวลาที่รวมกันเท่ากับความยาววิดีโอ ได้แก่ เปิดเรื่อง สาธิต/ขยายรายละเอียด และภาพปิดท้าย รวมมุมกล้อง แสง การเคลื่อนไหว และความต่อเนื่องให้ชัดเจน ห้ามมีคำอธิบายก่อนหรือหลัง prompt และต้องรักษารูปร่าง สี วัสดุ และรายละเอียดที่มองเห็นของสินค้าให้ตรงรูปอ้างอิง'
  ].join('\n');
  const parts = [{ text: prompt }];
  if (input.image?.data && input.image?.mimeType) {
    const raw = String(input.image.data).replace(/^data:[^,]+,/, '');
    if (raw.length > 7000000) return json(413, { error: 'ไฟล์รูปใหญ่เกินไป กรุณาใช้รูปไม่เกิน 5 MB' });
    if (!/^image\/(jpeg|png|webp)$/.test(input.image.mimeType)) return json(415, { error: 'รองรับรูป JPG, PNG หรือ WebP' });
    parts.push({ inline_data: { mime_type: input.image.mimeType, data: raw } });
  }
  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + encodeURIComponent(apiKey);
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: { temperature: 0.7, maxOutputTokens: 1400 } }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const status = response.status === 429 ? 429 : response.status === 400 || response.status === 403 ? 400 : 502;
      const detail = result?.error?.message || 'บริการ AI ตอบกลับไม่สำเร็จ';
      return json(status, { error: status === 429 ? 'โควตา AI ชั่วคราวเต็ม กรุณาลองใหม่ภายหลัง' : 'Gemini API: ' + detail });
    }
    const text = result?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
    if (!text) return json(502, { error: 'AI ไม่ได้ส่ง Prompt กลับมา กรุณาลองใหม่' });
    return json(200, { prompt: text, model: 'gemini-2.5-flash-lite' });
  } catch { return json(502, { error: 'ติดต่อบริการ AI ไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่' }); }
}
