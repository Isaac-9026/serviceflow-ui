"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Users, HardHat, Camera, FileCheck2, Plus, Clock } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Orden, Usuario, TipoEvidencia, Solicitud } from "@/types/backend";
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
  
  // Nueva Orden Manual (para Coordinador/Admin)
  const [isCrearOrdenOpen, setIsCrearOrdenOpen] = useState(false);
  const [nuevaOrdenForm, setNuevaOrdenForm] = useState({ solicitudId: "", descripcion: "" });

  // Asignar Técnico
  const [isAsignarOpen, setIsAsignarOpen] = useState(false);
  const [selectedOrdenId, setSelectedOrdenId] = useState<number | null>(null);
  const [selectedTecnico, setSelectedTecnico] = useState("");
  
  // Registrar Evidencia (Técnico en campo)
  const [isEvidenciaOpen, setIsEvidenciaOpen] = useState(false);
  const [evidenciaForm, setEvidenciaForm] = useState({
    tipo: "FOTO" as TipoEvidencia,
    rutaArchivo: "",
    nota: ""
  });

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

  // Subir Evidencia y enviar a Verificación
  const handleRegistrarEvidencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrdenId) return;
    setIsSubmitting(true);
    try {
      await api.post(`/ordenes/${selectedOrdenId}/evidencias`, {
        tipo: evidenciaForm.tipo,
        rutaArchivo: evidenciaForm.rutaArchivo || null,
        nota: evidenciaForm.nota
      });
      toast.success("Evidencias registradas. La orden pasa a PENDIENTE DE VERIFICACIÓN");
      setIsEvidenciaOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Error al registrar evidencias de trabajo");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cerrar y Verificar Orden (Coordinador / Admin)
  const handleCompletarOrden = async (ordenId: number) => {
    if (!confirm("¿Confirmas la verificación del trabajo realizado y el cierre de esta orden?")) return;
    try {
      await api.patch(`/ordenes/${ordenId}/completar`);
      toast.success("¡Orden de trabajo y solicitud marcadas como COMPLETADAS!");
      fetchData();
    } catch (error) {
      toast.error("Error al completar la orden");
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

  // Filtrado de vista para técnicos
  const ordenesFiltradas = user?.rol === "TECNICO" 
    ? ordenes.filter(o => o.tecnicoAsignado?.id === user.id)
    : ordenes;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Órdenes de Trabajo</h1>
          <p className="text-muted-foreground text-sm">
            {user?.rol === "TECNICO" 
              ? "Revisa tus asignaciones de campo, registra notas técnicas y sube evidencias." 
              : "Asigna técnicos, monitorea la ejecución y verifica el trabajo finalizado."}
          </p>
        </div>

        {(user?.rol === "ADMIN" || user?.rol === "COORDINADOR") && (
          <Button onClick={() => setIsCrearOrdenOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nueva Orden
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Solicitud Asoc.</TableHead>
              <TableHead>Descripción / Instrucciones</TableHead>
              <TableHead>Técnico Responsable</TableHead>
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
                    ? "No tienes órdenes de trabajo asignadas actualmente." 
                    : "No hay órdenes de trabajo registradas."}
                </TableCell>
              </TableRow>
            ) : (
              ordenesFiltradas.map((o) => (
                <TableRow key={o.id} className="group transition-colors">
                  <TableCell className="font-medium text-muted-foreground">#{o.id}</TableCell>
                  <TableCell className="text-muted-foreground">
                    Sol. #{o.solicitudId}
                    {o.cotizacionId && <span className="text-xs block text-primary">Cot. #{o.cotizacionId}</span>}
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

                      {/* ACCIÓN 2: Subir Evidencias / Finalizar Trabajo (Para el Técnico si está EN_PROGRESO) */}
                      {(user?.rol === "TECNICO" || user?.rol === "ADMIN") && o.estado === 'EN_PROGRESO' && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="gap-1.5 h-8 text-xs font-semibold"
                          onClick={() => {
                            setSelectedOrdenId(o.id);
                            setEvidenciaForm({ tipo: "FOTO", rutaArchivo: "", nota: "" });
                            setIsEvidenciaOpen(true);
                          }}
                        >
                          <Camera className="h-3.5 w-3.5" /> Registrar Evidencia
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

      {/* DIALOG: REGISTRAR EVIDENCIA / NOTAS TÉCNICAS */}
      <Dialog open={isEvidenciaOpen} onOpenChange={setIsEvidenciaOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Registrar Evidencias de Ejecución</DialogTitle>
            <DialogDescription>
              Sube las pruebas del trabajo técnico realizado en la Orden #{selectedOrdenId} para pasar a verificación.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegistrarEvidencia} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Evidencia</Label>
              <Select 
                value={evidenciaForm.tipo} 
                onValueChange={(val) => setEvidenciaForm({...evidenciaForm, tipo: val as TipoEvidencia})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOTO">Fotografía de Trabajo</SelectItem>
                  <SelectItem value="NOTA">Nota Técnica Descriptiva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nota">Detalle / Informe del Trabajo Realizado *</Label>
              <Input 
                id="nota" 
                placeholder="Ej. Tubería sustituida con éxito, pruebas de presión OK."
                value={evidenciaForm.nota}
                onChange={e => setEvidenciaForm({...evidenciaForm, nota: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ruta">URL o Referencia del Archivo (Opcional)</Label>
              <Input 
                id="ruta" 
                placeholder="https://... o foto_reparacion.jpg"
                value={evidenciaForm.rutaArchivo}
                onChange={e => setEvidenciaForm({...evidenciaForm, rutaArchivo: e.target.value})}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEvidenciaOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !evidenciaForm.nota}>
                {isSubmitting ? "Enviando..." : "Enviar a Verificación"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
