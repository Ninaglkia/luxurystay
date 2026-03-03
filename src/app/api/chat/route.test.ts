/**
 * Tests for POST /api/chat route handler
 *
 * TDD RED phase: These tests are written before the implementation.
 * They verify the expected behavior of the streaming chat endpoint.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the AI SDK modules before importing the route
vi.mock('ai', () => ({
  streamText: vi.fn(),
  convertToModelMessages: vi.fn().mockResolvedValue([]),
}))

vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn().mockReturnValue({ type: 'anthropic-model', modelId: 'claude-haiku-4-5' }),
}))

describe('POST /api/chat route handler', () => {
  let POST: (req: Request) => Promise<Response>
  let maxDuration: number
  let streamTextMock: ReturnType<typeof vi.fn>
  let convertToModelMessagesMock: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    // Mock streamText to return an object with toUIMessageStreamResponse
    const { streamText, convertToModelMessages } = await import('ai')
    streamTextMock = streamText as ReturnType<typeof vi.fn>
    convertToModelMessagesMock = convertToModelMessages as ReturnType<typeof vi.fn>

    // Default mock: returns a streaming-like response
    streamTextMock.mockReturnValue({
      toUIMessageStreamResponse: vi.fn().mockReturnValue(
        new Response('data: hello\n\n', {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      ),
    })

    // Re-import to get fresh module with mocks applied
    const module = await import('./route')
    POST = module.POST
    maxDuration = module.maxDuration
  })

  describe('maxDuration export', () => {
    it('exports maxDuration = 30 for Vercel timeout configuration', () => {
      expect(maxDuration).toBe(30)
    })
  })

  describe('valid UIMessage array', () => {
    it('returns HTTP 200 with streaming response for valid messages', async () => {
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              id: 'test-1',
              role: 'user',
              parts: [{ type: 'text', text: 'Hello' }],
            },
          ],
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })

    it('calls streamText with the converted messages', async () => {
      const messages = [
        { id: 'test-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
      ]
      const convertedMessages = [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }]
      convertToModelMessagesMock.mockResolvedValue(convertedMessages)

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })

      await POST(request)

      expect(streamTextMock).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: convertedMessages,
          maxOutputTokens: 500,
        })
      )
    })

    it('calls toUIMessageStreamResponse() (not toDataStreamResponse)', async () => {
      const toUIMessageStreamResponseMock = vi.fn().mockReturnValue(new Response('', { status: 200 }))
      streamTextMock.mockReturnValue({
        toUIMessageStreamResponse: toUIMessageStreamResponseMock,
      })

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hi' }] }],
        }),
      })

      await POST(request)

      expect(toUIMessageStreamResponseMock).toHaveBeenCalledOnce()
    })
  })

  describe('empty messages array', () => {
    it('returns a streaming response for empty messages array', async () => {
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })
  })

  describe('invalid request body', () => {
    it('returns 400 for malformed JSON body', async () => {
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'this is not valid JSON {',
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('returns 400 when messages is not an array', async () => {
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: 'not an array' }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('returns 400 when messages field is missing', async () => {
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wrongField: [] }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })
})
