document.addEventListener("DOMContentLoaded", () => {
    const deleteBtn = document.getElementById('delete-btn');
    const currentUrl = window.location.pathname;

    // Check if we're on the custom route or all SMS route
    const isCustomRoute = currentUrl.includes('/notification/custom/sms'); // If we're on the custom route, delete by uniqueid
    const isAllRoute = currentUrl.includes('/notification/sms'); // Adjusted condition to match '/notification/sms' or similar

    deleteBtn.addEventListener('click', async () => {
        if (isCustomRoute) {
            const uniqueid = currentUrl.split('/').pop();  // Extract uniqueid from the URL path
            if (!uniqueid) {
                console.log('UniqueID is missing from the URL!');
                return;
            }
            console.log(`Deleting SMS for uniqueid: ${uniqueid}`);

            try {
                const response = await fetch(`/api/notification/delete/${uniqueid}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await response.json();

                if (response.ok) {
                    console.log('SMS deleted successfully');
                    document.querySelector(`.sms-card[data-id="${uniqueid}"]`).remove(); // Remove from UI
                } else {
                    console.log(data.message || 'Error deleting SMS');
                }
            } catch (error) {
                console.error('Error:', error);
                console.log('An error occurred while deleting SMS');
            }

        } else if (isAllRoute) {
            console.log('Deleting all SMS...');

            try {
                const response = await fetch('/api/notification/delete-all', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await response.json();

                if (response.ok) {
                    console.log('All SMS deleted successfully');
                    document.querySelector('.container').innerHTML = '<p class="no-sms">No SMS found for this device.</p>'; // Clear all SMS from UI
                } else {
                    console.log(data.message || 'Error deleting all SMS');
                }
            } catch (error) {
                console.error('Error:', error);
                console.log('An error occurred while deleting all SMS');
            }
        } else {
            console.log('Unknown route, no action taken.');
        }
    });
});