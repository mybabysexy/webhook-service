import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
            // Note: user asked for REST method selection. If we support exact match, we check it.
            // If the user wants ANY, we might handle it. For now assuming exact match.
            // But let's check if we want to support method mismatch or not.
            // The prompt said "Webhook creation must have rest method selection".
            // So likely strict method matching.
            if (webhook.method !== method) {
                return NextResponse.json({ error: `Method ${method} not allowed` }, { status: 405 });
            }
        }

        // Capture request details
        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
            headers[key] = value;
        });

        let body = null;
        const contentType = request.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            try {
                body = await request.json();
            } catch (e) {
                console.error("Failed to parse JSON body", e);
                body = { error: "Invalid JSON" };
            }
        } else {
            // handle text or form data if needed, or store as null/string
            // For simplicity, maybe we read text if not json
            try {
                const text = await request.text();
                if (text) {
                    body = { raw: text };
                }
            } catch (e) {
                console.error("Failed to read body", e);
            }
        }

        // Parse query params
        const { searchParams } = new URL(request.url);
        const query: Record<string, string> = {};
        searchParams.forEach((value, key) => {
            query[key] = value;
        });

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

        // Return configured response
        return NextResponse.json(webhook.responseData, {
            status: webhook.responseStatus,
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
