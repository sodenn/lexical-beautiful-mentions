import { forwardRef, HTMLProps } from "react";

const Input = forwardRef<HTMLInputElement, HTMLProps<HTMLInputElement>>(
  (props, ref) => (
    <input
      className="w-full appearance-none rounded-md border-2 border-cyan-700 bg-transparent px-3 py-2 text-base text-gray-900 placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring focus:ring-cyan-600 dark:border-cyan-600 dark:text-white dark:focus:border-transparent dark:focus:ring-cyan-400 sm:text-sm"
      {...props}
      ref={ref}
    />
  ),
);
Input.displayName = "Input";

export default Input;
