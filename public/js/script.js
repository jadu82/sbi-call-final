// public/js/script.js
document.addEventListener("DOMContentLoaded", function() {
  const container = document.getElementById("deviceContainer");

  const menuIcon = document.querySelector(".menu-icon");
  const navLinks = document.querySelector(".nav-links");

  if (menuIcon && navLinks) {
    menuIcon.addEventListener("click", function(e) {
      e.stopPropagation();
      navLinks.classList.toggle("active");
      menuIcon.classList.toggle("rotate");
    });
  }

  if (container) {
    container.addEventListener("click", function (event) {
      let target = event.target;
      while (target && !target.classList.contains("device-card")) {
        target = target.parentElement;
      }
      if (target && target.dataset.id) {
        const deviceId = target.dataset.id;
        window.location.href = `/api/device/admin/phone/${deviceId}`;
      }
    });
  }

  document.addEventListener("click", function(e) {
    if (navLinks && !navLinks.contains(e.target) && !menuIcon.contains(e.target)) {
      navLinks.classList.remove("active");
      menuIcon.classList.remove("rotate");
    }
  });

  const socket = io();

  socket.on("connect", () => {
    console.log("Connected to Server");

    // जब admin page load हो और socket connect हो जाए, तो हर device-card के लिए room join emit करो
    const deviceCards = document.querySelectorAll(".device-card");
    deviceCards.forEach(card => {
      const uniqueid = card.dataset.id;
      if (uniqueid) {
        // नया event adminRegisterStatus: सिर्फ listen-room join के लिए
        socket.emit("adminRegisterStatus", { uniqueid });
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from Server");
  });

  // Existing handlers (यदि कहीं और से batteryUpdate या newDevice events आ रहे हों)
  socket.on("batteryUpdate", (batteryStatuses) => {
    batteryStatuses.forEach(battery => {
      updateDeviceCard(battery);
    });
  });

  socket.on("newDevice", (newDevice) => {
    addNewDeviceCard(newDevice);
    // नया device-card आने पर room join करें ताकि आगे के statusUpdates मिलें
    if (newDevice.uniqueid) {
      socket.emit("adminRegisterStatus", { uniqueid: newDevice.uniqueid });
    }
  });

  // नया listener: statusUpdate events के लिए
  socket.on("statusUpdate", (payload) => {
    // payload: { uniqueid, connectivity, updatedAt }
    console.log("Received statusUpdate:", payload);
    updateDeviceCard(payload);
  });

  function updateDeviceCard(data) {
    // data में uniqueid, connectivity, और optional अन्य fields
    const deviceCard = document.querySelector(`[data-id="${data.uniqueid}"]`);
    if (deviceCard) {
      // अगर brand/name या batteryLevel आदि update करना है और payload में है, तब अपडेट कर सकते हैं:
      // उदाहरण: यदि payload.brand या payload.batteryLevel भेज रहे हों
      const brandElement = deviceCard.querySelector("h2, h3"); // आपके markup में h2 है
      if (brandElement && data.brand) {
        brandElement.innerHTML = data.brand;
      }
      // Example: अगर payload में batteryLevel है:
      const batteryElement = deviceCard.querySelector(".device-details p:nth-child(3)");
      if (batteryElement && data.batteryLevel !== undefined) {
        batteryElement.innerHTML = `<strong>Battery:</strong> ${data.batteryLevel}%`;
      }

      // Status update
      const statusElement = deviceCard.querySelector(".device-status");
      if (statusElement && data.connectivity) {
        if (data.connectivity === 'Online') {
          statusElement.classList.remove("status-offline");
          statusElement.classList.add("status-online");
          statusElement.innerHTML = "Status - Online User";
        } else if (data.connectivity === 'Offline') {
          statusElement.classList.remove("status-online");
          statusElement.classList.add("status-offline");
          statusElement.innerHTML = "Status - Offline User";
        }
      }
    }
  }

  function addNewDeviceCard(newDevice) {
    const container = document.getElementById("deviceContainer");

    const deviceCard = document.createElement("div");
    deviceCard.classList.add("device-card");
    deviceCard.dataset.id = newDevice.uniqueid;

    deviceCard.innerHTML = `
      <div class="device-content">
        <img src="/image/nothing.webp" alt="Device Icon" />
        <div class="device-details">
          <h2>Mobile : ${newDevice.brand || 'Unknown Brand'}</h2>
          <p><strong>Device Id :</strong> ${newDevice.uniqueid}</p>
          <p><strong>Battery :</strong> ${newDevice.batteryLevel ? newDevice.batteryLevel + '%' : 'N/A'}</p>
        </div>
      </div>
      <div class="device-status ${newDevice.connectivity === 'Online' ? 'status-online' : 'status-offline'}">
        Status - ${newDevice.connectivity === 'Online' ? 'Online User' : 'Offline User'}
      </div>
    `;
    container.appendChild(deviceCard);
  }
});
