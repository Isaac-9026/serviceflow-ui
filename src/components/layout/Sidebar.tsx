"use client";

import { useState } from "react";
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
  Layers, 
  ChevronsUpDown,
  User,
  Mail,
  Copy,
  Check,
  KeyRound,
  ExternalLink
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada correctamente");
    router.push("/login");
  };

  const handleCopyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      setCopiedEmail(true);
      toast.success("Correo copiado al portapapeles");
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const getRoleInfo = (rol?: string) => {
    switch (rol) {
      case "ADMIN":
        return {
          label: "Administrador del Sistema",
          desc: "Control total de la plataforma: gestión de personal, catálogo de servicios, aprobación de flujos operativos y auditoría de eventos.",
          badgeClass: "bg-primary/10 text-primary border-primary/20",
        };
      case "COORDINADOR":
        return {
          label: "Coordinador de Operaciones",
          desc: "Gestión del flujo de servicios: recepción de solicitudes, emisión de cotizaciones, asignación de técnicos y validación de órdenes completadas.",
          badgeClass: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
        };
      case "TECNICO":
        return {
          label: "Técnico Especialista de Campo",
          desc: "Ejecución operativa: seguimiento de órdenes asignadas, registro de notas de trabajo y carga de evidencias fotográficas en terreno.",
          badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
        };
      default:
        return {
          label: rol || "Operador",
          desc: "Usuario autenticado en la plataforma de servicios.",
          badgeClass: "bg-muted text-foreground border-border",
        };
    }
  };

  const roleInfo = getRoleInfo(user?.rol);
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
            <span className="text-base font-bold tracking-tight text-sidebar-foreground">
              ServiceFlow
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Servicios Generales
            </span>
          </div>
        </div>
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
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-[color,background-color,box-shadow] duration-150 ease-out ${
                      isActive 
                        ? "text-primary font-semibold bg-primary/10 shadow-xs" 
                        : "text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer: Menú de cuenta unificado */}
      {user && (
        <div className="mt-auto border-t border-sidebar-border/60 pt-3 px-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 p-1.5 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/20 hover:bg-sidebar-accent/60 hover:border-sidebar-border transition-colors text-left group cursor-pointer"
                title="Opciones de cuenta"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary font-bold text-xs shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {user.nombre ? user.nombre.substring(0, 2).toUpperCase() : "U"}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-semibold text-sidebar-foreground truncate" title={user.nombre}>
                      {user.nombre}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {roleInfo.label}
                    </span>
                  </div>
                </div>
                <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-sidebar-foreground shrink-0 transition-colors mr-1" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="top"
              align="start"
              sideOffset={8}
              className="w-56 p-1.5 shadow-lg border-border"
            >
              {/* Información rápida de cabecera */}
              <div className="px-2 py-1.5 space-y-0.5">
                <p className="text-xs font-semibold text-foreground truncate">{user.nombre}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                <div className="pt-1">
                  <span className="inline-block text-[10px] font-medium text-primary">
                    {roleInfo.label}
                  </span>
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* Opción para ver detalles completos de la cuenta */}
              <DropdownMenuItem
                onClick={() => setIsProfileOpen(true)}
                className="cursor-pointer text-xs"
              >
                <User className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <span>Información de cuenta</span>
              </DropdownMenuItem>

              {/* Acceso para Administrador */}
              {user.rol === "ADMIN" && (
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/usuarios")}
                  className="cursor-pointer text-xs"
                >
                  <Users className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <span>Gestión de Usuarios</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {/* Cerrar sesión */}
              <DropdownMenuItem
                variant="destructive"
                onClick={handleLogout}
                className="cursor-pointer text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="h-3.5 w-3.5 mr-2" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Modal / Dialog de Información de Cuenta (Limpio y sin artefactos IA) */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-md overscroll-contain p-0 overflow-hidden border-border shadow-lg">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-border/60 bg-muted/20">
            <DialogHeader className="space-y-1 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                  Credencial de Usuario
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${roleInfo.badgeClass}`}>
                  {roleInfo.label}
                </span>
              </div>
              <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                Información de Cuenta
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Detalles del usuario y permisos asignados en ServiceFlow.
              </DialogDescription>
            </DialogHeader>

            {/* Identidad */}
            <div className="mt-4 flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shrink-0">
                {user?.nombre ? user.nombre.substring(0, 2).toUpperCase() : "U"}
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-base font-bold text-foreground truncate">
                  {user?.nombre}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Detalles */}
          <div className="p-6 space-y-3.5 text-xs">
            {/* Correo Electrónico */}
            <div className="rounded-xl border border-border bg-card p-3 shadow-2xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Correo Electrónico
              </span>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-foreground font-medium truncate">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopyEmail}
                  className="h-7 px-2 text-xs gap-1 shrink-0"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-muted-foreground" />
                      <span>Copiar</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Metadatos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-3 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  ID de Cuenta
                </span>
                <div className="flex items-center gap-1.5 text-foreground font-semibold text-sm">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <span>#{user?.id}</span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-3 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Rol de Acceso
                </span>
                <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs truncate">
                  <KeyRound className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{user?.rol}</span>
                </div>
              </div>
            </div>

            {/* Permisos */}
            <div className="rounded-xl border border-border bg-muted/30 p-3 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <span>Nivel de Permisos</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {roleInfo.desc}
              </p>
            </div>


            {/* Enlace para Administradores */}
            {user?.rol === "ADMIN" && (
              <Button
                variant="outline"
                className="w-full justify-between h-9 text-xs font-medium border-border hover:bg-muted"
                onClick={() => {
                  setIsProfileOpen(false);
                  router.push("/dashboard/usuarios");
                }}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Administrar equipo y técnicos</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>

          {/* Footer de Modal */}
          <div className="flex items-center justify-end border-t border-border/60 bg-muted/20 px-6 py-3">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setIsProfileOpen(false)}
              className="text-xs px-4"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
