# QrCodeChecker 🟩🔍

A complete QR Code generation and webcam-based scanning suite for React. It contains a customizable generator page (with logo integration and downloads) and a real-time scanner page with camera feed decoding and token validation.

---

## Key Features 🚀

### 1. QR Code Generator (`QRGeneratorPage.jsx`)
- **Logo Integration:** Automatically centers a custom brand logo (like the MARS AI logo) inside the QR code.
- **Visual Styling:** Live customization of the QR code's dot colors and styles.
- **Multi-Format Downloads:** Export your custom QR codes to high-quality **PNG** or **SVG** vector formats.
- **Dynamic Content:** Live updates as the user types a URL, ticket ID, or any textual data.

### 2. QR Code Scanner (`ScannerPage.jsx`)
- **Webcam Scan in Live Stream:** Real-time access to the user's camera feed (`navigator.mediaDevices.getUserMedia`).
- **jsQR Integration:** Uses `jsQR` to decode frames drawn to a canvas element instantly.
- **Manual Input Fallback:** Users can manually type or paste hex tokens if their camera is unavailable.
- **Scan Validation States:** Configured UI overlays to show scan statuses: *Success*, *Expired*, *Revoked*, or *Invalid*.
- **Modern HUD Overlay:** Cyberpunk-style scan target bounds and glassmorphic inputs.

### 3. Scan History (`ScanHistoryPage.jsx`)
- **Scan Tracking:** Keeps a list of scanned tokens and timestamps.
- **Filter and Search:** Group scanned items by status.

---

## Tech Stack 🛠️

- **Core:** [React](https://react.dev/)
- **QR Styling Engine:** [qr-code-styling](https://www.npmjs.com/package/qr-code-styling)
- **Decoding Engine:** [jsQR](https://www.npmjs.com/package/jsqr)
- **Animations:** [Motion / Framer Motion](https://motion.dev/)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## Installation 📦

1. Copy the components into your project:
   - `src/components/QRGeneratorPage.jsx`
   - `src/components/ScannerPage.jsx`
   - `src/components/ScanHistoryPage.jsx`

2. Install the peer dependencies:
   ```bash
   npm install qr-code-styling jsqr motion lucide-react
   ```

3. Ensure Tailwind CSS is configured in your project.

---

## Setup & API Usage 💻

### QR Generator Setup
The generator is fully ready to render as a route or standalone view. You can configure the embedded logo by modifying the logo URL or importing it locally:

```jsx
import React from "react";
import QRGeneratorPage from "./components/QRGeneratorPage";

export default function GeneratorRoute() {
  return <QRGeneratorPage />;
}
```

### QR Scanner Setup
The scanner expects an API hook or fetch client to validate the decoded token with your back-end. You can plug in your own API endpoint in `ScannerPage.jsx`:

```jsx
// Custom API Call inside ScannerPage.jsx
const handleScanSuccess = async (token) => {
  try {
    const response = await fetch(`/api/events/scan/${token}`, { method: "POST" });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Scan validation failed", error);
  }
};
```

Example import:

```jsx
import React from "react";
import ScannerPage from "./components/ScannerPage";

export default function ScannerRoute() {
  return <ScannerPage />;
}
```

---

## Customization Options 🎨

### QR Code Styling Config
In `QRGeneratorPage.jsx`, the generator utilizes the `QRCodeStyling` constructor:
```javascript
new QRCodeStyling({
  width: 280,
  height: 280,
  data: textValue,
  image: "/logo.png", // Replace with your brand logo path
  dotsOptions: {
    color: dotsColor,
    type: "rounded" // Options: rounded, dots, classy, classy-rounded, square, extra-rounded
  },
  backgroundOptions: {
    color: "#ffffff"
  },
  imageOptions: {
    crossOrigin: "anonymous",
    margin: 8
  }
});
```

---

## License ⚖️

> **⚠️ This software is proprietary. All rights reserved.**

This component is **NOT open-source**. The source code is publicly visible for evaluation purposes only.

**You may NOT:**
- ❌ Use this component in any project without purchasing a license.
- ❌ Copy, fork, or redistribute the code.
- ❌ Create derivative works for distribution.

**You MAY:**
- ✅ View and study the source code for learning purposes.
- ✅ Purchase a commercial license to use it in your projects.

### 💰 Purchase a License

For pricing and licensing inquiries, contact:
- **GitHub:** [@syrinedev-06](https://github.com/syrinedev-06)
- **Email** [@Email](stawren@hotmail.fr)


See the full [LICENSE](./LICENSE) file for details.
