import { motion } from "motion/react";
import { QrCode, Download, ArrowLeft, Palette, Type } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import QRCodeStyling from "qr-code-styling";

const createLogoSVG = () => {
  const svg = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#0a0a0a" rx="12"/>
    <text x="50" y="45" font-family="Arial, sans-serif" font-size="16" font-weight="900" text-anchor="middle" fill="#ffffff">MARS</text>
    <text x="50" y="65" font-family="Arial, sans-serif" font-size="16" font-weight="900" text-anchor="middle" fill="#ffffff">AI</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const DOT_STYLES    = ["rounded", "dots", "classy", "square"];
const CORNER_STYLES = ["dot", "square", "extra-rounded"];

export default function QRGeneratorPage() {
  const navigate = useNavigate();

  const [url, setUrl]                         = useState("https://marsai-festival.com");
  const [dotsColor, setDotsColor]             = useState("#ffffff");
  const [backgroundColor, setBackgroundColor] = useState("#0a0a0a");
  const [dotsStyle, setDotsStyle]             = useState("rounded");
  const [cornerSquareStyle, setCornerSquareStyle] = useState("extra-rounded");

  const qrCodeRef      = useRef(null);
  const qrCodeInstance = useRef(null);

  // Créer l'instance initiale
  useEffect(() => {
    if (!qrCodeRef.current) return;

    qrCodeInstance.current = new QRCodeStyling({
      width: 300,
      height: 300,
      type: "svg",
      data: url,
      image: createLogoSVG(),
      imageOptions: { crossOrigin: "anonymous", margin: 4, imageSize: 0.3 },
      dotsOptions: { color: dotsColor, type: dotsStyle },
      backgroundOptions: { color: backgroundColor },
      cornersSquareOptions: { color: dotsColor, type: cornerSquareStyle },
      cornersDotOptions: { color: dotsColor, type: "dot" },
    });

    qrCodeInstance.current.append(qrCodeRef.current);

    return () => {
      if (qrCodeRef.current) qrCodeRef.current.innerHTML = "";
    };
  }, []);

  // Mettre à jour à chaque changement
  useEffect(() => {
    if (!qrCodeInstance.current) return;
    qrCodeInstance.current.update({
      data: url,
      image: createLogoSVG(),
      dotsOptions: { color: dotsColor, type: dotsStyle },
      backgroundOptions: { color: backgroundColor },
      cornersSquareOptions: { color: dotsColor, type: cornerSquareStyle },
      cornersDotOptions: { color: dotsColor },
    });
  }, [url, dotsColor, backgroundColor, dotsStyle, cornerSquareStyle]);

  const handleDownload = (extension) => {
    qrCodeInstance.current?.download({ name: "marsai-qrcode", extension });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 overflow-y-auto pb-32">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#ad46ff]/[0.03] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#51a2ff]/[0.03] rounded-full blur-[120px]" />
      </div>

      {/* Bouton retour */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => navigate(-1)}
        className="fixed top-6 left-6 z-50 w-12 h-12 bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-[16px] flex items-center justify-center hover:bg-white/[0.05] hover:border-white/20 transition-all group"
      >
        <ArrowLeft className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
      </motion.button>

      <div className="max-w-6xl mx-auto pt-20">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] mb-6">
            <QrCode className="w-10 h-10 text-white/80" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-4 text-white">
            Générateur QR Code
          </h1>
          <p className="text-white/40 text-lg max-w-2xl mx-auto">
            Créez des QR codes personnalisés avec le logo MARS AI
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* Aperçu QR */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[32px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <h3 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-2 text-white/80">
                <QrCode className="w-5 h-5" />
                Aperçu
              </h3>

              <div className="flex items-center justify-center bg-white/[0.02] border border-white/5 rounded-[24px] p-8 mb-6">
                <div ref={qrCodeRef} className="flex items-center justify-center" />
              </div>

              {/* Téléchargement */}
              <div className="grid grid-cols-2 gap-4">
                {["png", "svg"].map((ext) => (
                  <motion.button
                    key={ext}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleDownload(ext)}
                    className="h-[66px] bg-white/[0.08] border border-white/20 rounded-[24px] font-black uppercase tracking-widest text-white hover:bg-white/[0.12] transition-all"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Download className="w-5 h-5" />
                      {ext.toUpperCase()}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contrôles */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-6"
          >
            {/* URL */}
            <div className="bg-white/[0.02] border border-white/10 rounded-[32px] p-6">
              <label className="block text-xs font-black uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                <Type className="w-4 h-4" />
                URL ou Texte
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full h-[66px] bg-white/[0.02] border border-white/10 rounded-[24px] px-6 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.04] transition-all"
              />
            </div>

            {/* Couleurs */}
            <div className="bg-white/[0.02] border border-white/10 rounded-[32px] p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Couleurs
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Couleur QR",  value: dotsColor,        set: setDotsColor },
                  { label: "Fond",         value: backgroundColor,  set: setBackgroundColor },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <label className="block text-xs text-white/30 mb-2">{label}</label>
                    <div className="relative">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        className="absolute inset-0 w-full h-[66px] opacity-0 cursor-pointer"
                      />
                      <div
                        className="w-full h-[66px] rounded-[24px] border-2 border-white/20 cursor-pointer hover:border-white/30 transition-all"
                        style={{ backgroundColor: value }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Style des points */}
            <div className="bg-white/[0.02] border border-white/10 rounded-[32px] p-6">
              <label className="block text-xs font-black uppercase tracking-widest text-white/50 mb-4">
                Style des points
              </label>
              <div className="grid grid-cols-2 gap-3">
                {DOT_STYLES.map((style) => (
                  <button
                    key={style}
                    onClick={() => setDotsStyle(style)}
                    className={`h-14 rounded-[16px] font-bold uppercase text-xs tracking-widest transition-all border ${
                      dotsStyle === style
                        ? "bg-white/[0.08] border-white/30 text-white"
                        : "bg-white/[0.02] border-white/10 text-white/40 hover:border-white/20"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Style des coins */}
            <div className="bg-white/[0.02] border border-white/10 rounded-[32px] p-6">
              <label className="block text-xs font-black uppercase tracking-widest text-white/50 mb-4">
                Style des coins
              </label>
              <div className="grid grid-cols-3 gap-3">
                {CORNER_STYLES.map((style) => (
                  <button
                    key={style}
                    onClick={() => setCornerSquareStyle(style)}
                    className={`h-14 rounded-[16px] font-bold uppercase text-xs tracking-widest transition-all border ${
                      cornerSquareStyle === style
                        ? "bg-white/[0.08] border-white/30 text-white"
                        : "bg-white/[0.02] border-white/10 text-white/40 hover:border-white/20"
                    }`}
                  >
                    {style.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
