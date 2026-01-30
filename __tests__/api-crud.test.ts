import { describe, it, expect, vi } from 'vitest';
import { GET, POST } from '@/app/api/webhooks/route';
import { prismaMock } from './prisma-mock';
import { NextResponse } from 'next/server';

describe('Webhooks CRUD API', () => {
    describe('GET /api/webhooks', () => {
        it('should return a list of webhooks', async () => {
            const mockWebhooks = [
                { id: '1', name: 'Test 1', path: 'test-1', createdAt: new Date() },
                { id: '2', name: 'Test 2', path: 'test-2', createdAt: new Date() },
            ];
            prismaMock.webhook.findMany.mockResolvedValue(mockWebhooks as any);

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual(JSON.parse(JSON.stringify(mockWebhooks)));
        });

        it('should return 500 on database error', async () => {
            prismaMock.webhook.findMany.mockRejectedValue(new Error('DB Error'));

            const response = await GET();
            expect(response.status).toBe(500);
        });
    });

    describe('POST /api/webhooks', () => {
        it('should create a new webhook', async () => {
            const newWebhook = {
                name: 'New Webhook',
                path: 'new-path',
                method: 'POST',
                responseStatus: 200,
                responseData: { success: true },
            };

            prismaMock.webhook.findUnique.mockResolvedValue(null);
            prismaMock.webhook.create.mockResolvedValue({ id: 'new-id', ...newWebhook } as any);

            const request = new Request('http://localhost/api/webhooks', {
                method: 'POST',
                body: JSON.stringify(newWebhook),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.id).toBe('new-id');
            expect(prismaMock.webhook.create).toHaveBeenCalled();
        });

        it('should return 400 if path exists', async () => {
            prismaMock.webhook.findUnique.mockResolvedValue({ id: 'exists' } as any);

            const request = new Request('http://localhost/api/webhooks', {
                method: 'POST',
                body: JSON.stringify({
                    name: 'Test',
                    path: 'existing-path',
                    method: 'POST',
                    responseStatus: 200,
                    responseData: '{}'
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
        });
    });
});
