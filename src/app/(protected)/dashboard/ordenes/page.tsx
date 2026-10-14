"use client";

import { useEffect, useState } from "react";
import { 
  CheckCircle, 
  Users, 
  HardHat, 
  Camera, 
  FileCheck2, 
  Plus, 
  Eye, 
  Image as ImageIcon, 
  FileText, 
  Search, 
  Ban, 
  Filter 
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Orden, Usuario, TipoEvidencia, Solicitud, Evidencia } from "@/types/backend";
import { useAuthStore } from "@/store/authStore";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OrdenesPage() {
  const { user } = useAuthStore();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros de búsqueda y estado
  const [searchQuery, setSearchQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("TODAS");

  // Nueva Orden Manual (para Coordinador/Admin)
  const [isCrearOrdenOpen, setIsCrearOrdenOpen] = useState(false);
  const [nuevaOrdenForm, setNuevaOrdenForm] = useState({ solicitudId: "", descripcion: "" });

  // Asignar Técnico
  const [isAsignarOpen, setIsAsignarOpen] = useState(false);
  const [selectedOrdenId, setSelectedOrdenId] = useState<number | null>(null);
  const [selectedTecnico, setSelectedTecnico] = useState("");
  
  // Registrar Evidencia (Técnico en campo) con subida real de archivo
  const [isEvidenciaOpen, setIsEvidenciaOpen] = useState(false);
  const [evidenciaTipo, setEvidenciaTipo] = useState<TipoEvidencia>("FOTO");
  const [evidenciaNota, setEvidenciaNota] = useState("");
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Ficha Técnica de Detalle de la Orden
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [ordenDetalle, setOrdenDetalle] = useState<Orden | null>(null);
  const [evidenciasDetalle, setEvidenciasDetalle] = useState<Evidencia[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Cancelar Orden
  const [isCancelarOpen, setIsCancelarOpen] = useState(false);
  const [ordenParaCancelar, setOrdenParaCancelar] = useState<Orden | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get<Orden[]>("/ordenes");
      setOrdenes(res.data);

      if (user?.rol === "ADMIN" || user?.rol === "COORDINADOR") {
        const [uRes, sRes] = await Promise.all([
          api.get<Usuario[]>("/usuarios"),
          api.get<Solicitud[]>("/solicitudes")
        ]);
        setTecnicos(uRes.data.filter(u => u.rol === "TECNICO" && u.activo));
        setSolicitudes(sRes.data.filter(s => s.estado === "RECIBIDA" || s.estado === "COTIZADA"));
      }
    } catch (error: any) {
      if (error.response?.status !== 401) {
        toast.error("Error al cargar órdenes de trabajo");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Crear Orden Manual
  const handleCrearOrdenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/ordenes", {
        solicitudId: Number(nuevaOrdenForm.solicitudId),
        cotizacionId: null,
        descripcion: nuevaOrdenForm.descripcion
      });
      toast.success("Orden de trabajo creada exitosamente");
      setIsCrearOrdenOpen(false);
      setNuevaOrdenForm({ solicitudId: "", descripcion: "" });
      fetchData();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Error al crear la orden";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Asignar Técnico
  const handleAsignar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrdenId || !selectedTecnico) return;
    setIsSubmitting(true);
    try {
      await api.post(`/ordenes/${selectedOrdenId}/asignar`, { 
        tecnicoId: Number(selectedTecnico),
        esPrincipal: true 
      });
      toast.success("Técnico asignado. La orden pasa a EN PROGRESO");
      setIsAsignarOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Error al asignar técnico");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir modal de evidencias
  const openRegistrarEvidencia = (ordenId: number) => {
    setSelectedOrdenId(ordenId);
    setEvidenciaTipo("FOTO");
    setEvidenciaNota("");
    setArchivoSeleccionado(null);
    setPreviewUrl(null);
    setIsEvidenciaOpen(true);
  };

  // Manejo de cambio de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setArchivoSeleccionado(file);
      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    } else {
      setArchivoSeleccionado(null);
      setPreviewUrl(null);
    }
  };

  // Subir Evidencia Real (Multipart)
  const handleRegistrarEvidencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrdenId) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("tipo", evidenciaTipo);
      formData.append("nota", evidenciaNota);
      if (archivoSeleccionado) {
        formData.append("archivo", archivoSeleccionado);
      }

      await api.post(`/ordenes/${selectedOrdenId}/evidencias/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Evidencias físicas registradas. La orden pasa a PENDIENTE DE VERIFICACIÓN");
      setIsEvidenciaOpen(false);
      fetchData();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Error al registrar evidencias de trabajo";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir Ficha Técnica / Detalle
  const openDetalle = async (orden: Orden) => {
    setOrdenDetalle(orden);
    setIsDetalleOpen(true);
    setLoadingDetalle(true);
    try {
      const res = await api.get<Evidencia[]>(`/ordenes/${orden.id}/evidencias`);
      setEvidenciasDetalle(res.data);
    } catch (error) {
      setEvidenciasDetalle([]);
    } finally {
      setLoadingDetalle(false);
    }
  };

  // Cerrar y Verificar Orden (Coordinador / Admin)
  const handleCompletarOrden = async (ordenId: number) => {
    if (!confirm("¿Confirmas la verificación del trabajo realizado y el cierre de esta orden?")) return;
    try {
      await api.patch(`/ordenes/${ordenId}/completar`);
      toast.success("¡Orden de trabajo y solicitud marcadas como COMPLETADAS!");
      setIsDetalleOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Error al completar la orden");
    }
  };

  // Cancelar Orden
  const openCancelarDialog = (orden: Orden) => {
    setOrdenParaCancelar(orden);
    setMotivoCancelacion("");
    setIsCancelarOpen(true);
  };

  const handleCancelarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ordenParaCancelar) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/ordenes/${ordenParaCancelar.id}/cancelar?motivo=${encodeURIComponent(motivoCancelacion)}`, {
        motivo: motivoCancelacion
      });
      toast.success(`Orden #${ordenParaCancelar.id} cancelada`);
      setIsCancelarOpen(false);
      if (isDetalleOpen && ordenDetalle?.id === ordenParaCancelar.id) {
        setIsDetalleOpen(false);
      }
      fetchData();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Error al cancelar la orden";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBadgeVariant = (estado: string) => {
    switch(estado) {
      case 'CREADA': return "secondary";
      case 'EN_PROGRESO': return "default";
      case 'PENDIENTE_VERIFICACION': return "outline";
      case 'COMPLETADA': return "outline";
      case 'CANCELADA': return "destructive";
      default: return "default";
    }
  };

  const formatEstadoLabel = (estado: string) => {
    switch(estado) {
      case 'CREADA': return "Creada (Sin Asignar)";
      case 'EN_PROGRESO': return "En Progreso";
      case 'PENDIENTE_VERIFICACION': return "Pendiente Verificación";
      case 'COMPLETADA': return "Completada";
      case 'CANCELADA': return "Cancelada";
      default: return estado;
    }
  };

  // Filtrado de vista por rol técnico y filtros de UI
  const ordenesFiltradas = ordenes
    .filter(o => user?.rol === "TECNICO" ? o.tecnicoAsignado?.id === user.id : true)
    .filter(o => {
      const matchesSearch = 
        searchQuery === "" ||
        o.id.toString().includes(searchQuery) ||
        o.solicitudId.toString().includes(searchQuery) ||
        (o.cotizacionId && o.cotizacionId.toString().includes(searchQuery)) ||
        o.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.tecnicoAsignado && o.tecnicoAsignado.nombre.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesEstado = estadoFilter === "TODAS" || o.estado === estadoFilter;

      return matchesSearch && matchesEstado;
    });

  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8080";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Órdenes de Trabajo</h1>
          <p className="text-muted-foreground text-sm">
            {user?.rol === "TECNICO" 
              ? "Revisa tus asignaciones de campo, adjunta fotografías reales de tu labor y sube notas." 
              : "Asigna técnicos, monitorea el avance, inspecciona evidencias fotográficas y valida cierres."}
          </p>
        </div>

        {(user?.rol === "ADMIN" || user?.rol === "COORDINADOR") && (
          <Button onClick={() => setIsCrearOrdenOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nueva Orden
          </Button>
        )}
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por #ID, solicitud, técnico o instrucciones..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <div className="w-full sm:w-[220px]">
          <Select value={estadoFilter} onValueChange={(val) => setEstadoFilter(val || "TODAS")}>
            <SelectTrigger className="bg-card">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todos los Estados</SelectItem>
              <SelectItem value="CREADA">Creada (Sin Asignar)</SelectItem>
              <SelectItem value="EN_PROGRESO">En Progreso</SelectItem>
              <SelectItem value="PENDIENTE_VERIFICACION">Pendiente Verificación</SelectItem>
              <SelectItem value="COMPLETADA">Completada</SelectItem>
              <SelectItem value="CANCELADA">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(searchQuery || estadoFilter !== "TODAS") && (
          <Button 
            variant="ghost" 
            onClick={() => { setSearchQuery(""); setEstadoFilter("TODAS"); }}
            className="text-xs text-muted-foreground"
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Solicitud / Cot.</TableHead>
              <TableHead>Descripción / Instrucciones</TableHead>
              <TableHead>Técnico Responsable</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : ordenesFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {user?.rol === "TECNICO" 
                    ? "No tienes órdenes de trabajo asignadas con los criterios seleccionados." 
                    : "No se encontraron órdenes de trabajo registradas."}
                </TableCell>
              </TableRow>
            ) : (
              ordenesFiltradas.map((o) => (
                <TableRow key={o.id} className="transition-colors">
                  <TableCell className="font-medium text-muted-foreground">#{o.id}</TableCell>
                  <TableCell className="text-muted-foreground">
                    Sol. #{o.solicitudId}
                    {o.cotizacionId && <span className="text-xs block text-primary font-medium">Cot. #{o.cotizacionId}</span>}
                  </TableCell>
                  <TableCell className="font-medium max-w-[250px] truncate" title={o.descripcion}>
                    {o.descripcion}
                  </TableCell>
                  <TableCell>
                    {o.tecnicoAsignado ? (
                      <div className="flex items-center gap-2">
                        <HardHat className="h-4 w-4 text-primary" />
                        <span className="font-medium">{o.tecnicoAsignado.nombre}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(o.estado)}>
                      {formatEstadoLabel(o.estado)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      {/* BOTÓN VER FICHA TÉCNICA (DETALLE) */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openDetalle(o)}
                        title="Ver Ficha Técnica y Evidencias"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* ACCIÓN 1: Asignar Técnico (Coordinador/Admin si estado es CREADA) */}
                      {(user?.rol === "ADMIN" || user?.rol === "COORDINADOR") && o.estado === 'CREADA' && (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="gap-1.5 h-8 text-xs font-semibold"
                          onClick={() => { setSelectedOrdenId(o.id); setSelectedTecnico(""); setIsAsignarOpen(true); }}
                        >
                          <Users className="h-3.5 w-3.5" /> Asignar Técnico
                        </Button>
                      )}

                      {/* ACCIÓN 2: Subir Evidencias / Finalizar Trabajo (Para el Técnico o Admin si está EN_PROGRESO) */}
                      {(user?.rol === "TECNICO" || user?.rol === "ADMIN") && o.estado === 'EN_PROGRESO' && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="gap-1.5 h-8 text-xs font-semibold"
                          onClick={() => openRegistrarEvidencia(o.id)}
                        >
                          <Camera className="h-3.5 w-3.5" /> Subir Evidencia
                        </Button>
                      )}

                      {/* ACCIÓN 3: Verificar y Cerrar Orden (Coordinador/Admin si está PENDIENTE_VERIFICACION) */}
                      {(user?.rol === "ADMIN" || user?.rol === "COORDINADOR") && o.estado === 'PENDIENTE_VERIFICACION' && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="gap-1.5 h-8 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleCompletarOrden(o.id)}
                          title="Aprobar el trabajo técnico y cerrar la orden"
                        >
                          <FileCheck2 className="h-3.5 w-3.5" /> Verificar y Cerrar
                        </Button>
                      )}

                      {/* ACCIÓN 4: Cancelar Orden (Coordinador/Admin si no está Completada ni Cancelada) */}
                      {(user?.rol === "ADMIN" || user?.rol === "COORDINADOR") && o.estado !== 'COMPLETADA' && o.estado !== 'CANCELADA' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => openCancelarDialog(o)}
                          title="Cancelar Orden de Trabajo"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}

                      {o.estado === 'COMPLETADA' && (
                        <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Cerrada
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* DIALOG: CREAR ORDEN MANUAL */}
      <Dialog open={isCrearOrdenOpen} onOpenChange={setIsCrearOrdenOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Nueva Orden de Trabajo</DialogTitle>
            <DialogDescription>
              Genera una orden vinculada directamente a una solicitud existente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCrearOrdenSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="solicitud">Solicitud de Servicio *</Label>
              <Select 
                value={nuevaOrdenForm.solicitudId} 
                onValueChange={(val) => {
                  const sol = solicitudes.find(s => s.id.toString() === val);
                  setNuevaOrdenForm({
                    solicitudId: val || "",
                    descripcion: sol ? sol.descripcion : nuevaOrdenForm.descripcion
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una solicitud pendiente" />
                </SelectTrigger>
                <SelectContent>
                  {solicitudes.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      #{s.id} - {s.clienteNombre} ({s.descripcion.substring(0, 30)}...)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Instrucciones de Trabajo *</Label>
              <Input 
                id="descripcion" 
                value={nuevaOrdenForm.descripcion} 
                onChange={e => setNuevaOrdenForm({...nuevaOrdenForm, descripcion: e.target.value})} 
                required 
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCrearOrdenOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !nuevaOrdenForm.solicitudId || !nuevaOrdenForm.descripcion}>
                {isSubmitting ? "Creando..." : "Crear Orden"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: ASIGNAR TÉCNICO */}
      <Dialog open={isAsignarOpen} onOpenChange={setIsAsignarOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Asignar Técnico de Campo</DialogTitle>
            <DialogDescription>
              Selecciona el técnico principal responsable de ejecutar la Orden #{selectedOrdenId}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAsignar} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="tecnico">Técnico Disponible *</Label>
              <Select value={selectedTecnico} onValueChange={(val) => setSelectedTecnico(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un técnico activo" />
                </SelectTrigger>
                <SelectContent>
                  {tecnicos.map(t => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.nombre} ({t.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAsignarOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedTecnico}>
                {isSubmitting ? "Asignando..." : "Confirmar Asignación"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: REGISTRAR EVIDENCIA CON SUBIDA REAL DE ARCHIVOS (MULTIPART) */}
      <Dialog open={isEvidenciaOpen} onOpenChange={setIsEvidenciaOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Evidencias de Ejecución</DialogTitle>
            <DialogDescription>
              Adjunta fotografías reales de tu trabajo o informes técnicos para la Orden #{selectedOrdenId}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegistrarEvidencia} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Evidencia</Label>
              <Select 
                value={evidenciaTipo} 
                onValueChange={(val) => setEvidenciaTipo(val as TipoEvidencia)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOTO">Fotografía de Ejecución</SelectItem>
                  <SelectItem value="NOTA">Nota Técnica Descriptiva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selector de Archivo Físico */}
            {evidenciaTipo === "FOTO" && (
              <div className="space-y-2">
                <Label htmlFor="archivo">Fotografía de Campo (JPG, PNG, WebP) *</Label>
                <Input 
                  id="archivo" 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  required={evidenciaTipo === "FOTO"}
                  className="cursor-pointer"
                />
                {previewUrl && (
                  <div className="mt-2 relative rounded-lg border border-border overflow-hidden bg-muted max-h-48 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Vista previa" className="max-h-48 w-auto object-contain outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10 rounded-md" />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nota">Detalle / Informe del Trabajo Realizado *</Label>
              <Input 
                id="nota" 
                placeholder="Ej. Tubería sustituida con éxito, pruebas de presión OK."
                value={evidenciaNota}
                onChange={e => setEvidenciaNota(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEvidenciaOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !evidenciaNota || (evidenciaTipo === "FOTO" && !archivoSeleccionado)}>
                {isSubmitting ? "Subiendo..." : "Enviar a Verificación"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: FICHA TÉCNICA / DETALLE DE LA ORDEN CON GALERÍA DE EVIDENCIAS */}
      <Dialog open={isDetalleOpen} onOpenChange={setIsDetalleOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto overscroll-contain">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Ficha Técnica: Orden #{ordenDetalle?.id}
            </DialogTitle>
            <DialogDescription>
              Inspección de datos del servicio, técnico asignado y evidencias fotográficas registradas.
            </DialogDescription>
          </DialogHeader>

          {ordenDetalle && (
            <div className="space-y-6 pt-2">
              {/* Resumen Superior */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-muted/40 border border-border/50 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Estado Actual</span>
                  <Badge variant={getBadgeVariant(ordenDetalle.estado)} className="mt-1">
                    {formatEstadoLabel(ordenDetalle.estado)}
                  </Badge>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Solicitud Vinculada</span>
                  <span className="font-semibold block mt-1">#{ordenDetalle.solicitudId}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Técnico Asignado</span>
                  <span className="font-semibold block mt-1">
                    {ordenDetalle.tecnicoAsignado ? ordenDetalle.tecnicoAsignado.nombre : "Sin Asignar"}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-xs text-muted-foreground block">Instrucciones Técnicas</span>
                  <p className="mt-1 font-medium">{ordenDetalle.descripcion}</p>
                </div>
              </div>

              {/* Sección de Evidencias */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" /> Evidencias Registradas ({evidenciasDetalle.length})
                  </h3>
                </div>

                {loadingDetalle ? (
                  <div className="space-y-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : evidenciasDetalle.length === 0 ? (
                  <div className="p-6 text-center rounded-lg border border-dashed border-border text-muted-foreground text-sm">
                    No se han registrado evidencias fotográficas ni notas para esta orden.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {evidenciasDetalle.map((ev) => (
                      <div key={ev.id} className="p-3 rounded-lg border border-border bg-card space-y-2">
                        {ev.rutaArchivo ? (
                          <div className="relative rounded-md overflow-hidden bg-muted aspect-video flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={`${backendBaseUrl}/uploads/${ev.rutaArchivo}`} 
                              alt="Evidencia" 
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-150 ease-out outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                              onClick={() => window.open(`${backendBaseUrl}/uploads/${ev.rutaArchivo}`, "_blank")}
                              title="Clic para ver en tamaño completo"
                            />
                          </div>
                        ) : (
                          <div className="p-3 rounded bg-muted/30 text-xs text-muted-foreground italic flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Sin archivo adjunto
                          </div>
                        )}
                        <div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{ev.tipo}</Badge>
                            <span>{new Date(ev.creadoEn).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs font-medium text-foreground">{ev.nota}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botones de acción dentro del detalle */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t">
                {(user?.rol === "ADMIN" || user?.rol === "COORDINADOR") && ordenDetalle.estado !== 'COMPLETADA' && ordenDetalle.estado !== 'CANCELADA' && (
                  <Button
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10 w-full sm:w-auto"
                    onClick={() => openCancelarDialog(ordenDetalle)}
                  >
                    <Ban className="h-4 w-4 mr-2" /> Cancelar Orden
                  </Button>
                )}

                {(user?.rol === "ADMIN" || user?.rol === "COORDINADOR") && ordenDetalle.estado === 'PENDIENTE_VERIFICACION' && (
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white gap-2 w-full sm:w-auto"
                    onClick={() => handleCompletarOrden(ordenDetalle.id)}
                  >
                    <FileCheck2 className="h-4 w-4" /> Verificar y Cerrar
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG: CONFIRMAR CANCELACIÓN DE ORDEN */}
      <Dialog open={isCancelarOpen} onOpenChange={setIsCancelarOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Ban className="h-5 w-5" /> Cancelar Orden de Trabajo
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de cancelar la Orden #{ordenParaCancelar?.id}? Esta acción detendrá el trabajo y registrará la cancelación en la auditoría.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCancelarSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="motivo-cancelar">Motivo de Cancelación</Label>
              <Input 
                id="motivo-cancelar"
                placeholder="Ej. Solicitud anulada por el cliente / Reprogramación"
                value={motivoCancelacion}
                onChange={e => setMotivoCancelacion(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCancelarOpen(false)}>
                Atrás
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting || !motivoCancelacion}>
                {isSubmitting ? "Cancelando..." : "Confirmar Cancelación"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
