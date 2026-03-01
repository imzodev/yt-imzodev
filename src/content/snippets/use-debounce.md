---
title: "useDebounce Hook"
description: "A custom React hook for debouncing fast-changing values. This is especially useful for search inputs where you want to wait until the user stops typing before making an API call."
language: "typescript"
type: "hook"
category: "react"
---

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set debouncedValue to value (passed in) after the specified delay
    const timer = setTimeout(() => setDebouncedValue(value), delay);

    // Clean up the timeout if value changes (also on unmount)
    // This is how we prevent debounced value from updating if value is changed
    // within the delay period
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
