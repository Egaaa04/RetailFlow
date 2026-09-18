import { useEffect, useState } from "react";

import {
  getAuditLogs,
  type AuditLog,
} from "../services/auditLogService";

function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(
    []
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const result =
        await getAuditLogs();

      if (!result.success) {
        setError(
          "Audit log tidak dapat dimuat."
        );
        return;
      }

      setLogs(result.audit_logs);
    } catch (error) {
      console.error(error);

      setError(
        "Tidak dapat memuat audit log."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getActionLabel = (
    action: string
  ) => {
    const labels: Record<string, string> = {
      CREATE: "Tambah",
      UPDATE: "Ubah",
      SALE: "Penjualan",
      PURCHASE: "Pembelian",
      RECEIVE: "Penerimaan",
      DAMAGE: "Kerusakan",
      ADJUSTMENT: "Penyesuaian",
      RETURN: "Pengembalian",
    };

    return labels[action] || action;
  };

  const getActionClass = (
    action: string
  ) => {
    if (
      action === "CREATE" ||
      action === "PURCHASE" ||
      action === "RECEIVE"
    ) {
      return "audit-positive";
    }

    if (
      action === "SALE" ||
      action === "DAMAGE"
    ) {
      return "audit-negative";
    }

    if (action === "ADJUSTMENT") {
      return "audit-warning";
    }

    return "audit-neutral";
  };

  return (
    <div className="report-page">

      <div className="page-header">
        <div>
          <h1>Audit Log</h1>

          <p>
            Riwayat aktivitas pengguna pada sistem
          </p>
        </div>
      </div>

      {error && (
        <div className="login-error">
          {error}
        </div>
      )}

      <div className="report-table-container">

        <div className="section-header">
          <div>
            <h2>
              Aktivitas Sistem
            </h2>

            <p>
              Menampilkan aktivitas terbaru
            </p>
          </div>
        </div>

        {loading ? (
          <p>
            Memuat audit log...
          </p>
        ) : logs.length === 0 ? (
          <p>
            Belum ada aktivitas yang tercatat.
          </p>
        ) : (
          <div className="table-wrapper">

            <table className="data-table">

              <thead>
                <tr>
                  <th>No</th>
                  <th>Waktu</th>
                  <th>Pengguna</th>
                  <th>Aksi</th>
                  <th>Entitas</th>
                  <th>ID</th>
                  <th>Deskripsi</th>
                </tr>
              </thead>

              <tbody>
                {logs.map(
                  (log, index) => (
                    <tr key={log.id}>

                      <td>
                        {index + 1}
                      </td>

                      <td>
                        {new Date(
                          log.created_at
                        ).toLocaleString(
                          "id-ID"
                        )}
                      </td>

                      <td>
                        {log.user_name ||
                          `User #${log.user_id}`}
                      </td>

                      <td>
                        <span
                          className={`audit-badge ${getActionClass(
                            log.action
                          )}`}
                        >
                          {getActionLabel(
                            log.action
                          )}
                        </span>
                      </td>

                      <td>
                        {log.entity}
                      </td>

                      <td>
                        {log.entity_id ||
                          "-"}
                      </td>

                      <td>
                        {log.description}
                      </td>

                    </tr>
                  )
                )}
              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default AuditLogs;