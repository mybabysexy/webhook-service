"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Plus } from "lucide-react";

const formSchema = z.object({
    name: z.string().optional(),
    path: z.string().min(1, "Path cannot be empty").regex(/^[a-zA-Z0-9-_/]+$/, "Invalid characters in path"),
    method: z.string(),
    responseStatus: z.coerce.number().min(80).max(999),
    responseData: z.string(),
});

interface CreateWebhookDialogProps {
    onSuccess: (webhook: any) => void;
}

export function CreateWebhookDialog({ onSuccess }: CreateWebhookDialogProps) {
    const [open, setOpen] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        // @ts-ignore
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            path: "",
            method: "POST",
            responseStatus: 200,
            responseData: "{}",
        },
    });

    useEffect(() => {
        if (open) {
            form.setValue("path", crypto.randomUUID());
        }
    }, [open, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const res = await fetch("/api/webhooks", {
                method: "POST",
                body: JSON.stringify(values),
            });

            if (res.ok) {
                const data = await res.json();
                onSuccess(data);
                setOpen(false);
                form.reset();
            } else {
                const err = await res.json();
                form.setError("path", { message: err.error });
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="btn">
                    <Plus className="w-4 h-4 mr-1" /> New
                </Button>
            </DialogTrigger>
            <DialogContent
                aria-describedby={undefined}
                className="p-0 border-0 bg-transparent shadow-none max-w-none w-auto sm:max-w-none [&>button]:hidden"
            >
                <VisuallyHidden>
                    <DialogTitle>Create Webhook</DialogTitle>
                </VisuallyHidden>
                <div className="window scale-down text-[1rem]" style={{ width: '35rem' }}>
                    <div className="title-bar">
                        <button aria-label="Close" className="close" onClick={() => setOpen(false)}></button>
                        <h1 className="title">Create Webhook</h1>
                    </div>
                    <div className="window-pane !overflow-hidden">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
                                <FormField
                                    control={form.control as any}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name (Optional)</FormLabel>
                                            <FormControl>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Stripe Integration"
                                                    className="w-full"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="path"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Path</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center gap-1 w-full">
                                                    <span className="shrink-0 text-lg">/</span>
                                                    <input
                                                        type="text"
                                                        placeholder="my-webhook"
                                                        className="w-full"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control as any}
                                        name="method"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Method</FormLabel>
                                                <FormControl>
                                                    <select
                                                        {...field}
                                                        className="!w-full"
                                                    >
                                                        <option value="POST">POST</option>
                                                        <option value="GET">GET</option>
                                                        <option value="PUT">PUT</option>
                                                        <option value="PATCH">PATCH</option>
                                                        <option value="DELETE">DELETE</option>
                                                        <option value="ANY">ANY</option>
                                                    </select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control as any}
                                        name="responseStatus"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status Code</FormLabel>
                                                <FormControl>
                                                    <select
                                                        {...field}
                                                        className="!w-full"
                                                    >
                                                        <option value="200">200 - OK</option>
                                                        <option value="201">201 - Created</option>
                                                        <option value="202">202 - Accepted</option>
                                                        <option value="204">204 - No Content</option>
                                                        <option value="400">400 - Bad Request</option>
                                                        <option value="401">401 - Unauthorized</option>
                                                        <option value="403">403 - Forbidden</option>
                                                        <option value="404">404 - Not Found</option>
                                                        <option value="500">500 - Server Error</option>
                                                    </select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control as any}
                                    name="responseData"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Response JSON</FormLabel>
                                            <FormControl>
                                                <textarea
                                                    {...field}
                                                    className="min-h-[100px] font-mono text-xs w-full"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end pt-2">
                                    <button type="submit" className="btn btn-default">
                                        Create
                                    </button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
