chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "FORWARD_WEBHOOK_REQUEST") {
        const { targetUrl, method, headers, body, requestId } = request.payload;

        (async () => {
            try {
                console.log(`Forwarding to ${targetUrl}`);

                const fetchOptions = {
                    method: method,
                    headers: headers || {},
                };

                if (method !== 'GET' && method !== 'HEAD' && body) {
                    fetchOptions.body = JSON.stringify(body);
                }

                const response = await fetch(targetUrl, fetchOptions);
                const status = response.status;
                const statusText = response.statusText;

                let responseBody;
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    responseBody = await response.json();
                } else {
                    responseBody = await response.text();
                }

                sendResponse({
                    success: true,
                    requestId,
                    status,
                    statusText,
                    response: responseBody
                });
            } catch (error) {
                console.error("Forwarding failed:", error);
                sendResponse({
                    success: false,
                    requestId,
                    error: error.message
                });
            }
        })();

        return true; // Keep the message channel open for async response
    }
});
