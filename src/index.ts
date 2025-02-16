import { WebSocketServer, WebSocket } from "ws";

const wsclient = new WebSocketServer({ port: 8080 });

const roomsServer = new Map<string, Set<WebSocket>>();
const socketToId = new Map<WebSocket, string>();
wsclient.on("connection", (clientSocket) => {
   
   
    clientSocket.on("message", (msg) => {
        const parsedMessage = JSON.parse(msg.toString());
/*----> */  if (parsedMessage.type === "join") {
            if (!roomsServer.has(parsedMessage.payload.roomId))
            { roomsServer.set(parsedMessage.payload.roomId, new Set());

            }
            roomsServer.get(parsedMessage.payload.roomId)?.add(clientSocket);
              socketToId.set(clientSocket, parsedMessage.payload.roomId);
                clientSocket.send(`you are connected to ${parsedMessage.payload.roomId} room`);
        }
/*----> */ if (parsedMessage.type === "chat") {
            const roomId = socketToId.get(clientSocket);
            if (!roomId) {
                clientSocket.send("join a room first");
                return;
            }
            const roomSockets = roomsServer.get(roomId);
            roomSockets?.forEach((socket) => {
                if (socket !== clientSocket) {
                    socket.send(parsedMessage.payload.message);
                }
            })
        }


/*----> */   clientSocket.on("close", () => {
            const roomId = socketToId.get(clientSocket);
            if (roomId) {
                // Remove socket from room
                const room = roomsServer.get(roomId);
                room?.delete(clientSocket);

                // If room is empty remove it from roomsServer
                if (room?.size === 0) {
                    roomsServer.delete(roomId);
                } else {
                    // Notify other users in the room
                    room?.forEach((socket) => {
                        socket.send(JSON.stringify({
                            type: "system",
                            payload: {
                                message: "A user has left the room"
                            }
                        }));
                    });
                }

                // Remove socket from socketToId mapping
                socketToId.delete(clientSocket);
            }
        });
    })
})