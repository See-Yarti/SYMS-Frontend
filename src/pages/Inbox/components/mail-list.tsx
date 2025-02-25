import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
const MailList = () => {
  return (
    <React.Fragment>
      <ScrollArea className="h-[calc(100vh-9rem)] ">
        <div className="flex flex-col gap-2 pr-4">
          {Array(10)
            .fill(null)
            .map(() => {
              return (
                <button
                  className={
                    'flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent'
                  }
                >
                  <div className="flex w-full flex-col gap-1">
                    <div className="flex items-center">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">William Smith</div>
                      </div>
                      <div className={'ml-auto text-xs text-muted-foreground '}>
                        about 1 hour ago
                      </div>
                    </div>
                    <div className="text-xs font-medium">Meeting Tomorrow</div>
                  </div>
                  <div className="line-clamp-2 text-xs text-muted-foreground">
                    Hi, let's have a meeting tomorrow to discuss the project.
                    I've been reviewing the project details and have some ideas
                    I'd like to share. It's crucial that we align on our next
                    steps to ensure the project's success.
                  </div>
                  <Badge variant={'default'} className="mt-2 rounded-md">
                    Leave Request
                  </Badge>
                </button>
              );
            })}
        </div>
      </ScrollArea>
    </React.Fragment>
  );
};

export default MailList;
