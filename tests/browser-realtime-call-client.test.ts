// Flow contract: a shared browser audio/video call uses only server-issued ICE plus opaque SDP/ICE signaling; media remains in the browser and end closes local tracks before transport readback.
import { describe, expect, it, vi } from 'vitest'
import { createBrowserRealtimeCallClient } from '../src/BrowserRealtimeCallClient.js'

describe('shared browser realtime call client', () => {
  it('uses server-issued ICE, attaches audio/video tracks and publishes only opaque signaling', async () => {
    const stop = vi.fn()
    const localStream = { getTracks: () => [{ kind: 'audio', stop }, { kind: 'video', stop }] } as unknown as MediaStream
    const peer = {
      addTrack: vi.fn(), createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'opaque-offer' }),
      setLocalDescription: vi.fn(), close: vi.fn(), onicecandidate: null, ontrack: null,
    }
    const transport = {
      getIceServers: vi.fn().mockResolvedValue([{ urls: ['turn:turn.example'] }]),
      startCall: vi.fn().mockResolvedValue({ callId: 'call-1' }),
      postSignal: vi.fn().mockResolvedValue(undefined), listSignals: vi.fn().mockResolvedValue([]), endCall: vi.fn().mockResolvedValue(undefined),
    }
    const client = createBrowserRealtimeCallClient({
      transport,
      getUserMedia: vi.fn().mockResolvedValue(localStream),
      createPeerConnection: vi.fn(() => peer as unknown as RTCPeerConnection),
      createMediaStream: vi.fn(() => ({ addTrack: vi.fn() }) as unknown as MediaStream),
    })

    const session = await client.start({ conversation: { threadId: 'thread-1' }, media: ['audio', 'video'] })

    expect(transport.getIceServers).toHaveBeenCalledWith({ threadId: 'thread-1' })
    expect(peer.addTrack).toHaveBeenCalledTimes(2)
    expect(transport.postSignal).toHaveBeenCalledWith(expect.objectContaining({
      callId: 'call-1', signal: { sequence: 1, type: 'offer', payload: '{"type":"offer","sdp":"opaque-offer"}' },
    }))
    expect(JSON.stringify(transport.postSignal.mock.calls)).not.toContain('turn.example')
    await session.end()
    expect(stop).toHaveBeenCalledTimes(2)
    expect(transport.endCall).toHaveBeenCalledWith({ conversation: { threadId: 'thread-1' }, callId: 'call-1' })
  })

  it('answers after the highest received signal sequence', async () => {
    const peer = {
      addTrack: vi.fn(), setRemoteDescription: vi.fn(), createAnswer: vi.fn().mockResolvedValue({ type: 'answer', sdp: 'opaque-answer' }),
      setLocalDescription: vi.fn(), addIceCandidate: vi.fn(), close: vi.fn(), onicecandidate: null, ontrack: null,
    }
    const transport = {
      getIceServers: vi.fn().mockResolvedValue([]), startCall: vi.fn(), endCall: vi.fn(), postSignal: vi.fn().mockResolvedValue(undefined),
      listSignals: vi.fn().mockResolvedValue([{ sequence: 7, type: 'offer', payload: '{"type":"offer","sdp":"opaque-offer"}' }]),
    }
    const client = createBrowserRealtimeCallClient({
      transport, getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [] } as unknown as MediaStream),
      createPeerConnection: vi.fn(() => peer as unknown as RTCPeerConnection),
      createMediaStream: vi.fn(() => ({ addTrack: vi.fn() }) as unknown as MediaStream),
    })
    await client.accept({ conversation: { threadId: 'thread-1' }, callId: 'call-1', media: ['audio'] })
    expect(transport.postSignal).toHaveBeenCalledWith(expect.objectContaining({
      signal: { sequence: 8, type: 'answer', payload: '{"type":"answer","sdp":"opaque-answer"}' },
    }))
  })

  it('joins an already-authorized caller session without creating a second call', async () => {
    const peer = {
      addTrack: vi.fn(), createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'opaque-offer' }),
      setLocalDescription: vi.fn(), close: vi.fn(), onicecandidate: null, ontrack: null,
    }
    const transport = {
      getIceServers: vi.fn().mockResolvedValue([]), startCall: vi.fn(), endCall: vi.fn(),
      postSignal: vi.fn().mockResolvedValue(undefined), listSignals: vi.fn().mockResolvedValue([]),
    }
    const client = createBrowserRealtimeCallClient({
      transport, getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [] } as unknown as MediaStream),
      createPeerConnection: vi.fn(() => peer as unknown as RTCPeerConnection),
      createMediaStream: vi.fn(() => ({ addTrack: vi.fn() }) as unknown as MediaStream),
    })

    await client.join({ conversation: 'existing-call', callId: 'call-1', media: ['audio', 'video'], initiator: true })

    expect(transport.startCall).not.toHaveBeenCalled()
    expect(transport.postSignal).toHaveBeenCalledWith(expect.objectContaining({ callId: 'call-1', signal: expect.objectContaining({ type: 'offer' }) }))
  })
})
