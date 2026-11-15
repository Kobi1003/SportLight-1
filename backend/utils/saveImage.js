import fs from "fs";
import path from "path";

/**
 * Saves a base64 image string to the local /uploads folder.
 * If already a URL or path, returns it unchanged.
 * @param {string} base64Str - The image string (data URI or URL)
 * @param {string} prefix - Filename prefix (e.g. 'avatar', 'achievement', 'logo')
 * @returns {string} The public local path e.g. '/uploads/avatar-1731682800000.png'
 */
export const saveBase64Image = (base64Str, prefix = "img") => {
  if (!base64Str || typeof base64Str !== "string") {
    return base64Str;
  }

  // Check if it's a data URI: data:image/png;base64,....
  const match = base64Str.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  if (!match) {
    // Already a standard path or URL
    return base64Str;
  }

  const rawExt = match[1].toLowerCase();
  const ext = rawExt === "jpeg" ? "jpg" : rawExt;
  const data = match[2];
  const buffer = Buffer.from(data, "base64");

  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}.${ext}`;
  const filePath = path.join(uploadDir, filename);

  try {
    fs.writeFileSync(filePath, buffer);
    console.log(`[Upload] Image saved to local disk: uploads/${filename}`);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error("[Upload Error] Failed to write file:", err);
    return base64Str;
  }
};

