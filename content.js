// Load user-defined whitelist from Chrome storage
let userAllowedChannels = [];
chrome.storage.sync.get(["userAllowedChannels"], (data) => {
    if (data.userAllowedChannels) {
        userAllowedChannels = data.userAllowedChannels;
    }
});

// Function to check if a channel is allowed using a case-insensitive comparison
function isAllowed(channelName) {
    const detectedName = channelName.trim().toLowerCase();
    const allowedLower = allowedChannels.map(name => name.trim().toLowerCase());
    const userAllowedLower = userAllowedChannels.map(name => name.trim().toLowerCase());
    
    console.log(`🔍 Checking: "${channelName}"`);
    
    if (allowedLower.includes(detectedName) || userAllowedLower.includes(detectedName)) {
        console.log(`✅ Allowed: ${channelName}`);
        return true;
    } else {
        console.warn(`❌ BLOCKED: ${channelName}`);
        return false;
    }
}

// Function to block content
function blockContent() {
    console.log("🚫 Redirecting to blocked page...");
    window.location.href = chrome.runtime.getURL("blocked.html");
}

let lastCheckedURL = "";

// Function to retry detecting the channel until it loads
function waitForChannelName(callback, retries = 15, delay = 500) {
    let attempt = 0;
    
    function check() {
        let channelName = "";

        let channelElement = document.querySelector("ytd-channel-name a");
        if (channelElement) {
            channelName = channelElement.textContent.trim();
        }

        let channelHeader = document.querySelector("#channel-header-container yt-formatted-string");
        if (channelHeader && !channelName) {
            channelName = channelHeader.textContent.trim();
        }

        if (channelName) {
            console.log(`🎯 Detected channel: "${channelName}"`);
            callback(channelName);
        } else if (attempt < retries) {
            attempt++;
            console.warn(`⚠️ Channel name not detected. Retrying... (${attempt}/${retries})`);
            setTimeout(check, delay);
        } else {
            console.error("❌ ERROR: Channel name could not be detected after multiple attempts.");
        }
    }

    check();
}

function checkChannel() {
    const currentURL = location.href;
    
    // Prevent duplicate checks if the URL hasn't changed
    if (currentURL === lastCheckedURL) {
        console.log("⏳ Skipping check, still on the same page.");
        return;
    }
    
    lastCheckedURL = currentURL;

    if (!currentURL.includes("/watch") && !currentURL.includes("/channel/") && !currentURL.includes("/user/")) {
        return;
    }

    console.log("⏳ Waiting for channel name to load...");
    waitForChannelName((channelName) => {
        setTimeout(() => {
            if (!isAllowed(channelName)) {
                blockContent();
            }
        }, 500);
    });
}

// Improved observer to track page and video changes
const observer = new MutationObserver(() => {
    console.log("🔄 Detected video or page update, rechecking...");
    checkChannel();
});

// Observe YouTube's main page container and video player for changes
const waitForPageLoad = setInterval(() => {
    const pageContainer = document.querySelector("ytd-app");
    const videoContainer = document.querySelector("#movie_player");
    
    if (pageContainer && videoContainer) {
        observer.observe(pageContainer, { childList: true, subtree: true });
        observer.observe(videoContainer, { childList: true, subtree: true });
        console.log("✅ Observer attached to YouTube's dynamic content.");
        clearInterval(waitForPageLoad);
    }
}, 1000);

// Listen for YouTube's navigation finish event (fires on video changes)
document.addEventListener("yt-navigate-finish", () => {
    console.log("🔄 yt-navigate-finish event detected, rechecking...");
    checkChannel();
});

// Run check on initial page load
window.addEventListener("load", () => {
    console.log("📢 YouTube Educational Filter Running...");
    checkChannel();
});

// Run check again after a short delay to catch any missed updates
setTimeout(checkChannel, 3000);
