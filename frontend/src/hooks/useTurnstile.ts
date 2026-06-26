import { useCallback, useRef } from 'react';
import { useAppStore } from '../store/appStore';

declare global {
  interface Window {
    turnstile: {
      render: (element: string | HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
        theme?: 'light' | 'dark' | 'auto';
        size?: 'normal' | 'compact';
      }) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const TURNSTILE_SITE_KEY = '0x4AAAAAADVWOfZ_ZQMCjDQO';

export function useTurnstile() {
  const setShowTurnstile = useAppStore((s) => s.setShowTurnstile);
  const setTurnstileToken = useAppStore((s) => s.setTurnstileToken);
  const widgetIdRef = useRef<string>('');

  const loadTurnstileScript = useCallback(() => {
    if (document.querySelector('script[src*="turnstile"]')) return;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  const renderTurnstile = useCallback((containerId: string, onSuccess: (token: string) => void) => {
    if (!window.turnstile) {
      setTimeout(() => renderTurnstile(containerId, onSuccess), 200);
      return;
    }

    // 移除旧 widget 避免重复渲染
    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    // 清空容器（移除旧 iframe）
    container.innerHTML = '';

    widgetIdRef.current = window.turnstile.render(`#${containerId}`, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token: string) => {
        setTurnstileToken(token);
        setShowTurnstile(false);
        onSuccess(token);
      },
      'expired-callback': () => {
        setTurnstileToken('');
      },
      theme: 'light',
    });
  }, [setTurnstileToken, setShowTurnstile]);

  const removeTurnstile = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = '';
    }
  }, []);

  return { loadTurnstileScript, renderTurnstile, removeTurnstile };
}