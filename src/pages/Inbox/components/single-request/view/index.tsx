import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppDispatch, useAppSelector } from '@/redux';
import { requestActions } from '@/redux/features/request';
import {
  BookCopy,
  Check,
  Forward,
  GitPullRequestClosed,
  ReceiptText,
  Reply,
  Star,
  Trash2,
} from 'lucide-react';
import React from 'react';

const RequestView = () => {
  const dispatch = useAppDispatch();

  return (
    <React.Fragment>
      <div className="">
        <div className="flex h-full flex-col">
          <div className="flex items-center px-2 border-b border-muted mx-1 pb-1">
            <div className="flex items-center ">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="link" size="icon">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Move to junk</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Move to junk</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="link" size="icon">
                    <ReceiptText className="h-4 w-4" />
                    <span className="sr-only">Print</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Print</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="link" size="icon">
                    <BookCopy className="h-4 w-4" />
                    <span className="sr-only">Full Print</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Full Print</TooltipContent>
              </Tooltip>
              <Separator orientation="vertical" className="mx-1 h-6" />{' '}
              <span className="text-base text-muted-foreground ml-2 font-normal line-clamp-1">
                Request for a leave on upcoming thursday
              </span>
            </div>
            <div className="ml-auto flex items-center ">
              <Separator orientation="vertical" className="mx-1 h-6" />{' '}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="link" size="icon">
                    <Check className="h-4 w-4" />
                    <span className="sr-only">Accept</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reply</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="link"
                    size="icon"
                    onClick={() => {
                      dispatch(requestActions.setCurrentRequestStep('reject'));
                    }}
                  >
                    <GitPullRequestClosed className="h-4 w-4" />
                    <span className="sr-only">Reject</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reject</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="link" size="icon">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="sr-only">Favorite</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Favorite</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="flex flex-1 flex-col">
            <div className="flex items-start p-4">
              <div className="flex items-start gap-4 text-sm">
                <Avatar>
                  <AvatarImage
                    alt={'username'}
                    src="https://plus.unsplash.com/premium_photo-1672239496412-ab605befa53f?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8bWFsZXxlbnwwfHwwfHx8MA%3D%3D"
                  />
                  <AvatarFallback></AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <div className="font-semibold">Huzaifa Majeed</div>
                  <div className="line-clamp-1 text-xs">
                    zaifali785@gmail.com
                  </div>
                  <div className="line-clamp-1 text-xs">
                    Request for a leave on upcoming thursday
                  </div>
                </div>
              </div>
              <div className="ml-auto text-xs text-muted-foreground">
                Oct 22, 2023, 9:00:00 AM
              </div>
            </div>
            <Separator />
            <div
              className="p-4"
              dangerouslySetInnerHTML={{
                __html: `<p><span font-size: 14px; color: rgb(250, 250, 250);">Hi, let's have a meeting tomorrow to discuss the project. I've been reviewing the project details and have some ideas I'd like to share. It's crucial that we align on our next steps to ensure the project's success.</span></p><p><br></p><p>`,
              }}
            />
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default RequestView;
