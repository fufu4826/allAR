import "@fortawesome/fontawesome-free/css/all.min.css";
import "leaflet/dist/leaflet.css";
import "./heritage.css";
import "./community.css";
import "./cover.css";

import SiteNavbar from "@/components/SiteNavbar";
import SiteFooter from "@/components/SiteFooter";
import WelcomeCover from "@/components/WelcomeCover";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WelcomeCover />
      <SiteNavbar />
      <main className="site-main">{children}</main>
      <SiteFooter />
    </>
  );
}
