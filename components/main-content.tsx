"use client";

import { useState } from "react";

import { HistoryItem } from "@/components/history-item";
import { Trash2, Loader2, RefreshCw, Copy } from "lucide-react";

import { RetroAlert } from "@/components/retro-alert";
import { RetroSwitch } from "@/components/retro-switch";

interface MainContentProps {
    webhook: any | null;
    onDeleteSuccess: (id: string) => void;
    onUpdate: () => void;
    onClose: () => void;
}

import { useWebhookDetails, useUpdateWebhook, useDeleteWebhook } from "@/lib/hooks";

export function MainContent({ webhook, onDeleteSuccess, onUpdate, onClose }: MainContentProps) {
    const { data: details, isLoading: loading, refetch } = useWebhookDetails(webhook?.id || null);
    const updateMutation = useUpdateWebhook();
    const deleteMutation = useDeleteWebhook();
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    const toggleStatus = async () => {
        if (!details) return;
        const newStatus = !details.enabled;
        await updateMutation.mutateAsync({
            id: details.id,
            data: { enabled: newStatus }
        });
        onUpdate(); // update sidebar list
    };

    const confirmDelete = async () => {
        if (!details) return;
        await deleteMutation.mutateAsync(details.id);
        onDeleteSuccess(details.id);
    };

    const handleDeleteClick = () => {
        if (!details) return;
        setShowDeleteAlert(true);
    };

    if (!webhook) {
        return (
            <div className="flex-1 flex items-center justify-center border-[.1rem] border-[var(--primary)]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Welcome</h2>
                    <h2 className="!text-sm text-gray-500">Select a webhook to view details or create a new one.</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="window flex flex-col h-full !m-0 !w-full md:!w-auto grow border-l-0">
            {/* Header / Title Bar */}
            <div className="title-bar">
                <button aria-label="Close" className="close" onClick={onClose}></button>
                <h1 className="title line-clamp-1">{details?.name || webhook.name || details?.path || (webhook.path ? `/${webhook.path}` : "New Webhook")}</h1>
                <button aria-label="Resize" className="resize hidden"></button>
            </div>

            {/* Details Bar / Metadata */}
            <div className="details-bar flex items-center justify-between !h-auto !py-1">
                <div className="flex items-center gap-2">
                    <span className="font-bold">{details?.method || webhook.method}</span>
                    <div className="h-4 w-[1px] bg-black mx-1"></div>
                    <RetroSwitch
                        id="status-mode"
                        label={(details?.enabled ?? webhook.enabled) ? "Enabled" : "Disabled"}
                        checked={details?.enabled ?? webhook.enabled}
                        onChange={() => toggleStatus()}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleDeleteClick} className="btn !min-w-0 !px-2 !min-h-0 !py-0 flex items-center gap-1 text-sm">
                        <Trash2 className="w-3 h-3" /> Delete
                    </button>
                </div>
            </div>

            {/* Window Pane / Content */}
            <div className="window-pane !p-4 flex flex-col gap-4 !overflow-y-auto">
                {/* URL Section */}
                <div className="flex flex-col gap-1">
                    <label className="font-bold text-sm">Webhook URL:</label>
                    <div className="flex items-center gap-2">
                        <input
                            readOnly
                            className="w-full text-sm font-mono"
                            value={typeof window !== 'undefined' ? `${window.location.origin}/webhook/${details?.path || webhook.path}` : ''}
                        />
                        <button
                            className="btn !min-w-0 !px-3"
                            onClick={() => {
                                const url = `${window.location.origin}/webhook/${details?.path || webhook.path}`;
                                navigator.clipboard.writeText(url);
                            }}
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Authentication Section */}
                {(details?.authEnabled || webhook?.authEnabled) && (
                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-sm">Authentication:</label>
                        <div className="flex flex-col gap-1 text-sm">
                            <div className="flex gap-2">
                                <span className="font-semibold">Type:</span>
                                <span>{(details?.authType || webhook?.authType) === 'bearer' ? 'Bearer Token (Header)' : 'Query Parameter (?token=...)'}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-semibold">Token:</span>
                                <code className="font-mono bg-gray-100 px-1">{details?.authToken || webhook?.authToken}</code>
                            </div>
                            {(details?.authType || webhook?.authType) === 'bearer' && (
                                <div className="text-xs text-gray-600 mt-1">
                                    Use header: <code className="font-mono bg-gray-100 px-1">Authorization: Bearer {details?.authToken || webhook?.authToken}</code>
                                </div>
                            )}
                            {(details?.authType || webhook?.authType) === 'query' && (
                                <div className="text-xs text-gray-600 mt-1">
                                    Example: <code className="font-mono bg-gray-100 px-1">{typeof window !== 'undefined' ? `${window.location.origin}/webhook/${details?.path || webhook.path}?token=${details?.authToken || webhook?.authToken}` : ''}</code>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="separator"></div>

                {/* History Section */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg">Request History</h3>
                        <button className="btn !min-w-0 !px-2" onClick={() => refetch()}>
                            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                        </button>
                    </div>

                    {loading && !details ? (
                        <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
                    ) : (details?.requests?.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            No requests yet.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {details?.requests?.map((req: any) => (
                                <HistoryItem key={req.id} request={req} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <RetroAlert
                open={showDeleteAlert}
                onOpenChange={setShowDeleteAlert}
                title="Delete Webhook"
                message="Are you sure you want to delete this webhook?"
                onConfirm={confirmDelete}
            />
        </div>
    );
}
