import { useEffect, useMemo, useState } from "react";
import TablaDynamic from "@/components/TableDynamic";
import { Modal } from "@/components";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { TableAction, TableColumn } from "@/types/table";
import {
  parserFacilityRelService,
  type FacilityOption,
  type ParserFacilityRelation,
  type ParserOption,
} from "@/services/parser-facility-rel.service";

export const RelParserFacility = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [isLoading, setIsLoading] = useState(false);
  const [relations, setRelations] = useState<ParserFacilityRelation[]>([]);
  const [parsers, setParsers] = useState<ParserOption[]>([]);
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParserId, setSelectedParserId] = useState<string>("");
  const [selectedFacilityGuid, setSelectedFacilityGuid] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [relData, parserData, facilityData] = await Promise.all([
        parserFacilityRelService.listRelations(),
        parserFacilityRelService.listParsers(),
        parserFacilityRelService.listFacilities(),
      ]);
      setRelations(relData);
      setParsers(parserData);
      setFacilities(facilityData);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "No se pudo cargar rel_parser_facility");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: TableColumn<ParserFacilityRelation>[] = useMemo(
    () => [
      {
        key: "parser_name",
        label: "PARSER",
        className: "font-medium",
        sortable: true,
        filterable: true,
      },
      {
        key: "parser_version",
        label: "VERSION",
        sortable: true,
        filterable: true,
      },
      {
        key: "facility_name",
        label: "FACILITY",
        className: "font-medium",
        sortable: true,
        filterable: true,
        render: (_value, row) =>
          row.facility_code ? `${row.facility_name} (${row.facility_code})` : row.facility_name,
      },
      {
        key: "is_active",
        label: "ESTADO",
        sortable: true,
        filterable: true,
        render: (value: boolean) => (value ? "Activo" : "Inactivo"),
      },
    ],
    []
  );

  const handleDelete = async (row: ParserFacilityRelation) => {
    try {
      await parserFacilityRelService.deleteRelation(row.id);
      toast.success("Asociación eliminada correctamente");
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "No se pudo eliminar la asociación");
    }
  };

  const actions: TableAction<ParserFacilityRelation>[] = [
    {
      label: "Eliminar",
      icon: <Trash2 className="h-4 w-4 text-red-600" />,
      onClick: handleDelete,
    },
  ];

  const handlePaginationChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  const handleCreateRelation = async () => {
    if (!selectedParserId) {
      toast.error("Seleccione un parser");
      return;
    }

    if (!selectedFacilityGuid) {
      toast.error("Seleccione una facility");
      return;
    }

    setIsSaving(true);
    try {
      await parserFacilityRelService.createRelation({
        parser_manifest_id: Number(selectedParserId),
        facility_guid: selectedFacilityGuid,
      });
      toast.success("Asociación creada correctamente");
      setIsModalOpen(false);
      setSelectedParserId("");
      setSelectedFacilityGuid("");
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "No se pudo crear la asociación");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rel parser - facility</h2>
          <p className="text-muted-foreground">Gestión de asociaciones entre parser y facility</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Nueva Asociación</Button>
      </div>

      <TablaDynamic
        data={relations}
        columns={columns}
        actions={actions}
        showIndex
        loading={isLoading}
        pagination={{
          page,
          pageSize,
          serverSide: false,
          total: relations.length,
        }}
        onPaginationChange={handlePaginationChange}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nueva asociación parser-facility"
        description="Seleccione parser y facility para crear la relación"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Parser</label>
            <select
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-background px-3 py-2 text-sm"
              value={selectedParserId}
              onChange={(event) => setSelectedParserId(event.target.value)}
              disabled={isSaving}
            >
              <option value="">Seleccione un parser...</option>
              {parsers.map((parser) => (
                <option key={parser.id} value={parser.id}>
                  {parser.parser_name} ({parser.parser_version})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Facility</label>
            <select
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-background px-3 py-2 text-sm"
              value={selectedFacilityGuid}
              onChange={(event) => setSelectedFacilityGuid(event.target.value)}
              disabled={isSaving}
            >
              <option value="">Seleccione una facility...</option>
              {facilities.map((facility) => (
                <option key={facility.guid} value={facility.guid}>
                  {facility.code ? `${facility.name} (${facility.code})` : facility.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleCreateRelation} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
