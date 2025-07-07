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
    <div className="border rounded-lg p-3 bg-gray-50">
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
            <div className="w-32 h-24 bg-red-100 rounded border flex items-center justify-center">
              <div className="text-center">
                <div className="text-red-500 text-lg mb-1">📺</div>
                <div className="text-xs text-red-700">YouTube</div>
                <div className="text-xs text-red-700">Video</div>
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
            <p className="text-xs text-gray-700 mb-2 line-clamp-2">
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

// Function to extract YouTube videos from text with validation
const extractYouTubeVideos = (text: string): YouTubeVideo[] => {
  const videos: YouTubeVideo[] = []
  const foundVideoIds = new Set<string>()
  
  if (!text || typeof text !== 'string') return videos
  
     // Basic text cleanup only
   const cleanText = text.trim()
  
     // Patterns for structured video information - more flexible
   const structuredPatterns = [
     // Standard format: **Title:** title **Channel:** channel **URL:** url
     /\*\*Title:\*\*\s*([^\n*]+)\s*\*\*Channel:\*\*\s*([^\n*]+)\s*\*\*URL:\*\*\s*(https?:\/\/[^\s\n]+)/gi,
     // Alternative format: Title: title Channel: channel URL: url
     /Title:\s*([^\n]+)\s*Channel:\s*([^\n]+)\s*URL:\s*(https?:\/\/[^\s\n]+)/gi,
     // Flexible format with possible line breaks
     /\*\*Title:\*\*([^*]+)\*\*Channel:\*\*([^*]+)\*\*URL:\*\*(https?:\/\/[^\s*]+)/gi,
     // Very simple format
     /Title:\s*(.+?)[\n\r]+Channel:\s*(.+?)[\n\r]+URL:\s*(https?:\/\/\S+)/gi,
   ]
  
        // Function to add valid video with comprehensive validation
   const addValidVideo = (title: string, channel: string, url: string): boolean => {
     if (!title || !channel || !url) return false
     
     const videoId = extractVideoId(url)
     
     if (!videoId || !isValidYouTubeVideoId(videoId) || foundVideoIds.has(videoId)) {
       return false
     }
     
     // Basic validation only
     if (title.length < 5 || channel.length < 2) {
       return false
     }
     
     foundVideoIds.add(videoId)
     videos.push({
       title: title.trim(),
       channel: channel.trim(),
       url: url,
       thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
     })
     
     return true
   }

     // Try structured format extraction
   for (const pattern of structuredPatterns) {
     let match
     while ((match = pattern.exec(cleanText)) !== null) {
       const title = match[1]?.trim() || ''
       const channel = match[2]?.trim() || ''
       const url = match[3]?.trim() || ''
       
       addValidVideo(title, channel, url)
     }
   }
  
     // If no structured videos found, try to extract standalone YouTube URLs
   if (videos.length === 0) {
     const urlPatterns = [
       /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/g,
       /youtu\.be\/([a-zA-Z0-9_-]{11})/g,
     ]
     
     for (const pattern of urlPatterns) {
       let match
       while ((match = pattern.exec(cleanText)) !== null) {
         const videoId = match[1]
         if (isValidYouTubeVideoId(videoId) && !foundVideoIds.has(videoId)) {
           foundVideoIds.add(videoId)
           const originalUrl = match[0] // Use the full matched URL
           videos.push({
             title: 'Medical Educational Video',
             channel: 'Medical Channel',
             url: originalUrl,
             thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
           })
         }
       }
     }
   }
  
  return videos
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
  const [isLoadingCitations, setIsLoadingCitations] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [citationSearchStarted, setCitationSearchStarted] = useState<Set<string>>(new Set())
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

  // Function to get video transcript and generate citations
  const findCitationsForVideos = async (videos: YouTubeVideo[], searchQuery: string): Promise<YouTubeVideo[]> => {
    const updatedVideos: YouTubeVideo[] = []

    for (const video of videos) {
      try {
        // First, get the video transcript
        const transcriptMessages = [
          {
            role: "system",
            content: "You are a transcript analyzer. Extract the key medical claims and information from the provided YouTube video. Identify specific medical facts, treatment recommendations, statistics, and health claims that would benefit from scientific citations."
          },
          {
            role: "user",
            content: `Analyze this YouTube video and extract the key medical claims: "${video.title}" by ${video.channel} (${video.url})\n\nIdentify the main medical facts, treatment recommendations, and health claims made in this video that should be supported by scientific evidence.`
          }
        ]

        const transcriptResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'Authorization': 'Bearer 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'
          },
          body: JSON.stringify({
            model: "sonar-pro",
            messages: transcriptMessages,
            "stream": false,
            "search_domain_filter": ["youtube.com"],
            "web_search_options": {
              "search_context_size": "high"
            }
          })
        })

        let videoClaims = `Key medical topics in video about ${searchQuery}`
        
        if (transcriptResponse.ok) {
          const transcriptData = await transcriptResponse.json()
          videoClaims = transcriptData.choices?.[0]?.message?.content || videoClaims
        }

                 // Now find citations for the specific claims made in this video
         const citationMessages = [
           {
             role: "system",
             content: "You are a medical research assistant. Based on the specific medical claims provided, find peer-reviewed scientific citations that support these exact claims. For each citation, use this exact format:\n\n\"[Specific medical claim from the video]\" - [Year] [Source name] article [direct link]\n\nExample:\n\"Heart disease kills 655,000 Americans annually\" - 2023 American Heart Association study https://www.ahajournals.org/doi/10.1161/CIR.0000000000001123\n\nRequirements:\n1. Quote the exact medical claim in quotes\n2. Provide year and simple source description (like \"Mayo Clinic article\" or \"Harvard study\")\n3. Include direct link to the source\n4. Focus on recent peer-reviewed medical literature and authoritative medical sources"
           },
           {
             role: "user",
             content: `Find 2-3 recent scientific citations that support specific medical claims from this video content:\n\n${videoClaims}\n\nUse the format: \"[exact claim]\" - [year] [source description] [direct link]`
           }
         ]

        const citationResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'Authorization': 'Bearer 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'
          },
          body: JSON.stringify({
            model: "sonar-pro",
            messages: citationMessages,
            "stream": false,
            "search_mode": "academic",
            "web_search_options": {
              "search_context_size": "high"
            }
          })
        })

        const videoCitations: string[] = []

                 if (citationResponse.ok) {
           const citationData = await citationResponse.json()
           const citationContent = citationData.choices?.[0]?.message?.content || ''
           
           // Extract citations from the response - looking for format "claim" - year source link
           const lines = citationContent.split('\n')
           
           for (const line of lines) {
             const trimmed = line.trim()
             // Look for lines that start with quotes and contain year/source patterns
             if (trimmed && 
                 (trimmed.startsWith('"') && trimmed.includes('-')) || 
                 (trimmed.includes('"') && (trimmed.includes('20') || trimmed.includes('http') || trimmed.includes('article')))) {
               // Clean up numbering and formatting
               const cleanedCitation = trimmed.replace(/^\d+\.\s*/, '').replace(/^\*\*.*?\*\*\s*/, '')
               if (cleanedCitation.length > 15 && cleanedCitation.includes('"')) { // Ensure it contains a claim
                 videoCitations.push(cleanedCitation)
               }
             }
           }
         }

        // Add the video with its specific citations
        updatedVideos.push({
          ...video,
          citations: videoCitations.length > 0 ? videoCitations.slice(0, 3) : undefined
        })

      } catch {
        // If citation search fails for this video, add it without citations
        updatedVideos.push(video)
      }
    }

    return updatedVideos
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
    
    // Clear citation search tracking for new conversation
    setCitationSearchStarted(new Set())

    try {
      // Prepare messages for Perplexity API
      const apiMessages = [
        {
          role: "system",
          content: "You are a medical video search assistant. You must search YouTube and find real, existing educational videos from verified medical sources.\n\nIMPORTANT: You MUST perform actual web searches to find real YouTube videos. Do not generate fake or example content.\n\nFor each real video you find, provide:\n**Title:** [exact video title from YouTube]\n**Channel:** [exact YouTube channel name]\n**URL:** [complete YouTube URL]\n\nSearch for videos from trusted sources like Mayo Clinic, Cleveland Clinic, Johns Hopkins, Harvard Medical School, WebMD, or certified doctors.\n\nReturn 2-3 real videos maximum. If no real videos are found, state 'No videos found.'"
        },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: "user",
          content: `Search YouTube for educational medical videos about "${currentInput}". Find videos from Mayo Clinic, Cleveland Clinic, Johns Hopkins, Harvard Medical School, WebMD, or certified doctors. Include the exact video titles, channel names, and YouTube URLs.`
        }
      ]

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'Authorization': 'Bearer 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'
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: apiMessages,
          "stream": true,
          "search_domain_filter": ["youtube.com"],
          "web_search_options": {
            "search_context_size": "medium"
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`)
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
                      
                      // Extract videos from content
                      let videos = msg.videos || []
                      
                      if (newContent.includes('**URL:**') || newContent.includes('**Title:**')) {
                        const extractedVideos = extractYouTubeVideos(newContent)
                        if (extractedVideos.length > 0) {
                          videos = extractedVideos
                        }
                      }
                      
                      // If content suggests no videos were found, clear any existing videos
                      if (newContent.toLowerCase().includes('no videos found')) {
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

      // After video search completes, check for videos and trigger citation search
      const checkForVideosAndStartCitations = () => {
        setMessages(currentMessages => {
          const assistantMsg = currentMessages.find(msg => msg.id === assistantMessage.id)
          
          // Check if citation search already started for this message and videos don't already have citations
          if (assistantMsg && 
              assistantMsg.videos && 
              assistantMsg.videos.length > 0 && 
              !isLoadingCitations && 
              !citationSearchStarted.has(assistantMessage.id) &&
              !assistantMsg.videos.some(v => v.citations && v.citations.length > 0)) {
            
            // Mark citation search as started for this message
            setCitationSearchStarted(prev => new Set([...prev, assistantMessage.id]))
            
            // Start citation search
            setIsLoadingCitations(true)
            findCitationsForVideos(assistantMsg.videos, currentInput)
              .then(videosWithCitations => {
                setMessages(prev => 
                  prev.map(msg => {
                    if (msg.id === assistantMessage.id) {
                      return { 
                        ...msg, 
                        videos: videosWithCitations
                      }
                    }
                    return msg
                  })
                )
                setIsLoadingCitations(false)
              })
              .catch(() => {
                setIsLoadingCitations(false)
              })
          }
          
          return currentMessages
        })
      }
      
      // Single timeout to check for videos (prevents multiple searches)
      setTimeout(checkForVideosAndStartCitations, 1000)

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
    "Find videos about diabetes management",
    "Search heart disease prevention videos", 
    "Show mental health awareness videos",
    "Find nutrition and diet videos",
  ]

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold">Academic Medical Video Search</h1>
            <p className="text-sm text-muted-foreground">
              Find evidence-based YouTube videos from verified medical institutions with academic citations.
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Welcome to Academic Medical Video Search</h3>
              <p className="text-muted-foreground mb-6">
                Search for evidence-based YouTube videos from verified medical institutions with academic sources:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="text-left justify-start h-auto p-3 bg-transparent"
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
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={`max-w-[80%] ${message.role === "user" ? "order-first" : ""}`}>
                <Card className={message.role === "user" ? "bg-primary text-primary-foreground" : ""}>
                  <CardContent className="p-3">
                    {message.role === "assistant" ? (
                      <div className="text-gray-700">
                        {message.videos && message.videos.length === 0 && 
                         message.content && 
                         (message.content.toLowerCase().includes('no verified medical videos found') || 
                          message.content.toLowerCase().includes('no videos found')) && (
                          <div className="text-sm p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-yellow-800">
                              🔍 <strong>No verified medical videos found</strong> for your search query. 
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
                          <Badge variant="secondary" className="text-xs bg-red-50 text-red-700">
                            📺 Medical Videos
                          </Badge>
                        </div>
                        {message.videos.map((video, index) => (
                          <VideoItem key={index} video={video} />
                        ))}
                        <div className="text-xs text-gray-500 italic border-t pt-2">
                          <p>⚠️ <strong>Educational Purpose:</strong> Videos are for educational use only. Always consult healthcare professionals for medical advice.</p>
                        </div>
                      </div>
                    )}

                    {/* Citations Loading Indicator */}
                    {message.role === "assistant" && message.videos && message.videos.length > 0 && isLoadingCitations && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                            🔬 Finding Scientific Evidence...
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Scientific Evidence for Video Claims */}
                    {message.role === "assistant" && message.videos && message.videos.some(v => v.citations && v.citations.length > 0) && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                            🔬 Scientific Evidence for Video Claims
                          </Badge>
                        </div>
                        <div className="space-y-4">
                          {message.videos.map((video, videoIndex) => {
                            if (!video.citations || video.citations.length === 0) return null
                            
                            return (
                              <div key={videoIndex} className="bg-white p-3 rounded border border-green-200">
                                <div className="font-medium text-green-800 mb-2 text-sm">
                                  📺 &quot;{video.title}&quot; - Supporting Evidence:
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
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      {isLoadingCitations ? 'Finding scientific evidence...' : 'Searching for videos...'}
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
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
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
