import { useState, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
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
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { Webhook } from "@prisma/client";
import { useCreateWebhook, useUpdateWebhook } from "@/lib/hooks";

const formSchema = z.object({
    name: z.string().optional(),
    path: z.string().min(1, "Path cannot be empty").regex(/^[a-zA-Z0-9-_/]+$/, "Invalid characters in path"),
    method: z.string(),
    responseStatus: z.string().refine((val) => {
        const num = parseInt(val);
        return !isNaN(num) && num >= 100 && num <= 599;
    }, "Must be a valid HTTP status code"),
    responseData: z.string().refine((val) => {
        try {
            JSON.parse(val);
            return true;
        } catch {
            return false;
        }
    }, "Invalid JSON format"),
    authEnabled: z.boolean(),
    authType: z.enum(["bearer", "query"]).optional(),
    authToken: z.string().optional(),
});

type WebhookFormValues = z.infer<typeof formSchema>;

interface WebhookDialogProps {
    onSuccess: (webhook: Webhook) => void;
}

export interface WebhookDialogHandle {
    openForCreate: () => void;
    openForDuplicate: (webhook: Webhook) => void;
    openForUpdate: (webhook: Webhook) => void;
}

export const WebhookDialog = forwardRef<WebhookDialogHandle, WebhookDialogProps>(({ onSuccess }, ref) => {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'update'>('create');
    const [webhookId, setWebhookId] = useState<string | null>(null);

    const createMutation = useCreateWebhook();
    const updateMutation = useUpdateWebhook();

    const form = useForm<WebhookFormValues>({
        resolver: zodResolver(formSchema),
        mode: "onSubmit",
        reValidateMode: "onSubmit",
        defaultValues: {
            name: "",
            path: "",
            method: "POST",
            responseStatus: "200",
            responseData: `{"success": true}`,
            authEnabled: false,
            authType: "bearer",
            authToken: ""
        },
    });

    useImperativeHandle(ref, () => ({
        openForCreate: () => {
            setMode('create');
            setWebhookId(null);
            form.reset({
                name: "",
                path: crypto.randomUUID(),
                method: "POST",
                responseStatus: "200",
                responseData: `{"success": true}`,
                authEnabled: false,
                authType: "bearer",
                authToken: ""
            });
            setOpen(true);
        },
        openForDuplicate: (webhook: Webhook) => {
            setMode('create');
            setWebhookId(null);
            form.reset({
                name: webhook.name ? `${webhook.name} (Copy)` : "",
                path: `${webhook.path}-copy`,
                method: webhook.method,
                responseStatus: String(webhook.responseStatus),
                responseData: typeof webhook.responseData === 'string'
                    ? webhook.responseData
                    : JSON.stringify(webhook.responseData, null, 2),
                authEnabled: webhook.authEnabled,
                authType: (webhook.authType === "bearer" || webhook.authType === "query")
                    ? webhook.authType
                    : "bearer",
                authToken: webhook.authToken || ""
            });
            setOpen(true);
        },
        openForUpdate: (webhook: Webhook) => {
            setMode('update');
            setWebhookId(webhook.id);
            form.reset({
                name: webhook.name || "",
                path: webhook.path,
                method: webhook.method,
                responseStatus: String(webhook.responseStatus),
                responseData: typeof webhook.responseData === 'string'
                    ? webhook.responseData
                    : JSON.stringify(webhook.responseData, null, 2),
                authEnabled: webhook.authEnabled,
                authType: (webhook.authType === "bearer" || webhook.authType === "query")
                    ? webhook.authType
                    : "bearer",
                authToken: webhook.authToken || ""
            });
            setOpen(true);
        }
    }));

    const onSubmit = async (values: WebhookFormValues) => {
        try {
            const submissionData = {
                ...values,
                responseStatus: parseInt(values.responseStatus),
                authType: values.authEnabled ? values.authType : undefined,
                authToken: values.authEnabled ? values.authToken : undefined
            };

            let data;
            if (mode === 'create') {
                data = await createMutation.mutateAsync(submissionData);
            } else if (mode === 'update' && webhookId) {
                data = await updateMutation.mutateAsync({ id: webhookId, data: submissionData });
            }
            
            if (data) {
                onSuccess(data);
                setOpen(false);
                form.reset();
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "An error occurred";
            form.setError("path", { message });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                aria-describedby={undefined}
                className="p-0 border-0 bg-transparent shadow-none max-w-none w-auto sm:max-w-none [&>button]:hidden"
            >
                <VisuallyHidden>
                    <DialogTitle>{mode === 'create' ? "Create Webhook" : "Update Webhook"}</DialogTitle>
                </VisuallyHidden>
                <div className="window scale-down text-[1rem]" style={{ width: '35rem' }}>
                    <div className="title-bar">
                        <button aria-label="Close" className="close" onClick={() => setOpen(false)}></button>
                        <h1 className="title">{mode === 'create' ? "Create Webhook" : "Update Webhook"}</h1>
                    </div>
                    <div className="window-pane !overflow-hidden">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
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
                                    control={form.control}
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
                                        control={form.control}
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
                                        control={form.control}
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
                                    control={form.control}
                                    name="responseData"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Response JSON</FormLabel>
                                            <FormControl>
                                                <div className="border border-black overflow-hidden bg-white">
                                                    <CodeMirror
                                                        value={field.value}
                                                        height="150px"
                                                        extensions={[json()]}
                                                        onChange={(value: string) => {
                                                            field.onChange(value)
                                                            form.clearErrors(field.name)
                                                        }}
                                                        theme="light"
                                                        className="text-xs font-mono"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="separator"></div>

                                <FormField
                                    control={form.control}
                                    name="authEnabled"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center gap-2">
                                                <FormControl>
                                                    <input
                                                        type="checkbox"
                                                        checked={field.value}
                                                        onChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel className="!mb-0">Enable Authentication</FormLabel>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {form.watch("authEnabled") && (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="authType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Auth Type</FormLabel>
                                                    <FormControl>
                                                        <select
                                                            {...field}
                                                            className="!w-full"
                                                        >
                                                            <option value="bearer">Bearer Token (Header)</option>
                                                            <option value="query">Query Parameter</option>
                                                        </select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="authToken"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Token</FormLabel>
                                                    <FormControl>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter your authentication token"
                                                            className="w-full font-mono"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => setOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-default">
                                        {mode === 'create' ? "Create" : "Update"}
                                    </button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
});

WebhookDialog.displayName = "WebhookDialog";
