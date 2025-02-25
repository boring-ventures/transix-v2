"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingTableProps {
  columnCount?: number;
  rowCount?: number;
  showToolbar?: boolean;
}

export function LoadingTable({
  columnCount = 5,
  rowCount = 5,
  showToolbar = true,
}: LoadingTableProps) {
  return (
    <div className="space-y-4">
      {showToolbar && (
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-7 w-[150px]" />
            <Skeleton className="h-4 w-[250px]" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-9 w-[200px]" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: columnCount }).map((_, index) => (
                <TableHead key={index} className="h-10">
                  <Skeleton className="h-4 w-[100px]" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <TableRow key={rowIndex} className="h-16">
                {Array.from({ length: columnCount }).map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-8 w-[70px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}
