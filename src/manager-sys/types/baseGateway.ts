import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';

export abstract class baseGateway implements OnGatewayConnection, OnGatewayDisconnect{
  @WebSocketServer()
  protected readonly server: Server;
  protected gatewaySettled: boolean;

  constructor() {
    this.gatewaySettled = false;
  }

  protected afterInit(server: Server) {
    this.gatewaySettled = true;
  }

  async handleConnection(client: Socket, ...args: any[]) {
    console.log(`[System] Client connected: ${client.id}`);
    try {
      // Intialize

    } catch(e) {
      console.log('try catch here');
      console.error(e);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    console.log(`[System] Client disconnected: ${client.id}`);
    try {

    } catch(e) {
      console.error(e);
      client.disconnect();
    }
  }
}
