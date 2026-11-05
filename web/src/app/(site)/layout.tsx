import "@fortawesome/fontawesome-free/css/all.min.css";
import "leaflet/dist/leaflet.css";
import "./heritage.css";
import "./community.css";

import SiteNavbar from "@/components/SiteNavbar";
import SiteFooter from "@/components/SiteFooter";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNavbar />
      <main className="site-main">{children}</main>
      <SiteFooter />
    </>
  );
}
