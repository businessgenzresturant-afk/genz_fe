import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";
import { apiClient } from "../utils/api.js";
import { showNotification } from "../utils/browserNotifications.js";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://127.0.0.1:5000";

const AdminOrdersSocketContext = createContext(null);

async function seedOrderStatusMap(token, map) {
  try {
    const { data } = await apiClient.get("/api/orders", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const list = Array.isArray(data) ? data : [];
    for (const o of list) {
      if (o?._id != null) {
        map.set(String(o._id), o.status || "Confirmed");
      }
    }
  } catch {
    /* ignore */
  }
}

/**
 * Single dashboard socket for logged-in admins: desktop + sound alerts on any page,
 * while {@link src/pages/admin/Dashboard.jsx} attaches the same socket for live list updates.
 */
export function AdminOrdersSocketProvider({ children }) {
  const { token, isAdmin, authReady } = useAuth();
  const [socket, setSocket] = useState(null);
  const statusMapRef = useRef(new Map());

  useEffect(() => {
    if (!authReady || !token || !isAdmin) {
      setSocket((prev) => {
        if (prev) prev.disconnect();
        return null;
      });
      statusMapRef.current = new Map();
      return;
    }

    const statusMap = statusMapRef.current;
    void seedOrderStatusMap(token, statusMap);

    const s = io(SOCKET_URL);
    s.emit("join-dashboard");

    s.on("new-order", (order) => {
      if (order?._id != null) {
        statusMap.set(String(order._id), order.status || "Confirmed");
      }
      if (order) {
        const label = order.orderNo ? `#${order.orderNo}` : "New order";
        const total = order.total != null ? `₹${order.total}` : "";
        showNotification("New order", {
          body: [label, total].filter(Boolean).join(" · "),
          tag: `genz-new-${order._id}`,
          sound: "new-order",
        });
      }
    });

    s.on("order-updated", (order) => {
      if (!order?._id) return;
      const id = String(order._id);
      const newStatus = order.status || "Confirmed";
      const prev = statusMap.get(id);
      statusMap.set(id, newStatus);
      if (prev !== undefined && prev !== newStatus) {
        showNotification(`Order ${order.orderNo || id}`, {
          body: `Status: ${newStatus}`,
          tag: `genz-upd-${id}-${newStatus}`,
          sound: "order-status",
        });
      }
    });

    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [authReady, token, isAdmin]);

  return (
    <AdminOrdersSocketContext.Provider value={socket}>
      {children}
    </AdminOrdersSocketContext.Provider>
  );
}

export function useAdminOrdersSocket() {
  return useContext(AdminOrdersSocketContext);
}
