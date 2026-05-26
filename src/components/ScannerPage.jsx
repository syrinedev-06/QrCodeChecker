import { motion, AnimatePresence } from "motion/react";
import { ScanLine, CheckCircle, XCircle, Camera, Keyboard, Loader2, User, Calendar, MapPin, Ticket, Shield, AlertCircle, History } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { scanQrToken } from "../../api/events.js";
import jsQR from "jsqr";

function getCurrentUser() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    // base64url → base64 standard avant atob()
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

const TYPE_COLORS = {
  standard: "from-[#51a2ff] to-[#0066ff]",
  vip:      "from-[#ad46ff] to-[#7000ff]",
  pmr:      "from-[#ff9500] to-[#ffcc00]",
  press:    "from-[#30d158] to-[#00a321]",
};

export default function ScannerPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [mode, setMode]             = useState("camera"); // 'camera' | 'manual'
  const [manualToken, setManualToken] = useState("");
  const [scanning, setScanning]     = useState(false);
  const [result, setResult]         = useState(null); // { ok: bool, data: {...} | message: '' }
  const [cameraError, setCameraError] = useState(null);

  const videoRef       = useRef(null);
  const canvasRef      = useRef(null);
  const streamRef      = useRef(null);
  const rafRef         = useRef(null);
  const lastScannedRef = useRef(null);
  const processingRef  = useRef(false);

  useEffect(() => {
    if (mode !== "camera") { stopCamera(); return; }
    startCamera();
    return () => stopCamera();
  }, [mode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      try {
        await video.play();
      } catch (playErr) {
        if (playErr?.name === "AbortError") return; // re-render React, ignoré
        throw playErr;
      }
      tick();
    } catch (err) {
      setCameraError(`Caméra inaccessible : ${err?.message || err}. Vérifiez les permissions du navigateur ou utilisez la saisie manuelle.`);
    }
  };

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const tick = () => {
    rafRef.current = requestAnimationFrame(() => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !streamRef.current) return;
      if (video.readyState < 2) { tick(); return; }
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(video, 0, 0);
      const img  = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, img.width, img.height);
      if (code?.data && code.data !== lastScannedRef.current && !processingRef.current) {
        lastScannedRef.current = code.data;
        processingRef.current  = true;
        processToken(code.data).finally(() => { processingRef.current = false; });
      } else {
        tick();
      }
    });
  };

  const saveToHistory = (entry) => {
    try {
      const history = JSON.parse(localStorage.getItem("scanHistory") || "[]");
      history.unshift({ ...entry, scannedAt: new Date().toISOString() });
      localStorage.setItem("scanHistory", JSON.stringify(history.slice(0, 100)));
    } catch {}
  };

  const processToken = async (token) => {
    setScanning(true);
    setResult(null);
    try {
      const res = await scanQrToken(token);
      const reg = res.data;
      const data = {
        username:      reg.User?.username || "—",
        email:         reg.User?.email    || "—",
        eventTitle:    reg.Event?.title   || "—",
        eventDate:     reg.Event?.startDate
          ? new Date(reg.Event.startDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
          : "—",
        eventLocation: reg.Event?.location || "—",
        ticketType:    reg.ticketType,
        checkedIn:     !!reg.checkedInAt,
        checkInCount:  reg.checkInCount,
        checkedInAt:   reg.checkedInAt
          ? new Date(reg.checkedInAt).toLocaleTimeString("fr-FR")
          : null,
      };
      saveToHistory({ ok: true, ...data });
      setResult({ ok: true, data });
    } catch (err) {
      const message = err.response?.data?.message || "Token invalide ou introuvable.";
      saveToHistory({ ok: false, message, token });
      setResult({ ok: false, message });
    } finally {
      setScanning(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualToken.trim()) processToken(manualToken.trim());
  };

  const handleReset = () => {
    setResult(null);
    setManualToken("");
    lastScannedRef.current = null;
    processingRef.current  = false;
    if (mode === "camera") tick();
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/[0.03] border border-white/10 rounded-[32px] p-8 text-center">
          <Shield className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-black uppercase mb-3">Connexion requise</h1>
          <p className="text-white/50 mb-6">Connectez-vous pour accéder au scanner de contrôle.</p>
          <button
            onClick={() => navigate("/auth/login")}
            className="w-full h-14 bg-white text-black rounded-[20px] font-black uppercase tracking-widest text-sm"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-y-auto pb-20">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-[#51a2ff]/[0.04] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-[#30d158]/[0.04] rounded-full blur-[120px]" />
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-12 pb-20">

        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/[0.03] border border-white/10 rounded-[24px] mb-6">
            <ScanLine className="w-10 h-10 text-white/80" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-3 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            Scanner QR
          </h1>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">
            Contrôle d'accès — Festival marsAI
          </p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
              <Shield className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-[10px] font-black uppercase tracking-wider">
                {currentUser.role || "USER"} : {currentUser.username || currentUser.id}
              </span>
            </div>
            <button
              onClick={() => navigate("/scan-history")}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/[0.05] border border-white/10 rounded-full hover:bg-white/[0.08] transition-all"
            >
              <History className="w-3 h-3 text-white/50" />
              <span className="text-white/50 text-[10px] font-black uppercase tracking-wider">Historique</span>
            </button>
          </div>
        </motion.div>

        {/* Toggle caméra / manuel */}
        <div className="flex gap-3 mb-8">
          {[
            { key: "camera", label: "Caméra", icon: Camera },
            { key: "manual", label: "Saisie manuelle", icon: Keyboard },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setMode(key); setResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2 h-14 rounded-[20px] font-black uppercase text-[11px] tracking-widest transition-all border ${
                mode === key
                  ? "bg-white text-black border-white"
                  : "bg-white/[0.03] border-white/10 text-white/40 hover:border-white/20"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Zone de scan caméra */}
        {mode === "camera" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <div className="relative bg-black border border-white/10 rounded-[32px] overflow-hidden aspect-square">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />

              {/* Overlay de scan */}
              {!result && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-56 h-56">
                    {/* Coins animés */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#51a2ff] rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#51a2ff] rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#51a2ff] rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#51a2ff] rounded-br-lg" />
                    {/* Ligne de scan animée */}
                    <motion.div
                      animate={{ y: [0, 192, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                      className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#51a2ff] to-transparent shadow-[0_0_8px_#51a2ff]"
                    />
                  </div>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                    <p className="text-white/70 text-sm">{cameraError}</p>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}

        {/* Saisie manuelle */}
        {mode === "manual" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="relative">
                <ScanLine className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Coller le token QR ici (64 caractères hex)..."
                  className="w-full h-[72px] bg-black/40 border border-white/10 rounded-[28px] pl-16 pr-6 text-sm font-mono focus:outline-none focus:border-[#51a2ff]/50 focus:bg-black/60 transition-all placeholder:text-white/10"
                />
              </div>
              <button
                type="submit"
                disabled={scanning || !manualToken.trim()}
                className="w-full h-[72px] bg-white text-black rounded-[28px] font-black uppercase tracking-[0.2em] text-[11px] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-3">
                  {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <ScanLine className="w-5 h-5" />}
                  {scanning ? "Vérification..." : "Vérifier le ticket"}
                </span>
              </button>
            </form>
          </motion.div>
        )}

        {/* Indicateur de scan en cours */}
        {scanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-3 p-4 bg-white/[0.03] border border-white/10 rounded-[20px]"
          >
            <Loader2 className="w-5 h-5 text-[#51a2ff] animate-spin" />
            <span className="text-white/60 text-sm font-bold uppercase tracking-wider">Vérification en cours...</span>
          </motion.div>
        )}
      </div>

      {/* Modal résultat */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={handleReset}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              {result.ok ? (
                <div className="bg-[#0a1a0a] border border-green-500/40 rounded-[32px] p-6 shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-[16px] bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-7 h-7 text-green-400" />
                    </div>
                    <div>
                      <div className="text-green-400 font-black uppercase tracking-widest text-base">Ticket Valide</div>
                      {result.data.checkInCount > 1 && (
                        <div className="text-amber-400 text-xs mt-0.5">
                          ⚠ Déjà scanné {result.data.checkInCount} fois — dernier à {result.data.checkedInAt}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Infos */}
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-3 p-3 bg-white/[0.04] rounded-[16px]">
                      <User className="w-4 h-4 text-white/30 flex-shrink-0" />
                      <div>
                        <div className="text-white/30 text-[9px] font-black uppercase tracking-widest">Titulaire</div>
                        <div className="text-white font-bold text-sm">{result.data.username}</div>
                        <div className="text-white/40 text-xs">{result.data.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/[0.04] rounded-[16px]">
                      <Calendar className="w-4 h-4 text-white/30 flex-shrink-0" />
                      <div>
                        <div className="text-white/30 text-[9px] font-black uppercase tracking-widest">Événement</div>
                        <div className="text-white font-bold text-sm">{result.data.eventTitle}</div>
                        <div className="text-white/40 text-xs">{result.data.eventDate}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 p-3 bg-white/[0.04] rounded-[16px]">
                        <MapPin className="w-4 h-4 text-white/30 flex-shrink-0" />
                        <div>
                          <div className="text-white/30 text-[9px] font-black uppercase tracking-widest">Lieu</div>
                          <div className="text-white font-bold text-xs">{result.data.eventLocation}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-white/[0.04] rounded-[16px]">
                        <Ticket className="w-4 h-4 text-white/30 flex-shrink-0" />
                        <div>
                          <div className="text-white/30 text-[9px] font-black uppercase tracking-widest">Type</div>
                          <div className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-white text-[10px] font-black uppercase bg-gradient-to-r ${TYPE_COLORS[result.data.ticketType] || "from-white/20 to-white/10"}`}>
                            {result.data.ticketType}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleReset}
                    className="w-full h-12 bg-white text-black rounded-[16px] font-black uppercase tracking-widest text-[11px] hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Scanner un autre
                  </button>
                </div>
              ) : (
                <div className="bg-[#1a0a0a] border border-red-500/40 rounded-[32px] p-6 shadow-2xl">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-[16px] bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <XCircle className="w-7 h-7 text-red-400" />
                    </div>
                    <div>
                      <div className="text-red-400 font-black uppercase tracking-widest text-base">Ticket Invalide</div>
                      <p className="text-white/50 text-sm mt-0.5">{result.message}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="w-full h-12 bg-white text-black rounded-[16px] font-black uppercase tracking-widest text-[11px] hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Réessayer
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
