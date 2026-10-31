import { Link, useRouterState } from "@tanstack/react-router";
import { Users, Boxes, ReceiptText, ChartNoAxesCombined, UserRound } from "lucide-react";

const tabs = [
  { to: "/", label: "Customers", icon: Users },
  { to: "/inventory", label: "Stock", icon: Boxes },
  { to: "/orders", label: "Orders", icon: ReceiptText },
  { to: "/reports", label: "Reports", icon: ChartNoAxesCombined },
  { to: "/account", label: "Account", icon: UserRound },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return <nav className="rss-mobile-nav" aria-label="Mobile navigation"><ul className="mx-auto grid max-w-xl grid-cols-5">
    {tabs.map(({ to, label, icon: Icon }) => {
      const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
      return <li key={to}><Link to={to} className={`rss-mobile-nav-link ${active ? "is-active" : ""}`}><span className="rss-mobile-nav-icon"><Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.4 : 1.8} /></span><span>{label}</span></Link></li>;
    })}
  </ul></nav>;
}
