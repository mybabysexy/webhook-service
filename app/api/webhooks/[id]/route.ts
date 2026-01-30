import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const webhook = await prisma.webhook.findUnique({
            where: { id },
            include: {
                requests: {
                    orderBy: { timestamp: "desc" },
                },
            },
        });

        if (!webhook) {
            return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
        }

        return NextResponse.json(webhook);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch webhook details" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const webhook = await prisma.webhook.update({
            where: { id },
            data: body,
        });
        return NextResponse.json(webhook);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update webhook" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await prisma.webhook.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to delete webhook" },
            { status: 500 }
        );
    }
}
