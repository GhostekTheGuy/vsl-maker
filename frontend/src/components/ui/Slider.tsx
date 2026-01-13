import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  showValue?: boolean;
}

const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, showValue = true, value, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <div className="flex justify-between mb-1">
            <label htmlFor={id} className="text-sm font-medium text-gray-700">
              {label}
            </label>
            {showValue && (
              <span className="text-sm text-gray-500">{value}</span>
            )}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          type="range"
          value={value}
          className={cn(
            'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer',
            'accent-primary-600',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };
