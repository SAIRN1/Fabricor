import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../App";
import { MapPin, Clock, CheckCircle, Phone, Navigation } from "lucide-react";

export default function InstallerView() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const { data: stops = [], isLoading } = useQuery({
    queryKey: ["/api/schedule", today],
    queryFn: () => fetch(`/api/schedule?date=${today}`, { credentials: "include" }).then(r => r.json()),
  });

  const STOP_COLORS: Record<string, string> = {
    template: "bg-blue-500/20 border-blue-500/30 text-blue-400",
    installation: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",
    measure: "bg-purple-500/20 border-purple-500/30 text-purple-400",
    service: "bg-amber-500/20 border-amber-500/30 text-amber-400",
    delivery: "bg-orange-500/20 border-orange-500/30 text-orange-400",
    sales: "bg-pink-500/20 border-pink-500/30 text-pink-400",
    follow_up: "bg-zinc-500/20 border-zinc-500/30 text-zinc-400",
  };

  const openDirections = (address: string) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
            <span className="text-black font-bold">{user?.name?.charAt(0)}</span>
          </div>
          <div>
            <div className="text-white font-bold">{user?.name}</div>
            <div className="text-zinc-500 text-xs">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
          </div>
        </div>

        <div className="text-zinc-400 text-xs uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>Today's Schedule</span>
          <span className="text-amber-400">{(stops as any[]).length} stops</span>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && (stops as any[]).length === 0 && (
          <div className="text-center py-16">
            <CheckCircle size={40} className="text-emerald-500 mx-auto mb-3" />
            <div className="text-white font-semibold text-lg">All clear today!</div>
            <div className="text-zinc-500 text-sm mt-1">No stops scheduled for today.</div>
          </div>
        )}

        <div className="space-y-3">
          {(stops as any[]).map((stop: any, i: number) => {
            const colorClass = STOP_COLORS[stop.stopType] || STOP_COLORS.template;
            const fullAddress = [stop.address, stop.city, stop.state].filter(Boolean).join(", ");
            return (
              <div key={stop.id} className="bg-[#0d0d14] border border-zinc-800/60 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 text-xs font-bold">{i + 1}</div>
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${colorClass}`}>
                      {stop.stopType?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                  </div>
                  {stop.scheduledTime && (
                    <div className="flex items-center gap-1 text-zinc-400 text-xs">
                      <Clock size={11} /> {stop.scheduledTime}
                    </div>
                  )}
                </div>

                <div className="text-white font-semibold mb-1">{stop.customerName || stop.jobName}</div>

                {fullAddress && (
                  <div className="flex items-start gap-1.5 text-zinc-400 text-sm mb-3">
                    <MapPin size={13} className="mt-0.5 flex-shrink-0" />
                    <span>{fullAddress}</span>
                  </div>
                )}

                {stop.notes && (
                  <div className="bg-zinc-900 rounded-lg px-3 py-2 text-zinc-400 text-xs mb-3">
                    {stop.notes}
                  </div>
                )}

                <div className="flex gap-2">
                  {fullAddress && (
                    <button onClick={() => openDirections(fullAddress)}
                      className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2.5 rounded-xl text-sm transition-colors">
                      <Navigation size={14} /> Directions
                    </button>
                  )}
                  {stop.customerPhone && (
                    <a href={`tel:${stop.customerPhone}`}
                      className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
                      <Phone size={14} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-zinc-700 text-xs mt-8">StoneDesk · {user?.shopName || "Your Shop"}</p>
      </div>
    </div>
  );
}
