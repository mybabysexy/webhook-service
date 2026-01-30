import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/webhook/[...path]/route';
import { prismaMock } from './prisma-mock';

describe('Webhook Ingestion Handler', () => {
    it('should handle valid webhook request', async () => {
        const mockWebhook = {
            id: 'webhook-id',
            path: 'test/path',
            enabled: true,
            method: 'POST',
            responseStatus: 200,
            responseData: { received: true },
        };

        prismaMock.webhook.findUnique.mockResolvedValue(mockWebhook as any);
        prismaMock.webhookRequest.create.mockResolvedValue({ id: 'req-id' } as any);

        const request = new Request('http://localhost/webhook/test/path', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ foo: 'bar' }),
        });

        const response = await POST(request, { params: Promise.resolve({ path: ['test', 'path'] }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({ received: true });
        expect(prismaMock.webhookRequest.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                webhookId: 'webhook-id',
                method: 'POST',
            })
        }));
    });

    it('should return 404 if webhook not found', async () => {
        prismaMock.webhook.findUnique.mockResolvedValue(null);

        const request = new Request('http://localhost/webhook/not/found', {
            method: 'POST'
        });

        const response = await POST(request, { params: Promise.resolve({ path: ['not', 'found'] }) });
        expect(response.status).toBe(404);
    });

    it('should return 503 if webhook is disabled', async () => {
        prismaMock.webhook.findUnique.mockResolvedValue({ enabled: false } as any);

        const request = new Request('http://localhost/webhook/disabled', {
            method: 'POST'
        });

        const response = await POST(request, { params: Promise.resolve({ path: ['disabled'] }) });
        expect(response.status).toBe(503);
    });
});
