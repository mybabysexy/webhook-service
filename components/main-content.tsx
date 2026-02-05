"use client";

import { useState, useEffect } from "react";

import { HistoryItem } from "@/components/history-item";
import { Trash2, Loader2, RefreshCw, Copy, Zap } from "lucide-react";

import { RetroAlert } from "@/components/retro-alert";
import { RetroSwitch } from "@/components/retro-switch";
import { Webhook } from "@prisma/client";

interface MainContentProps {
    webhook: Webhook | null;
    onDeleteSuccess: (id: string) => void;
    onUpdate: () => void;
    onClose: () => void;
    onEditClick: (webhook: Webhook) => void;
}

import { useWebhookDetails, useUpdateWebhook, useDeleteWebhook } from "@/lib/hooks";
import { Edit } from "lucide-react";

export function MainContent({ webhook, onDeleteSuccess, onUpdate, onClose, onEditClick }: MainContentProps) {
    const { data: details, isLoading: loading, refetch } = useWebhookDetails(webhook?.id || null);
    const updateMutation = useUpdateWebhook();
    const deleteMutation = useDeleteWebhook();
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const [liveModePrevIds, setLiveModePrevIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        let interval: number;
        if (isLive) {
            interval = window.setInterval(() => {
                refetch();
            }, 1000);
        }
        return () => {
            if (interval) window.clearInterval(interval);
        };
    }, [isLive, refetch]);

    // Check for extension on mount via Ping
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Send a ping in case extension is already loaded
        const ping = () => {
            window.postMessage({ type: "PING_EXTENSION" }, "*");
        }

        ping();

        const interval = window.setInterval(ping, 1000);

        return () => window.clearInterval(interval);
    }, []);

    // useEffect(() => {
    //     if (typeof window === 'undefined') return;

    //     const handleMessage = (event: MessageEvent) => {
    //         if (event.data.type === "EXTENSION_LOADED") {
    //             console.log("PONG");
    //         }
    //     };

    //     window.addEventListener("message", handleMessage);
    //     return () => {
    //         window.removeEventListener("message", handleMessage);
    //     };
    // }, []);

    const toggleLive = () => {
        if (!isLive) {
            setIsLive(true);
            if (details?.requests) {
                setLiveModePrevIds(new Set(details.requests.map(r => r.id)));
            }
        } else {
            setIsLive(false);
            setLiveModePrevIds(new Set());
        }
    };

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

    const handleEditClick = () => {
        if (details) {
            // merge details with base webhook to ensure we have all fields if details are partial
            // though details should be fuller than webhook
           onEditClick(details);
        } else if (webhook) {
            onEditClick(webhook);
        }
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
                    <button onClick={handleEditClick} className="btn !min-w-0 !px-2 !min-h-0 !py-0 flex items-center gap-1 text-sm">
                        <Edit className="w-3 h-3" /> Edit
                    </button>
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
                            className="w-full text-sm font-mono h-7"
                            value={typeof window !== 'undefined' ? `${window.location.origin}/webhook/${details?.path || webhook.path}` : ''}
                        />
                        <button
                            className="btn !min-w-0 !px-3 h-7"
                            onClick={() => {
                                const url = `${window.location.origin}/webhook/${details?.path || webhook.path}`;
                                navigator.clipboard.writeText(url);
                            }}
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="separator"></div>

                {/* History Section */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg">Request History</h3>
                        <div className="flex items-center gap-2">
                            <button
                                className={`btn !min-w-0 !px-2 flex items-center gap-1 ${isLive ? "!bg-red-50 !text-red-500 !border-red-500" : ""}`}
                                onClick={toggleLive}
                                title={isLive ? "Stop Live Mode" : "Start Live Mode"}
                            >
                                <Zap className={`w-3 h-3 ${isLive ? "fill-current animate-pulse" : ""}`} />
                                <span className="text-xs font-bold">Live</span>
                            </button>
                            <button className="btn !min-w-0 !px-2" onClick={() => refetch()}>
                                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {loading && !details ? (
                        <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
                    ) : (details?.requests?.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            No requests yet.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {details?.requests?.map((req) => (
                                <HistoryItem
                                    key={req.id}
                                    request={req}
                                    className={isLive && liveModePrevIds.has(req.id) ? "opacity-30 grayscale transition-all duration-300" : "transition-all duration-300"}
                                />
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
