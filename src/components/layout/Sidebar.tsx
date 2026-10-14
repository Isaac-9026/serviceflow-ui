"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Settings, 
  ClipboardList,
  Wrench,
  FileText,
  FileCheck,
  LogOut
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/solicitudes", label: "Solicitudes", icon: FileText },
  { href: "/dashboard/cotizaciones", label: "Cotizaciones", icon: FileCheck },
  { href: "/dashboard/ordenes", label: "Órdenes de Trabajo", icon: ClipboardList },
  { href: "/dashboard/clientes", label: "Clientes", icon: Briefcase },
  { href: "/dashboard/catalogo", label: "Catálogo", icon: Wrench },
  { href: "/dashboard/usuarios", label: "Usuarios", icon: Users },
  { href: "/dashboard/auditoria", label: "Auditoría", icon: Settings },
];

const techLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/ordenes", label: "Mis Órdenes", icon: ClipboardList },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada correctamente");
    router.push("/login");
  };

  const links = user?.rol === "TECNICO" ? techLinks : adminLinks;

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border px-3 py-4">
      <div className="mb-8 flex items-center px-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Wrench className="h-4 w-4" />
        </div>
        <span className="ml-3 text-lg font-semibold tracking-tight text-sidebar-foreground">
          ServiceFlow
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
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

      {/* Footer del usuario con Cerrar Sesión */}
      {user && (
        <div className="mt-auto border-t border-sidebar-border pt-4 px-1 space-y-2">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-sidebar-accent/50 border border-sidebar-border/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-xs shrink-0">
              {user.nombre ? user.nombre.substring(0, 2).toUpperCase() : "U"}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-sidebar-foreground truncate" title={user.nombre}>
                {user.nombre}
              </span>
              <span className="text-[10px] text-muted-foreground truncate capitalize">
                {user.rol.toLowerCase()}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            title="Cerrar sesión en ServiceFlow"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}
