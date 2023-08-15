import { ComponentPropsWithoutRef, forwardRef, ReactNode, useId } from "react";

export interface CheckboxProps extends ComponentPropsWithoutRef<"input"> {
  label?: ReactNode;
  helpText?: ReactNode;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>((props, ref) => {
  const { label, helpText, ...other } = props;
  const uniqueId = useId();
  const id = other.id || uniqueId;
  return (
    <div className="flex flex-row">
      <input
        ref={ref}
        type="checkbox"
        className="mt-[2px] h-4 w-4 rounded border-gray-400 bg-gray-100 text-cyan-600 hover:bg-gray-200 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-gray-200 dark:border-gray-500 dark:bg-gray-700 dark:ring-offset-gray-800 dark:checked:border-cyan-600 checked:dark:bg-cyan-600 dark:hover:bg-gray-600 dark:checked:hover:border-cyan-600 dark:checked:hover:bg-cyan-600 dark:focus:ring-cyan-600 sm:cursor-pointer"
        {...other}
        id={id}
      />
      <label htmlFor={id} className="flex flex-col">
        <div className="pl-2 text-sm font-medium text-gray-900 dark:text-gray-300 sm:cursor-pointer">
          {label}
        </div>
        <div className="pl-2 text-sm text-gray-800 dark:text-gray-400 sm:cursor-pointer">
          {helpText}
        </div>
      </label>
    </div>
  );
});
Checkbox.displayName = "Checkbox";

export default Checkbox;
