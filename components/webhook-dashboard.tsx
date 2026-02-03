"use client";

import { useState, useRef } from "react";
import { Sidebar } from "@/components/sidebar";
import { MainContent } from "@/components/main-content";
import { Webhook } from "@prisma/client";
import { useWebhooks } from "@/lib/hooks";

import { Loader2 } from "lucide-react";
import { WebhookDialog, WebhookDialogHandle } from "@/components/webhook-dialog";

export function WebhookDashboard() {
    const { data: webhooks = [], isLoading, refetch } = useWebhooks();
    const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
    const dialogRef = useRef<WebhookDialogHandle>(null);

    // Initial loading state
    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    const handleSuccess = (webhook: Webhook) => {
        setSelectedWebhookId(webhook.id);
        refetch(); // Ensure list is updated
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
                    onCreateSuccess={handleSuccess}
                    onDeleteSuccess={handleDeleteSuccess}
                    onCreateClick={() => dialogRef.current?.openForCreate()}
                    onDuplicateClick={(w) => dialogRef.current?.openForDuplicate(w)}
                    onEditClick={(w) => dialogRef.current?.openForUpdate(w)}
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
                    onEditClick={(w) => dialogRef.current?.openForUpdate(w)}
                />
            </div>
            
            <WebhookDialog ref={dialogRef} onSuccess={handleSuccess} />
        </div>
    );
}
