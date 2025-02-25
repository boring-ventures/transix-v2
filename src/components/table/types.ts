export type SortDirection = 'asc' | 'desc' | undefined

export interface Column<T> {
  id: string
  header: string
  accessorKey: keyof T
  sortable?: boolean
  cell?: (props: { row: T }) => React.ReactNode
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

