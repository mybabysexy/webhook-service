"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { MainContent } from "@/components/main-content";
import { Webhook } from "@prisma/client";

interface WebhookWithRequests extends Webhook {
    requests?: any[];
}

export function WebhookDashboard() {
    const [webhooks, setWebhooks] = useState<WebhookWithRequests[]>([]);
    const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchWebhooks = async () => {
        try {
            const res = await fetch("/api/webhooks");
            if (res.ok) {
                const data = await res.json();
                setWebhooks(data);
            }
        } catch (error) {
            console.error("Failed to fetch webhooks", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWebhooks();
    }, []);

    const handleCreateSuccess = (newWebhook: WebhookWithRequests) => {
        setWebhooks([newWebhook, ...webhooks]);
        setSelectedWebhookId(newWebhook.id);
    };

    const handleDeleteSuccess = (id: string) => {
        setWebhooks(webhooks.filter((w) => w.id !== id));
        if (selectedWebhookId === id) {
            setSelectedWebhookId(null);
        }
    };

    const selectedWebhook = webhooks.find((w) => w.id === selectedWebhookId) || null;

    return (
        <div className="flex flex-col md:flex-row h-screen p-4 gap-4">
            <div className={`contents ${selectedWebhookId ? 'hidden md:contents' : 'contents'}`}>
                <Sidebar
                    webhooks={webhooks}
                    selectedId={selectedWebhookId}
                    onSelect={setSelectedWebhookId}
                    onCreateSuccess={handleCreateSuccess}
                />
            </div>

            <div className={`contents ${!selectedWebhookId ? 'hidden md:contents' : 'contents'}`}>
                <MainContent
                    webhook={selectedWebhook}
                    onDeleteSuccess={handleDeleteSuccess}
                    onUpdate={() => {
                        fetchWebhooks();
                    }}
                    onClose={() => {
                        setSelectedWebhookId(null);
                    }}
                />
            </div>
        </div>
    );
}
