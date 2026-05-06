import { useEffect, useState } from "react";

export function useCountUp(target: number, isActive: boolean, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!isActive) {
      setVal(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(2, -10 * t);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setVal(target * ease(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, isActive, duration]);
  return val;
}

export function formatNum(n: number, decimals = 0) {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
