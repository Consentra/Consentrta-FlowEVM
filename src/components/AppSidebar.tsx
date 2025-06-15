
import { useLocation } from "react-router-dom";
import {
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
  Vote,
  Users,
  BarChart3,
  Bot,
  Shield,
  Plus
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

// Menu items - removed profile option
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Proposals",
    url: "/proposals",
    icon: Vote,
  },
  {
    title: "Create Proposal",
    url: "/proposals/create",
    icon: Plus,
  },
  {
    title: "DAOs",
    url: "/daos",
    icon: Users,
  },
  {
    title: "Create DAO",
    url: "/daos/create",
    icon: Plus,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "AI Assistance",
    url: "/ai-assistance",
    icon: Bot,
  },
  {
    title: "Identity Verification",
    url: "/verification",
    icon: Shield,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Governance Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
