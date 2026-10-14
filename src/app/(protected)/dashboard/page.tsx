"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  FileCheck, 
  ClipboardList, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  HardHat, 
  ChevronRight,
  TrendingUp,
  Activity,
  Layers
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { Solicitud, Cotizacion, Orden, Auditoria } from "@/types/backend";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, type Variants } from "framer-motion";

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [solRes, cotRes, ordRes, audRes] = await Promise.allSettled([
          api.get<Solicitud[]>("/solicitudes"),
          api.get<Cotizacion[]>("/cotizaciones"),
          api.get<Orden[]>("/ordenes"),
          api.get<Auditoria[]>("/auditoria"),
        ]);

        if (solRes.status === "fulfilled") setSolicitudes(solRes.value.data);
        if (cotRes.status === "fulfilled") setCotizaciones(cotRes.value.data);
        if (ordRes.status === "fulfilled") setOrdenes(ordRes.value.data);
        if (audRes.status === "fulfilled") setAuditorias(audRes.value.data.slice(0, 6));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Métricas calculadas para la operación
  const countSolicitudesNuevas = solicitudes.filter(s => s.estado === "RECIBIDA").length;
  const countCotizacionesPendientes = cotizaciones.filter(c => c.estado === "PENDIENTE").length;
  const countOrdenesEnProgreso = ordenes.filter(o => o.estado === "EN_PROGRESO" || o.estado === "CREADA").length;
  const countOrdenesPorVerificar = ordenes.filter(o => o.estado === "PENDIENTE_VERIFICACION").length;
  const countOrdenesCompletadas = ordenes.filter(o => o.estado === "COMPLETADA").length;

  // Filtrado específico para el técnico
  const misOrdenesTecnico = ordenes.filter(o => o.tecnicoAsignado?.id === user?.id);
  const misOrdenesActivas = misOrdenesTecnico.filter(o => o.estado === "EN_PROGRESO" || o.estado === "CREADA");

  const isTecnico = user?.rol === "TECNICO";

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={staggerContainer} 
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* Encabezado Principal */}
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Centro de Control Operativo
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isTecnico 
              ? `Hola, ${user?.nombre}. Tienes ${misOrdenesActivas.length} órdenes asignadas pendientes de completar.` 
              : `Flujo continuo de servicios generales en tiempo real · Operador: ${user?.nombre} (${user?.rol}).`}
          </p>
        </div>

        {!isTecnico && (
          <div className="flex items-center gap-2.5">
            <Link href="/dashboard/solicitudes">
              <Button size="sm" className="gap-2 shadow-xs">
                <Plus className="h-4 w-4" /> Nueva Solicitud
              </Button>
            </Link>
            <Link href="/dashboard/ordenes">
              <Button size="sm" variant="outline" className="gap-2">
                <ClipboardList className="h-4 w-4" /> Órdenes
              </Button>
            </Link>
          </div>
        )}
      </motion.div>

      {/* PIPELINE DEL CICLO DE SERVICIO (Modo Operación) */}
      {!isTecnico ? (
        <motion.section variants={staggerItem} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Pipeline de Servicios en Curso
            </h2>
            <span className="text-xs text-muted-foreground font-medium">
              4 etapas del ciclo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* ETAPA 1 */}
            <Link href="/dashboard/solicitudes" className="block group">
              <div className="h-full p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span className="font-semibold text-foreground/80 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-blue-500" /> 1. Solicitudes
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">Entrada</Badge>
                  </div>
                  <div className="text-2xl font-bold tracking-tight">
                    {loading ? <Skeleton className="h-7 w-12" /> : countSolicitudesNuevas}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Por cotizar o asignar</p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-medium text-primary">
                  <span>Atender solicitudes</span>
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>

            {/* ETAPA 2 */}
            <Link href="/dashboard/cotizaciones" className="block group">
              <div className="h-full p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span className="font-semibold text-foreground/80 flex items-center gap-1.5">
                      <FileCheck className="h-4 w-4 text-amber-500" /> 2. Cotizaciones
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">Presupuesto</Badge>
                  </div>
                  <div className="text-2xl font-bold tracking-tight">
                    {loading ? <Skeleton className="h-7 w-12" /> : countCotizacionesPendientes}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Esperando aprobación</p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-medium text-primary">
                  <span>Revisar propuestas</span>
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>

            {/* ETAPA 3 */}
            <Link href="/dashboard/ordenes" className="block group">
              <div className="h-full p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span className="font-semibold text-foreground/80 flex items-center gap-1.5">
                      <ClipboardList className="h-4 w-4 text-indigo-500" /> 3. En Campo
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">Técnicos</Badge>
                  </div>
                  <div className="text-2xl font-bold tracking-tight">
                    {loading ? <Skeleton className="h-7 w-12" /> : countOrdenesEnProgreso}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Órdenes en ejecución</p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-medium text-primary">
                  <span>Ver asignaciones</span>
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>

            {/* ETAPA 4 */}
            <Link href="/dashboard/ordenes" className="block group">
              <div className="h-full p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span className="font-semibold text-foreground/80 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 4. Cierres
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">Finalizados</Badge>
                  </div>
                  <div className="text-2xl font-bold tracking-tight">
                    {loading ? <Skeleton className="h-7 w-12" /> : countOrdenesCompletadas}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Servicios verificados</p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-medium text-primary">
                  <span>Consultar historial</span>
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          </div>
        </motion.section>
      ) : (
        /* VISTA ESPECÍFICA PARA EL TÉCNICO EN CAMPO */
        <motion.section variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold text-foreground">Órdenes Activas</span>
              <HardHat className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold tracking-tight">
              {loading ? "..." : misOrdenesActivas.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Asignadas a tu usuario</p>
            <Link href="/dashboard/ordenes" className="mt-4 inline-flex items-center text-xs font-semibold text-primary">
              Ir a mis órdenes <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold text-foreground">En Verificación</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-3xl font-bold tracking-tight">
              {loading ? "..." : misOrdenesTecnico.filter(o => o.estado === "PENDIENTE_VERIFICACION").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Con evidencias fotográficas subidas</p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold text-foreground">Total Completadas</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold tracking-tight">
              {loading ? "..." : misOrdenesTecnico.filter(o => o.estado === "COMPLETADA").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Trabajos de campo aprobados</p>
          </div>
        </motion.section>
      )}

      {/* BLOQUE CENTRAL: TAREAS URGENTES Y STREAM DE AUDITORÍA EN VIVO */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Alertas de Atención Operativa */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" /> Foco de Acción Operativo
            </h2>
          </div>

          <div className="space-y-3">
            {/* Alerta 1: Órdenes por verificar */}
            {countOrdenesPorVerificar > 0 && (
              <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {countOrdenesPorVerificar} {countOrdenesPorVerificar === 1 ? "orden requiere" : "órdenes requieren"} verificación de evidencias
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Los técnicos han subido las fotos y notas de trabajo. Es necesario validar y emitir el cierre formal.
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/ordenes">
                  <Button size="sm" variant="outline" className="border-amber-500/30 text-xs shrink-0">
                    Revisar
                  </Button>
                </Link>
              </div>
            )}

            {/* Alerta 2: Solicitudes sin atender */}
            {countSolicitudesNuevas > 0 && (
              <div className="p-4 rounded-xl border border-blue-500/25 bg-blue-500/5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {countSolicitudesNuevas} {countSolicitudesNuevas === 1 ? "solicitud nueva pendiente" : "solicitudes nuevas pendientes"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Clientes han solicitado servicio. Decide si requiere presupuesto previo o emite una orden de trabajo directa.
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/solicitudes">
                  <Button size="sm" variant="outline" className="border-blue-500/30 text-xs shrink-0">
                    Gestionar
                  </Button>
                </Link>
              </div>
            )}

            {countOrdenesPorVerificar === 0 && countSolicitudesNuevas === 0 && (
              <div className="p-6 rounded-xl border border-dashed border-border bg-card text-center space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Al día: No hay solicitudes ni órdenes con atención prioritaria urgente.
                </p>
                <p className="text-xs text-muted-foreground">
                  El ciclo operativo se encuentra fluyendo con normalidad.
                </p>
              </div>
            )}

            {/* Accesos rápidos funcionales */}
            <div className="pt-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Accesos Directos de Negocio
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Link href="/dashboard/clientes">
                  <div className="p-3 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors text-xs font-medium flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary/70" />
                    Directorio Clientes
                  </div>
                </Link>
                <Link href="/dashboard/catalogo">
                  <div className="p-3 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors text-xs font-medium flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary/70" />
                    Catálogo Servicios
                  </div>
                </Link>
                <Link href="/dashboard/auditoria">
                  <div className="p-3 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors text-xs font-medium flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary/70" />
                    Auditoría del Sistema
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Stream de Auditoría en Vivo (Trazabilidad Real) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-emerald-500" /> Eventos en Vivo
            </h2>
            <Link href="/dashboard/auditoria" className="text-[11px] font-medium text-primary hover:underline">
              Ver todo
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))
            ) : auditorias.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Sin eventos de auditoría registrados.
              </p>
            ) : (
              <div className="divide-y divide-border/50">
                {auditorias.map((item) => (
                  <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <Badge variant="outline" className="text-[9px] px-1 py-0 font-medium">
                        {item.tipoEntidad} #{item.entidadId}
                      </Badge>
                      <span className="text-muted-foreground text-[10px]">
                        {new Date(item.creadoEn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-foreground leading-tight">
                      {item.accion}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {item.usuarioEmail || "Sistema"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
