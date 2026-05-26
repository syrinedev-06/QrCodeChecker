import { motion } from "motion/react";
import { CheckCircle, XCircle, Trash2, User, Calendar, Clock, AlertCircle, TimerOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { fetchScanHistory } from "../../api/events.js";

const TYPE_COLORS = {
  standard: "from-[#51a2ff] to-[#0066ff]",
  vip:      "from-[#ad46ff] to-[#7000ff]",
  pmr:      "from-[#ff9500] to-[#ffcc00]",
  press:    "from-[#30d158] to-[#00a321]",
};

const STATUS_COLORS = {
  valid:   "bg-green-500/[0.04] border-green-500/20",
  invalid: "bg-red-500/[0.04] border-red-500/20",
  expired: "bg-amber-500/[0.04] border-amber-500/20",
  revoked: "bg-red-500/[0.04] border-red-500/20",
};

function entryFromApi(log) {
  const reg = log.registration;
  return {
    ok: log.status === "valid",
    status: log.status,
    username: reg?.User?.username ?? "—",
    eventTitle: reg?.Event?.title ?? "—",
    ticketType: reg?.ticketType ?? "—",
    checkInCount: reg?.checkInCount ?? 1,
    expiresAt: reg?.expiresAt ?? null,
    message: log.message ?? "",
    scannedAt: log.createdAt,
    source: "api",
  };
}

function entryFromLocal(entry) {
  return { ...entry, status: entry.ok ? "valid" : "invalid", source: "local" };
}

export default function ScanHistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);

  useEffect(() => {
    fetchScanHistory()
      .then((res) => {
        setHistory(res.data.map(entryFromApi));
        setFromApi(true);
      })
      .catch(() => {
        // fallback localStorage
        try {
          const local = JSON.parse(localStorage.getItem("scanHistory") || "[]");
          setHistory(local.map(entryFromLocal));
        } catch {
          setHistory([]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const clearLocal = () => {
    localStorage.removeItem("scanHistory");
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-12">

        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
              Historique
            </h1>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mt-1">
              {loading ? "Chargement…" : `${history.length} scan${history.length !== 1 ? "s" : ""} enregistré${history.length !== 1 ? "s" : ""}`}
              {fromApi && <span className="ml-2 text-green-400/60">· base de données</span>}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/scanner")}
              className="h-10 px-4 bg-white/[0.05] border border-white/10 text-white rounded-[14px] font-black uppercase text-[10px] tracking-widest hover:bg-white/[0.08] transition-all"
            >
              Scanner
            </button>
            {!fromApi && history.length > 0 && (
              <button
                onClick={clearLocal}
                className="h-10 px-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-[14px] font-black uppercase text-[10px] tracking-widest hover:bg-red-500/20 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Effacer
              </button>
            )}
          </div>
        </motion.div>

        {/* Liste */}
        {loading ? (
          <div className="text-center py-20 text-white/30 font-black uppercase text-sm tracking-widest">Chargement…</div>
        ) : history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 bg-white/[0.03] border border-white/10 rounded-[20px] flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/30 font-black uppercase text-sm tracking-widest">Aucun scan enregistré</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {history.map((entry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`rounded-[20px] p-4 border ${STATUS_COLORS[entry.status] ?? "bg-red-500/[0.04] border-red-500/20"}`}
              >
                <div className="flex items-start gap-3">
                  {entry.ok
                    ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    : entry.status === "expired"
                      ? <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      : <XCircle    className="w-5 h-5 text-red-400    flex-shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    {entry.ok ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1 text-white font-bold text-sm">
                            <User className="w-3.5 h-3.5 text-white/30" />
                            {entry.username}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white bg-gradient-to-r ${TYPE_COLORS[entry.ticketType] || "from-white/20 to-white/10"}`}>
                            {entry.ticketType}
                          </span>
                          {entry.checkInCount > 1 && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20">
                              ×{entry.checkInCount} scans
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-white/40 text-xs">
                          <Calendar className="w-3 h-3" />
                          {entry.eventTitle}
                        </div>
                        {entry.expiresAt && (
                          <div className={`flex items-center gap-1 text-xs ${new Date() > new Date(entry.expiresAt) ? "text-red-400/70" : "text-white/30"}`}>
                            <TimerOff className="w-3 h-3" />
                            Expire le {new Date(entry.expiresAt).toLocaleString("fr-FR", {
                              day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className={`font-bold text-sm ${entry.status === "expired" ? "text-amber-400" : "text-red-400"}`}>
                          {entry.status === "expired" ? "QR expiré" : entry.status === "revoked" ? "Ticket révoqué" : "Ticket invalide"}
                        </div>
                        <div className="text-white/30 text-xs mt-0.5">{entry.message}</div>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-white/20 text-[10px] mt-1.5">
                      <Clock className="w-3 h-3" />
                      {new Date(entry.scannedAt).toLocaleString("fr-FR", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
