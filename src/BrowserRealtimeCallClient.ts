export type RealtimeCallMedia = 'audio' | 'video'
export type RealtimeCallSignal = Readonly<{
  sequence: number
  type: 'offer' | 'answer' | 'ice-candidate'
  payload: string
}>

export type BrowserRealtimeCallSession = Readonly<{
  callId: string
  localStream: MediaStream
  remoteStream: MediaStream
  end(): Promise<void>
}>

export type BrowserRealtimeCallTransport<Conversation> = Readonly<{
  getIceServers(conversation: Conversation): Promise<readonly RTCIceServer[]>
  startCall(input: Readonly<{ conversation: Conversation; media: readonly RealtimeCallMedia[] }>): Promise<Readonly<{ callId: string }>>
  postSignal(input: Readonly<{ conversation: Conversation; callId: string; signal: RealtimeCallSignal }>): Promise<void>
  listSignals(input: Readonly<{ conversation: Conversation; callId: string; afterSequence: number }>): Promise<readonly RealtimeCallSignal[]>
  endCall(input: Readonly<{ conversation: Conversation; callId: string }>): Promise<void>
}>

export type BrowserRealtimeCallDependencies<Conversation> = Readonly<{
  transport: BrowserRealtimeCallTransport<Conversation>
  getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>
  createPeerConnection?: (configuration: RTCConfiguration) => RTCPeerConnection
  createMediaStream?: () => MediaStream
  schedulePoll?: (callback: () => void, delayMs: number) => unknown
}>

/**
 * Product-neutral WebRTC browser engine. Product BFF adapters own call
 * authorization, ICE issuance and opaque signaling persistence; this engine
 * never receives a private destination or sends media through the BFF.
 */
export function createBrowserRealtimeCallClient<Conversation>(dependencies: BrowserRealtimeCallDependencies<Conversation>) {
  const getUserMedia = dependencies.getUserMedia ?? (constraints => navigator.mediaDevices.getUserMedia(constraints))
  const createPeerConnection = dependencies.createPeerConnection ?? (configuration => new RTCPeerConnection(configuration))
  const createMediaStream = dependencies.createMediaStream ?? (() => new MediaStream())
  const schedulePoll = dependencies.schedulePoll ?? ((callback, delayMs) => globalThis.setTimeout(callback, delayMs))

  async function connect(input: Readonly<{
    conversation: Conversation
    callId: string
    media: readonly RealtimeCallMedia[]
    initiator: boolean
  }>): Promise<BrowserRealtimeCallSession> {
    const iceServers = await dependencies.transport.getIceServers(input.conversation)
    const peer = createPeerConnection({ iceServers: [...iceServers] })
    const localStream = await getUserMedia({ audio: input.media.includes('audio'), video: input.media.includes('video') })
    const remoteStream = createMediaStream()
    for (const track of localStream.getTracks()) peer.addTrack(track, localStream)
    let nextSequence = 1
    let lastReadSequence = 0
    let ended = false
    peer.ontrack = event => {
      for (const track of event.streams[0]?.getTracks() ?? [event.track]) remoteStream.addTrack(track)
    }
    peer.onicecandidate = event => {
      if (!event.candidate || ended) return
      void dependencies.transport.postSignal({
        conversation: input.conversation,
        callId: input.callId,
        signal: { sequence: nextSequence++, type: 'ice-candidate', payload: JSON.stringify(event.candidate.toJSON()) },
      })
    }
    async function applySignals() {
      const signals = await dependencies.transport.listSignals({
        conversation: input.conversation, callId: input.callId, afterSequence: lastReadSequence,
      })
      for (const signal of signals) {
        lastReadSequence = Math.max(lastReadSequence, signal.sequence)
        nextSequence = Math.max(nextSequence, signal.sequence + 1)
        if (signal.type === 'ice-candidate') await peer.addIceCandidate(JSON.parse(signal.payload))
        else if (signal.type === 'offer' && !input.initiator) {
          await peer.setRemoteDescription(JSON.parse(signal.payload))
          const answer = await peer.createAnswer()
          await peer.setLocalDescription(answer)
          await dependencies.transport.postSignal({
            conversation: input.conversation, callId: input.callId,
            signal: { sequence: nextSequence++, type: 'answer', payload: JSON.stringify(answer) },
          })
        } else if (signal.type === 'answer' && input.initiator) {
          await peer.setRemoteDescription(JSON.parse(signal.payload))
        }
      }
    }
    if (input.initiator) {
      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      await dependencies.transport.postSignal({
        conversation: input.conversation, callId: input.callId,
        signal: { sequence: nextSequence++, type: 'offer', payload: JSON.stringify(offer) },
      })
    } else await applySignals()
    const poll = async () => {
      if (ended) return
      try { await applySignals() } finally { if (!ended) schedulePoll(() => void poll(), 750) }
    }
    schedulePoll(() => void poll(), 250)
    return {
      callId: input.callId,
      localStream,
      remoteStream,
      async end() {
        ended = true
        for (const track of localStream.getTracks()) track.stop()
        peer.close()
        await dependencies.transport.endCall({ conversation: input.conversation, callId: input.callId })
      },
    }
  }

  return {
    async start(input: Readonly<{ conversation: Conversation; media: readonly RealtimeCallMedia[] }>) {
      const { callId } = await dependencies.transport.startCall(input)
      return connect({ ...input, callId, initiator: true })
    },
    accept(input: Readonly<{ conversation: Conversation; callId: string; media: readonly RealtimeCallMedia[] }>) {
      return connect({ ...input, initiator: false })
    },
    join(input: Readonly<{ conversation: Conversation; callId: string; media: readonly RealtimeCallMedia[]; initiator: boolean }>) {
      return connect(input)
    },
  }
}
