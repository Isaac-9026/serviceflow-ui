"use client";

import { useEffect, useState, useMemo } from "react";
import { CheckCircle, Ban, Eye, Wrench, Search, FileText, Calendar, DollarSign } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CotizacionesPage() {
  const router = useRouter();
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("TODAS");

  // Detalle de Cotización
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [selectedDetalle, setSelectedDetalle] = useState<Cotizacion | null>(null);

  // Rechazar Cotización
  const [isRechazarOpen, setIsRechazarOpen] = useState(false);
  const [cotizacionARechazar, setCotizacionARechazar] = useState<Cotizacion | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");

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

  const filteredCotizaciones = useMemo(() => {
    return cotizaciones.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        c.descripcion.toLowerCase().includes(q) ||
        c.solicitudId.toString().includes(q) ||
        c.monto.toString().includes(q);

      const matchesEstado = estadoFilter === "TODAS" || c.estado === estadoFilter;
      return matchesSearch && matchesEstado;
    });
  }, [cotizaciones, searchQuery, estadoFilter]);

  const handleAprobar = async (cotizacionId: number) => {
    try {
      await api.patch(`/cotizaciones/${cotizacionId}/aprobar`);
      toast.success("Cotización aprobada. Ya puedes generar la Orden de Trabajo.");
      fetchData();
    } catch (error) {
      toast.error("Error al aprobar la cotización");
    }
  };

  const openRechazarDialog = (cotizacion: Cotizacion) => {
    setCotizacionARechazar(cotizacion);
    setMotivoRechazo("");
    setIsRechazarOpen(true);
  };

  const handleConfirmarRechazo = async () => {
    if (!cotizacionARechazar) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/cotizaciones/${cotizacionARechazar.id}/rechazar?motivo=${encodeURIComponent(motivoRechazo)}`);
      toast.success("Cotización marcada como RECHAZADA");
      setIsRechazarOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Error al rechazar la cotización");
    } finally {
      setIsSubmitting(false);
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
        descripcion: ordenDescripcion,
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

  const getBadgeClass = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
      case "APROBADA":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30";
      case "RECHAZADA":
        return "bg-destructive/10 text-destructive border-destructive/30";
      case "CANCELADA":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Cotizaciones</h1>
          <p className="text-muted-foreground text-sm">
            Revisa presupuestos emitidos, gestiona aprobaciones de clientes y genera órdenes de trabajo.
          </p>
        </div>
      </div>

      {/* Buscador y Filtro de Estado */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descripción, solicitud..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={estadoFilter} onValueChange={(val) => setEstadoFilter(val || "TODAS")}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todos los estados</SelectItem>
              <SelectItem value="PENDIENTE">Pendiente</SelectItem>
              <SelectItem value="APROBADA">Aprobada</SelectItem>
              <SelectItem value="RECHAZADA">Rechazada</SelectItem>
              <SelectItem value="CANCELADA">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(searchQuery || estadoFilter !== "TODAS") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setEstadoFilter("TODAS");
            }}
            className="h-9"
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Tabla de Cotizaciones */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead className="w-[120px]">Solicitud</TableHead>
              <TableHead>Alcance / Descripción</TableHead>
              <TableHead className="w-[120px]">Monto ($)</TableHead>
              <TableHead className="w-[120px]">Válido Hasta</TableHead>
              <TableHead className="w-[120px]">Estado</TableHead>
              <TableHead className="text-right w-[200px]">Acciones de Flujo</TableHead>
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
            ) : filteredCotizaciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No hay cotizaciones que coincidan con el criterio seleccionado.
                </TableCell>
              </TableRow>
            ) : (
              filteredCotizaciones.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">#{c.id}</TableCell>
                  <TableCell className="font-medium text-xs">
                    <span 
                      className="text-primary hover:underline cursor-pointer" 
                      onClick={() => router.push("/dashboard/solicitudes")}
                      title="Ver en Solicitudes"
                    >
                      Solicitud #{c.solicitudId}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium max-w-[250px] truncate text-sm" title={c.descripcion}>
                    {c.descripcion}
                  </TableCell>
                  <TableCell className="font-bold text-sm text-foreground">
                    ${Number(c.monto).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.validoHasta ? new Date(c.validoHasta).toLocaleDateString() : "Sin fecha"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getBadgeClass(c.estado)}>
                      {c.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setSelectedDetalle(c);
                          setIsDetalleOpen(true);
                        }}
                        title="Ver detalle de presupuesto"
                      >
                        <Eye className="h-3.5 w-3.5" /> Detalle
                      </Button>

                      {/* SI ESTÁ PENDIENTE: Puede aprobarse o rechazarse */}
                      {c.estado === "PENDIENTE" && (
                        <>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="gap-1 h-8 text-xs font-semibold text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-950/30"
                            onClick={() => handleAprobar(c.id)}
                            title="Aprobar Presupuesto del Cliente"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Aprobar
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => openRechazarDialog(c)}
                            title="Rechazar cotización"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}

                      {/* SI ESTÁ APROBADA: Permite generar la Orden de Trabajo */}
                      {c.estado === "APROBADA" && (
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

      {/* DIALOG: VER DETALLE DE COTIZACIÓN */}
      <Dialog open={isDetalleOpen} onOpenChange={setIsDetalleOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Cotización #{selectedDetalle?.id}
            </DialogTitle>
            <DialogDescription>
              Propuesta económica para la Solicitud #{selectedDetalle?.solicitudId}.
            </DialogDescription>
          </DialogHeader>
          {selectedDetalle && (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Monto Total</span>
                    <p className="text-2xl font-bold text-foreground">
                      ${Number(selectedDetalle.monto).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Badge variant="outline" className={getBadgeClass(selectedDetalle.estado)}>
                    {selectedDetalle.estado}
                  </Badge>
                </div>

                <div className="text-sm space-y-1.5 pt-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Vigencia hasta: <strong className="text-foreground">{selectedDetalle.validoHasta ? new Date(selectedDetalle.validoHasta).toLocaleDateString() : "Indefinida"}</strong></span>
                  </div>
                  <div className="text-xs text-muted-foreground pt-1">
                    Emitida el: {new Date(selectedDetalle.creadoEn).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Alcance y Trabajos Incluidos</span>
                <div className="rounded-md border p-3 text-sm bg-background">
                  {selectedDetalle.descripcion}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="default" size="sm" onClick={() => setIsDetalleOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG: RECHAZAR COTIZACIÓN */}
      <Dialog open={isRechazarOpen} onOpenChange={setIsRechazarOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Ban className="h-5 w-5" /> Rechazar Cotización #{cotizacionARechazar?.id}
            </DialogTitle>
            <DialogDescription>
              Esta acción marcará el presupuesto como RECHAZADO y registrará el motivo en la auditoría.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="motivo-rechazo">Motivo del rechazo del cliente (opcional)</Label>
              <Input
                id="motivo-rechazo"
                placeholder="Ej. Precio no aceptado o cliente eligió otro proveedor"
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsRechazarOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" disabled={isSubmitting} onClick={handleConfirmarRechazo}>
                {isSubmitting ? "Rechazando..." : "Confirmar Rechazo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: GENERAR ORDEN DE TRABAJO */}
      <Dialog open={isGenerarOrdenOpen} onOpenChange={setIsGenerarOrdenOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Generar Orden de Trabajo</DialogTitle>
            <DialogDescription>
              Vincular la Cotización #{selectedCotizacion?.id} a una orden de ejecución técnica.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGenerarOrdenSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="ord-cot-desc">Instrucciones Técnicas *</Label>
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
