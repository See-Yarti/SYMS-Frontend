import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/redux';
import { requestActions } from '@/redux/features/request';
import { TRequestState } from '@/redux/features/request/types';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Check,
  CheckCheck,
  CircleX,
  Clock,
  LucideIcon,
  PlusCircle,
  Search,
} from 'lucide-react';
import React from 'react';
import { useDebouncedValue } from '@mantine/hooks';

type RequestT = {
  label: string;
  value: string;
  icon?: LucideIcon;
};

const RequestStatus: RequestT[] = [
  {
    label: 'Pending',
    value: 'pending',
    icon: Clock,
  },
  {
    label: 'Approved',
    value: 'approved',
    icon: CheckCheck,
  },
  {
    label: 'Rejected',
    value: 'rejected',
    icon: CircleX,
  },
];

const RequestType: RequestT[] = [
  {
    label: 'Leave',
    value: 'leave',
  },
  {
    label: 'Overtime',
    value: 'overtime',
  },
  {
    label: 'Travel',
    value: 'travel',
  },
  {
    label: 'Training',
    value: 'training',
  },
  {
    label: 'Promotion',
    value: 'promotion',
  },
  {
    label: 'Meeting',
    value: 'meeting',
  },
  {
    label: 'Other',
    value: 'other',
  },
];

const Nav = () => {
  const dispatch = useAppDispatch();
  const [SearchValue, setSearchValue] = React.useState<string | null>(null);
  const [debouncedSearch] = useDebouncedValue(SearchValue, 300);

  // Effect to dispatch debounced search value to Redux
  React.useEffect(() => {
    dispatch(requestActions.setSearchQuery(debouncedSearch || null));
  }, [debouncedSearch, dispatch]);

  // Get selected values from the Redux store
  const { filters } = useAppSelector((state) => state.request) as TRequestState;

  const handleSelectedValue = (value: string) => {
    dispatch(requestActions.setFilter({ filter: 'status', value }));
  };

  const handleFiltersType = (value: string) => {
    dispatch(requestActions.setFilter({ filter: 'type', value }));
  };

  const setDate = (date: Date | undefined) => {
    dispatch(
      requestActions.setTimestamp(
        date instanceof Date ? date.toISOString() : null
      )
    );
  };
  return (
    <React.Fragment>
      <div className="flex items-center gap-3">
        <div className="relative w-1/4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground " />
          <Input
            onChange={(e) => setSearchValue(e.target.value)}
            type="search"
            value={SearchValue || ''}
            aria-label="Search"
            name="search"
            placeholder="Search"
            className="pl-8 shadow-none"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="border-dashed">
              <PlusCircle />
              Status
              {filters.status && filters.status.length > 0 && (
                <React.Fragment>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal lg:hidden"
                  >
                    {filters.status.length}
                  </Badge>
                  <div className="hidden space-x-1 lg:flex justify-center items-center">
                    {filters.status.length > 1 ? (
                      <Badge
                        variant="secondary"
                        className="rounded-sm px-1 font-normal"
                      >
                        {filters.status.length} selected
                      </Badge>
                    ) : (
                      RequestStatus.filter(
                        (option) =>
                          filters.status &&
                          filters.status.includes(option.value)
                      ).map((option) => (
                        <Badge
                          variant="secondary"
                          key={option.value}
                          className="rounded-sm px-1 font-normal"
                        >
                          {option.label}
                        </Badge>
                      ))
                    )}
                  </div>
                </React.Fragment>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search status..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {RequestStatus.map((option) => {
                    const isSelected =
                      filters.status && filters.status.includes(option.value);
                    return (
                      <CommandItem
                        key={option.value}
                        onSelect={() => {
                          handleSelectedValue(option.value);
                        }}
                      >
                        <div
                          className={cn(
                            'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'opacity-50 [&_svg]:invisible'
                          )}
                        >
                          <Check />
                        </div>
                        {option.icon && (
                          <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{option.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {filters.status && filters.status.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() =>
                          dispatch(
                            requestActions.setFilter({
                              filter: 'status',
                              value: null,
                            })
                          )
                        }
                        className="justify-center text-center"
                      >
                        Clear filters
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="border-dashed">
              <PlusCircle />
              Type
              {filters.type && filters.type.length > 0 && (
                <React.Fragment>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal lg:hidden"
                  >
                    {filters.type.length}
                  </Badge>
                  <div className="hidden space-x-1 lg:flex justify-center items-center">
                    {filters.type.length > 1 ? (
                      <Badge
                        variant="secondary"
                        className="rounded-sm px-1 font-normal"
                      >
                        {filters.type.length} selected
                      </Badge>
                    ) : (
                      RequestType.filter(
                        (option) =>
                          filters.type && filters.type.includes(option.value)
                      ).map((option) => (
                        <Badge
                          variant="secondary"
                          key={option.value}
                          className="rounded-sm px-1 font-normal"
                        >
                          {option.label}
                        </Badge>
                      ))
                    )}
                  </div>
                </React.Fragment>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search type..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {RequestType.map((option) => {
                    const isSelected =
                      filters.type && filters.type.includes(option.value);
                    return (
                      <CommandItem
                        key={option.value}
                        onSelect={() => {
                          handleFiltersType(option.value);
                        }}
                      >
                        <div
                          className={cn(
                            'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'opacity-50 [&_svg]:invisible'
                          )}
                        >
                          <Check />
                        </div>
                        <span>{option.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {filters.type && filters.type.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() =>
                          dispatch(
                            requestActions.setFilter({
                              filter: 'type',
                              value: null,
                            })
                          )
                        }
                        className="justify-center text-center"
                      >
                        Clear filters
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={'outline'}
              className={cn(
                'w-[195px] justify-start text-left font-normal border-dashed',
                !!filters.timestamp && 'text-muted-foreground '
              )}
            >
              <CalendarIcon
                className={cn(
                  'mr-2 h-4 w-4',
                  'text-foreground'
                )}
              />
              {filters.timestamp ? (
                format(filters.timestamp, 'PPP')
              ) : (
                <span className="text-foreground">Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={
                filters.timestamp ? new Date(filters.timestamp) : undefined
              }
              onSelect={setDate}
              initialFocus
              fromDate={new Date(2024, 1, 2)}
              toDate={new Date()}
              showOutsideDays={false}
            />
            <Separator />
            <div className="p-1">
              <Button
                variant={'outline'}
                onClick={() => setDate(undefined)}
                className="w-full border-none text-muted-foreground hover:text-muted-foreground"
              >
                {' '}
                Clear filters{' '}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </React.Fragment>
  );
};
export default Nav;
