document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    console.log('Form submission prevented. Starting animation...');

    // Hide the login container
    document.getElementById('loginContainer').classList.add('hidden');

    // Show the animation container
    const animationContainer = document.getElementById('animationContainer');
    animationContainer.classList.remove('hidden');

    const zeroLetters = ['Z', 'E', 'R', 'O'];
    const traceLetters = ['T', 'R', 'A', 'C', 'E'];

    // Clear only text elements, not the logo
    Array.from(animationContainer.children).forEach(child => {
        if (!child.classList.contains('logo-animation')) {
            child.remove();
        }
    });

    // Create a container for text animation
    const textContainer = document.createElement('div');
    textContainer.className = 'text-container';
    animationContainer.appendChild(textContainer);

    // Display ZERO letters one by one
    zeroLetters.forEach((letter, index) => {
        const span = document.createElement('span');
        span.textContent = letter;
        span.className = 'letter';
        span.style.animationDelay = `${index * 0.3}s`;
        textContainer.appendChild(span);
    });

    // Add a gap between ZERO and TRACE
    setTimeout(() => {
        const gap = document.createElement('div');
        gap.style.width = '50px';
        textContainer.appendChild(gap);
    }, zeroLetters.length * 300);

    // Display TRACE letters all at once after ZERO
    setTimeout(() => {
        traceLetters.forEach((letter) => {
            const span = document.createElement('span');
            span.textContent = letter;
            span.className = 'letter';
            textContainer.appendChild(span);
        });
    }, zeroLetters.length * 300 + 500);

    // Show the logo animation after text animation
    setTimeout(() => {
        console.log('Text animation completed. Starting logo animation...');
        const logo = document.getElementById('logoAnimation');
        if (logo) {
            logo.classList.add('logo-visible');
        } else {
            console.error('Logo element not found! Make sure the element exists in the DOM.');
        }
    }, (zeroLetters.length + 2) * 300 + 500);

    // Redirect to the dashboard after the logo animation completes
    setTimeout(() => {
        console.log('Logo animation completed. Redirecting to /api/device/dashboard...');
        window.location.href = '/api/device/dashboard';
    }, (zeroLetters.length + 2) * 300 + 800);
});