"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/store/authStore";

const routeMeta: Record<string, { section: string; title: string }> = {
  "/dashboard": { section: "General", title: "Panel Principal" },
  "/dashboard/solicitudes": { section: "Operaciones", title: "Solicitudes de Servicio" },
  "/dashboard/cotizaciones": { section: "Operaciones", title: "Cotizaciones" },
  "/dashboard/ordenes": { section: "Operaciones", title: "Órdenes de Trabajo" },
  "/dashboard/clientes": { section: "Comercial", title: "Clientes" },
  "/dashboard/catalogo": { section: "Comercial", title: "Catálogo de Servicios" },
  "/dashboard/usuarios": { section: "Sistema", title: "Equipo y Usuarios" },
  "/dashboard/auditoria": { section: "Sistema", title: "Auditoría de Eventos" },
};

export function Topbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [fechaActual, setFechaActual] = useState("");

  useEffect(() => {
    const hoy = new Date();
    const formato = new Intl.DateTimeFormat("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(hoy);
    setFechaActual(formato.charAt(0).toUpperCase() + formato.slice(1));
  }, []);

  const currentMeta = routeMeta[pathname] || { section: "Módulo", title: "ServiceFlow" };

  if (!user) return null;

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-background/95 backdrop-blur-xs px-6 select-none shrink-0 z-10">
      {/* Breadcrumb contextual */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground font-medium">{currentMeta.section}</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
        <h1 className="text-sm font-semibold text-foreground tracking-tight">
          {currentMeta.title}
        </h1>
      </div>

      {/* Utilidades Operativas (Sin duplicación de perfil/cierre) */}
      <div className="flex items-center gap-3">
        {/* Fecha actual del turno operativo */}
        {fechaActual && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground font-medium px-2.5 py-1 rounded-lg bg-muted/40 border border-border/40">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground/80" />
            <span>{fechaActual}</span>
          </div>
        )}


        {/* Botón de alternancia de tema claro/oscuro */}
        <ThemeToggle />

        {/* Acceso rápido contextual (Solo para Coordinador y Admin cuando no estén ya en solicitudes) */}
        {(user.rol === "ADMIN" || user.rol === "COORDINADOR") && pathname !== "/dashboard/solicitudes" && (
          <Link href="/dashboard/solicitudes">
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs font-medium border-border/80 hover:bg-primary/5 hover:text-primary">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nueva Solicitud</span>
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
