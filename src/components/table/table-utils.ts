import { SortDirection } from './types'

export function sortData<T>(
  data: T[],
  sortField: keyof T | undefined,
  sortDirection: SortDirection
): T[] {
  if (!sortField || !sortDirection) {
    return data
  }

  return [...data].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    }
    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
  })
}

export function filterData<T>(data: T[], searchField: keyof T, searchValue: string): T[] {
  if (!searchValue) return data

  return data.filter((item) => {
    const fieldValue = item[searchField]
    if (typeof fieldValue === 'string') {
      return fieldValue.toLowerCase().includes(searchValue.toLowerCase())
    }
    return String(fieldValue).toLowerCase().includes(searchValue.toLowerCase())
  })
}

export function paginateData<T>(data: T[], pageIndex: number, pageSize: number): T[] {
  const start = pageIndex * pageSize
  return data.slice(start, start + pageSize)
}

