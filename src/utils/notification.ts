import type { NotificationType } from '../typings';

/**
 * 頁面內通知系統
 */
export function showNotification(
  message: string,
  type: NotificationType = 'info'
): void {
  let container = document.getElementById('notificationContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationContainer';
    container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
    document.body.appendChild(container);
  }

  const notification = document.createElement('div');
  const bgColor =
    type === 'success'
      ? 'bg-green-500'
      : type === 'error'
        ? 'bg-red-500'
        : 'bg-blue-500';
  notification.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[280px] max-w-[400px] animate-slide-in`;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

  notification.innerHTML = `
    <span class="text-lg font-bold">${icon}</span>
    <span class="flex-1 text-sm">${message}</span>
  `;

  container.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    notification.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      container?.removeChild(notification);
      if (container && container.children.length === 0) {
        document.body.removeChild(container);
      }
    }, 300);
  }, 3000);
}

