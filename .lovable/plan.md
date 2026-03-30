

## Problem

Two issues on the checkout page:

1. **Blank page / crash when entering payment step**: The `TranzilaPayment` component has an early `return` (line 23-31) **before** the `useEffect` hook (line 50). This violates React's rules of hooks — hooks must always be called in the same order. When Tranzila settings aren't loaded yet or are disabled, the early return skips the `useEffect`, causing "Rendered more hooks than during the previous render" and a blank screen.

2. **Privacy checkbox**: The checkbox **does** exist in the code (line 1155-1164). The user sees a blank page because of the crash above, which prevents the form from rendering properly on re-renders.

## Fix

### File: `src/components/TranzilaPayment.tsx`

Move the `useEffect` hook **before** the early return so hooks are always called in the same order regardless of settings state.

```tsx
export const TranzilaPayment = ({ ... }: Props) => {
  const { data: settings } = useTranzilaSettings();
  const { t, locale } = useLocale();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Move useEffect BEFORE any early returns
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => { ... };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSuccess, onError]);

  // NOW the early return is safe
  if (!settings?.enabled || !settings.terminal_name) {
    return ( <div>...</div> );
  }

  // Rest of component...
};
```

Single file change. The privacy checkbox requires no changes — it's already present and will render correctly once the crash is fixed.

