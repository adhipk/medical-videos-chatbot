import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const apiKey = process.env.PERPLEXITY_API_KEY || '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'

    // Single comprehensive search that finds videos AND their supporting citations
    const messages = [
      {
        role: "system",
        content: `You are a medical video search assistant that finds REAL, EXISTING YouTube videos and provides scientific citations.

CRITICAL: You MUST only return REAL YouTube videos that actually exist. Do NOT generate fake video titles or URLs.

TASK: Search YouTube.com for actual educational medical videos about the requested topic and provide scientific citations for their claims.

IMPORTANT INSTRUCTIONS:
1. Search YouTube.com directly for real videos from verified medical channels
2. Only return videos that you can verify actually exist on YouTube
3. Use exact titles and URLs from real YouTube videos
4. If you cannot find real videos, say "No real medical videos found for this topic"

RESPONSE FORMAT:

**Medical Video Search Results**

**Video 1:**
**Title:** [EXACT title from real YouTube video]
**Channel:** [EXACT channel name from YouTube]
**URL:** [REAL YouTube URL that actually works]
**Description:** [Brief description of actual video content]
**Citations:**
"[Specific medical claim from the real video]" - 2024 [Authoritative medical source] article [direct research link]
"[Another evidence-based claim from the video]" - 2023 [Medical journal/institution] study [peer-reviewed link]

---

**Video 2:**
**Title:** [EXACT title from real YouTube video]
**Channel:** [EXACT channel name from YouTube]
**URL:** [REAL YouTube URL that actually works]
**Description:** [Brief description of actual video content]
**Citations:**
"[Medical claim from the real video]" - 2024 [Medical authority] research [direct link]
"[Treatment/prevention claim from the video]" - 2023 [Healthcare organization] guidelines [official link]

STRICT REQUIREMENTS:
- ONLY return REAL YouTube videos that actually exist - NO FAKE URLs
- Find videos ONLY from: Mayo Clinic, Cleveland Clinic, Johns Hopkins, Harvard Medical School, Stanford Medicine, Mount Sinai, WebMD, MedlinePlus, or verified medical professionals
- Use exact video titles and channel names from real YouTube videos
- Verify YouTube URLs are real and functional
- Each citation must support actual claims made in the real videos
- If you cannot find real videos, respond: "No real medical videos found for this topic. Try different search terms."

DO NOT CREATE FAKE VIDEOS. ONLY RETURN REAL YOUTUBE CONTENT.`
      },
      {
        role: "user", 
        content: `Search YouTube.com and find 2-3 REAL, EXISTING educational videos about "${query}" from verified medical institutions. 

IMPORTANT: Only return videos that actually exist on YouTube. Use exact titles and URLs from real videos.

Search specifically for channels like:
- Mayo Clinic
- Cleveland Clinic  
- Johns Hopkins Medicine
- Harvard Medical School
- Stanford Medicine
- Mount Sinai
- WebMD
- MedlinePlus
- Board-certified physicians with verified channels

For each REAL video you find:
- Copy the EXACT title from the YouTube video
- Copy the EXACT channel name from YouTube
- Provide the REAL YouTube URL that actually works
- Describe what the actual video covers
- Find scientific citations that support claims made in that specific video

If you cannot find real medical videos about "${query}" on YouTube, respond with "No real medical videos found for this topic. Try different search terms."

DO NOT make up fake video titles or URLs. Only return real content that exists on YouTube.`
      }
    ]

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: messages,
        "stream": true,
        "search_domain_filter": ["youtube.com"],
        "search_mode": "web",
        "web_search_options": {
          "search_context_size": "high",
          "search_recency": "month"
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`)
    }

    // Return the streaming response directly to the frontend
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Combined search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 