"use client";

import { useState } from "react";
import { CreateWebhookDialog } from "@/components/create-webhook-dialog";
import { Webhook } from "@prisma/client";
import clsx from "clsx";

interface SidebarProps {
    webhooks: Webhook[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onCreateSuccess: (webhook: Webhook) => void;
}

export function Sidebar({ webhooks, selectedId, onSelect, onCreateSuccess }: SidebarProps) {
    const [search, setSearch] = useState("");

    const filteredWebhooks = webhooks.filter((w) =>
        w.path.toLowerCase().includes(search.toLowerCase())
    );

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
                    <CreateWebhookDialog onSuccess={onCreateSuccess} />
                </div>

                <div className="separator !my-2"></div>

                <div className="flex flex-col gap-1">
                    {filteredWebhooks.length === 0 ? (
                        <div className="text-center text-gray-500 mt-4 text-sm">No webhooks found.</div>
                    ) : (
                        filteredWebhooks.map((webhook) => (
                            <div
                                key={webhook.id}
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
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
