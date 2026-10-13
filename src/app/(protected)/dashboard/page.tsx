"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  FileCheck, 
  ClipboardList, 
  CheckCircle2, 
  ArrowRight,
  Plus,
  Users,
  HardHat
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { Solicitud, Cotizacion, Orden } from "@/types/backend";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [metrics, setMetrics] = useState({
    solicitudesRecibidas: 0,
    cotizacionesPendientes: 0,
    ordenesEnProgreso: 0,
    ordenesCompletadas: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const [solRes, cotRes, ordRes] = await Promise.allSettled([
          api.get<Solicitud[]>("/solicitudes"),
          api.get<Cotizacion[]>("/cotizaciones"),
          api.get<Orden[]>("/ordenes"),
        ]);

        const solicitudes = solRes.status === "fulfilled" ? solRes.value.data : [];
        const cotizaciones = cotRes.status === "fulfilled" ? cotRes.value.data : [];
        const ordenes = ordRes.status === "fulfilled" ? ordRes.value.data : [];

        setMetrics({
          solicitudesRecibidas: solicitudes.filter(s => s.estado === "RECIBIDA").length,
          cotizacionesPendientes: cotizaciones.filter(c => c.estado === "PENDIENTE").length,
          ordenesEnProgreso: ordenes.filter(o => o.estado === "EN_PROGRESO" || o.estado === "CREADA").length,
          ordenesCompletadas: ordenes.filter(o => o.estado === "COMPLETADA").length,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const cards = [
    {
      title: "Solicitudes por Atender",
      value: metrics.solicitudesRecibidas,
      icon: FileText,
      href: "/dashboard/solicitudes",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      description: "Nuevas peticiones recibidas"
    },
    {
      title: "Cotizaciones Pendientes",
      value: metrics.cotizacionesPendientes,
      icon: FileCheck,
      href: "/dashboard/cotizaciones",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      description: "En espera de aprobación"
    },
    {
      title: "Órdenes en Ejecución",
      value: metrics.ordenesEnProgreso,
      icon: ClipboardList,
      href: "/dashboard/ordenes",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      description: "Asignadas o en progreso"
    },
    {
      title: "Servicios Finalizados",
      value: metrics.ordenesCompletadas,
      icon: CheckCircle2,
      href: "/dashboard/ordenes",
      color: "text-green-500",
      bg: "bg-green-500/10",
      description: "Órdenes cerradas con éxito"
    },
  ];

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel Principal</h1>
          <p className="text-muted-foreground text-sm">
            Bienvenido, <span className="font-semibold text-foreground">{user?.nombre}</span> ({user?.rol}). Monitorea el ciclo operativo en tiempo real.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/dashboard/solicitudes">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nueva Solicitud
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Tarjetas de métricas del ciclo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={card.href}>
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:border-primary/50 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                    <div className={`p-2 rounded-lg ${card.bg}`}>
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-bold tracking-tight">
                      {loading ? "..." : card.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                  </div>
                  <div className="mt-4 flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver módulo <ArrowRight className="h-3 w-3 ml-1" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Flujo de Trabajo Guía */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Ciclo de Trabajo de ServiceFlow</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Sigue las etapas del proceso de negocio desde que un cliente solicita un servicio hasta su cierre verificado:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-muted/40 border border-border/50">
            <div className="font-semibold text-primary mb-1">1. Solicitud Recibida</div>
            <p className="text-xs text-muted-foreground">
              Registra la solicitud del cliente. Decide si requiere cotización previa o va directo a orden.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/40 border border-border/50">
            <div className="font-semibold text-primary mb-1">2. Cotización y Aprobación</div>
            <p className="text-xs text-muted-foreground">
              Define el presupuesto. Al ser aprobado por el cliente, genera la Orden de Trabajo.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/40 border border-border/50">
            <div className="font-semibold text-primary mb-1">3. Asignación y Ejecución</div>
            <p className="text-xs text-muted-foreground">
              Asigna al técnico responsable. El personal en campo ejecuta y sube evidencias o notas.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/40 border border-border/50">
            <div className="font-semibold text-primary mb-1">4. Verificación y Cierre</div>
            <p className="text-xs text-muted-foreground">
              El coordinador verifica el cumplimiento de las evidencias y cierra la orden formalmente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
