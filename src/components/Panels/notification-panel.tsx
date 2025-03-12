import * as React from 'react';
import { Label } from '../ui/label';
import EachNotification from '../Cards/notifications/each-notification';

const notifications = [
  {
    title: 'Laiba Sent you a Leave Request.',
    description: '30 minutes ago',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=3744&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    fallback: 'LS',
  },
  {
    title:
      'Ayesha has blocked you on Instagram. Are you sure you want to continue? This action cannot be undone.',
    description: '1 hour ago',
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=3276&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    fallback: 'AA',
  },
  {
    title: 'Ayesha has accepted your invitation to join the team.',
    description: '1 hour ago',
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=3276&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    fallback: 'AA',
  },
];

export function NotificationPanel() {
  return (
    <React.Fragment>
      <div className="hidden lg:flex duration-200 relative h-svh w-[18rem] flex-col bg-sidebar text-sidebar-foreground border z-10 p-2 ">
        <div className="grid grid-cols-1 gap-2 pt-2">
          {notifications.map((notification, index) => (
            <EachNotification notification={notification} key={index} />
          ))}
        </div>
      </div>
    </React.Fragment>
  );
}
