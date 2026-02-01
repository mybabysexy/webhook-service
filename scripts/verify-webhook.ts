// using global fetch

interface Webhook {
    id: string;
    path: string;
    method: string;
    responseStatus: number;
    [key: string]: unknown;
}

async function main() {
    const BASE_URL = 'http://localhost:3000';

    // 1. Create Webhook
    console.log('Creating webhook...');
    const createRes = await fetch(`${BASE_URL}/api/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            path: 'test-webhook-1',
            method: 'POST',
            responseStatus: 201,
            responseData: JSON.stringify({ success: true, message: "Hello" })
        })
    });

    if (!createRes.ok) {
        console.error('Failed to create webhook:', await createRes.text());
        process.exit(1);
    }

    const webhook = await createRes.json() as Webhook;
    console.log('Webhook created:', webhook.id);

    // 2. List Webhooks
    console.log('Listing webhooks...');
    const listRes = await fetch(`${BASE_URL}/api/webhooks`);
    const webhooks = await listRes.json() as Webhook[];
    const found = webhooks.find(w => w.id === webhook.id);
    if (!found) {
        console.error('Webhook not found in list');
        process.exit(1);
    }
    console.log('Webhook found in list');

    // 3. Trigger Webhook
    console.log('Triggering webhook...');
    const triggerRes = await fetch(`${BASE_URL}/webhook/test-webhook-1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foo: 'bar' })
    });

    if (triggerRes.status !== 201) {
        console.error('Unexpected status:', triggerRes.status);
        process.exit(1);
    }
    const triggerData = await triggerRes.json();
    console.log('Trigger response:', triggerData);

    // 4. Check History
    console.log('Checking history...');
    const detailsRes = await fetch(`${BASE_URL}/api/webhooks/${webhook.id}`);
    const details = await detailsRes.json();

    if (details.requests.length === 0) {
        console.error('No history recorded');
        process.exit(1);
    }

    const lastRequest = details.requests[0];
    if (lastRequest.body.foo !== 'bar') {
        console.error('Request body mismatch', lastRequest.body);
        process.exit(1);
    }
    console.log('History verified successfully');

    // 5. Cleanup
    console.log('Cleaning up...');
    await fetch(`${BASE_URL}/api/webhooks/${webhook.id}`, { method: 'DELETE' });
    console.log('Done.');
}

main().catch(console.error);
