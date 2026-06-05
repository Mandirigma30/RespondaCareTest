import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Bell, ShieldAlert, CheckCircle, Info, Calendar } from "lucide-react";

interface NotificationItem {
  id: string;
  type: "warning" | "success" | "info";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export default function NotificationsPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      type: "warning",
      title: "Active Weather Warning: Heavy Rain",
      description: "Severe tropical system incoming. Residents in low-lying zones of Barangay 45 are advised to monitor evacuation updates and prepare emergency packages.",
      time: "2 hours ago",
      read: false,
    },
    {
      id: "2",
      type: "success",
      title: "Health ID Card Decryption Verification",
      description: "Your health records were accessed and verified securely under RA 10173 compliance during the recent consultation.",
      time: "Yesterday",
      read: true,
    },
    {
      id: "3",
      type: "info",
      title: "Barangay Health Center Consultation Shift",
      description: "Dr. Chen's consult shifts for high-risk cardiac patients are scheduled for this Saturday, 08:00 - 12:00 at the main clinic desk.",
      time: "2 days ago",
      read: true,
    },
  ]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "warning":
        return <ShieldAlert className="h-5 w-5 text-red-400" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBorderColor = (type: NotificationItem["type"]) => {
    switch (type) {
      case "warning":
        return "border-l-red-500";
      case "success":
        return "border-l-green-500";
      case "info":
        return "border-l-blue-500";
    }
  };

  return (
    <div ref={ref} className="bg-[#0f1115] min-h-full p-8 text-white">
      <header data-animate className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Bell className="h-8 w-8 text-[#8b1a1a]" />
            Notifications
          </h1>
          <p className="text-[#9ca3af] mt-2">Updates from Barangay Health Center and Emergency Services.</p>
        </div>
        <button
          onClick={markAllRead}
          className="text-xs text-[#8b1a1a] hover:text-[#a01e1e] font-bold transition-colors cursor-pointer border border-[#30363d] rounded-lg px-3 py-2 bg-[#1a1d23]"
        >
          Mark all as read
        </button>
      </header>

      <div className="space-y-4 max-w-4xl">
        {notifications.map((n) => (
          <article
            key={n.id}
            data-animate
            className={`bg-[#1a1d23] rounded-2xl border border-gray-800 border-l-4 ${getBorderColor(
              n.type
            )} p-5 flex items-start gap-4 transition-all hover:bg-white/[0.01] ${!n.read ? "bg-[#1a1d23]/80 shadow-md" : "opacity-80"}`}
          >
            <div className={`p-2 rounded-xl bg-gray-800/50 flex-shrink-0`}>{getIcon(n.type)}</div>
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <h3 className={`font-bold text-white text-base ${!n.read ? "" : "text-gray-300"}`}>
                  {n.title}
                  {!n.read && (
                    <span className="ml-2 inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </h3>
                <span className="text-xs text-[#8b949e] font-mono flex items-center gap-1.5 flex-shrink-0 pl-4">
                  <Calendar className="h-3 w-3" />
                  {n.time}
                </span>
              </div>
              <p className="text-xs text-[#9ca3af] mt-2 leading-relaxed">{n.description}</p>
            </div>
          </article>
        ))}

        {notifications.length === 0 && (
          <div className="text-center py-12 bg-[#1a1d23] rounded-2xl border border-gray-800">
            <Bell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">All caught up!</p>
            <p className="text-gray-500 text-xs mt-1">No new notifications from Barangay 45.</p>
          </div>
        )}
      </div>
    </div>
  );
}
