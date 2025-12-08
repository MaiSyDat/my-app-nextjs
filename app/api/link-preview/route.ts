import { NextRequest, NextResponse } from "next/server";

/**
 * API route để fetch link preview metadata
 * Hỗ trợ: YouTube (oEmbed), npm packages, và các link thông thường (Open Graph)
 */

interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  type?: string;
  videoId?: string;
  author?: string;
}

// Headers chung cho các request
const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};

/**
 * Fetch YouTube metadata từ oEmbed API
 */
async function getYouTubePreview(url: string): Promise<LinkPreview | null> {
  try {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1];
    if (!videoId) return null;

    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
      headers: FETCH_HEADERS,
    });
    if (!res.ok) return null;

    const data = await res.json();
    return {
      url,
      title: data.title,
      image: data.thumbnail_url,
      siteName: "YouTube",
      type: "video",
      videoId,
      author: data.author_name,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch npm package metadata
 */
async function getNpmPreview(url: string): Promise<LinkPreview | null> {
  try {
    const packageName = url.match(/npmjs\.com\/package\/([^\/\?]+)/)?.[1];
    if (!packageName) return null;

    const res = await fetch(`https://registry.npmjs.org/${packageName}`);
    if (!res.ok) return null;

    const data = await res.json();
    const version = data['dist-tags']?.latest;
    const versionData = version ? data.versions[version] : null;

    return {
      url,
      title: `${packageName}${version ? `@${version}` : ''}`,
      description: versionData?.description || data.description,
      siteName: "npm",
      type: "package",
      author: versionData?.author?.name || data.author?.name,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch Open Graph metadata từ HTML
 */
async function getGenericPreview(url: string): Promise<LinkPreview | null> {
  try {
    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) return null;

    const html = await res.text();
    const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)?.[1] || html.match(/<title>([^<]+)<\/title>/i)?.[1];
    const ogDescription = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)?.[1] || html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1];
    const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)?.[1];
    const ogSiteName = html.match(/<meta\s+property="og:site_name"\s+content="([^"]+)"/i)?.[1];

    if (!ogTitle && !ogDescription && !ogImage) return null;

    return { url, title: ogTitle, description: ogDescription, image: ogImage, siteName: ogSiteName, type: "website" };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url).searchParams.get("url");
    if (!url) return NextResponse.json({ message: "URL parameter is required" }, { status: 400 });

    // Validate và normalize URL
    let validUrl: string | null = null;
    try {
      validUrl = new URL(url.startsWith("http") ? url : `https://${url}`).toString();
    } catch {
      return NextResponse.json({ message: "Invalid URL" }, { status: 400 });
    }

    // Fetch preview theo thứ tự: YouTube -> npm -> generic
    const preview =
      (validUrl.includes("youtube.com") || validUrl.includes("youtu.be")) ? await getYouTubePreview(validUrl) :
      validUrl.includes("npmjs.com/package") ? await getNpmPreview(validUrl) :
      await getGenericPreview(validUrl);

    if (!preview) return NextResponse.json({ message: "Could not fetch preview" }, { status: 404 });
    return NextResponse.json(preview);
  } catch {
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}

