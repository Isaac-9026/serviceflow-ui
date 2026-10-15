"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Ban, Eye, Calculator, Wrench, ArrowRight, Search, FileText, MapPin, Phone, Building2, Mail, Tag, User } from "lucide-react";
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
import { Combobox } from "@/components/ui/combobox";

export default function SolicitudesPage() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("TODAS");

  // Nueva Solicitud
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({ 
    clienteId: "", 
    categoriaId: "", 
    descripcion: "",
    direccion: "" 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ver Detalle
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [selectedDetalle, setSelectedDetalle] = useState<Solicitud | null>(null);

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

  // Cancelar Solicitud con Motivo
  const [isCancelarOpen, setIsCancelarOpen] = useState(false);
  const [solicitudACancelar, setSolicitudACancelar] = useState<Solicitud | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");

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

  const filteredSolicitudes = useMemo(() => {
    return solicitudes.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        s.clienteNombre.toLowerCase().includes(q) ||
        (s.categoriaNombre && s.categoriaNombre.toLowerCase().includes(q)) ||
        s.descripcion.toLowerCase().includes(q) ||
        (s.direccion && s.direccion.toLowerCase().includes(q));

      const matchesEstado = estadoFilter === "TODAS" || s.estado === estadoFilter;
      return matchesSearch && matchesEstado;
    });
  }, [solicitudes, searchQuery, estadoFilter]);

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

  const openDetalle = (solicitud: Solicitud) => {
    setSelectedDetalle(solicitud);
    setIsDetalleOpen(true);
  };

  // Abrir Modal de Cotizar
  const openCotizarDialog = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
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

  const openCancelarDialog = (solicitud: Solicitud) => {
    setSolicitudACancelar(solicitud);
    setMotivoCancelacion("");
    setIsCancelarOpen(true);
  };

  const handleConfirmarCancelar = async () => {
    if (!solicitudACancelar) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/solicitudes/${solicitudACancelar.id}/cancelar?motivo=${encodeURIComponent(motivoCancelacion)}`);
      toast.success("Solicitud cancelada correctamente");
      setIsCancelarOpen(false);
      fetchData();
    } catch (error) {
      toast.error("No se pudo cancelar la solicitud");
    } finally {
      setIsSubmitting(false);
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

  const getEstadoBadgeClass = (estado: string) => {
    switch (estado) {
      case "RECIBIDA":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
      case "COTIZADA":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30";
      case "EN_PROGRESO":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
      case "COMPLETADA":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30";
      case "CANCELADA":
        return "bg-destructive/10 text-destructive border-destructive/30";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Solicitudes</h1>
          <p className="text-muted-foreground text-sm">
            Recibe peticiones, decide si requieren cotización previa o genera una orden de trabajo directa.
          </p>
        </div>

        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Solicitud
        </Button>
      </div>

      {/* Buscador y Filtro por Estado */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, descripción..."
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
              <SelectItem value="RECIBIDA">Recibida</SelectItem>
              <SelectItem value="COTIZADA">Cotizada</SelectItem>
              <SelectItem value="EN_PROGRESO">En Progreso</SelectItem>
              <SelectItem value="COMPLETADA">Completada</SelectItem>
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

      {/* Tabla de Solicitudes */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead className="w-[110px]">Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="w-[130px]">Estado</TableHead>
              <TableHead className="text-right">Acciones de Flujo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredSolicitudes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No hay solicitudes que coincidan con los filtros seleccionados.
                </TableCell>
              </TableRow>
            ) : (
              filteredSolicitudes.map((s) => (
                <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">#{s.id}</TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(s.creadoEn).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">{s.clienteNombre}</TableCell>
                  <TableCell className="text-sm">{s.categoriaNombre || "General"}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm" title={s.descripcion}>
                    {s.descripcion}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getEstadoBadgeClass(s.estado)}>
                      {s.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => openDetalle(s)}
                        title="Ver detalle completo"
                      >
                        <Eye className="h-3.5 w-3.5" /> Detalle
                      </Button>

                      {/* SI ES RECIBIDA: Puede cotizarse o enviarse a orden directa */}
                      {s.estado === "RECIBIDA" && (
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
                            title="Generar Orden de Trabajo directa (sin cotización)"
                          >
                            <Wrench className="h-3.5 w-3.5" /> Orden Directa
                          </Button>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => openCancelarDialog(s)}
                            title="Cancelar solicitud"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}

                      {/* SI ESTÁ COTIZADA: Enlace directo a cotizaciones */}
                      {s.estado === "COTIZADA" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-muted-foreground hover:text-foreground h-8"
                          onClick={() => router.push("/dashboard/cotizaciones")}
                        >
                          Ir a Cotizaciones <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {/* SI ESTÁ EN PROGRESO: Enlace directo a órdenes */}
                      {s.estado === "EN_PROGRESO" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-muted-foreground hover:text-foreground h-8"
                          onClick={() => router.push("/dashboard/ordenes")}
                        >
                          Ver en Órdenes <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {s.estado === "COMPLETADA" && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium px-2">Finalizado</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* DIALOG: VER DETALLE DE SOLICITUD */}
      <Dialog open={isDetalleOpen} onOpenChange={setIsDetalleOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Solicitud #{selectedDetalle?.id}
            </DialogTitle>
            <DialogDescription>
              Ficha descriptiva completa del requerimiento del cliente.
            </DialogDescription>
          </DialogHeader>
          {selectedDetalle && (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Cliente</span>
                    <p className="text-base font-bold text-foreground">{selectedDetalle.clienteNombre}</p>
                  </div>
                  <Badge variant="outline" className={getEstadoBadgeClass(selectedDetalle.estado)}>
                    {selectedDetalle.estado}
                  </Badge>
                </div>

                <div className="text-sm space-y-1.5 pt-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span>Categoría: <strong className="text-foreground">{selectedDetalle.categoriaNombre || "General"}</strong></span>
                  </div>
                  {selectedDetalle.direccion && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-foreground">{selectedDetalle.direccion}</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground pt-1">
                    Registrada el: {new Date(selectedDetalle.creadoEn).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Descripción del Requerimiento</span>
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
            {/* SELECCIÓN DE CLIENTE CON BUSCADOR EN VIVO */}
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente Solicitante *</Label>
              <Combobox
                id="cliente"
                value={createFormData.clienteId}
                onValueChange={(val) => {
                  const cli = clientes.find((c) => c.id.toString() === val);
                  setCreateFormData((prev) => {
                    const prevCli = clientes.find((c) => c.id.toString() === prev.clienteId);
                    const shouldAutoFill = !prev.direccion || prev.direccion === prevCli?.direccion;
                    return {
                      ...prev,
                      clienteId: val,
                      direccion: shouldAutoFill && cli?.direccion ? cli.direccion : prev.direccion,
                    };
                  });
                }}
                placeholder="Selecciona o busca un cliente..."
                searchPlaceholder="Buscar por nombre, teléfono o dirección..."
                emptyMessage="No se encontraron clientes coincidentes"
                options={clientes.map((c) => ({
                  value: c.id.toString(),
                  label: c.nombre,
                  description: [c.telefono ? `Tel: ${c.telefono}` : null, c.direccion].filter(Boolean).join(" • "),
                }))}
              />
            </div>

            {/* SELECCIÓN DE CATEGORÍA */}
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría del Servicio</Label>
              <Select
                value={createFormData.categoriaId}
                onValueChange={(val) => setCreateFormData({ ...createFormData, categoriaId: val || "" })}
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecciona una categoría (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()} label={c.nombre}>
                      {c.nombre}
                    </SelectItem>
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

      {/* DIALOG: CANCELAR SOLICITUD */}
      <Dialog open={isCancelarOpen} onOpenChange={setIsCancelarOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Ban className="h-5 w-5" /> Cancelar Solicitud #{solicitudACancelar?.id}
            </DialogTitle>
            <DialogDescription>
              Esta acción marcará la solicitud como CANCELADA y registrará el motivo en la auditoría.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="motivo-cancelar">Motivo de la cancelación (opcional)</Label>
              <Input
                id="motivo-cancelar"
                placeholder="Ej. El cliente desistió del servicio o duplicado"
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsCancelarOpen(false)}>
                Regresar
              </Button>
              <Button variant="destructive" disabled={isSubmitting} onClick={handleConfirmarCancelar}>
                {isSubmitting ? "Cancelando..." : "Confirmar Cancelación"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
