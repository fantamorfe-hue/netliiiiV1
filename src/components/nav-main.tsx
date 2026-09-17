"use client"

import * as React from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  label,
  items,
}: {
  label: string
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
      isActive?: boolean
    }[]
  }[]
}) {
  const location = useLocation()
  const groupRef = React.useRef<HTMLDivElement>(null)
  const [openOverrides, setOpenOverrides] = React.useState<Record<string, boolean>>({})

  // Match both the path and any query string so tabbed links resolve correctly.
  const isUrlActive = (url: string) => {
    const [path, query = ""] = url.split("?")
    if (location.pathname !== path) return false
    if (!query) return true
    const expected = new URLSearchParams(query)
    const current = new URLSearchParams(location.search)
    return [...expected.entries()].every(([key, value]) => current.get(key) === value)
  }

  // An item (and its parent) is active when the current path matches it or one of its subitems
  const isItemActive = (item: typeof items[0]) => {
    if (item.isActive) return true
    if (isUrlActive(item.url)) return true
    return item.items?.some((subItem) => isUrlActive(subItem.url)) || false
  }

  // Reset manual toggles when navigating so route-derived state wins
  React.useEffect(() => {
    setOpenOverrides({})
  }, [location.pathname, location.search])

  return (
    <SidebarGroup ref={groupRef}>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            open={openOverrides[item.title] ?? isItemActive(item)}
            onOpenChange={(open) =>
              setOpenOverrides((prev) => ({ ...prev, [item.title]: open }))
            }
            className="group/collapsible"
          >
            <SidebarMenuItem>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className="cursor-pointer"
                      isActive={isItemActive(item)}
                    >
                      <Link to={item.url}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </Link>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild className="cursor-pointer" isActive={isUrlActive(subItem.url)}>
                            <Link 
                              to={subItem.url}
                              target={(item.title === "Auth Pages" || item.title === "Errors") ? "_blank" : undefined}
                              rel={(item.title === "Auth Pages" || item.title === "Errors") ? "noopener noreferrer" : undefined}
                            >
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : (
                <SidebarMenuButton asChild tooltip={item.title} className="cursor-pointer" isActive={location.pathname === item.url}>
                  <Link to={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
