import { ComponentPropsWithoutRef, forwardRef } from "react";

type ButtonProps = ComponentPropsWithoutRef<"button">;

const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
  <button
    ref={ref}
    className="rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold leading-5 text-white hover:bg-cyan-800 focus:outline-none focus:ring focus:ring-cyan-500 active:bg-cyan-800 dark:bg-cyan-600 dark:hover:bg-cyan-700 dark:focus:ring-cyan-400"
    {...props}
  />
));
Button.displayName = "Button";

export default Button;
