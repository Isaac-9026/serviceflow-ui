"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Settings, 
  ClipboardList,
  Wrench,
  FileText
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/usuarios", label: "Usuarios", icon: Users },
  { href: "/dashboard/clientes", label: "Clientes", icon: Briefcase },
  { href: "/dashboard/catalogo", label: "Catálogo", icon: Wrench },
  { href: "/dashboard/solicitudes", label: "Solicitudes", icon: FileText },
  { href: "/dashboard/ordenes", label: "Órdenes de Trabajo", icon: ClipboardList },
  { href: "/dashboard/auditoria", label: "Auditoría", icon: Settings },
];

const techLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/ordenes", label: "Mis Órdenes", icon: ClipboardList },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  const links = user?.rol === "TECNICO" ? techLinks : adminLinks;

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border px-3 py-4">
      <div className="mb-8 flex items-center px-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Wrench className="h-4 w-4" />
        </div>
        <span className="ml-3 text-lg font-semibold tracking-tight text-sidebar-foreground">
          ServiceFlow
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive 
                    ? "text-sidebar-primary" 
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-md bg-sidebar-primary/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
                <Icon className={`h-4 w-4 z-10 ${isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50"}`} />
                <span className="z-10">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
