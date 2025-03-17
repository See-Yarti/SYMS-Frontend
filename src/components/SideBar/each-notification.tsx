import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '../ui/label';

export interface INotification {
  id: string;
  message: string;
  title: string;
  image: string;
  link?: string;
  formattedDate: string;
  createdAt: string;
}

const EachNotification = ({
  notification,
}: {
  notification: INotification;
}) => {
  return (
    <React.Fragment>
      <div className="mb-1 items-start rounded-md px-2 w-full">
        <div className="inline-flex items-start gap-2">
          <div>
            <Avatar className="rounded-md">
              <AvatarImage
                src={
                  'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=3948&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
                }
                className="object-cover"
                alt="Avatar"
              />
              <AvatarFallback className="rounded-md">
                {notification.title.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col justify-between space-y-1">
            <Label className="text-sm font-normal leading-1 leading-tight">
              {notification.title}
            </Label>
            <Label className="text-sm text-muted-foreground font-normal leading-1 leading-tight">
              {notification.message}
            </Label>
            <Label className="text-xs font-normal leading-1 leading-tight">
              {notification.formattedDate}
            </Label>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default EachNotification;
