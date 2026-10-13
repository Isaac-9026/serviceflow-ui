"use client";

import { useEffect, useState } from "react";
import { Search, Activity, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Auditoria } from "@/types/backend";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<Auditoria[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [tipoEntidad, setTipoEntidad] = useState("ORDEN");
  const [entidadId, setEntidadId] = useState("");

  const cargarTodos = async () => {
    try {
      setLoading(true);
      const res = await api.get<Auditoria[]>("/auditoria");
      setLogs(res.data);
    } catch (error) {
      toast.error("Error al cargar registros de auditoría");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodos();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entidadId.trim()) {
      cargarTodos();
      return;
    }

    try {
      setLoading(true);
      const res = await api.get<Auditoria[]>(`/auditoria/${tipoEntidad}/${entidadId.trim()}`);
      setLogs(res.data);
      if (res.data.length === 0) {
        toast.info(`No se encontraron registros para ${tipoEntidad} #${entidadId}`);
      }
    } catch (error) {
      toast.error("Error al buscar registros de auditoría");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEntidadId("");
    cargarTodos();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Auditoría del Sistema</h1>
          <p className="text-muted-foreground text-sm">
            Trazabilidad histórica y eventos del ciclo operativo (ADR-004).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={cargarTodos} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Recargar
        </Button>
      </div>

      {/* Buscador */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-end gap-4">
          <div className="space-y-2 w-full sm:w-[200px]">
            <Label htmlFor="tipo">Entidad</Label>
            <Select value={tipoEntidad} onValueChange={(val) => setTipoEntidad(val || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOLICITUD">Solicitud</SelectItem>
                <SelectItem value="COTIZACION">Cotización</SelectItem>
                <SelectItem value="ORDEN">Orden de Trabajo</SelectItem>
                <SelectItem value="CLIENTE">Cliente</SelectItem>
                <SelectItem value="USUARIO">Usuario</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 w-full sm:w-[280px]">
            <Label htmlFor="id">ID de la Entidad (Numérico)</Label>
            <Input 
              id="id" 
              placeholder="Ej. 1 (dejar vacío para ver todos)"
              value={entidadId} 
              onChange={e => setEntidadId(e.target.value)} 
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button type="submit" disabled={loading} className="gap-2">
              <Search className="h-4 w-4" /> Filtrar
            </Button>
            {entidadId && (
              <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
                Limpiar
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Tabla de Resultados */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[180px]">Fecha / Hora</TableHead>
              <TableHead className="w-[150px]">Entidad</TableHead>
              <TableHead className="w-[180px]">Acción</TableHead>
              <TableHead className="w-[200px]">Usuario Autor</TableHead>
              <TableHead>Detalle de Evento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Activity className="h-8 w-8 text-muted-foreground/50" />
                    <p>No hay eventos de auditoría registrados para el criterio seleccionado.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="group transition-colors">
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(log.creadoEn).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {log.tipoEntidad} #{log.entidadId}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-medium text-xs">
                      {log.accion}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {log.usuarioNombre || log.usuarioEmail || "Sistema"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.detalles}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
