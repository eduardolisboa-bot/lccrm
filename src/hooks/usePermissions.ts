import { useAuth } from "@/lib/auth-context";

export function usePermissions() {
  const { profile } = useAuth();
  const tipo = profile?.tipo_usuario;
  const isMaster = tipo === "master";
  const isInterno = tipo === "interno";
  const isParceiro = tipo === "parceiro";
  const internalUser = isMaster || isInterno;

  return {
    tipo,
    isMaster,
    isInterno,
    isParceiro,
    canViewAllClients: isMaster,
    canEditTags: internalUser,
    canDeleteDocuments: isMaster,
    canUploadDocuments: internalUser,
    canMergeClients: isMaster,
    canChangeStatus: internalUser,
    canCreateActivities: isMaster || isInterno || isParceiro,
    canCompleteActivities: internalUser,
    canSyncCalendar: internalUser,
    canAccessSettings: isMaster,
    canAccessUsers: isMaster,
    canCreateTags: isMaster,
  };
}
