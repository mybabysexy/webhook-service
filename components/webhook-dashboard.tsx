"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { MainContent } from "@/components/main-content";
import { Webhook } from "@prisma/client";
import { useWebhooks } from "@/lib/hooks";

export function WebhookDashboard() {
    const { data: webhooks = [], isLoading, refetch } = useWebhooks();
    const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);

    const handleCreateSuccess = (newWebhook: Webhook) => {
        setSelectedWebhookId(newWebhook.id);
    };

    const handleDeleteSuccess = (id: string) => {
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
                    onDeleteSuccess={handleDeleteSuccess}
                />
            </div>

            <div className={`contents ${!selectedWebhookId ? 'hidden md:contents' : 'contents'}`}>
                <MainContent
                    webhook={selectedWebhook}
                    onDeleteSuccess={handleDeleteSuccess}
                    onUpdate={() => {
                        refetch();
                    }}
                    onClose={() => {
                        setSelectedWebhookId(null);
                    }}
                />
            </div>
        </div>
    );
}
