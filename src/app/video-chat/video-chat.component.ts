import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { WebrtcService } from '../webrtc.service';


@Component({
  selector: 'app-video-chat',
  template: `
    <div class="video-container">
    <video #localVideo autoplay></video>
    <div class="overlay">
      <span>You</span>
    </div>
  </div>
  <div class="video-container">
    <video #remoteVideo autoplay></video>
    <div class="overlay">
      <span>You the Caller :) </span>
    </div>
  </div>
  <button (click)="startCall()">Start Call</button>
  `,
  styles: [`
   .video-container {
      position: relative;
      display: inline-block;
    }

    video {
      width: 100%;
      height: auto;
    }

    .overlay {
      position: absolute;
      top: 10px;
      left: 10px;
      color: red;
      background-color: rgba(0, 0, 0, 0.5);
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 16px;
    }

  `]
})
export class VideoChatComponent implements OnInit {
  @ViewChild('localVideo') localVideo!: ElementRef;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef;

  constructor(private webrtcService: WebrtcService) { }

  async ngOnInit() {
    const localStream = await this.webrtcService.getMediaStream();
    this.localVideo.nativeElement.srcObject = localStream;
  }

  async startCall() {
    await this.webrtcService.createOffer();

    this.webrtcService.peerConnection.ontrack = (event: RTCTrackEvent) => {
      this.remoteVideo.nativeElement.srcObject = event.streams[0];
    };
  }
}
