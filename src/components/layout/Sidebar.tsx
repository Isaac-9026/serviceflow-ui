"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  ClipboardList,
  Wrench,
  FileText,
  FileCheck,
  LogOut,
  ShieldCheck,
  Layers
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const adminNavGroups: NavGroup[] = [
  {
    title: "VISTA GENERAL",
    items: [
      { href: "/dashboard", label: "Dashboard Operativo", icon: LayoutDashboard },
    ],
  },
  {
    title: "OPERACIONES DE CAMPO",
    items: [
      { href: "/dashboard/solicitudes", label: "Solicitudes", icon: FileText },
      { href: "/dashboard/cotizaciones", label: "Cotizaciones", icon: FileCheck },
      { href: "/dashboard/ordenes", label: "Órdenes de Trabajo", icon: ClipboardList },
    ],
  },
  {
    title: "GESTIÓN COMERCIAL",
    items: [
      { href: "/dashboard/clientes", label: "Clientes", icon: Briefcase },
      { href: "/dashboard/catalogo", label: "Catálogo de Servicios", icon: Wrench },
    ],
  },
  {
    title: "SISTEMA Y CONTROL",
    items: [
      { href: "/dashboard/usuarios", label: "Equipo y Técnicos", icon: Users },
      { href: "/dashboard/auditoria", label: "Auditoría de Eventos", icon: ShieldCheck },
    ],
  },
];

const techNavGroups: NavGroup[] = [
  {
    title: "MI OPERACIÓN",
    items: [
      { href: "/dashboard", label: "Panel Técnico", icon: LayoutDashboard },
      { href: "/dashboard/ordenes", label: "Mis Órdenes Asignadas", icon: ClipboardList },
    ],
  },
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

  const navGroups = user?.rol === "TECNICO" ? techNavGroups : adminNavGroups;

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border px-3 py-4 select-none shrink-0">
      {/* Brand Header */}
      <div className="mb-4 flex items-center justify-between px-2 pb-3 border-b border-sidebar-border/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/25">
            <Layers className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-sidebar-foreground flex items-center gap-1.5">
              ServiceFlow
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Servicios Generales
            </span>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-sidebar-border text-muted-foreground">
          v1.0
        </Badge>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <div className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
              {group.title}
            </div>
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileTap={{ scale: 0.96 }}
                    className={`relative flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-[color,background-color,box-shadow] duration-150 ease-out ${
                      isActive 
                        ? "text-primary font-semibold bg-primary/10 shadow-xs" 
                        : "text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer Card */}
      {user && (
        <div className="mt-auto border-t border-sidebar-border pt-3 px-1 space-y-2">
          {/* Concentric border radius: inner rounded-lg (8px) + p-2 (8px padding) = outer rounded-2xl (16px) */}
          <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-sidebar-accent/40 border border-sidebar-border/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary font-bold text-xs shrink-0">
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
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-[color,background-color,border-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer border border-transparent hover:border-destructive/20"
            title="Cerrar sesión en ServiceFlow"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </aside>
  );
}
