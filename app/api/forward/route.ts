import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { targetUrl, method, headers, body } = await request.json();

        if (!targetUrl) {
            return NextResponse.json({ error: "Missing targetUrl" }, { status: 400 });
        }

        const forwardHeaders: Record<string, string> = {};
        if (headers) {
            Object.entries(headers).forEach(([k, v]) => {
                const key = k.toLowerCase();
                // Filter out headers that are managed by the fetch client or invalid to set manually
                if (key !== 'host' && key !== 'content-length' && key !== 'connection') {
                    forwardHeaders[k] = String(v);
                }
            });
        }

        console.log(`Forwarding webhook to ${targetUrl} with method ${method}`);

        const response = await fetch(targetUrl, {
            method: method || 'POST',
            headers: forwardHeaders,
            body: (method !== 'GET' && method !== 'HEAD' && body) ? JSON.stringify(body) : undefined,
            // We do NOT use no-cors here, so we get full response access, 
            // and we can send any headers (as this is server-to-server).
        });

        const jsonResponse = await response.json();

        // We can return the status to the UI
        return NextResponse.json({
            success: true,
            status: response.status,
            statusText: response.statusText,
            response: jsonResponse,
        });

    } catch (error: any) {
        console.error("Forwarding error:", error);
        return NextResponse.json({ error: error.message || "Failed to forward request" }, { status: 500 });
    }
}
