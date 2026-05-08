import { io } from "socket.io-client";

const socket = io("https://prep-to-place.onrender.com", {
  autoConnect: false,
});

export default socket;
