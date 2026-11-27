import "./globals.css";

export const metadata = {
  title: "MercyLegacy — Create · Plant · Connect",
  description: "Where memory becomes living legacy — identities, living trees, QR connections and forests.",
};

const visionAdStyle: React.CSSProperties = {
  position: "fixed",
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 1000,
  overflow: "hidden",
  borderTop: "1px solid #b58b2a",
  background: "#090909",
  padding: "9px 0",
  whiteSpace: "nowrap",
};

const visionAdTrackStyle: React.CSSProperties = {
  display: "flex",
  width: "max-content",
  animation: "mercysoulVisionAd 28s linear infinite",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <div aria-label="MercySoul Vision Brain advertisement" style={visionAdStyle}>
          <div style={visionAdTrackStyle}>
            <a href="https://mercy-vision.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: "#f2d98a", textDecoration: "none", paddingRight: 70 }}>
              ☥ <strong>MercySoul Vision Brain</strong> · Where Imagination Becomes Sacred Art · Create your custom AI vision → Visit Vision Brain
            </a>
            <a href="https://mercy-vision.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: "#f2d98a", textDecoration: "none", paddingRight: 70 }}>
              ☥ <strong>MercySoul Vision Brain</strong> · Where Imagination Becomes Sacred Art · Create your custom AI vision → Visit Vision Brain
            </a>
          </div>
        </div>
        <style>{`@keyframes mercysoulVisionAd{from{transform:translateX(0)}to{transform:translateX(-50%)}} @media(prefers-reduced-motion:reduce){div[aria-label="MercySoul Vision Brain advertisement"] div{animation:none!important}} body{padding-bottom:38px}`}</style>
      </body>
    </html>
  );
}
