export type SortDirection = 'asc' | 'desc' | undefined

export interface Column<T> {
  id: string;
  header: string;
  accessorKey?: keyof T | string;
  accessorFn?: (row: T) => unknown;
  cell?: ({
    row,
    getValue,
  }: {
    row: T;
    getValue?: () => unknown;
  }) => React.ReactNode | string | number | null | undefined;
  enableSorting?: boolean;
  enableHiding?: boolean;
  sortable?: boolean;
}

export interface TableProps<T> {
  title: string
  description?: string;
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchField?: keyof T
  defaultSort?: {
    field: keyof T
    direction: SortDirection
  }
  rowSelection?: boolean
  pageSize?: number
  pageSizeOptions?: number[]
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onAdd?: () => void
  onRowClick?: (row: T) => void
}

export interface PaginationState {
  pageIndex: number
  pageSize: number
}

export interface DataTableProps<TData> {
  title: string;
  description: string;
  data: TData[];
  columns: Column<TData>[];
  searchable?: boolean;
  searchField?: string;
  defaultSort?: { field: string; direction: "asc" | "desc" };
  onAdd?: () => void;
  onEdit?: (record: TData) => void;
  onDelete?: (record: TData) => void;
  onRowClick?: (record: TData) => void;
  customActions?: Array<{
    label: string;
    onClick: (record: TData) => void;
  }>;
}

