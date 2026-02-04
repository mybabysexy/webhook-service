"use client";

import { useState } from "react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Loader2, Send } from "lucide-react";
import { JsonView, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import clsx from "clsx";
import { RetroSwitch } from "@/components/retro-switch";
import { WebhookRequest } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { format } from "date-fns";

interface HistoryItemProps {
    request: WebhookRequest;
    className?: string; // Add className prop
}

// Type guard to check if JsonValue is an object
function isJsonObject(value: Prisma.JsonValue): value is Prisma.JsonObject {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function HistoryItem({ request, className }: HistoryItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isRawHeaders, setIsRawHeaders] = useState(false);
    const [isRawBody, setIsRawBody] = useState(false);
    const [forwardIp, setForwardIp] = useState("");
    const [isForwarding, setIsForwarding] = useState(false);

    const handleForward = async () => {
        if (!forwardIp) return;
        setIsForwarding(true);
        try {
            // Construct the target URL
            // Ensure http:// or https:// is present, if not assume http://
            let targetUrl = forwardIp;
            if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
                targetUrl = `http://${targetUrl}`;
            }
            
            new URL(targetUrl); // validate URL
            
            // Prepare headers
            const headers: Record<string, string> = {};
            if (isJsonObject(request.headers)) {
                Object.entries(request.headers).forEach(([k, v]) => {
                     headers[k] = String(v);
                });
            }

            // Forward via server-side API
            await fetch('/api/forward', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    targetUrl,
                    method: request.method,
                    headers,
                    body: request.body
                }),
            });
        } catch (e: any) {
            alert(`Error forwarding: ${e.message}`);
        } finally {
            setIsForwarding(false);
        }
    };

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className={clsx("border-[.1rem] border-[var(--primary)]", className)} // Merge className
        >
            <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm">
                                {format(new Date(request.timestamp), "dd/MM/yyyy HH:mm:ss")}
                            </span>
                            <span className="text-xs text-gray-500">ID: {request.id.slice(0, 8)}...</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isJsonObject(request.headers) && request.headers['x-webhook-response-status'] && (
                            <span className="text-xs font-bold px-1 border border-black text-white bg-[var(--primary)]">
                                {String(request.headers['x-webhook-response-status'])}
                            </span>
                        )}
                        <span className={clsx("text-xs font-bold px-1 border border-black",
                            "bg-[var(--primary)] text-white"
                        )}>{request.method}</span>
                    </div>
                </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="p-3 space-y-4 text-sm bg-white">
                <div className="border-l-3 border-gray-200 pl-3 py-1">
                    <h4 className="font-bold text-xs uppercase text-gray-500 mb-2">Forward Request</h4>
                    <div className="flex items-center gap-2">
                         <input
                            type="text"
                            placeholder="e.g. 192.168.1.5:8080 or localhost:3000"
                            className="flex-1 border border-gray-300 rounded px-2 h-8 text-sm font-mono"
                            value={forwardIp}
                            disabled={isForwarding}
                            onChange={(e) => setForwardIp(e.target.value)}
                        />
                        <Button
                            size="sm"
                            onClick={handleForward}
                            disabled={!forwardIp || isForwarding}
                            className="h-8"
                        >
                            {isForwarding ? <Loader2 className="h-3 w-3 animate-spin"/> : <Send className="h-3 w-3" />}
                            <span className="ml-2">Send</span>
                        </Button>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-xs uppercase text-gray-500">Headers</h4>
                        <RetroSwitch
                            label="Raw"
                            checked={isRawHeaders}
                            onChange={setIsRawHeaders}
                            className="text-gray-400"
                        />
                    </div>
                    <div className="bg-gray-100 p-2 border border-gray-300 font-sans! text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                        {isRawHeaders ? (
                            JSON.stringify(request.headers, null, 4)
                        ) : (
                            isJsonObject(request.headers) && Object.entries(request.headers).map(([k, v]) => (
                                <div key={k}><span className="font-bold">{k}:</span> {String(v)}</div>
                            ))
                        )}
                    </div>
                </div>
                <div>
                    <h4 className="font-bold mb-1 text-xs uppercase text-gray-500">Query Params</h4>
                    <div className="bg-gray-100 p-2 border border-gray-300 font-sans! text-xs overflow-auto">
                        {isJsonObject(request.query) && Object.keys(request.query).length > 0 ? (
                            Object.entries(request.query).map(([k, v]) => (
                                <div key={k}><span className="font-bold">{k}:</span> {String(v)}</div>
                            ))
                        ) : <span className="text-gray-400">None</span>}
                    </div>
                </div>
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-xs uppercase text-gray-500">Body</h4>
                        <RetroSwitch
                            label="Raw"
                            checked={isRawBody}
                            onChange={setIsRawBody}
                            className="text-gray-400"
                        />
                    </div>
                    <div className="border border-gray-300 overflow-auto max-h-96 bg-gray-50">
                        {request.body && isJsonObject(request.body) && Object.keys(request.body).length > 0 ? (
                            isRawBody ? (
                                <pre className="p-2 font-mono text-xs whitespace-pre-wrap">
                                    {JSON.stringify(request.body, null, 4)}
                                </pre>
                            ) : (
                                <JsonView data={request.body} style={defaultStyles} />
                            )
                        ) : (
                            <div className="p-2 text-gray-400 font-mono text-xs">Empty Body</div>
                        )}
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
