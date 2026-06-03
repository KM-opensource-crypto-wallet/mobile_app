/**
 * Shared utilities for tutorial video handling.
 * Used by VideoCard (thumbnail resolution) and VideoPlayer (playback strategy).
 */

/**
 * Extracts a YouTube video ID from any standard YouTube URL.
 * Handles: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/
 * Returns null for non-YouTube URLs (direct MP4 sources).
 */
export const getYouTubeId = url => {
  if (!url) {
    return null;
  }
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match?.[1] || null;
};

/**
 * Returns true if the video URL is a YouTube link.
 */
export const isYouTubeVideo = url => !!getYouTubeId(url);

/**
 * Returns the best available thumbnail URL for a video item.
 *
 * Priority:
 *   1. item.thumbnail — if provided and non-empty
 *   2. YouTube auto-generated HQ thumbnail — if the video is a YT link
 *   3. null — caller renders a placeholder or first-frame Video
 */
export const resolveThumbnail = item => {
  if (item?.thumbnail) {
    return item.thumbnail;
  }
  const ytId = getYouTubeId(item?.video);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  return null;
};
