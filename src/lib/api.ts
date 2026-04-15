const API_BASE_URL = typeof window !== 'undefined' 
  ? (window.location.origin.includes('localhost') ? 'http://localhost:8000' : window.location.origin)
  : 'http://localhost:8000';

export interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: number;
  view_count: number;
  uploader: string;
}

export const fetchVideoInfo = async (url: string): Promise<VideoInfo> => {
  const response = await fetch(`${API_BASE_URL}/info?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch video info');
  }
  return response.json();
};

export const downloadVideo = async (url: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to start download');
  }
  const data = await response.json();
  return data.download_url; // Return the absolute URL from backend
};
