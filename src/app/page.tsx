'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { fetchVideoInfo, downloadVideo, VideoInfo } from '@/lib/api';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetchInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setVideoInfo(null);

    try {
      const info = await fetchVideoInfo(url);
      setVideoInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!url) return;

    setDownloading(true);
    setError(null);

    try {
      const downloadUrl = await downloadVideo(url);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${videoInfo?.title || 'video'}.mp4`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            YouTube Downloader
          </h1>
          <p className="text-lg text-gray-600">
            Paste a YouTube URL below to download the video as MP4.
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-6 mb-8">
          <form onSubmit={handleFetchInfo} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-black"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:bg-blue-400"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              <p>{error}</p>
            </div>
          )}
        </div>

        {videoInfo && (
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden animate-fade-in">
            <div className="md:flex">
              <div className="md:flex-shrink-0 relative w-full md:w-64 h-48">
                <Image
                  className="object-cover"
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title}
                  fill
                  unoptimized
                />
              </div>
              <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                    {videoInfo.title}
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    {videoInfo.uploader} • {formatDuration(videoInfo.duration)}
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-green-400 flex items-center justify-center gap-2"
                >
                  {downloading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Download MP4
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
