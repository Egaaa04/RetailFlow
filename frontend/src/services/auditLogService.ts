import api from "./api";

export interface AuditLog {
  id: number;
  user_id: number;
  user_name: string | null;
  action: string;
  entity: string;
  entity_id: number | null;
  description: string;
  created_at: string;
}

export const getAuditLogs = async () => {
  const response = await api.get(
    "/audit-logs"
  );

  return response.data;
};