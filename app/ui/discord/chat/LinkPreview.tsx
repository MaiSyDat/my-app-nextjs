/**
 * Component hiển thị link preview (rich preview cho URLs)
 * 
 * Component này:
 * - Fetch metadata từ API /api/link-preview
 * - Hiển thị preview với title, description, image
 * - Hỗ trợ YouTube embeds, npm packages, và generic links
 * - Loading state khi đang fetch
 * - Error handling nếu không fetch được
 */

"use client";

import { useEffect, useState, memo, useMemo } from "react";
import Icon from "@/app/ui/common/Icon";

interface LinkPreviewProps {
  url: string;
}

interface PreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  type?: string;
  videoId?: string;
  author?: string;
}

/**
 * Component title bar chung cho link preview - Memoized
 */
const TitleBar = memo(function TitleBar({ url, siteName, title }: { url: string; siteName?: string; title?: string }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-1.5">
        {siteName && <span className="text-xs text-[#747F8D] font-medium">{siteName}</span>}
        {title && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#747F8D] hover:text-[#00A8FC] hover:underline line-clamp-1 max-w-md">
            {title}
          </a>
        )}
      </div>
      <button className="text-[#747F8D] hover:text-[#060607] hover:bg-[#E3E5E8] rounded p-1 transition-colors">
        <Icon src="more-vertical.svg" className="w-4 h-4" size={16} />
      </button>
    </div>
  );
});

TitleBar.displayName = "TitleBar";

/**
 * Component hiển thị link preview/embed
 * Hỗ trợ YouTube, npm, và các link thông thường - Memoized
 */
const LinkPreview = memo(function LinkPreview({ url }: LinkPreviewProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => isMounted && data && setPreview(data))
      .catch(() => {});
    return () => { isMounted = false; };
  }, [url]);

  if (!preview) return null;

  // YouTube embed
  if (preview.type === "video" && preview.videoId && preview.siteName === "YouTube") {
    return (
      <div className="mt-1.5">
        <TitleBar url={url} siteName="YouTube" title={preview.title} />
        <a href={url} target="_blank" rel="noopener noreferrer" className="block rounded overflow-hidden border border-[#E3E5E8] bg-white hover:border-[#C7CCD1] transition-colors">
            <div className="relative aspect-video bg-black">
            {preview.image && <img src={preview.image} alt={preview.title || "YouTube video"} className="w-full h-full object-cover" />}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors cursor-pointer group">
              <div className="w-14 h-14 bg-[#FF0000] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Icon src="play.svg" className="w-7 h-7 text-white ml-0.5" size={28} />
              </div>
            </div>
            <div className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors">
              <Icon src="external-link.svg" className="w-4 h-4 text-white" size={16} />
            </div>
          </div>
          <div className="p-2.5">
            {preview.author && <div className="text-sm font-semibold text-[#060607] mb-1">{preview.author}</div>}
            {preview.title && <div className="text-xs text-[#060607] line-clamp-2">{preview.title}</div>}
          </div>
        </a>
      </div>
    );
  }

  // npm package hoặc link thông thường
  return (
    <div className="mt-1.5">
      <TitleBar url={url} siteName={preview.siteName} title={preview.title} />
      <a href={url} target="_blank" rel="noopener noreferrer" className="block rounded overflow-hidden border border-[#E3E5E8] bg-white hover:border-[#C7CCD1] transition-colors">
        <div className="flex">
          {preview.image && (
            <div className="w-24 h-20 shrink-0">
              <img src={preview.image} alt={preview.title || "Preview"} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 p-2.5 min-w-0">
            {preview.title && <div className="text-xs font-semibold text-[#060607] mb-1 line-clamp-2">{preview.title}</div>}
            {preview.description && <div className="text-xs text-[#747F8D] line-clamp-2">{preview.description}</div>}
            {preview.author && <div className="text-xs text-[#747F8D] mt-1">{preview.author}</div>}
          </div>
        </div>
      </a>
    </div>
  );
});

LinkPreview.displayName = "LinkPreview";

export default LinkPreview;

