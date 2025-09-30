import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function useSocket() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io(import.meta.env.VITE_BACKEND_URL);
    setSocket(s);
    return () => s.disconnect();
  }, []);

  return socket;
}
