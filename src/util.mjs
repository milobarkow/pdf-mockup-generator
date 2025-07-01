export function showWarning(msg, duration = 4000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);

    // remove it after animation ends (or after duration)
    setTimeout(() => {
        toast.remove();
    }, duration);
}


