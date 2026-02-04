"use client";

import { useState, useEffect, useRef } from "react";
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";

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
    
    // Sheet state
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [responseDetails, setResponseDetails] = useState<any>(null);
    const [isRawResponse, setIsRawResponse] = useState(false);
    const [hasExtension, setHasExtension] = useState(false);

    // Check for extension on mount via Ping
    useEffect(() => {
        if (typeof window === 'undefined') return;
        // Send a ping in case extension is already loaded
        window.postMessage({ type: "PING_EXTENSION" }, "*");
    }, []);

    // Listen for extension responses
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleMessage = (event: MessageEvent) => {
            if (event.source !== window) return;
            
            // Clear existing timeout to debounce
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            debounceRef.current = setTimeout(() => {
                if (event.data.type === "FORWARD_WEBHOOK_RESPONSE") {
                    const result = event.data.payload;
                    
                    // Filter: Only process if this response belongs to this item
                    if (result.requestId !== request.id) {
                        return;
                    }

                    console.log("Received response from extension:", result);
                    
                    setResponseDetails(result);
                    setIsSheetOpen(true);
                    setIsForwarding(false);
                }
                if (event.data.type === "EXTENSION_LOADED") {
                    setHasExtension(true);
                }
            }, 300);
        };

        window.addEventListener("message", handleMessage);
        return () => {
            window.removeEventListener("message", handleMessage);
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const handleForward = async () => {
        if (!forwardIp) return;
        setIsForwarding(true);
        setResponseDetails(null);
        setIsRawResponse(false);

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

            const requestData = {
                targetUrl,
                method: request.method,
                headers,
                body: request.body,
                requestId: request.id // Add ID for filtering
            };
            // Strategy: 
            // 1. If extension is detected, use it.
            // 2. Fallback to server-side forwarding.

            if (hasExtension) {
                console.log("Forwarding via Extension");
                window.postMessage({
                    type: "FORWARD_WEBHOOK_REQUEST",
                    payload: requestData
                }, "*");
                // isForwarding set to false in event listener
                return;
            }

            // Fallback to Server-Side API
            console.log("Forwarding via Server API");
            const response = await fetch('/api/forward', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            const result = await response.json();

            setResponseDetails(result);
            setIsSheetOpen(true);
            setIsForwarding(false); // Done

            if (!response.ok) {
                console.error("Forwarding failed", result);
            }

        } catch (e: any) {
            console.error(`Error forwarding: ${e.message}`);
            setIsForwarding(false);
        }
    };

    return (
        <>
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
                        {(forwardIp.includes("localhost") || forwardIp.includes("127.0.0.1")) && !hasExtension && (
                            <p className="text-[10px] text-amber-600 mt-1">
                                ⚠️ For localhost, please install the <b>Chrome Extension</b>.
                            </p>
                        )}
                        {hasExtension && (
                            <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                                ✅ Chrome Extension detected.
                            </p>
                        )}
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
                        <div className="bg-gray-100 p-2 border border-gray-300 font-sans! text-sm overflow-auto max-h-96 whitespace-pre-wrap">
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

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-[500px] sm:w-[540px] overflow-y-auto flex flex-col">
                    <SheetHeader>
                        <SheetTitle>Forwarding Response</SheetTitle>
                        <SheetDescription>
                            Response details from the forwarded request.
                        </SheetDescription>
                    </SheetHeader>
                    
                    {responseDetails && (
                        <div className="px-4 space-y-6 flex-1">
                            <div>
                                <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Status</h4>
                                <div className="flex items-center gap-2">
                                    <span className={clsx(
                                        "px-2 py-1 rounded text-sm font-bold",
                                        responseDetails.status >= 200 && responseDetails.status < 300 
                                            ? "bg-green-100 text-green-700" 
                                            : "bg-red-100 text-red-700"
                                    )}>
                                        {responseDetails.status} {responseDetails.statusText}
                                    </span>
                                </div>
                            </div>

                            {responseDetails.response && (
                                <>  
                                    {/* Headers from the forwarded response (if available in future backend updates) */}
                                    {/* Ideally we would show headers here if the backend returned them in 'response' */}
                                    
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-sm font-bold text-gray-500 uppercase">Response Body</h4>
                                            <RetroSwitch
                                                label="Raw"
                                                checked={isRawResponse}
                                                onChange={setIsRawResponse}
                                                className="text-gray-400"
                                            />
                                        </div>
                                         <div className="border border-gray-200 rounded p-2 bg-gray-50 overflow-auto max-h-[60vh]">
                                            {isRawResponse ? (
                                                <pre className="p-2 font-mono text-xs whitespace-pre-wrap">
                                                    {typeof responseDetails.response === 'string' 
                                                        ? responseDetails.response 
                                                        : JSON.stringify(responseDetails.response, null, 4)}
                                                </pre>
                                            ) : (
                                                <JsonView data={responseDetails.response} style={defaultStyles} />
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            {!responseDetails.response && (
                                <div className="text-gray-400 italic text-sm">
                                    No response body returned.
                                </div>
                            )}
                        </div>
                    )}

                    <SheetFooter className="sm:justify-center border-t mt-auto">
                        <div className="text-center text-xs text-gray-400">
                            <p className="mb-2">Need to forward to localhost?</p>
                            <a 
                                href="/extension/extension.zip"
                                onClick={(e) => {
                                    e.preventDefault();
                                    alert("To install the extension:\n1. Open chrome://extensions\n2. Enable Developer Mode\n3. Click 'Load Unpacked'\n4. Select the 'public/extension' folder in this project.");
                                }}
                                className="text-primary hover:underline cursor-pointer"
                            >
                                Download Chrome Extension Bridge
                            </a>
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}
