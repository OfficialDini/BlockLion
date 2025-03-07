document.addEventListener("DOMContentLoaded", () => {
  const channelInput = document.getElementById("channelInput");
  const addButton = document.getElementById("addChannel");
  const whitelist = document.getElementById("whitelist");

  function loadWhitelist() {
      chrome.storage.sync.get(["userAllowedChannels"], (data) => {
          whitelist.innerHTML = "";
          const channels = data.userAllowedChannels || [];
          channels.forEach(channel => {
              let li = document.createElement("li");
              li.textContent = channel;
              let removeBtn = document.createElement("button");
              removeBtn.textContent = "❌";
              removeBtn.onclick = () => removeChannel(channel);
              li.appendChild(removeBtn);
              whitelist.appendChild(li);
          });
      });
  }

  function addChannel() {
      let newChannel = channelInput.value.trim();
      if (!newChannel) return;
      chrome.storage.sync.get(["userAllowedChannels"], (data) => {
          let channels = data.userAllowedChannels || [];
          if (!channels.includes(newChannel)) {
              channels.push(newChannel);
              chrome.storage.sync.set({ userAllowedChannels: channels }, loadWhitelist);
          }
      });
      channelInput.value = "";
  }

  function removeChannel(channel) {
      chrome.storage.sync.get(["userAllowedChannels"], (data) => {
          let channels = data.userAllowedChannels || [];
          channels = channels.filter(name => name !== channel);
          chrome.storage.sync.set({ userAllowedChannels: channels }, loadWhitelist);
      });
  }

  addButton.addEventListener("click", addChannel);
  loadWhitelist();
});
