<template>
  <div class="home">
    <video id="webcam-video" height="360" width="480"></video>
    <div id="chart-container">
      <canvas id="chart"></canvas>
    </div>
  </div>
</template>

<script>
import path from 'path'
import Chart from 'chart.js'
import * as tf from '@tensorflow/tfjs'
import * as faceapi from 'face-api.js'

faceapi.env.monkeyPatch({
  Canvas: HTMLCanvasElement,
  Image: HTMLImageElement,
  ImageData: ImageData,
  Video: HTMLVideoElement,
  createCanvasElement: () => document.createElement('canvas'),
  createImageElement: () => document.createElement('img')
})

export default {
  data () {
    return {
      chart: null,
      video: null,
      stream: null,
      face: null,
      brightness: [],
      heartBeat: []
    }
  },
  created: async function () {
    const mp = path.join(__static, 'models') // eslint-disable-line no-undef
    await faceapi.nets.tinyFaceDetector.loadFromDisk(mp)
    await faceapi.nets.faceLandmark68TinyNet.loadFromDisk(mp)

    setInterval(() => {
      if (this.stream !== null) {
        this.detectFace()
      }
    }, 500)

    setInterval(() => {
      if (this.stream !== null) {
        this.brightness.push(this.getBrightness())
        if (this.brightness.length > 8) {
          this.brightness.shift()
          const hb = this.getHeartBeat(this.brightness)
          this.heartBeat.push(hb)
          let chartData = this.chart.data.datasets[0].data
          if (chartData.length > 100) {
            chartData.shift()
          }
          chartData.push(hb)
          this.chart.update()
        }
      }
    }, 100)
  },
  mounted: async function () {
    this.video = document.querySelector('#webcam-video')
    this.chart = new Chart(document.querySelector('#chart').getContext('2d'), {
      type: 'line',
      data: {
        labels: Array(100),
        datasets: [{
          backgroundColor: 'rgba(45, 49, 171, 0.5)',
          borderColor: 'rgba(45, 49, 171, 0.3)',
          fill: 'bottom',
          data: []
        }]
      },
      options: {
        legend: {
          display: false
        },
        layout: {
          padding: {
            top: 0,
            left: 0,
            bottom: 0,
            right: 0
          }
        },
        title: {
          display: true,
          text: 'Heart beat',
          fontSize: 16
        },
        responsive: true,
        maintainAspectRatio: false,
        tooltips: { enabled: false },
        hover: { mode: null },
        scales: {
          xAxes: [{
            display: false
          }],
          yAxes: [{
            ticks: {
              min: -3,
              max: 3
            }
          }]
        }
      }
    })

    navigator.mediaDevices.getUserMedia({
      video: true
    }).then((stream) => {
      this.video.srcObject = stream
      this.video.play()
      this.stream = stream
    }).catch((e) => {
      alert('could not connect stream')
    })
  },
  methods: {
    sum: function (array) {
      return array.reduce((a, b) => a + b)
    },
    getHeartBeat: function (array) {
      return 2 * this.sum(array.slice(-6, -2)) - this.sum(array.slice(-8))
    },
    getBrightness: function () {
      return tf.tidy(() => {
        let img = tf.browser.fromPixels(this.video).cast('float32')
        let xCenter = this.video.width / 2
        let yCenter = this.video.height / 2
        if (this.face !== null) {
          xCenter = parseInt(this.face.x + this.face.width / 2)
          yCenter = parseInt(this.face.y + this.face.height / 2)
        }
        let cropSize = [60, 60]
        let channel = 1
        return img.slice(
          [yCenter - cropSize[0] / 2, xCenter - cropSize[1] / 2, channel],
          [cropSize[0], cropSize[1], 1]
        ).flatten().mean().dataSync()[0]
      })
    },
    detectFace: async function () {
      let faces = await faceapi.tinyFaceDetector(this.video)
      if (faces.length > 0) {
        this.face = faces[0].forSize(
          this.video.width,
          this.video.height
        ).box
      }
    }
  }
}
</script>

<style lang="scss">

html, body {
  height: 100%;
  margin: 0;
  background: #000000;
}

video {
  width: 100%;
  height: 100%;
}

#chart-container {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  height: 30%;
}

#chart {
  width: 100%;
  height: 100%;
}

</style>
