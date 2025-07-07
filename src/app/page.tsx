"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, Bot, User, ExternalLink } from "lucide-react"

// Video Item Component
const VideoItem: React.FC<{ video: YouTubeVideo }> = ({ video }) => {
  const [thumbnailError, setThumbnailError] = useState(false)
  const [linkValid, setLinkValid] = useState<boolean | null>(null)
  const videoId = extractVideoId(video.url)
  
  // Validate the video link on mount
  useEffect(() => {
    const validateLink = async () => {
      if (videoId && isValidYouTubeVideoId(videoId)) {
        try {
          // Test if the video exists by checking thumbnail
          const img = new Image()
          img.onload = () => setLinkValid(true)
          img.onerror = () => setLinkValid(false)
          img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        } catch {
          setLinkValid(false)
        }
      } else {
        setLinkValid(false)
      }
    }
    validateLink()
  }, [videoId])
  
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {!thumbnailError && video.thumbnailUrl && videoId ? (
            <img 
              src={video.thumbnailUrl} 
              alt={video.title}
              className="w-32 h-24 object-cover rounded border"
              onError={() => {
                setThumbnailError(true)
                setLinkValid(false)
              }}
              onLoad={() => {
                // Thumbnail loaded successfully
              }}
              loading="lazy"
            />
          ) : (
            <div className="w-32 h-24 bg-gray-100 rounded border flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-500 text-lg mb-1">📺</div>
                <div className="text-xs text-gray-600">YouTube</div>
                <div className="text-xs text-gray-600">Video</div>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm mb-1 line-clamp-2">
            {video.title}
          </h4>
          <p className="text-xs text-gray-600 mb-2">
            Channel: {video.channel}
          </p>
          {video.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {video.description}
            </p>
          )}
          <div className="flex items-center gap-2">
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                linkValid === false 
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
              onClick={(e) => {
                if (linkValid === false) {
                  e.preventDefault()
                  alert('This video link appears to be broken or the video may have been removed.')
                }
              }}
            >
              <span>{linkValid === false ? 'Link Unavailable' : 'Watch on YouTube'}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            {videoId && (
              <span className="text-xs text-gray-500">
                ID: {videoId}
              </span>
            )}
            {linkValid === true && (
              <span className="text-xs text-green-600 font-medium">
                ✓ Verified
              </span>
            )}
            {linkValid === false && (
              <span className="text-xs text-red-600 font-medium">
                ✗ Broken Link
              </span>
            )}
            {linkValid === null && videoId && (
              <span className="text-xs text-gray-500 font-medium">
                ⟳ Checking...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



// Function to extract YouTube video ID from URL
const extractVideoId = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null
  
     const patterns = [
     // Standard watch URLs
     /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
     // Short URLs
     /youtu\.be\/([a-zA-Z0-9_-]{11})/,
   ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      const videoId = match[1]
      if (isValidYouTubeVideoId(videoId)) {
        return videoId
      }
    }
  }
  
  return null
}

// Function to validate YouTube video ID format
const isValidYouTubeVideoId = (videoId: string): boolean => {
  if (!videoId || typeof videoId !== 'string') return false
  
  // YouTube video IDs are exactly 11 characters, alphanumeric plus - and _
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId)
}



interface YouTubeVideo {
  title: string
  url: string
  channel: string
  description?: string
  thumbnailUrl?: string
  citations?: string[]
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  citations?: string[]
  videos?: YouTubeVideo[]
  timestamp: number
}

interface PerplexityResponse {
  choices: Array<{
    delta?: {
      content?: string
    }
    message?: {
      content?: string
    }
  }>
  citations?: string[]
}

export default function ChatbotUI() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Function to render citation with specific claim highlighted and links
  const renderCitationWithLinks = (citation: string) => {
    // Check if citation is in the new simple format: "claim" - year source description link
    const claimMatch = citation.match(/^"([^"]+)"\s*-\s*(.+)/)
    
    if (claimMatch) {
      const [, claim, citationPart] = claimMatch
      
      // Look for URLs in the citation part
      const urlRegex = /(https?:\/\/[^\s]+)/g
      const parts: (string | React.JSX.Element)[] = []
      let lastIndex = 0
      let match
      let partIndex = 0

      while ((match = urlRegex.exec(citationPart)) !== null) {
        // Add text before the URL
        if (match.index > lastIndex) {
          parts.push(
            <span key={`text-${partIndex++}`}>
              {citationPart.slice(lastIndex, match.index)}
            </span>
          )
        }
        
        // Add the URL as a clickable link
        parts.push(
          <a
            key={`link-${partIndex++}`}
            href={match[1]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline break-all"
          >
            {match[1]}
          </a>
        )
        
        lastIndex = match.index + match[0].length
      }
      
      // Add any remaining text after the last URL
      if (lastIndex < citationPart.length) {
        parts.push(
          <span key={`text-${partIndex++}`}>
            {citationPart.slice(lastIndex)}
          </span>
        )
      }
      
      return (
        <>
          <span className="font-semibold text-gray-800 bg-yellow-50 px-1 rounded">
            &quot;{claim}&quot;
          </span>
          <span className="text-gray-600"> - </span>
          {parts.length > 0 ? <>{parts}</> : <span>{citationPart}</span>}
        </>
      )
    }
    
    // Fallback: parse any URLs in the text and make them clickable
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts: (string | React.JSX.Element)[] = []
    let lastIndex = 0
    let match
    let partIndex = 0

    while ((match = urlRegex.exec(citation)) !== null) {
      // Add text before the URL
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${partIndex++}`}>
            {citation.slice(lastIndex, match.index)}
          </span>
        )
      }
      
      // Add the URL as a clickable link
      parts.push(
        <a
          key={`link-${partIndex++}`}
          href={match[1]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline break-all"
        >
          {match[1]}
        </a>
      )
      
      lastIndex = match.index + match[0].length
    }
    
    // Add any remaining text after the last URL
    if (lastIndex < citation.length) {
      parts.push(
        <span key={`text-${partIndex++}`}>
          {citation.slice(lastIndex)}
        </span>
      )
    }
    
    // If no URLs were found, return the original citation as a span
    if (parts.length === 0) {
      return <span>{citation}</span>
    }
    
    return <>{parts}</>
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

    // Enhanced function to extract videos with citations from the combined response
  const extractVideosWithCitations = (text: string): YouTubeVideo[] => {
    const videos: YouTubeVideo[] = []
    const foundVideoIds = new Set<string>()
    
    if (!text || typeof text !== 'string') return videos
    
    const cleanText = text.trim()
    
    // Split content by video sections (looking for **Video patterns or **Title:** patterns)
    const videoSections = cleanText.split(/(?=\*\*Video|\*\*Title:\*\*)/g).filter(section => section.trim())
    
    for (const section of videoSections) {
      try {
        // Extract video information - handle both new and old formats
        const titleMatch = section.match(/\*\*Title:\*\*\s*(.+?)(?=\n|\*\*|$)/m)
        const channelMatch = section.match(/\*\*Channel:\*\*\s*(.+?)(?=\n|\*\*|$)/m)
        const urlMatch = section.match(/\*\*URL:\*\*\s*(https?:\/\/[^\s\n]+)/)
        const descriptionMatch = section.match(/\*\*Description:\*\*\s*(.+?)(?=\n|\*\*|$)/m)
        
        if (!titleMatch || !channelMatch || !urlMatch) continue
        
        const title = titleMatch[1]?.trim() || ''
        const channel = channelMatch[1]?.trim() || ''
        const url = urlMatch[1]?.trim() || ''
        const description = descriptionMatch?.[1]?.trim() || ''
        
        // Clean up any remaining markdown or emojis from title and channel
        const cleanTitle = title.replace(/[\*\[\]]/g, '').trim()
        const cleanChannel = channel.replace(/[\*\[\]]/g, '').trim()
        
        // Validate video
        const videoId = extractVideoId(url)
        if (!videoId || !isValidYouTubeVideoId(videoId) || foundVideoIds.has(videoId)) {
          console.warn('Invalid or duplicate video URL:', url)
          continue
        }
        
        // Additional validation to catch obvious fake URLs
        if (url.includes('example') || url.includes('abc123') || url.includes('xyz') || 
            title.toLowerCase().includes('fake') || title.toLowerCase().includes('example')) {
          console.warn('Detected potentially fake video:', title, url)
          continue
        }
        
        if (cleanTitle.length < 5 || cleanChannel.length < 2) {
          continue
        }
        
        // Extract citations for this video
        const citations: string[] = []
        const citationsMatch = section.match(/\*\*Citations:\*\*\s*([\s\S]*?)(?=\n\*\*Video|$)/m)
        
        if (citationsMatch) {
          const citationText = citationsMatch[1]
          const lines = citationText.split('\n')
          
          for (const line of lines) {
            const trimmed = line.trim()
            // Look for citation format: "claim" - year source link
            if (trimmed && 
                (trimmed.startsWith('"') && trimmed.includes('-')) || 
                (trimmed.includes('"') && (trimmed.includes('20') || trimmed.includes('http') || trimmed.includes('article') || trimmed.includes('study')))) {
              // Clean up any markdown formatting and numbering
              const cleanedCitation = trimmed
                .replace(/^\d+\.\s*/, '')
                .replace(/^\*\*.*?\*\*\s*/, '')
                .replace(/^[\-\•\*]\s*/, '')
                .trim()
                
              if (cleanedCitation.length > 15 && cleanedCitation.includes('"')) {
                citations.push(cleanedCitation)
              }
            }
          }
        }
        
        foundVideoIds.add(videoId)
        videos.push({
          title: cleanTitle,
          channel: cleanChannel,
          url: url,
          description: description || undefined,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          citations: citations.length > 0 ? citations.slice(0, 4) : undefined
        })
        
      } catch (error) {
        console.warn('Error parsing video section:', error)
        continue
      }
    }
    
    return videos
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now()
    }

    const currentInput = input.trim()
    setInput("")
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)
    
    // Single API call handles both videos and citations

    try {
      // Call the new combined video search with citations API
      const response = await fetch('/api/search-videos-with-citations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: currentInput
        })
      })

      if (!response.ok) {
        throw new Error(`Combined search API error: ${response.status}`)
      }

      // Create assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        citations: [],
        videos: [],
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') {
              break
            }

            try {
              const parsed: PerplexityResponse = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ''
              const citations = parsed.citations || []
              
              if (content || citations.length > 0) {
                setMessages(prev => 
                  prev.map(msg => {
                    if (msg.id === assistantMessage.id) {
                      const newContent = msg.content + content
                      
                      // Extract videos with citations from the combined response
                      let videos = msg.videos || []
                      
                      if (newContent.includes('**Title:**')) {
                        const extractedVideos = extractVideosWithCitations(newContent)
                        if (extractedVideos.length > 0) {
                          videos = extractedVideos
                        }
                      }
                      
                      // If content suggests no videos were found, clear any existing videos
                      if (newContent.toLowerCase().includes('no videos found') || 
                          newContent.toLowerCase().includes('no real medical videos found')) {
                        videos = []
                      }
                      
                      return { 
                        ...msg, 
                        content: newContent,
                        citations: citations.length > 0 ? citations : msg.citations,
                        videos: videos.length > 0 ? videos : msg.videos
                      }
                    }
                    return msg
                  })
                )
              }
            } catch (parseError) {
              // Log parsing errors for debugging
              console.warn('Failed to parse SSE data:', data, parseError)
              continue
            }
          }
        }
      }

      // No need for separate citation search - citations are included in the combined response

    } catch (err) {
      console.error('Chat error:', err)
      setError('Failed to send message. Please try again.')
      // Remove the user message if there was an error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  const suggestedQuestions = [
    "Diabetes management",
    "Heart disease prevention", 
    "Mental health awareness",
    "Nutrition and diet",
  ]

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-600 text-white">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <img 
                src="/tech-ahead-logo-black.svg" 
                alt="Tech Ahead Logo" 
                className="h-6 w-auto"
              />
              <h1 className="text-xl font-semibold text-gray-900">
                Medical Video Search
              </h1>
            </div>
            <p className="text-sm text-gray-600">
              Find evidence-based medical videos with scientific citations
            </p>
          </div>
        </div>
      </div>

            {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <Bot className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Search Medical Videos
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Search for educational medical videos from trusted sources with scientific citations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="text-left justify-start h-auto p-3 hover:bg-gray-50"
                    onClick={() => setInput(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={`max-w-[80%] ${message.role === "user" ? "order-first" : ""}`}>
                <Card className={message.role === "user" ? "bg-blue-600 text-white" : "bg-white border-gray-200"}>
                  <CardContent className="p-3">
                    {message.role === "assistant" ? (
                      <div className="text-gray-700">
                        {/* Display the assistant's streaming content */}
                        {/* {message.content && (
                          <div className="whitespace-pre-wrap mb-4">
                            {message.content}
                          </div>
                        )} */}
                        
                        {/* Show no videos found message only when explicitly indicated */}
                        {message.videos && message.videos.length === 0 && 
                         message.content && 
                         (message.content.toLowerCase().includes('no verified medical videos found') || 
                          message.content.toLowerCase().includes('no videos found')) && (
                          <div className="text-sm p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-yellow-800">
                              <strong>No verified medical videos found</strong> for your search query. 
                              Try rephrasing your question or using more general medical terms.
                            </p>
                            <p className="text-yellow-700 text-xs mt-2">
                              We only show videos from trusted medical sources to ensure accuracy.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                    )}
                    
                    {/* YouTube Videos */}
                    {message.role === "assistant" && message.videos && message.videos.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary" className="text-xs">
                            Medical Videos
                          </Badge>
                        </div>
                        {message.videos.map((video, index) => (
                          <VideoItem key={index} video={video} />
                        ))}
                        <div className="text-xs text-gray-500 italic border-t pt-2">
                          <p><strong>Educational Purpose:</strong> Videos are for educational use only. Always consult healthcare professionals for medical advice.</p>
                        </div>
                      </div>
                    )}



                                        {/* Scientific Evidence for Video Claims */}
                    {message.role === "assistant" && message.videos && message.videos.some(v => v.citations && v.citations.length > 0) && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h3 className="text-sm font-medium text-green-800 mb-3">Scientific Evidence</h3>
                        <div className="space-y-3">
                          {message.videos.map((video, videoIndex) => {
                            if (!video.citations || video.citations.length === 0) return null
                            
                            return (
                              <div key={videoIndex} className="bg-white p-3 rounded border border-green-200">
                                <div className="font-medium text-gray-800 text-sm mb-2">
                                  &quot;{video.title}&quot; - Supporting Evidence:
                                </div>
                                <div className="space-y-2">
                                  {video.citations.map((citation, citationIndex) => (
                                    <div key={citationIndex} className="text-xs text-gray-700 pl-4 border-l-2 border-green-300">
                                      <span className="font-medium text-green-700">[{citationIndex + 1}]</span>
                                      <span className="ml-1">{renderCitationWithLinks(citation)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {message.role === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-green-600 text-white">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-600 text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-white border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-700">
                      Searching for videos with citations...
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {error && (
            <Card className="border-destructive">
              <CardContent className="p-3">
                <p className="text-destructive text-sm">{error}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about any medical topic..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
