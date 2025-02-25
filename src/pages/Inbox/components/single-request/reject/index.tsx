import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppDispatch } from '@/redux';
import { requestActions } from '@/redux/features/request';
import { MoveLeft } from 'lucide-react';
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import RichTextEditor from '@/components/RTE';

// Rejection Form Schema
const formSchema = z.object({
  reason: z.union([
    z.string().min(1, {
      message: 'Reason is required',
    }),
    z.null(),
  ]),
});

const RejectRequest = () => {
  const dispatch = useAppDispatch();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: null,
    },
  });
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast('Request rejected successfully');
  }

  return (
    <React.Fragment>
      <div className="">
        <div className="flex h-full flex-col px-2">
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="link"
                  size="icon"
                  onClick={() => {
                    dispatch(requestActions.setCurrentRequestStep('view'));
                  }}
                >
                  <MoveLeft className="h-4 w-4" />
                  <span className="sr-only">Move to junk</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Move to junk</TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="mx-1 h-6" />{' '}
            <Label className="text-base text-muted-foreground ml-2 font-normal line-clamp-1">
              Reject Request
            </Label>
          </div>
          <div className="p-2 flex flex-1 flex-col">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-muted-foreground font-normal line-clamp-1">
                        Reason for rejection
                      </FormLabel>
                      <FormControl>
                        <RichTextEditor
                          placeholder="Reason for rejection"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Please provide a reason for rejecting the request. If
                        you want to reject without a reason, please leave this
                        field blank.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" size={'sm'}>
                    Reject Request
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default RejectRequest;
