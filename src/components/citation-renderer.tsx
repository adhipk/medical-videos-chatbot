import { ExternalLink, Globe } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Citation {
  title: string
  url: string
  date?: string
  snippet?: string
}

interface CitationRendererProps {
  citations?: string[]
  searchResults?: Citation[]
  content?: string
}

export function CitationRenderer({ citations, searchResults, content }: CitationRendererProps) {
  if (!citations && !searchResults && !content) return null

  return (
    <Card className="mt-3 bg-slate-50 border-slate-200">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-slate-600" />
          <Badge variant="secondary">Sources & Citations</Badge>
        </div>

        {content && <div className="mb-3 p-2 bg-white rounded border text-sm">{content}</div>}

        {searchResults && searchResults.length > 0 && (
          <div className="space-y-2 mb-3">
            <p className="text-xs font-medium text-slate-700">Search Results:</p>
            {searchResults.slice(0, 3).map((result, index) => (
              <div key={index} className="bg-white p-2 rounded border">
                <div className="flex items-start gap-2">
                  <Globe className="h-3 w-3 text-slate-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline block truncate"
                    >
                      {result.title}
                    </a>
                    {result.snippet && <p className="text-xs text-slate-600 mt-1 line-clamp-2">{result.snippet}</p>}
                    {result.date && <p className="text-xs text-slate-400 mt-1">{result.date}</p>}
                  </div>
                  <ExternalLink className="h-3 w-3 text-slate-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}

        {citations && citations.length > 0 && (
          <div className="pt-2 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-700 mb-2">Citations:</p>
            <div className="flex flex-wrap gap-1">
              {citations.map((citation, index) => (
                <a
                  key={index}
                  href={citation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors inline-flex items-center gap-1"
                >
                  [{index + 1}]
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
