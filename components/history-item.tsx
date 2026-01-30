"use client";

import { useState } from "react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { JsonView, darkStyles, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import clsx from "clsx";
import { RetroSwitch } from "@/components/retro-switch";

interface HistoryItemProps {
    request: any;
}

export function HistoryItem({ request }: HistoryItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isRawHeaders, setIsRawHeaders] = useState(false);
    const [isRawBody, setIsRawBody] = useState(false);

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="border-[.1rem] border-[var(--primary)]"
        >
            <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm">
                                {new Date(request.timestamp).toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-500">ID: {request.id.slice(0, 8)}...</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={clsx("text-xs font-bold px-1 border border-black",
                            "bg-[var(--primary)] text-white"
                        )}>{request.method}</span>
                    </div>
                </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="p-3 space-y-4 text-sm bg-white">
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
                    <div className="bg-gray-100 p-2 border border-gray-300 font-mono text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                        {isRawHeaders ? (
                            JSON.stringify(request.headers, null, 4)
                        ) : (
                            Object.entries(request.headers).map(([k, v]) => (
                                <div key={k}><span className="font-bold">{k}:</span> {String(v)}</div>
                            ))
                        )}
                    </div>
                </div>
                <div>
                    <h4 className="font-bold mb-1 text-xs uppercase text-gray-500">Query Params</h4>
                    <div className="bg-gray-100 p-2 border border-gray-300 font-mono text-xs overflow-auto">
                        {Object.keys(request.query).length > 0 ? (
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
                        {request.body && Object.keys(request.body).length > 0 ? (
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
