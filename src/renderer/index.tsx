import React from 'react'
import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import Chart from 'chart.js'
import * as tf from '@tensorflow/tfjs'
import * as faceapi from 'face-api.js'

import '../../style/global'

const option = new faceapi.TinyFaceDetectorOptions()

const App: React.FC = () => {
  let chart: Chart
  let video: HTMLVideoElement
  const brightnessArray: number[] = []
  const heartBeatArray: number[] = []

  const sum = (array: number[]): number => {
    return array.reduce((a, b) => a + b)
  }

  const getBrightness = (video: HTMLVideoElement, face: any) => {
    return tf.tidy(() => {
      let img = tf.browser.fromPixels(video).cast('float32')
      let xCenter = video.width / 2
      let yCenter = video.height / 2
      if (face !== null) {
        xCenter = parseInt(face.x + face.width / 2)
        yCenter = parseInt(face.y + face.height / 2)
      }
      let cropSize = [60, 60]
      let channel = 1
      return img
        .slice(
          [yCenter - cropSize[0] / 2, xCenter - cropSize[1] / 2, channel],
          [cropSize[0], cropSize[1], 1]
        )
        .flatten()
        .mean()
        .dataSync()[0]
    })
  }

  useEffect(() => {
    const init = async () => {
      faceapi.env.monkeyPatch({
        Canvas: HTMLCanvasElement,
        Image: HTMLImageElement,
        ImageData: ImageData,
        Video: HTMLVideoElement,
        createCanvasElement: () => document.createElement('canvas'),
        createImageElement: () => document.createElement('img'),
      })

      await faceapi.nets.tinyFaceDetector.load('/models')
      await faceapi.nets.faceLandmark68TinyNet.load('/models')

      video = document.querySelector('#webcam-video') as HTMLVideoElement
      const context = (
        document.querySelector('#chart') as HTMLCanvasElement
      ).getContext('2d') as CanvasRenderingContext2D
      chart = new Chart(context, {
        type: 'line',
        data: {
          labels: Array(100),
          datasets: [
            {
              backgroundColor: 'rgba(45, 49, 171, 0.5)',
              borderColor: 'rgba(45, 49, 171, 0.3)',
              fill: 'bottom',
              data: [],
            },
          ],
        },
        options: {
          animation: {
            duration: 0,
          },
          legend: {
            display: false,
          },
          elements: {
            point: {
              radius: 0,
            },
          },
          layout: {
            padding: {
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
            },
          },
          responsive: true,
          maintainAspectRatio: false,
          tooltips: { enabled: false },
          scales: {
            xAxes: [
              {
                display: false,
              },
            ],
            yAxes: [
              {
                display: false,
              },
            ],
          },
        },
      })

      navigator.mediaDevices
        .getUserMedia({
          video: true,
        })
        .then((s) => {
          video.srcObject = s
          video.play()
        })
        .catch((e) => {
          console.log(e)
        })

      setInterval(async () => {
        if (
          video === undefined ||
          chart === undefined ||
          chart.data === undefined ||
          chart.data.datasets === undefined ||
          chart.data.datasets[0].data === undefined
        ) {
          return
        }

        let faces = await faceapi.detectAllFaces(video, option)
        if (faces.length < 1) {
          return
        }
        const face = faces[0].forSize(video.width, video.height).box

        brightnessArray.push(getBrightness(video, face))
        if (brightnessArray.length > 8) {
          brightnessArray.shift()
          const hb =
            2 * sum(brightnessArray.slice(-6, -2)) -
            sum(brightnessArray.slice(-8))
          heartBeatArray.push(hb)
          let chartData = chart.data.datasets[0].data
          chartData.push(hb)
          if (chartData.length > 100) {
            chartData.shift()
          }
          chart.update()
        }
      }, 100)
    }
    init()
  }, [])

  return (
    <>
      <video id="webcam-video" height="360" width="480" />
      <div id="chart-container">
        <canvas id="chart"></canvas>
      </div>
    </>
  )
}

createRoot(document.getElementById('root') as HTMLElement).render(<App />)
