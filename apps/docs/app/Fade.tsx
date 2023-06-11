import { PropsWithChildren, useEffect, useState } from "react";

const duration = 200;

export default function Fade({
  in: inProp = true,
  children,
}: PropsWithChildren<{ in?: boolean }>) {
  const [mount, setMount] = useState(inProp);

  useEffect(() => {
    if (inProp) {
      setMount(true);
    } else {
      const timeoutId = setTimeout(() => {
        setMount(false);
      }, duration);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [inProp]);

  const style = {
    transition: `opacity ${duration}ms`,
    opacity: mount ? 1 : 0,
  };

  return <div style={style}>{mount ? children : null}</div>;
}
