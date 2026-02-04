// Announce presence immediately
window.postMessage({ type: "EXTENSION_LOADED" }, "*");

// Listen for messages from the web app
window.addEventListener("message", (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return;

    // Respond to presence check
    if (event.data.type === "PING_EXTENSION") {
        window.postMessage({ type: "EXTENSION_LOADED" }, "*");
        return;
    }

    if (event.data.type && event.data.type === "FORWARD_WEBHOOK_REQUEST") {
        console.log("Extension received forwarding request:", event.data);

        // Send to background script
        chrome.runtime.sendMessage(event.data, (response) => {
            // Send response back to web app
            window.postMessage({
                type: "FORWARD_WEBHOOK_RESPONSE",
                payload: response
            }, "*");
        });
    }
});
