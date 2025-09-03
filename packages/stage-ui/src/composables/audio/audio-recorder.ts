import type { MaybeRefOrGetter } from 'vue'

import { toWav } from '@proj-airi/audio/encoding'
import { until } from '@vueuse/core'
import { ref, shallowRef, toRef, watch } from 'vue'

export function useAudioRecorder(
  media: MaybeRefOrGetter<MediaStream | undefined>,
) {
  const mediaRef = toRef(media)
  const recording = shallowRef<Blob>()
  const isRecording = ref(false)

  // Audio processing variables
  const audioContext = ref<AudioContext>()
  const sourceNode = ref<MediaStreamAudioSourceNode>()
  const processorNode = ref<ScriptProcessorNode>() // Using ScriptProcessorNode for wider compatibility
  const audioData = ref<Float32Array<ArrayBufferLike>[]>([])
  const mediaRecorder = ref<MediaRecorder | undefined>()
  const mediaChunks = ref<Blob[]>([])

  const onStopRecordHooks = ref<Array<(recording: Blob | undefined) => Promise<void>>>([])

  function onStopRecord(callback: (recording: Blob | undefined) => Promise<void>) {
    onStopRecordHooks.value.push(callback)
  }

  // Convert audio buffers to a single WAV blob
  function encodeWAV(samples: Float32Array[], sampleRate: number): Blob {
    if (samples.length === 0)
      return new Blob([], { type: 'audio/wav' })

    // Concatenate all Float32Array chunks into one
    const totalLength = samples.reduce((acc, cur) => acc + cur.length, 0)
    const merged = new Float32Array(totalLength)
    let offset = 0
    for (const chunk of samples) {
      merged.set(chunk, offset)
      offset += chunk.length
    }

    const view = toWav(merged.buffer, sampleRate)
    return new Blob([view], { type: 'audio/wav' })
  }

  async function startRecord() {
    await until(mediaRef).toBeTruthy()
    if (!mediaRef.value) {
      return
    }

    // Reset recording state
    recording.value = undefined
    audioData.value = []
    isRecording.value = true

    try {
      // Prefer MediaRecorder if available (produces playable audio directly)
      if (typeof window !== 'undefined' && 'MediaRecorder' in window) {
        mediaChunks.value = []
        const preferredTypes = [
          'audio/webm;codecs=opus',
          'audio/ogg;codecs=opus',
          'audio/webm',
          'audio/ogg',
        ]
        const mimeType = preferredTypes.find(type => (window as any).MediaRecorder.isTypeSupported?.(type))
        mediaRecorder.value = mimeType
          ? new MediaRecorder(mediaRef.value!, { mimeType })
          : new MediaRecorder(mediaRef.value!)

        mediaRecorder.value.ondataavailable = (e) => {
          if (e.data && e.data.size > 0)
            mediaChunks.value.push(e.data)
        }
        mediaRecorder.value.start()
        // eslint-disable-next-line no-console
        console.debug('[录音] 已使用 MediaRecorder 开始录音，编码格式=', mimeType || mediaRecorder.value.mimeType)
        return
      }

      // Create audio context and nodes
      audioContext.value = new AudioContext()
      if (audioContext.value.state === 'suspended') {
        try {
          await audioContext.value.resume()
        }
        catch (e) {
          console.warn('AudioContext resume failed, will continue:', e)
        }
      }
      sourceNode.value = audioContext.value.createMediaStreamSource(mediaRef.value)

      // Create script processor for audio processing
      processorNode.value = audioContext.value.createScriptProcessor(4096, 1, 1)

      // Process audio data
      processorNode.value.onaudioprocess = (e) => {
        if (isRecording.value) {
          const channelData = new Float32Array(e.inputBuffer.getChannelData(0))
          audioData.value.push(channelData)
        }
      }

      // Connect nodes
      sourceNode.value.connect(processorNode.value)
      processorNode.value.connect(audioContext.value.destination)
      // eslint-disable-next-line no-console
      console.debug('[录音] 已启动，采样率=', audioContext.value.sampleRate)
    }
    catch (error) {
      console.error('Error starting audio recording:', error)
      isRecording.value = false
    }
  }

  async function stopRecord() {
    if (!isRecording.value)
      return

    isRecording.value = false

    try {
      // If using MediaRecorder
      if (mediaRecorder.value) {
        const done = new Promise<Blob>((resolve) => {
          mediaRecorder.value!.onstop = () => {
            const blob = new Blob(mediaChunks.value, { type: mediaRecorder.value!.mimeType })
            resolve(blob)
          }
        })
        mediaRecorder.value.stop()
        recording.value = await done
        // Call hooks with the recording
        for (const hook of onStopRecordHooks.value) {
          await hook(recording.value)
        }
        mediaRecorder.value = undefined
        mediaChunks.value = []
        return
      }

      if (!audioContext.value)
        return

      // Disconnect and clean up audio nodes
      if (processorNode.value) {
        processorNode.value.disconnect()
        processorNode.value = undefined
      }

      if (sourceNode.value) {
        sourceNode.value.disconnect()
        sourceNode.value = undefined
      }

      // Create WAV from recorded data
      if (audioData.value.length > 0) {
        recording.value = encodeWAV(audioData.value, audioContext.value.sampleRate)
        // eslint-disable-next-line no-console
        console.debug('[录音] WAV 大小(字节)=', recording.value.size)

        // Call hooks with the recording
        for (const hook of onStopRecordHooks.value) {
          await hook(recording.value)
        }
      }
      else {
        recording.value = undefined
      }

      // Close audio context
      await audioContext.value.close()
      audioContext.value = undefined
    }
    catch (error) {
      console.error('Error stopping audio recording:', error)
    }

    return audioData.value
  }

  watch(mediaRef, () => {
    if (isRecording.value) {
      stopRecord().then(() => {
        if (mediaRef.value && mediaRef.value.active) {
          startRecord()
        }
      })
    }
  })

  return {
    startRecord,
    stopRecord,
    onStopRecord,
    recording,
    isRecording,
  }
}
