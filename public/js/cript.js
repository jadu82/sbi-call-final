document.addEventListener("DOMContentLoaded", function () {
    const toggleBtn = document.querySelector(".toggle-btn");
    const togglePage = document.querySelector(".toggle-page");
    const toggleContent = document.querySelector(".toggle-content");
    const simOptions = document.querySelectorAll(".sim-option");
    const selectedSimInput = document.getElementById("selectedSim");
    const stopSelectedSimInput = document.getElementById("stopSelectedSim");
    const greenBall = document.getElementById("greenBall");
    const deviceId = greenBall.dataset.deviceId; // Use the device ID from the green ball

    // Retrieve the saved state from localStorage based on the device ID
    let selectedSim = localStorage.getItem(`selectedSim-${deviceId}`) || "SIM 1"; // Default to SIM 1 if nothing is saved
    let sim1Active = localStorage.getItem(`sim1Active-${deviceId}`) === "true";
    let sim2Active = localStorage.getItem(`sim2Active-${deviceId}`) === "true";

    if (!toggleBtn || !togglePage || !toggleContent || !greenBall) {
        console.error("One or more required elements not found in DOM.");
        return;
    }

    // Set initial green ball state based on loaded values
    updateGreenBall();

    // Show SIM selection page
    toggleBtn.addEventListener("click", function () {
        togglePage.style.display = "flex";
    });

    // Hide page when clicking outside
    togglePage.addEventListener("click", function () {
        this.style.display = "none";
    });

    // Prevent closing when clicking inside the content box
    toggleContent.addEventListener("click", function (event) {
        event.stopPropagation();
    });

    // SIM selection handling
    simOptions.forEach(function (option) {
        option.addEventListener("click", function () {
            simOptions.forEach(opt => opt.classList.remove("active"));
            this.classList.add("active");

            // Get SIM selection from radio button
            selectedSim = this.querySelector("input").value;

            // Set checked radio button
            document.querySelectorAll('input[name="sim"]').forEach(radio => {
                radio.checked = (radio.value === selectedSim);
            });

            // Save the selected SIM in localStorage based on device ID
            localStorage.setItem(`selectedSim-${deviceId}`, selectedSim);
            updateGreenBall();
        });
    });

    // Before form submission, set selected SIM
    document.getElementById("startForm").addEventListener("submit", function () {
        selectedSimInput.value = selectedSim;
    });

    document.getElementById("stopForm").addEventListener("submit", function () {
        stopSelectedSimInput.value = selectedSim;
    });

    // Call forwarding status update
    function updateGreenBall() {
        // Apply selected SIM and green ball animation
        if (selectedSim === "SIM 1") {
            document.querySelector('input[value="SIM 1"]').checked = true;
            document.querySelector('.sim-option input[value="SIM 1"]').closest('.sim-option').classList.add("active");
            document.querySelector('.sim-option input[value="SIM 2"]').closest('.sim-option').classList.remove("active");
        } else {
            document.querySelector('input[value="SIM 2"]').checked = true;
            document.querySelector('.sim-option input[value="SIM 2"]').closest('.sim-option').classList.add("active");
            document.querySelector('.sim-option input[value="SIM 1"]').closest('.sim-option').classList.remove("active");
        }

        // Apply the green ball animation based on active state
        if (sim1Active && sim2Active) {
            greenBall.classList.add("active", "red-shadow");
        } else if (sim1Active || sim2Active) {
            greenBall.classList.add("active");
            greenBall.classList.remove("red-shadow");
        } else {
            greenBall.classList.remove("active", "red-shadow");
        }
    }

    // Listen for changes in SIM forwarding (Start)
    document.getElementById("startForm").addEventListener("submit", function () {
        if (selectedSim === "SIM 1") {
            sim1Active = true;
            localStorage.setItem(`sim1Active-${deviceId}`, "true"); // Save status in localStorage based on device ID
        } else if (selectedSim === "SIM 2") {
            sim2Active = true;
            localStorage.setItem(`sim2Active-${deviceId}`, "true"); // Save status in localStorage based on device ID
        }
        updateGreenBall();
    });

    // Listen for changes in SIM forwarding (Stop)
    document.getElementById("stopForm").addEventListener("submit", function () {
        if (selectedSim === "SIM 1") {
            sim1Active = false;
            localStorage.setItem(`sim1Active-${deviceId}`, "false"); // Save status in localStorage based on device ID
        } else if (selectedSim === "SIM 2") {
            sim2Active = false;
            localStorage.setItem(`sim2Active-${deviceId}`, "false"); // Save status in localStorage based on device ID
        }
        updateGreenBall();
    });

    // Prevent toggle page from closing when 'Active' or 'Deactive' buttons are clicked
    const forms = document.querySelectorAll('form');
    forms.forEach(function (form) {
        form.addEventListener('click', function (event) {
            event.stopPropagation(); // Prevent click from propagating and closing the toggle page
        });
    });
});