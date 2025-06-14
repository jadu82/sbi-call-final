// public/js/script.js

document.addEventListener("DOMContentLoaded", function() {
  const container = document.getElementById("deviceContainer");
  const menuIcon = document.querySelector(".menu-icon");
  const navLinks = document.querySelector(".nav-links");

  // Toggle mobile nav
  if (menuIcon && navLinks) {
    menuIcon.addEventListener("click", function(e) {
      e.stopPropagation();
      navLinks.classList.toggle("active");
      menuIcon.classList.toggle("rotate");
    });
    document.addEventListener("click", function(e) {
      if (!navLinks.contains(e.target) && !menuIcon.contains(e.target)) {
        navLinks.classList.remove("active");
        menuIcon.classList.remove("rotate");
      }
    });
  }

  // Card‑click navigation
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

  // Initialize Socket.IO
  const socket = io();

  socket.on("connect", () => {
    console.log("Connected to Server:", socket.id);

    // As soon as we connect, register each card's status room
    document.querySelectorAll('.device-card').forEach(card => {
      const uniqueid = card.dataset.id;
      if (uniqueid) {
        socket.emit('registerStatus', { uniqueid });
      }
    });
  });

  socket.on("disconnect", (reason) => {
    console.log("Disconnected from Server:", reason);
  });

  // Handle bulk battery updates if your server emits them
  socket.on("batteryUpdate", (batteryStatuses) => {
    batteryStatuses.forEach(battery => {
      updateDeviceCard(battery);
    });
  });

  // Handle new device adds
  socket.on("newDevice", (newDevice) => {
    addNewDeviceCard(newDevice);
    // After adding, register status for this new card
    socket.emit('registerStatus', { uniqueid: newDevice.uniqueid });
  });

  // **NEW**: real-time status updates handler
  socket.on("statusUpdate", (data) => {
    const { uniqueid, connectivity } = data;
    const card = document.querySelector(`.device-card[data-id="${uniqueid}"]`);
    if (!card) return;

    const statusElement = card.querySelector(".device-status");
    if (!statusElement) return;

    if (connectivity === 'Online') {
      statusElement.classList.remove("status-offline");
      statusElement.classList.add("status-online");
      statusElement.textContent = "Status – Online User";
    } else {
      statusElement.classList.remove("status-online");
      statusElement.classList.add("status-offline");
      statusElement.textContent = "Status – Offline User";
    }
  });

  // Helper: update battery & connectivity if server sends both
  function updateDeviceCard(battery) {
    const card = document.querySelector(`.device-card[data-id="${battery.uniqueid}"]`);
    if (!card) return;

    // Brand / name
    const brandEl = card.querySelector("h2, h3");
    if (brandEl) brandEl.textContent = battery.brand || 'Unknown';

    // Unique ID line
    const idEl = card.querySelector("p strong")?.parentElement;
    if (idEl) idEl.innerHTML = `<strong>Device Id :</strong> ${battery.uniqueid || 'N/A'}`;

    // Battery level
    const battEl = card.querySelector(".device-details p:nth-child(3)");
    if (battEl) battEl.innerHTML = `<strong>Battery :</strong> ${battery.batteryLevel != null ? battery.batteryLevel + '%' : 'N/A'}`;

    // Connectivity status (reuse statusUpdate logic)
    if (battery.connectivity) {
      socket.emit('registerStatus', { uniqueid: battery.uniqueid });
      // Or directly update:
      socket.emit('connectivityUpdate', {
        uniqueid: battery.uniqueid,
        connectivity: battery.connectivity,
        timestamp: battery.updatedAt || Date.now()
      });
    }
  }

  // Helper: add a brand new card to the DOM
  function addNewDeviceCard(newDevice) {
    const container = document.getElementById("deviceContainer");
    if (!container) return;

    const card = document.createElement("div");
    card.classList.add("device-card");
    card.dataset.id = newDevice.uniqueid;
    card.innerHTML = `
      <div class="device-content">
        <img src="/image/nothing.webp" alt="Device Icon" />
        <div class="device-details">
          <h2>Mobile : ${newDevice.brand || 'Unknown Brand'}</h2>
          <p><strong>Device Id :</strong> ${newDevice.uniqueid}</p>
          <p><strong>Battery :</strong> ${newDevice.batteryLevel != null ? newDevice.batteryLevel + '%' : 'N/A'}</p>
        </div>
      </div>
      <div class="device-status ${newDevice.connectivity === 'Online' ? 'status-online' : 'status-offline'}">
        Status – ${newDevice.connectivity === 'Online' ? 'Online User' : 'Offline User'}
      </div>
    `;
    container.appendChild(card);
  }
});
