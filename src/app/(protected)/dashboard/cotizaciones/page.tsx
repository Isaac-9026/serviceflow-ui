"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, FileText, Wrench, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Cotizacion } from "@/types/backend";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function CotizacionesPage() {
  const router = useRouter();
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);

  // Generar Orden de Trabajo desde Cotización Aprobada
  const [isGenerarOrdenOpen, setIsGenerarOrdenOpen] = useState(false);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [ordenDescripcion, setOrdenDescripcion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get<Cotizacion[]>("/cotizaciones");
      setCotizaciones(res.data);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        toast.error("Error al cargar cotizaciones");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAprobar = async (solicitudId: number, cotizacionId: number) => {
    try {
      await api.patch(`/solicitudes/${solicitudId}/cotizaciones/${cotizacionId}/aprobar`);
      toast.success("Cotización aprobada. Ya puedes generar la Orden de Trabajo.");
      fetchData();
    } catch (error) {
      toast.error("Error al aprobar la cotización");
    }
  };

  const openGenerarOrdenDialog = (cotizacion: Cotizacion) => {
    setSelectedCotizacion(cotizacion);
    setOrdenDescripcion(cotizacion.descripcion);
    setIsGenerarOrdenOpen(true);
  };

  const handleGenerarOrdenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCotizacion) return;
    setIsSubmitting(true);
    try {
      await api.post("/ordenes", {
        solicitudId: selectedCotizacion.solicitudId,
        cotizacionId: selectedCotizacion.id,
        descripcion: ordenDescripcion
      });
      toast.success("¡Orden de Trabajo generada con éxito vinculada a la cotización!");
      setIsGenerarOrdenOpen(false);
      fetchData();
      router.push("/dashboard/ordenes");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Error al generar la orden de trabajo";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBadgeVariant = (estado: string) => {
    switch(estado) {
      case 'PENDIENTE': return "secondary";
      case 'APROBADA': return "outline";
      case 'RECHAZADA': return "destructive";
      case 'CANCELADA': return "destructive";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Cotizaciones</h1>
          <p className="text-muted-foreground text-sm">
            Revisa presupuestos de clientes, apruébalos y genera las órdenes de trabajo para ejecución técnica.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Solicitud Asoc.</TableHead>
              <TableHead>Alcance / Descripción</TableHead>
              <TableHead>Monto ($)</TableHead>
              <TableHead>Válido Hasta</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones de Flujo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : cotizaciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No hay cotizaciones emitidas aún. Puedes emitir una desde el módulo de Solicitudes.
                </TableCell>
              </TableRow>
            ) : (
              cotizaciones.map((c) => (
                <TableRow key={c.id} className="group transition-colors">
                  <TableCell className="font-medium text-muted-foreground">#{c.id}</TableCell>
                  <TableCell className="font-medium">
                    <span className="text-primary hover:underline cursor-pointer" onClick={() => router.push("/dashboard/solicitudes")}>
                      Solicitud #{c.solicitudId}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium max-w-[250px] truncate" title={c.descripcion}>
                    {c.descripcion}
                  </TableCell>
                  <TableCell className="font-bold text-foreground">
                    ${Number(c.monto).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.validoHasta ? new Date(c.validoHasta).toLocaleDateString() : "Sin fecha"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(c.estado)}>
                      {c.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      {/* SI ESTÁ PENDIENTE: Puede aprobarse */}
                      {c.estado === 'PENDIENTE' && (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="gap-1.5 h-8 text-xs font-semibold text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-950/30"
                          onClick={() => handleAprobar(c.solicitudId, c.id)}
                          title="Aprobar Presupuesto del Cliente"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Aprobar
                        </Button>
                      )}

                      {/* SI ESTÁ APROBADA: Permite generar la Orden de Trabajo */}
                      {c.estado === 'APROBADA' && (
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-1.5 h-8 text-xs font-semibold"
                          onClick={() => openGenerarOrdenDialog(c)}
                          title="Generar la Orden de Trabajo para el equipo técnico"
                        >
                          <Wrench className="h-3.5 w-3.5" /> Generar Orden
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* DIALOG: GENERAR ORDEN DE TRABAJO DESDE COTIZACIÓN */}
      <Dialog open={isGenerarOrdenOpen} onOpenChange={setIsGenerarOrdenOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Generar Orden de Trabajo</DialogTitle>
            <DialogDescription>
              Vincular la Cotización #{selectedCotizacion?.id} (Solicitud #{selectedCotizacion?.solicitudId}) a una orden de ejecución técnica.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGenerarOrdenSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="ord-cot-desc">Descripción / Instrucciones Técnicas *</Label>
              <Input 
                id="ord-cot-desc"
                value={ordenDescripcion}
                onChange={e => setOrdenDescripcion(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsGenerarOrdenOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !ordenDescripcion}>
                {isSubmitting ? "Generando..." : "Confirmar y Generar Orden"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
