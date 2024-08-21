import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebrtcService {
  private localStream!: MediaStream;
  public peerConnection: RTCPeerConnection;
  private remoteStream!: MediaStream;
  private signalingSocket: WebSocket;

  constructor() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' } // Example STUN server
      ]
    });

    this.peerConnection.onicecandidate = this.handleIceCandidate.bind(this);
    this.peerConnection.ontrack = this.handleTrack.bind(this);

    this.signalingSocket = new WebSocket('ws://localhost:8080');

    this.signalingSocket.onmessage = this.handleSignalingMessage.bind(this);
  }

  async getMediaStream() {
    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });
    return this.localStream;
  }

  async createOffer() {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.sendSignal({ type: 'offer', data: offer });
    return offer;
  }

  async createAnswer(offer: RTCSessionDescriptionInit) {
    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    this.sendSignal({ type: 'answer', data: answer });
    return answer;
  }

  async addAnswer(answer: RTCSessionDescriptionInit) {
    await this.peerConnection.setRemoteDescription(answer);
  }

  handleIceCandidate(event: RTCPeerConnectionIceEvent) {
    if (event.candidate) {
      this.sendSignal({ type: 'candidate', data: event.candidate });
    }
  }

  handleTrack(event: RTCTrackEvent) {
    this.remoteStream = event.streams[0];
  }

  handleSignalingMessage(event: MessageEvent) {
    try {
      // Check if the data is already in JSON format or needs to be converted
      if (typeof event.data === 'string') {
        const signal = JSON.parse(event.data);
  
        switch (signal.type) {
          case 'offer':
            this.createAnswer(signal.data);
            break;
          case 'answer':
            this.addAnswer(signal.data);
            break;
          case 'candidate':
            this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.data));
            break;
        }
      } else if (event.data instanceof Blob) {
        // If it's a Blob, handle accordingly
        event.data.text().then(text => {
          const signal = JSON.parse(text);
  
          switch (signal.type) {
            case 'offer':
              this.createAnswer(signal.data);
              break;
            case 'answer':
              this.addAnswer(signal.data);
              break;
            case 'candidate':
              this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.data));
              break;
          }
        });
      } else {
        console.error('Unknown WebSocket message format:', event.data);
      }
    } catch (error) {
      console.error('Failed to handle signaling message:', error);
    }
  }
  

  sendSignal(data: any) {
    this.signalingSocket.send(JSON.stringify(data));
  }
}
