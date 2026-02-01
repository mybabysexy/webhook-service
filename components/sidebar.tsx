"use client";

import { useState, useRef } from "react";
import { CreateWebhookDialog, CreateWebhookDialogHandle } from "@/components/create-webhook-dialog";
import { Webhook } from "@prisma/client";
import clsx from "clsx";
import { Copy, Trash2 } from "lucide-react";
import { useDeleteWebhook } from "@/lib/hooks";
import { RetroAlert } from "@/components/retro-alert";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface SidebarProps {
    webhooks: Webhook[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onCreateSuccess: (webhook: Webhook) => void;
    onDeleteSuccess: (id: string) => void;
}

export function Sidebar({ webhooks, selectedId, onSelect, onCreateSuccess, onDeleteSuccess }: SidebarProps) {
    const [search, setSearch] = useState("");
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [webhookToDelete, setWebhookToDelete] = useState<string | null>(null);
    const createDialogRef = useRef<CreateWebhookDialogHandle>(null);

    const deleteMutation = useDeleteWebhook();

    const filteredWebhooks = webhooks.filter((w) =>
        w.path.toLowerCase().includes(search.toLowerCase())
    );

    const handleDuplicate = (webhookId: string) => {
        const webhook = webhooks.find(w => w.id === webhookId);
        if (webhook && createDialogRef.current) {
            createDialogRef.current.openWithData(webhook);
        }
    };

    const handleDelete = (webhookId: string) => {
        setWebhookToDelete(webhookId);
        setShowDeleteAlert(true);
    };

    const confirmDelete = async () => {
        if (!webhookToDelete) return;
        try {
            await deleteMutation.mutateAsync(webhookToDelete);
            onDeleteSuccess(webhookToDelete);
            setShowDeleteAlert(false);
            setWebhookToDelete(null);
        } catch (error) {
            console.error("Failed to delete webhook:", error);
        }
    };

    return (
        <div className="window flex flex-col h-full !m-0 !w-full md:!w-80 shrink-0">
            <div className="title-bar">
                <button aria-label="Close" className="close hidden"></button>
                <h1 className="title">Webhooks</h1>
                <button aria-label="Resize" className="resize hidden"></button>
            </div>

            <div className="window-pane !p-2 flex flex-col gap-2 !overflow-y-auto">
                <div className="flex gap-2 items-center">
                    <div className="grow">
                        <input
                            type="search"
                            placeholder="Search..."
                            className="w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <CreateWebhookDialog ref={createDialogRef} onSuccess={onCreateSuccess} />
                </div>

                <div className="separator !my-2"></div>

                <div className="flex flex-col gap-1">
                    {filteredWebhooks.length === 0 ? (
                        <div className="text-center text-gray-500 mt-4 text-sm">No webhooks found.</div>
                    ) : (
                        filteredWebhooks.map((webhook) => (
                            <ContextMenu key={webhook.id}>
                                <ContextMenuTrigger asChild>
                                    <div
                                        onClick={() => onSelect(webhook.id)}
                                        className={clsx(
                                            "p-2 flex items-center justify-between cursor-pointer border-2 hover:bg-[var(--primary)] hover:text-white group",
                                            selectedId === webhook.id
                                                ? "bg-[var(--primary)] text-white border-transparent border-dotted"
                                                : "bg-white border-transparent"
                                        )}
                                    >
                                        <span className="font-bold truncate">{webhook.name || `/${webhook.path}`}</span>
                                        {webhook.method !== "ANY" && (
                                            <span className="text-xs ml-2 opacity-70">{webhook.method}</span>
                                        )}
                                    </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                    <ContextMenuItem onClick={() => handleDuplicate(webhook.id)}>
                                        <Copy className="w-4 h-4 mr-2" />
                                        <span>Duplicate</span>
                                    </ContextMenuItem>
                                    <ContextMenuItem onClick={() => handleDelete(webhook.id)}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        <span>Delete</span>
                                    </ContextMenuItem>
                                </ContextMenuContent>
                            </ContextMenu>
                        ))
                    )}
                </div>
            </div>

            <RetroAlert
                open={showDeleteAlert}
                onOpenChange={setShowDeleteAlert}
                title="Delete Webhook"
                message="Are you sure you want to delete this webhook? This action cannot be undone."
                onConfirm={confirmDelete}
            />
        </div>
    );
}
