import * as React from 'react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Check } from 'lucide-react';

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  disabled,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start"
          disabled={disabled}
        >
          {selected.length ? (
            options
              .filter((o) => selected.includes(o.value))
              .map((o) => o.label)
              .join(', ')
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0">
        <div className="max-h-60 overflow-auto">
          {options.map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <button
                type="button"
                className={`flex w-full items-center px-2 py-1.5 text-sm hover:bg-muted ${checked ? 'bg-muted' : ''}`}
                key={opt.value}
                onClick={() =>
                  onChange(
                    checked
                      ? selected.filter((v) => v !== opt.value)
                      : [...selected, opt.value],
                  )
                }
              >
                <Check
                  className={`mr-2 h-4 w-4 ${checked ? 'opacity-100' : 'opacity-0'}`}
                />
                {opt.label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
