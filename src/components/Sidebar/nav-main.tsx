import { ChevronRight } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Link, useLocation } from 'react-router-dom';
import { navigationRoutes } from '@/data/navigation-routes';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import React from 'react';
import { Label } from '../ui/label';

export function NavMain() {
  const { pathname } = useLocation();
  const lastIndex = pathname.split('/').pop() || '/';
  const firstIndex = pathname.split('/')[1] || '/';
  return (
    <SidebarMenu>
      {navigationRoutes.map((section) => (
        <React.Fragment key={section.title}>
          <Label className="mb-2 text-sm font-normal text-muted-foreground">
            {section.title}
          </Label>
          {section.items.map((item) => (
            <React.Fragment key={item.title}>
              {item.type === 'route' ? (
                <SidebarMenuSubItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={item.url == pathname}
                  >
                    <Link
                      to={item.url}
                      className="flex w-full items-center gap-2"
                    >
                      {item.icon && <item.icon className="w-4 h-4" />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuSubItem>
              ) : (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.slug == firstIndex}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="gap-2">
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={subItem.url == pathname}
                            >
                              <Link to={subItem.url}>{subItem.title}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}
    </SidebarMenu>
  );
}
