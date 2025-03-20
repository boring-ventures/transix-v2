"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useProfiles, type Profile } from "@/hooks/use-profiles";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DataTable } from "@/components/table/data-table";
import { LoadingTable } from "@/components/table/loading-table";
import { CreateProfileDialog } from "./components/create-profile-dialog";
import { EditProfileDialog } from "./components/edit-profile-dialog";
import { DeleteProfileDialog } from "./components/delete-profile-dialog";
import type { Column } from "@/components/table/types";

export default function ProfilesClient() {
  const router = useRouter();
  const { profiles, isLoadingProfiles, isCompanyRestricted } = useProfiles();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState<Profile | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  // Memoize profiles to prevent unnecessary re-renders
  const memoizedProfiles = useMemo(() => profiles, [profiles]);

  const handleViewProfile = (profile: Profile) => {
    router.push(`/profiles/${profile.userId}`);
  };

  const handleEditProfile = (profile: Profile) => {
    // For company-restricted users, only allow editing non-superadmin profiles
    if (isCompanyRestricted && profile.role === "superadmin") {
      return;
    }
    setProfileToEdit(profile);
  };

  const handleDeleteProfile = (profile: Profile) => {
    // For company-restricted users, only allow deleting non-superadmin profiles
    if (isCompanyRestricted && profile.role === "superadmin") {
      return;
    }
    setProfileToDelete(profile.userId);
  };

  // Memoize columns to prevent them from being recreated on each render
  const columns = useMemo<Column<Profile>[]>(
    () => [
      {
        id: "fullName",
        header: "Nombre",
        accessorKey: "fullName",
        sortable: true,
      },
      {
        id: "email",
        header: "Email",
        accessorKey: "email",
        sortable: true,
      },
      {
        id: "role",
        header: "Rol",
        accessorKey: "role",
        sortable: true,
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.role.replace("_", " ")}
          </Badge>
        ),
      },
      // Only show company column for superadmins
      ...(isCompanyRestricted
        ? []
        : [
            {
              id: "company",
              header: "Empresa",
              accessorKey: "company",
              cell: ({ row }: { row: Profile }) =>
                row.company?.name || "Sin empresa",
            } as Column<Profile>,
          ]),
      {
        id: "branch",
        header: "Sucursal",
        accessorKey: "branch",
        cell: ({ row }) => row.branch?.name || "Sin sucursal",
      },
      {
        id: "status",
        header: "Estado",
        accessorKey: "active",
        sortable: true,
        cell: ({ row }) => (
          <Badge variant={row.active ? "default" : "destructive"}>
            {row.active ? "Activo" : "Inactivo"}
          </Badge>
        ),
      },
      {
        id: "createdAt",
        header: "Creado",
        accessorKey: "createdAt",
        sortable: true,
        cell: ({ row }) => format(new Date(row.createdAt), "d MMM, yyyy"),
      },
    ],
    [isCompanyRestricted]
  );

  return (
    <div className="container mx-auto py-6">
      {isLoadingProfiles ? (
        <LoadingTable columnCount={7} rowCount={5} />
      ) : (
        <DataTable
          title="Lista de Usuarios"
          description="Ver y gestionar todos los usuarios del sistema"
          data={memoizedProfiles}
          columns={columns}
          searchable={true}
          searchField="fullName"
          defaultSort={{ field: "fullName", direction: "asc" }}
          onAdd={() => setShowCreateDialog(true)}
          onEdit={handleEditProfile}
          onDelete={handleDeleteProfile}
          onRowClick={handleViewProfile}
        />
      )}

      <CreateProfileDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <EditProfileDialog
        open={!!profileToEdit}
        onOpenChange={(open) => !open && setProfileToEdit(null)}
        profile={profileToEdit}
      />

      <DeleteProfileDialog
        profileId={profileToDelete}
        onClose={() => setProfileToDelete(null)}
      />
    </div>
  );
}
