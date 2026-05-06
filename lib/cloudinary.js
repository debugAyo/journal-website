/**
 * Formats a Cloudinary URL to ensure it downloads as a PDF with a proper filename.
 * 
 * @param {string} url - The stored Cloudinary URL
 * @param {string} title - The title of the manuscript (used for the filename)
 * @returns {string} - The formatted download URL
 */
export function getSafeDownloadUrl(url, title = "manuscript") {
  if (!url) return "#";

  // Only process Cloudinary URLs
  if (!url.includes("res.cloudinary.com")) return url;

  // Route through local proxy to handle private files and custom naming
  const encodedUrl = encodeURIComponent(url);
  const safeTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  return `/api/download?url=${encodedUrl}&filename=${safeTitle}`;
}