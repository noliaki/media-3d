import { MutationTree, ActionTree, GetterTree } from 'vuex'
import io from 'socket.io-client'
import { Status } from '@@/common/Status'
import { signageEvent, Responce } from '@@/common/EventName'

// 😜
let signageIo: SocketIOClient.Socket

export interface State {
  socketId?: string
  roomName?: string
  status: Status
  stream?: MediaStream
  selectedFrameIndex?: number
  paused: boolean
  decided: boolean
  animationFileName?: string
  videoScreenCanvas: HTMLCanvasElement | null
}

export const state: () => State = (): State => ({
  socketId: undefined,
  roomName: undefined,
  stream: undefined,
  status: Status.SignageReady,
  selectedFrameIndex: undefined,
  paused: false,
  decided: false,
  animationFileName: undefined,
  videoScreenCanvas: null
})

export const getters: GetterTree<State, null> = {
  scene({ status }): string {
    switch (status) {
      case Status.SignageReady:
        return 'TheQRcode'

      case Status.ControllerReady:
      case Status.Streaming:
      case Status.Shot:
        return 'TheStream'

      case Status.ImageGenerating:
        return 'TheGenerating'

      case Status.imageGenerated:
        return 'TheAnimationDisplay'

      default:
        return 'TheWaiting'
    }
  }
}

export const mutations: MutationTree<State> = {
  identified(state: State, data: Responce): void {
    state.socketId = data.socketId
    state.roomName = data.roomName
    state.status = data.status
  },
  updatedStatus(state: State, data: Responce): void {
    if (data.status === Status.Streaming) {
      state.paused = false
    }

    if (data.fileName) {
      console.log(data.fileName)
      state.animationFileName = data.fileName
    }

    state.roomName = data.roomName
    state.status = data.status
  },
  changeFrameIndex(state: State, selectedIndex: number | undefined): void {
    state.selectedFrameIndex = selectedIndex
  },
  pauseVideo(state: State): void {
    state.paused = true
  },
  playVideo(state: State): void {
    state.paused = false
  },
  decided(state: State): void {
    state.decided = true
  },
  reset(state: State): void {
    state.roomName = undefined
    state.stream = undefined
    state.status = Status.SignageReady
    state.selectedFrameIndex = undefined
    state.paused = false
    state.decided = false
    state.animationFileName = undefined
    // state.videoImageData = null
  },
  setVideoImageData(state: State, videoEl: HTMLVideoElement): void {
    const canvas: HTMLCanvasElement = document.createElement('canvas')
    canvas.width = videoEl.videoWidth
    canvas.height = videoEl.videoHeight
    const context: CanvasRenderingContext2D | null = canvas.getContext('2d')

    if (!context) {
      return
    }

    context.drawImage(videoEl, 0, 0)

    state.videoScreenCanvas = canvas
  }
}

export const actions: ActionTree<State, null> = {
  initIo({ commit }): void {
    signageIo = io('/signage')

    signageIo
      .on(
        signageEvent.identified,
        (data: Responce): void => {
          commit('identified', data)
        }
      )
      .on(
        signageEvent.updatedStatus,
        (data: Responce): void => {
          console.log(signageEvent.updatedStatus)
          console.log(data)
          commit('updatedStatus', data)
        }
      )
      .on(
        signageEvent.changeFrame,
        (data: Responce): void => {
          console.log(data)
          commit('changeFrameIndex', data.selectedIndex)
        }
      )
      .on(
        signageEvent.shot,
        (data: Responce): void => {
          console.log(data)
          commit('pauseVideo')
        }
      )
      .on(
        signageEvent.retake,
        (data: Responce): void => {
          console.log(signageEvent.retake)
          console.log(data)
          commit('playVideo')
        }
      )
      .on(
        signageEvent.decided,
        (data: Responce): void => {
          console.log(signageEvent.decided)
          console.log(data)
          commit('decided')
        }
      )
  },
  startedStream(): void {
    signageIo.emit(signageEvent.startedStreaming)
  },
  pausedStream(): void {
    signageIo.emit(signageEvent.pausedStreaming)
  },
  startGenerating(): void {
    signageIo.emit(signageEvent.startGenerating)
  },
  finishGenerating(context: any, res: Responce): void {
    signageIo.emit(signageEvent.doneGenerated, res)
  },
  reset({ commit }): void {
    commit('reset')
    signageIo.emit(signageEvent.joinRoom)
  }
}
