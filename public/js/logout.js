document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutAllButton");
    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        fetch("/api/auth/logout-all", {
          method: "POST",
          credentials: "include"
        })
        .then(response => response.text())
        .then(data => {
          alert(data);
          console.log("Logout response:", data);
          window.location.href = "/api/auth/login";
        })
        .catch(err => {
          console.error("Logout error:", err);
        });
      });
    }
  });
  
