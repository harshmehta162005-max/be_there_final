import { NextResponse } from "next/server";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    if (!url || !/^https?:\/\//i.test(url)) {
        return new NextResponse("Invalid url", { status: 400 });
    }

    try {
        const res = await fetch(url, {
            headers: {
                "user-agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                referer: url,
            },
        });

        if (!res.ok) {
            return new NextResponse("Image fetch failed", { status: 502 });
        }

        const contentType = res.headers.get("content-type") || "image/jpeg";
        const buffer = await res.arrayBuffer();
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "content-type": contentType,
                "cache-control": "public, max-age=3600",
            },
        });
    } catch {
        return new NextResponse("Image fetch error", { status: 500 });
    }
}
