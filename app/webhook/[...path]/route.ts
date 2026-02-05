import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function handleWebhook(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
    const { path: pathSegments } = await params;
    const path = pathSegments.join("/");
    const method = request.method;

    try {
        const webhook = await prisma.webhook.findUnique({
            where: { path },
        });

        if (!webhook) {
            return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
        }

        if (!webhook.enabled) {
            return NextResponse.json(
                { error: "Webhook is disabled" },
                { status: 503 } // Service Unavailable
            );
        }

        if (webhook.method !== method && webhook.method !== "ANY") {
            return NextResponse.json({ error: `Method ${method} not allowed` }, { status: 405 });
        }

        // Capture request details
        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
            headers[key] = value;
        });

        let body = null;
        const contentType = request.headers.get("content-type") || "";
        if (method !== 'GET' && method !== 'HEAD') {
            if (contentType.includes("application/json")) {
                try {
                    // We clone the request to ensure we can read the body even if we needed it elsewhere (though here we just read it once)
                    // Actually, request.json() consumes the body. 
                    // Since we need to read it before deciding to error content, this is fine.
                    body = await request.json();
                } catch (e) {
                    console.error("Failed to parse JSON body", e);
                    body = { error: "Invalid JSON" };
                }
            } else {
                try {
                    const text = await request.text();
                    if (text) {
                        body = { raw: text };
                    }
                } catch (e) {
                    console.error("Failed to read body", e);
                }
            }
        }

        // Parse query params
        const { searchParams } = new URL(request.url);
        const query: Record<string, string> = {};
        searchParams.forEach((value, key) => {
            query[key] = value;
        });

        // Authentication check
        let authenticated = true;
        
        if (webhook.authEnabled && webhook.authToken) {
            authenticated = false;
            if (webhook.authType === "bearer") {
                // Check Authorization header for Bearer token
                const authHeader = request.headers.get("authorization");
                if (authHeader && authHeader.startsWith("Bearer ")) {
                    const token = authHeader.substring(7);
                    authenticated = token === webhook.authToken;
                }
            } else if (webhook.authType === "query") {
                // Check query parameter for token
                const token = searchParams.get("token");
                authenticated = token === webhook.authToken;
            }
        }

        const responseStatus = authenticated ? webhook.responseStatus : 401;
        const responseData = authenticated ? webhook.responseData : { error: "Unauthorized" };

        // Add status to headers for internal tracking
        headers['x-webhook-response-status'] = String(responseStatus);

        // Save request to DB
        await prisma.webhookRequest.create({
            data: {
                webhookId: webhook.id,
                method,
                headers,
                body: body ?? {},
                query,
            },
        });

        return NextResponse.json(responseData, {
            status: responseStatus,
        });

    } catch (error) {
        console.error("Webhook handler error", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export const GET = handleWebhook;
export const POST = handleWebhook;
export const PUT = handleWebhook;
export const DELETE = handleWebhook;
export const PATCH = handleWebhook;
