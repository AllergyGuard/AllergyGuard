import { SiteHeader } from "@/components/site-header";

// Every page except /emergency and /~offline. SiteHeader reads the auth
// cookies, which makes these pages render per request; keeping it out of the
// root layout lets /emergency be a static page the service worker precaches.
export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
