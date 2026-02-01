import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const webhooks = await prisma.webhook.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(webhooks);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch webhooks" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, path, method, responseStatus, responseData, authEnabled, authType, authToken } = body;

        // Validate path uniqueness
        const existing = await prisma.webhook.findUnique({
            where: { path },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Webhook path already exists" },
                { status: 400 }
            );
        }

        const webhook = await prisma.webhook.create({
            data: {
                name,
                path,
                method,
                responseStatus: parseInt(responseStatus),
                responseData: typeof responseData === 'string' ? JSON.parse(responseData) : responseData,
                authEnabled: authEnabled || false,
                authType: authEnabled ? authType : null,
                authToken: authEnabled ? authToken : null,
            },
        });

        return NextResponse.json(webhook, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to create webhook" },
            { status: 500 }
        );
    }
}
