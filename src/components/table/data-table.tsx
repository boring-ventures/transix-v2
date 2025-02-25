"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Plus,
  Pencil,
  Trash2,
  PlusCircle,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { SortDirection, PaginationState, Column } from "./types";
import { sortData, filterData, paginateData } from "./table-utils";

interface DataTableProps<TData> {
  title?: string;
  description?: string;
  data: TData[];
  columns: Column<TData>[];
  searchable?: boolean;
  searchField?: keyof TData;
  defaultSort?: { field: keyof TData; direction: SortDirection };
  rowSelection?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  onEdit?: (row: TData) => void;
  onDelete?: (row: TData) => void;
  onAdd?: () => void;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData>({
  title,
  description,
  data,
  columns,
  searchable = true,
  searchField = "title" as keyof TData,
  defaultSort,
  rowSelection = true,
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  onEdit,
  onDelete,
  onAdd,
  onRowClick,
}: DataTableProps<TData>) {
  const [sortConfig, setSortConfig] = useState<{
    field: keyof TData | undefined;
    direction: SortDirection;
  }>({
    field: defaultSort?.field,
    direction: defaultSort?.direction,
  });

  const [searchValue, setSearchValue] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  // Handle sorting
  const handleSort = (field: keyof TData) => {
    setSortConfig((current) => ({
      field,
      direction:
        current.field === field
          ? current.direction === "asc"
            ? "desc"
            : current.direction === "desc"
            ? undefined
            : "asc"
          : "asc",
    }));
  };

  // Process data with sorting, filtering, and pagination
  const processedData = useMemo(() => {
    let processed = [...data];

    // Apply search filter
    if (searchValue && searchField) {
      processed = filterData(processed, searchField, searchValue);
    }

    // Apply sorting
    if (sortConfig.field && sortConfig.direction) {
      processed = sortData(processed, sortConfig.field, sortConfig.direction);
    }

    // Get total count before pagination
    const totalCount = processed.length;

    // Apply pagination
    const paginatedData = paginateData(
      processed,
      pagination.pageIndex,
      pagination.pageSize
    );

    return { data: paginatedData, totalCount };
  }, [data, searchValue, sortConfig, pagination, searchField]);

  // Handle row selection
  const handleSelectAll = () => {
    if (selectedRows.size === processedData.data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(processedData.data.map((_, index) => index)));
    }
  };

  const handleSelectRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const totalPages = Math.ceil(processedData.totalCount / pagination.pageSize);

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-row items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {onAdd && data.length > 0 && (
          <Button onClick={onAdd} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Nuevo
          </Button>
        )}
      </div>

      <div className="w-full">
        {data.length > 0 ? (
          <>
            <div className="flex items-center justify-between py-4">
              {searchable && (
                <Input
                  placeholder="Buscar..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="max-w-sm"
                />
              )}
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {rowSelection && (
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={
                            selectedRows.size === processedData.data.length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                    )}
                    {columns.map((column) => (
                      <TableHead
                        key={column.id}
                        className={
                          column.sortable ? "cursor-pointer select-none" : ""
                        }
                        onClick={() =>
                          column.sortable && handleSort(column.accessorKey)
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <span>{column.header}</span>
                          {column.sortable && (
                            <div className="w-4">
                              {sortConfig.field === column.accessorKey ? (
                                sortConfig.direction === "asc" ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : sortConfig.direction === "desc" ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronsUpDown className="h-4 w-4" />
                                )
                              ) : (
                                <ChevronsUpDown className="h-4 w-4" />
                              )}
                            </div>
                          )}
                        </div>
                      </TableHead>
                    ))}
                    {(onEdit || onDelete) && (
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedData.data.map((row, rowIndex) => (
                    <TableRow
                      key={rowIndex}
                      className={onRowClick ? "cursor-pointer" : ""}
                      onClick={() => onRowClick && onRowClick(row)}
                    >
                      {rowSelection && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedRows.has(rowIndex)}
                            onCheckedChange={() => handleSelectRow(rowIndex)}
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell key={column.id}>
                          {column.cell
                            ? column.cell({ row })
                            : String(row[column.accessorKey])}
                        </TableCell>
                      ))}
                      {(onEdit || onDelete) && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(row)}
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete(row)}
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  {selectedRows.size} de {processedData.totalCount} fila(s)
                  seleccionada(s).
                </p>
                <Select
                  value={String(pagination.pageSize)}
                  onValueChange={(value) =>
                    setPagination((current) => ({
                      ...current,
                      pageSize: Number(value),
                      pageIndex: 0,
                    }))
                  }
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  filas por página
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((current) => ({ ...current, pageIndex: 0 }))
                  }
                  disabled={pagination.pageIndex === 0}
                >
                  {"<<"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((current) => ({
                      ...current,
                      pageIndex: current.pageIndex - 1,
                    }))
                  }
                  disabled={pagination.pageIndex === 0}
                >
                  {"<"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Página {pagination.pageIndex + 1} de {totalPages}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((current) => ({
                      ...current,
                      pageIndex: current.pageIndex + 1,
                    }))
                  }
                  disabled={pagination.pageIndex === totalPages - 1}
                >
                  {">"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((current) => ({
                      ...current,
                      pageIndex: totalPages - 1,
                    }))
                  }
                  disabled={pagination.pageIndex === totalPages - 1}
                >
                  {">>"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <PlusCircle className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No hay datos</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                No se encontraron registros. Agrega uno nuevo para empezar.
              </p>
              {onAdd && (
                <Button onClick={onAdd} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Nuevo
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
