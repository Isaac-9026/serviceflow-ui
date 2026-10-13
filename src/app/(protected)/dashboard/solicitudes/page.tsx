"use client";

import { useEffect, useState } from "react";
import { Plus, Ban, FileText, Calculator, Wrench, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Solicitud, Cliente, Categoria } from "@/types/backend";

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

export default function SolicitudesPage() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  // Nueva Solicitud
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({ 
    clienteId: "", 
    categoriaId: "", 
    descripcion: "",
    direccion: "" 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generar Cotización
  const [isCotizarOpen, setIsCotizarOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [cotizarFormData, setCotizarFormData] = useState({
    descripcion: "",
    monto: "",
    validoHasta: ""
  });

  // Generar Orden Directa (sin cotización)
  const [isOrdenDirectaOpen, setIsOrdenDirectaOpen] = useState(false);
  const [ordenDescripcion, setOrdenDescripcion] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [solRes, cliRes, catRes] = await Promise.all([
        api.get<Solicitud[]>("/solicitudes"),
        api.get<Cliente[]>("/clientes"),
        api.get<Categoria[]>("/categorias")
      ]);
      setSolicitudes(solRes.data);
      setClientes(cliRes.data);
      setCategorias(catRes.data);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        toast.error("Error al cargar los datos del módulo");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateDialog = () => {
    setCreateFormData({ clienteId: "", categoriaId: "", descripcion: "", direccion: "" });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/solicitudes", {
        clienteId: Number(createFormData.clienteId),
        categoriaId: createFormData.categoriaId ? Number(createFormData.categoriaId) : null,
        descripcion: createFormData.descripcion,
        direccion: createFormData.direccion || null
      });
      toast.success("Solicitud registrada con estado RECIBIDA");
      setIsCreateOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Error al crear la solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir Modal de Cotizar
  const openCotizarDialog = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    // Establecer fecha por defecto: 15 días en el futuro
    const defaultValidez = new Date();
    defaultValidez.setDate(defaultValidez.getDate() + 15);
    const dateStr = defaultValidez.toISOString().split("T")[0];

    setCotizarFormData({
      descripcion: `Presupuesto para: ${solicitud.descripcion}`,
      monto: "",
      validoHasta: dateStr
    });
    setIsCotizarOpen(true);
  };

  const handleCotizarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSolicitud) return;
    setIsSubmitting(true);
    try {
      await api.post(`/solicitudes/${selectedSolicitud.id}/cotizaciones`, {
        descripcion: cotizarFormData.descripcion,
        monto: Number(cotizarFormData.monto),
        validoHasta: cotizarFormData.validoHasta
      });
      toast.success("Cotización emitida. La solicitud ahora está COTIZADA");
      setIsCotizarOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Error al emitir la cotización");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir Modal de Orden Directa
  const openOrdenDirectaDialog = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setOrdenDescripcion(solicitud.descripcion);
    setIsOrdenDirectaOpen(true);
  };

  const handleOrdenDirectaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSolicitud) return;
    setIsSubmitting(true);
    try {
      await api.post("/ordenes", {
        solicitudId: selectedSolicitud.id,
        cotizacionId: null,
        descripcion: ordenDescripcion
      });
      toast.success("Orden de Trabajo generada directamente. Solicitud pasa a EN PROGRESO");
      setIsOrdenDirectaOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Error al generar orden de trabajo directa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelar = async (id: number) => {
    if (!confirm("¿Seguro que deseas cancelar esta solicitud?")) return;
    try {
      await api.patch(`/solicitudes/${id}/cancelar`);
      toast.success("Solicitud cancelada correctamente");
      fetchData();
    } catch (error) {
      toast.error("No se pudo cancelar la solicitud");
    }
  };

  const getBadgeVariant = (estado: string) => {
    switch(estado) {
      case 'RECIBIDA': return "default";
      case 'COTIZADA': return "secondary";
      case 'EN_PROGRESO': return "outline";
      case 'COMPLETADA': return "outline";
      case 'CANCELADA': return "destructive";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Solicitudes</h1>
          <p className="text-muted-foreground text-sm">
            Recibe peticiones, decide si requieren cotización o genera una orden de trabajo directa.
          </p>
        </div>

        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Solicitud
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Categoría / Servicio</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones de Flujo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : solicitudes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No hay solicitudes registradas. Haz clic en "Nueva Solicitud" para iniciar el flujo.
                </TableCell>
              </TableRow>
            ) : (
              solicitudes.map((s) => (
                <TableRow key={s.id} className="group transition-colors">
                  <TableCell className="font-medium text-muted-foreground">#{s.id}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(s.creadoEn).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{s.clienteNombre}</TableCell>
                  <TableCell>{s.categoriaNombre || "General"}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={s.descripcion}>
                    {s.descripcion}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(s.estado)}>
                      {s.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      {/* FLUJO SI ES RECIBIDA: Puede cotizarse o enviarse a orden directa */}
                      {s.estado === 'RECIBIDA' && (
                        <>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="gap-1.5 h-8 text-xs font-semibold"
                            onClick={() => openCotizarDialog(s)}
                            title="Emitir Cotización para esta solicitud"
                          >
                            <Calculator className="h-3.5 w-3.5 text-primary" /> Cotizar
                          </Button>

                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1.5 h-8 text-xs font-semibold"
                            onClick={() => openOrdenDirectaDialog(s)}
                            title="Generar Orden de Trabajo directa (sin cotización previa)"
                          >
                            <Wrench className="h-3.5 w-3.5" /> Orden Directa
                          </Button>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleCancelar(s.id)}
                            title="Cancelar solicitud"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {/* SI ESTÁ COTIZADA: Enlace directo al módulo de cotizaciones */}
                      {s.estado === 'COTIZADA' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => router.push("/dashboard/cotizaciones")}
                        >
                          Ir a Cotizaciones <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {/* SI ESTÁ EN PROGRESO: Enlace directo a órdenes */}
                      {s.estado === 'EN_PROGRESO' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => router.push("/dashboard/ordenes")}
                        >
                          Ver en Órdenes <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {s.estado === 'COMPLETADA' && (
                        <span className="text-xs text-green-600 font-medium">Finalizado</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* DIALOG: CREAR SOLICITUD */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Nueva Solicitud de Servicio</DialogTitle>
            <DialogDescription>
              Registra el requerimiento de un cliente para dar inicio al flujo operativo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <Select value={createFormData.clienteId} onValueChange={(val) => setCreateFormData({...createFormData, clienteId: val || ""})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría del Servicio</Label>
              <Select value={createFormData.categoriaId} onValueChange={(val) => setCreateFormData({...createFormData, categoriaId: val || ""})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona categoría (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción del Problema *</Label>
              <Input 
                id="descripcion" 
                placeholder="Ej. Fuga de agua en tubería de baño principal"
                value={createFormData.descripcion} 
                onChange={e => setCreateFormData({...createFormData, descripcion: e.target.value})} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección / Lugar de Trabajo</Label>
              <Input 
                id="direccion" 
                placeholder="Ej. Av. Primavera 456, Depto 302"
                value={createFormData.direccion} 
                onChange={e => setCreateFormData({...createFormData, direccion: e.target.value})} 
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !createFormData.clienteId || !createFormData.descripcion}>
                {isSubmitting ? "Registrando..." : "Registrar Solicitud"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: EMITIR COTIZACIÓN */}
      <Dialog open={isCotizarOpen} onOpenChange={setIsCotizarOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Emitir Cotización (Presupuesto)</DialogTitle>
            <DialogDescription>
              Genera una propuesta económica para la Solicitud #{selectedSolicitud?.id}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCotizarSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="cot-desc">Detalle / Alcance de la cotización</Label>
              <Input 
                id="cot-desc"
                value={cotizarFormData.descripcion}
                onChange={e => setCotizarFormData({...cotizarFormData, descripcion: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cot-monto">Monto Total ($) *</Label>
                <Input 
                  id="cot-monto" 
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={cotizarFormData.monto}
                  onChange={e => setCotizarFormData({...cotizarFormData, monto: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cot-validez">Válido Hasta</Label>
                <Input 
                  id="cot-validez" 
                  type="date"
                  value={cotizarFormData.validoHasta}
                  onChange={e => setCotizarFormData({...cotizarFormData, validoHasta: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCotizarOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !cotizarFormData.monto}>
                {isSubmitting ? "Emitiendo..." : "Emitir Cotización"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: GENERAR ORDEN DIRECTA */}
      <Dialog open={isOrdenDirectaOpen} onOpenChange={setIsOrdenDirectaOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Generar Orden de Trabajo Directa</DialogTitle>
            <DialogDescription>
              Para trabajos que no requieren aprobación previa de presupuesto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOrdenDirectaSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="ord-desc">Instrucciones / Descripción del Trabajo</Label>
              <Input 
                id="ord-desc"
                value={ordenDescripcion}
                onChange={e => setOrdenDescripcion(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOrdenDirectaOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !ordenDescripcion}>
                {isSubmitting ? "Creando..." : "Crear Orden de Trabajo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
