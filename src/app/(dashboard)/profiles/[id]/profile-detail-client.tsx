"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfiles, type Profile } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Building, Calendar, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { EditProfileDialog } from "../components/edit-profile-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileDetailClientProps {
  id: string;
}

export default function ProfileDetailClient({ id }: ProfileDetailClientProps) {
  const router = useRouter();
  const { fetchProfile } = useProfiles();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        const profileData = await fetchProfile(id);
        setProfile(profileData);
      } catch (error) {
        console.error("Error cargando datos del usuario:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [id, fetchProfile]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="container mx-auto py-6">
      <Button 
        variant="outline" 
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
            <Skeleton className="h-[200px] rounded-xl" />
            <Skeleton className="h-[200px] rounded-xl" />
            <Skeleton className="h-[200px] rounded-xl" />
          </div>
        </div>
      ) : profile ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{profile.fullName}</h1>
              <p className="text-muted-foreground">
                {profile.email}
              </p>
            </div>
            <div>
              <Button onClick={() => setShowEditDialog(true)}>
                Editar Usuario
              </Button>
            </div>
          </div>

          <Tabs defaultValue="info" className="space-y-4">
            <TabsList>
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="company">Empresa</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Perfil
                    </CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={profile.avatarUrl || ""} alt={profile.fullName} />
                        <AvatarFallback>{getInitials(profile.fullName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">{profile.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {profile.username || "Sin nombre de usuario"}
                        </p>
                        <Badge variant="outline" className="mt-2 capitalize">
                          {profile.role.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                    {profile.bio && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">{profile.bio}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Contacto
                    </CardTitle>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground mb-4">{profile.email || "Sin email"}</p>
                    
                    <p className="text-sm font-medium">Estado</p>
                    <Badge variant={profile.active ? "default" : "destructive"} className="mt-1">
                      {profile.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Fechas
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium">Fecha de nacimiento</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {profile.birthDate 
                        ? format(new Date(profile.birthDate), "d 'de' MMMM 'de' yyyy", { locale: es })
                        : "No especificada"}
                    </p>
                    
                    <p className="text-sm font-medium">Creado el</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(profile.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="company">
              <Card>
                <CardHeader>
                  <CardTitle>Información de Empresa</CardTitle>
                  <CardDescription>
                    Empresa y sucursal asignadas al usuario
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {profile.company ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Empresa</h3>
                        <div className="flex items-center mt-2">
                          <Building className="h-5 w-5 mr-2 text-muted-foreground" />
                          <span>{profile.company.name}</span>
                          <Badge variant={profile.company.active ? "outline" : "secondary"} className="ml-2">
                            {profile.company.active ? "Activa" : "Inactiva"}
                          </Badge>
                        </div>
                      </div>

                      {profile.branch && (
                        <div>
                          <h3 className="text-lg font-medium">Sucursal</h3>
                          <div className="flex items-center mt-2">
                            <Building className="h-5 w-5 mr-2 text-muted-foreground" />
                            <span>{profile.branch.name}</span>
                            <Badge variant={profile.branch.active ? "outline" : "secondary"} className="ml-2">
                              {profile.branch.active ? "Activa" : "Inactiva"}
                            </Badge>
                          </div>
                          {profile.branch.address && (
                            <p className="text-sm text-muted-foreground mt-1 ml-7">
                              {profile.branch.address}
                              {profile.branch.city && `, ${profile.branch.city}`}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Building className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Usuario sin empresa asignada</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setShowEditDialog(true)}
                      >
                        Asignar Empresa
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <EditProfileDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            profile={profile}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <User className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Usuario No Encontrado</h2>
          <p className="text-muted-foreground">
            El usuario que está buscando no existe o ha sido eliminado.
          </p>
        </div>
      )}
    </div>
  );
} 