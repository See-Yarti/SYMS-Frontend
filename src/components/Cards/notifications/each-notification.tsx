import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';

export interface INotification {
  id: string;
  message: string;
  image: string;
  link?: string;
  fallback: string;
  createdAt: string;
}

const EachNotification = ({
  notification,
}: {
  notification: INotification;
}) => {
  return (
    <React.Fragment>
      <div className="mb-1 items-start bg-muted dark:bg-transparent rounded-md p-1  ">
        <div className="inline-flex items-start gap-2">
          <Avatar className="rounded-md ">
            <AvatarImage
              src={notification.image}
              className="object-cover"
              alt="Avatar"
            />
            <AvatarFallback className="rounded-md">
              {notification.fallback}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col  h-full">
            <Label className="text-sm font-normal">
              {notification.message}
            </Label>
            {/* <span className="text-sm text-muted-foreground">
              {notification.description}
            </span> */}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default EachNotification;
