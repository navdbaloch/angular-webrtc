import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import RecordRTC from 'recordrtc';

@Component({
  selector: 'app-video-recorder',
  templateUrl: './video-recorder.component.html',
  styleUrls: ['./video-recorder.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class VideoRecorderComponent implements OnInit {
  @ViewChild('video') video!: ElementRef;
  @ViewChild('videoPlayer') videoPlayer!: ElementRef;

  private recordRTC: any;
  private stream!: MediaStream;
  public isRecording = false;
  public minutes: number = 0;
  public seconds: number = 0;
  private timerInterval: any;
  public recordedBlob!: Blob;

  constructor() { }

  ngOnInit(): void { }

  startRecording() {
    this.isRecording = true;
    this.minutes = 0;
    this.seconds = 0;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        this.stream = stream;
        this.video.nativeElement.srcObject = stream;
        this.video.nativeElement.muted = true;
        this.video.nativeElement.play();

        this.recordRTC = new RecordRTC(stream, {
          type: 'video'
        });

        this.recordRTC.startRecording();

        this.startTimer();
      })
      .catch(err => {
        console.error('Error accessing camera or microphone', err);
      });
  }

  stopRecording() {
    this.recordRTC.stopRecording(() => {
      this.recordedBlob = this.recordRTC.getBlob();
      this.videoPlayer.nativeElement.src = URL.createObjectURL(this.recordedBlob);
      this.videoPlayer.nativeElement.play();

      this.stream.getTracks().forEach(track => track.stop());
      this.video.nativeElement.srcObject = null;

      this.isRecording = false;
      clearInterval(this.timerInterval);
    });
  }

  download() {
    this.recordRTC.save('video-recording.mp4');
  }

  private startTimer() {
    this.timerInterval = setInterval(() => {
      this.seconds++;
      if (this.seconds === 60) {
        this.seconds = 0;
        this.minutes++;
      }
    }, 1000);
  }
}
