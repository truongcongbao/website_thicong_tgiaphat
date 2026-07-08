/**
 * Robust event dispatching utility to avoid "Illegal constructor" errors
 * in restricted iframe or sandboxed environments.
 */

export function safeDispatchEvent<T = any>(name: string, detail: T) {
  try {
    let event: CustomEvent<T>;
    try {
      // Standard modern constructor
      event = new CustomEvent(name, { detail, bubbles: true, cancelable: true });
    } catch (e) {
      // Fallback for older browsers or restricted iframe environments
      const fallbackEvent = document.createEvent("CustomEvent");
      fallbackEvent.initCustomEvent(name, true, true, detail);
      event = fallbackEvent as CustomEvent<T>;
    }
    window.dispatchEvent(event);
  } catch (err) {
    console.warn(`Failed to dispatch custom event "${name}" safely:`, err);
  }
}

export function safeDispatchSimpleEvent(name: string) {
  try {
    let event: Event;
    try {
      // Standard modern constructor
      event = new Event(name, { bubbles: true, cancelable: true });
    } catch (e) {
      // Fallback for older browsers or restricted iframe environments
      const fallbackEvent = document.createEvent("Event");
      fallbackEvent.initEvent(name, true, true);
      event = fallbackEvent;
    }
    window.dispatchEvent(event);
  } catch (err) {
    console.warn(`Failed to dispatch simple event "${name}" safely:`, err);
  }
}
