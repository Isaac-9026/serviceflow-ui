"use client";

import { useState } from "react";
import { Search, Activity } from "lucide-react";
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
  
  const [tipoEntidad, setTipoEntidad] = useState("USUARIO");
  const [entidadId, setEntidadId] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entidadId) return;

    try {
      setLoading(true);
      const res = await api.get<Auditoria[]>(`/auditoria/${tipoEntidad}/${entidadId}`);
      setLogs(res.data);
      if (res.data.length === 0) {
        toast.info("No se encontraron registros para esta entidad.");
      }
    } catch (error) {
      toast.error("Error al buscar registros de auditoría");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Auditoría del Sistema</h1>
          <p className="text-muted-foreground text-sm">
            Rastrea los cambios históricos de las entidades en la base de datos (MongoDB).
          </p>
        </div>
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
                <SelectItem value="USUARIO">Usuario</SelectItem>
                <SelectItem value="CLIENTE">Cliente</SelectItem>
                <SelectItem value="SOLICITUD">Solicitud</SelectItem>
                <SelectItem value="ORDEN">Orden</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 w-full sm:w-[300px]">
            <Label htmlFor="id">ID de la Entidad (Numérico)</Label>
            <Input 
              id="id" 
              placeholder="Ej. 1"
              value={entidadId} 
              onChange={e => setEntidadId(e.target.value)} 
              required 
            />
          </div>
          <Button type="submit" disabled={loading || !entidadId} className="w-full sm:w-auto gap-2">
            <Search className="h-4 w-4" /> Buscar Logs
          </Button>
        </form>
      </div>

      {/* Tabla de Resultados */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Fecha / Hora</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Usuario Autor</TableHead>
              <TableHead>Detalle de Cambios</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Activity className="h-8 w-8 text-muted-foreground/50" />
                    <p>Realiza una búsqueda para ver el historial.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="group transition-colors">
                  <TableCell className="text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 uppercase">
                      {log.accion}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{log.usuario}</TableCell>
                  <TableCell className="max-w-[400px] text-xs font-mono text-muted-foreground break-all">
                    {log.cambios}
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
