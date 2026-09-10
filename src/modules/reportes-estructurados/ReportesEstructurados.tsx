import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MainLayout } from "@/layouts/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components";
import TablaDynamic from "@/components/TableDynamic";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Link2, Settings } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { MapeoVariablesTab } from "@/modules/reportes-estructurados/MapeoVariablesTab";
import { ConceptosCriteriosTab } from "@/modules/reportes-estructurados/ConceptosCriteriosTab";
import {
  parserFacilityRelService,
  type FacilityOption,
  type ParserFacilityRelation,
  type ParserStudytypeRelation,
  type StudytypeOption,
} from "@/services/parser-facility-rel.service";
import { Loader2, MapPin, Search } from "lucide-react";
import type { TableAction, TableColumn } from "@/types/table";
import { formatDateTime } from "@/lib/fechaYhora";

type TabKey = "lista-parser" | "mapeo-variables" | "conceptos-criterios" | "plantillas-inteligentes";

interface ParserItem {
  id: number;
  parser_name: string;
  parser_version: string;
  parser_family: string;
  compatibility_level: string;
  is_active: boolean;
  associations_count: number;
  updated_at: string | null;
}

const tabConfig: { key: TabKey; label: string; path: string }[] = [
  { key: "lista-parser", label: "Lista de parser", path: "/reportes-estructurados/lista-parser" },
  { key: "mapeo-variables", label: "Mapeo de variables", path: "/reportes-estructurados/mapeo-variables" },
  { key: "conceptos-criterios", label: "Conceptos y criterios", path: "/reportes-estructurados/conceptos-criterios" },
  { key: "plantillas-inteligentes", label: "Plantillas inteligentes", path: "/reportes-estructurados/plantillas-inteligentes" },
];

const tabByPath = (pathname: string): TabKey => {
  const match = tabConfig.find((item) => item.path === pathname);
  return match?.key ?? "lista-parser";
};

export const ReportesEstructurados = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = useMemo(() => tabByPath(location.pathname), [location.pathname]);

  const [parsers, setParsers] = useState<ParserItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [isLoadingParsers, setIsLoadingParsers] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [statusType, setStatusType] = useState<"error" | "">("");
  const [isRelationModalOpen, setIsRelationModalOpen] = useState(false);
  const [selectedParser, setSelectedParser] = useState<ParserItem | null>(null);
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [studyTypes, setStudyTypes] = useState<StudytypeOption[]>([]);
  const [relationsForParser, setRelationsForParser] = useState<ParserFacilityRelation[]>([]);
  const [studytypeRelationsForParser, setStudytypeRelationsForParser] = useState<ParserStudytypeRelation[]>([]);
  const [isSavingRelation, setIsSavingRelation] = useState(false);
  const [isLoadingRelationsData, setIsLoadingRelationsData] = useState(false);
  const [facilitySearch, setFacilitySearch] = useState("");
  const [studytypeSearch, setStudytypeSearch] = useState("");
  const [selectedFacilityGuids, setSelectedFacilityGuids] = useState<Set<string>>(new Set());
  const [selectedStudytypeGuids, setSelectedStudytypeGuids] = useState<Set<string>>(new Set());

  const onTabChange = (value: string) => {
    const next = tabConfig.find((item) => item.key === value);
    if (next && next.path !== location.pathname) {
      navigate(next.path);
    }
  };

  const loadParsers = async () => {
    setIsLoadingParsers(true);
    setStatusMessage("");
    setStatusType("");

    try {
      const response = await api.get("/structured-reports/parsers");
      const data = response?.data?.data ?? [];

      const normalized = Array.isArray(data)
        ? data.map((item: any) => ({
            id: Number(item.id),
            parser_name: String(item.parser_name || ""),
            parser_version: String(item.parser_version || ""),
            parser_family: String(item.parser_family || ""),
            compatibility_level: String(item.compatibility_level || ""),
            is_active: Boolean(item.is_active),
            associations_count: Number(item.associations_count || 0),
            updated_at: item.updated_at ? String(item.updated_at) : null,
          }))
        : [];

      setParsers(normalized);
    } catch (error: any) {
      const message = error?.response?.data?.error || "No se pudo cargar la lista de parser";
      setStatusType("error");
      setStatusMessage(message);
    } finally {
      setIsLoadingParsers(false);
    }
  };

  useEffect(() => {
    loadParsers();
  }, []);

  const openRelationModal = async (parser: ParserItem) => {
    setSelectedParser(parser);
    setFacilitySearch("");
    setStudytypeSearch("");
    setSelectedFacilityGuids(new Set());
    setSelectedStudytypeGuids(new Set());
    setIsRelationModalOpen(true);
    setIsLoadingRelationsData(true);

    try {
      const [facilityData, relationData, studyTypeData, studyTypeRelationData] = await Promise.all([
        parserFacilityRelService.listFacilities(),
        parserFacilityRelService.listRelations(parser.id),
        parserFacilityRelService.listStudyTypes(),
        parserFacilityRelService.listStudytypeRelations(parser.id),
      ]);
      setFacilities(facilityData);
      setRelationsForParser(relationData);
      setStudyTypes(studyTypeData);
      setStudytypeRelationsForParser(studyTypeRelationData);

      const selectedFacilities = new Set(relationData.map((item) => item.facility_guid));
      setSelectedFacilityGuids(selectedFacilities);

      const selectedStudytypes = new Set(studyTypeRelationData.map((item) => item.studytype_guid));
      setSelectedStudytypeGuids(selectedStudytypes);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "No se pudieron cargar datos de asociación");
    } finally {
      setIsLoadingRelationsData(false);
    }
  };

  const handleFacilityCheckedChange = (facilityGuid: string, checked: boolean) => {
    setSelectedFacilityGuids((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(facilityGuid);
      } else {
        next.delete(facilityGuid);
      }
      return next;
    });
  };

  const handleSelectAllFacilities = (checked: boolean) => {
    if (checked) {
      setSelectedFacilityGuids(new Set(filteredFacilities.map((facility) => facility.guid)));
      return;
    }
    setSelectedFacilityGuids(new Set());
  };

  const handleStudytypeCheckedChange = (studytypeGuid: string, checked: boolean) => {
    setSelectedStudytypeGuids((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(studytypeGuid);
      } else {
        next.delete(studytypeGuid);
      }
      return next;
    });
  };

  const handleSelectAllStudytypes = (checked: boolean) => {
    if (checked) {
      setSelectedStudytypeGuids(new Set(filteredStudyTypes.map((studyType) => studyType.guid)));
      return;
    }
    setSelectedStudytypeGuids(new Set());
  };

  const handleSaveRelations = async () => {
    if (!selectedParser) {
      toast.error("Seleccione un parser");
      return;
    }

    setIsSavingRelation(true);
    try {
      const facilityGuids = Array.from(selectedFacilityGuids);
      const studytypeGuids = Array.from(selectedStudytypeGuids);

      await Promise.all([
        parserFacilityRelService.syncRelations({
          parser_manifest_id: selectedParser.id,
          facility_guids: facilityGuids,
        }),
        parserFacilityRelService.syncStudytypeRelations({
          parser_manifest_id: selectedParser.id,
          studytype_guids: studytypeGuids,
        }),
      ]);

      toast.success("Relaciones guardadas correctamente");
      const [relationData, studyTypeRelationData] = await Promise.all([
        parserFacilityRelService.listRelations(selectedParser.id),
        parserFacilityRelService.listStudytypeRelations(selectedParser.id),
      ]);
      setRelationsForParser(relationData);
      setStudytypeRelationsForParser(studyTypeRelationData);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "No se pudieron guardar las relaciones");
    } finally {
      setIsSavingRelation(false);
    }
  };

  const filteredFacilities = facilities.filter((facility) => {
    const search = facilitySearch.trim().toLowerCase();
    if (!search) {
      return true;
    }

    return (
      facility.name.toLowerCase().includes(search) ||
      (facility.code || "").toLowerCase().includes(search)
    );
  });

  const filteredStudyTypes = studyTypes.filter((studyType) => {
    const search = studytypeSearch.trim().toLowerCase();
    if (!search) {
      return true;
    }

    return (
      studyType.description.toLowerCase().includes(search) ||
      (studyType.code || "").toLowerCase().includes(search)
    );
  });

  const parserColumns: TableColumn<ParserItem>[] = useMemo(
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
        key: "parser_family",
        label: "FAMILIA",
        sortable: true,
        filterable: true,
      },
      {
        key: "compatibility_level",
        label: "COMPATIBILIDAD",
        sortable: true,
        filterable: true,
      },
      {
        key: "is_active",
        label: "ACTIVO",
        sortable: true,
        filterable: true,
        render: (value: boolean) => (value ? "Sí" : "No"),
      },
      {
        key: "associations_count",
        label: "ASOCIACIONES",
        sortable: true,
        filterable: true,
      },
      {
        key: "updated_at",
        label: "ACTUALIZADO",
        sortable: true,
        filterable: true,
        render: (value: string | null) => (value ? formatDateTime(value) : "-"),
      },
    ],
    []
  );

  const parserActions: TableAction<ParserItem>[] = [
    {
      label: "Asociar facility",
      component: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Ver relaciones"
          aria-label="Ver relaciones"
          onClick={() => openRelationModal(row)}
        >
          <Link2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const handlePaginationChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  return (
    <MainLayout>
      <div className="page-dark-gradient rounded-lg p-3 sm:p-6 shadow-sm z-10 h-full flex flex-col overflow-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-brand-purple p-2 rounded-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-purple dark:text-purple-400">Reportes estructurados</h1>
            <p className="text-sm text-muted-foreground dark:text-foreground">Gestión de parser, variables, conceptos y plantillas inteligentes</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full flex-1 flex flex-col">
          <TabsList className="bg-transparent border-b border-gray-200 dark:border-gray-700 rounded-none h-auto p-0 justify-start gap-0 w-full">
            {tabConfig.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-transparent data-[state=active]:text-brand-purple dark:data-[state=active]:text-purple-400 data-[state=active]:bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-transparent shadow-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="lista-parser" className="mt-4">
            <div className="bg-white dark:bg-gray-900/70 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-end mb-4">
                <Button type="button" variant="outline" onClick={loadParsers} disabled={isLoadingParsers}>
                  {isLoadingParsers ? "Actualizando..." : "Actualizar lista"}
                </Button>
              </div>

              <TablaDynamic
                data={parsers}
                columns={parserColumns}
                actions={parserActions}
                showIndex
                loading={isLoadingParsers}
                pagination={{
                  page,
                  pageSize,
                  serverSide: false,
                  total: parsers.length,
                }}
                onPaginationChange={handlePaginationChange}
              />

              {!isLoadingParsers && parsers.length === 0 && (
                <div className="mt-4 text-sm text-muted-foreground">No hay parser registrados.</div>
              )}

              {statusMessage && (
                <div
                  className={`mt-4 rounded-md border px-3 py-2 text-sm ${
                    statusType === "error"
                      ? "border-red-400 bg-red-50 text-red-700"
                      : "border-blue-400 bg-blue-50 text-blue-700"
                  }`}
                >
                  {statusMessage}
                </div>
              )}
            </div>
          </TabsContent>

          <Modal
            isOpen={isRelationModalOpen}
            onClose={() => setIsRelationModalOpen(false)}
            title="Asociar parser con facility y tipo de estudio"
            description={selectedParser ? `${selectedParser.parser_name} (${selectedParser.parser_version})` : undefined}
            size="full"
            className="sm:max-w-[70vw]"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-semibold">Facilities</h3>
                    <p className="text-sm text-muted-foreground">Seleccione las facilities donde este parser puede operar</p>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar facility..."
                      value={facilitySearch}
                      onChange={(event) => setFacilitySearch(event.target.value)}
                      className="pl-9"
                      disabled={isSavingRelation}
                    />
                  </div>

                  {!isLoadingRelationsData && facilities.length > 0 && (
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Checkbox
                        id="select-all-parser-facilities"
                        checked={selectedFacilityGuids.size === filteredFacilities.length && filteredFacilities.length > 0}
                        onCheckedChange={(checked) => handleSelectAllFacilities(Boolean(checked))}
                      />
                      <label htmlFor="select-all-parser-facilities" className="text-sm font-medium cursor-pointer">
                        Seleccionar todas ({selectedFacilityGuids.size}/{filteredFacilities.length})
                      </label>
                    </div>
                  )}

                  <div className="max-h-[290px] overflow-y-auto overflow-x-hidden space-y-0.5 pr-1 border rounded-md p-2">
                    {isLoadingRelationsData ? (
                      <div className="flex justify-center items-center h-20">
                        <Loader2 className="h-6 w-6 animate-spin text-brand-purple" />
                      </div>
                    ) : filteredFacilities.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {facilitySearch ? "No se encontraron facilities" : "No hay facilities disponibles"}
                      </p>
                    ) : (
                      filteredFacilities.map((facility) => {
                        const isSelected = selectedFacilityGuids.has(facility.guid);
                        return (
                          <div
                            key={facility.guid}
                            className={`flex w-full items-center gap-3 p-2 rounded-md border transition-colors duration-200 ease-out ${
                              isSelected ? "bg-brand-purple/5 border-brand-purple/40" : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                          >
                            <Checkbox
                              id={`facility-${facility.guid}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => handleFacilityCheckedChange(facility.guid, Boolean(checked))}
                            />
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 min-w-0 flex-1 text-left"
                              onClick={() => handleFacilityCheckedChange(facility.guid, !isSelected)}
                            >
                              <MapPin
                                className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                                  isSelected ? "text-brand-purple" : "text-gray-400"
                                }`}
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{facility.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{facility.code || facility.guid}</p>
                              </div>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-semibold">Tipos de estudio</h3>
                    <p className="text-sm text-muted-foreground">Seleccione los tipos de estudio compatibles con este parser</p>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar tipo de estudio..."
                      value={studytypeSearch}
                      onChange={(event) => setStudytypeSearch(event.target.value)}
                      className="pl-9"
                      disabled={isSavingRelation}
                    />
                  </div>

                  {!isLoadingRelationsData && studyTypes.length > 0 && (
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Checkbox
                        id="select-all-parser-studytypes"
                        checked={selectedStudytypeGuids.size === filteredStudyTypes.length && filteredStudyTypes.length > 0}
                        onCheckedChange={(checked) => handleSelectAllStudytypes(Boolean(checked))}
                      />
                      <label htmlFor="select-all-parser-studytypes" className="text-sm font-medium cursor-pointer">
                        Seleccionar todos ({selectedStudytypeGuids.size}/{filteredStudyTypes.length})
                      </label>
                    </div>
                  )}

                  <div className="max-h-[290px] overflow-y-auto overflow-x-hidden space-y-0.5 pr-1 border rounded-md p-2">
                    {isLoadingRelationsData ? (
                      <div className="flex justify-center items-center h-20">
                        <Loader2 className="h-6 w-6 animate-spin text-brand-purple" />
                      </div>
                    ) : filteredStudyTypes.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {studytypeSearch ? "No se encontraron tipos de estudio" : "No hay tipos de estudio disponibles"}
                      </p>
                    ) : (
                      filteredStudyTypes.map((studyType) => {
                        const isSelected = selectedStudytypeGuids.has(studyType.guid);
                        return (
                          <div
                            key={studyType.guid}
                            className={`flex w-full items-center gap-3 p-2 rounded-md border transition-colors duration-200 ease-out ${
                              isSelected ? "bg-brand-purple/5 border-brand-purple/40" : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                          >
                            <Checkbox
                              id={`studytype-${studyType.guid}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => handleStudytypeCheckedChange(studyType.guid, Boolean(checked))}
                            />
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 min-w-0 flex-1 text-left"
                              onClick={() => handleStudytypeCheckedChange(studyType.guid, !isSelected)}
                            >
                              <MapPin
                                className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                                  isSelected ? "text-brand-purple" : "text-gray-400"
                                }`}
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{studyType.description}</p>
                                <p className="text-xs text-muted-foreground truncate">{studyType.code || studyType.guid}</p>
                              </div>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Asociaciones actuales: Facilities {relationsForParser.length} · Tipos de estudio {studytypeRelationsForParser.length}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsRelationModalOpen(false)} disabled={isSavingRelation}>
                  Cerrar
                </Button>
                <Button onClick={handleSaveRelations} disabled={isSavingRelation}>
                  {isSavingRelation ? "Guardando..." : "Guardar relaciones"}
                </Button>
              </div>
            </div>
          </Modal>

          <TabsContent value="mapeo-variables" className="mt-4">
            <MapeoVariablesTab />
          </TabsContent>

          <TabsContent value="conceptos-criterios" className="mt-4">
            <ConceptosCriteriosTab />
          </TabsContent>

          <TabsContent value="plantillas-inteligentes" className="mt-4">
            <div className="bg-white dark:bg-gray-900/70 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-sm text-muted-foreground">
              Plantillas inteligentes
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};
