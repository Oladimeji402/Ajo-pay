type ShowToast = (message: string, options?: { type?: 'success' | 'error' | 'info' | 'warning'; duration?: number }) => void;
type NotifyOptions = { duration?: number };

export function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error && error.message.trim().length > 0) {
        return error.message;
    }

    return fallback;
}

export function notifyError(showToast: ShowToast, error: unknown, fallback: string) {
    const message = getErrorMessage(error, fallback);
    showToast(message, { type: 'error' });
    return message;
}

export function notifySuccess(showToast: ShowToast, message: string, options?: NotifyOptions) {
    showToast(message, { type: 'success', duration: options?.duration });
    return message;
}

export function notifyWarning(showToast: ShowToast, message: string, options?: NotifyOptions) {
    showToast(message, { type: 'warning', duration: options?.duration });
    return message;
}

export function notifyInfo(showToast: ShowToast, message: string, options?: NotifyOptions) {
    showToast(message, { type: 'info', duration: options?.duration });
    return message;
}
