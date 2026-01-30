import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Webhook } from "@prisma/client";

export type WebhookWithRequests = Webhook & {
    requests: any[];
};

export function useWebhooks() {
    return useQuery<Webhook[]>({
        queryKey: ["webhooks"],
        queryFn: async () => {
            const res = await fetch("/api/webhooks");
            if (!res.ok) throw new Error("Failed to fetch webhooks");
            return res.json();
        },
    });
}

export function useWebhookDetails(id: string | null) {
    return useQuery<WebhookWithRequests>({
        queryKey: ["webhooks", id],
        queryFn: async () => {
            const res = await fetch(`/api/webhooks/${id}`);
            if (!res.ok) throw new Error("Failed to fetch webhook details");
            return res.json();
        },
        enabled: !!id,
    });
}

export function useCreateWebhook() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newWebhook: any) => {
            const res = await fetch("/api/webhooks", {
                method: "POST",
                body: JSON.stringify(newWebhook),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create webhook");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["webhooks"] });
        },
    });
}

export function useUpdateWebhook() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await fetch(`/api/webhooks/${id}`, {
                method: "PATCH",
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update webhook");
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["webhooks"] });
            queryClient.invalidateQueries({ queryKey: ["webhooks", data.id] });
        },
    });
}

export function useDeleteWebhook() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/webhooks/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete webhook");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["webhooks"] });
        },
    });
}
