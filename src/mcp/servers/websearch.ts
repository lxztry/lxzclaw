/**
 * MCP Web Search Server
 * Provides web search and fetch as MCP tools
 */

export const websearchTools = [
  {
    name: 'search',
    description: 'Search the web for information',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        count: { type: 'number', description: 'Number of results (default: 5)' },
        engine: { type: 'string', description: 'Search engine (google, bing, duckduckgo)' }
      },
      required: ['query']
    }
  },
  {
    name: 'fetch_url',
    description: 'Fetch and extract content from a URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to fetch' },
        maxChars: { type: 'number', description: 'Maximum characters to return' }
      },
      required: ['url']
    }
  },
  {
    name: 'extract_links',
    description: 'Extract all links from a webpage',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to extract links from' },
        internalOnly: { type: 'boolean', description: 'Only return internal links' }
      },
      required: ['url']
    }
  },
  {
    name: 'get_headers',
    description: 'Get HTTP headers from a URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to get headers from' }
      },
      required: ['url']
    }
  }
];

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function handleWebsearchTool(tool: string, args: Record<string, unknown>) {
  switch (tool) {
    case 'search': {
      const query = args.query as string;
      const count = (args.count as number) || 5;
      
      // Using a simple fetch to simulate search (in production, use a real search API)
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${count}`;
      
      try {
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MCP Bot)'
          }
        });
        const html = await response.text();
        
        // Simple regex to extract search results (very basic)
        const results: SearchResult[] = [];
        const regex = /<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<a href="([^"]+)"[^>]*>[^<]*(?:<[^>]*>)*([^<]+)/g;
        let match;
        let i = 0;
        
        while ((match = regex.exec(html)) !== null && i < count) {
          results.push({
            title: match[1].replace(/<[^>]*>/g, ''),
            url: match[2],
            snippet: match[3].replace(/<[^>]*>/g, '').substring(0, 200)
          });
          i++;
        }
        
        return { results, query };
      } catch (error) {
        return { error: `Search failed: ${error}` };
      }
    }
    
    case 'fetch_url': {
      const url = args.url as string;
      const maxChars = (args.maxChars as number) || 10000;
      
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MCP Bot)'
          }
        });
        
        const contentType = response.headers.get('content-type') || '';
        
        if (!contentType.includes('text')) {
          return { error: 'Can only fetch text content' };
        }
        
        const text = await response.text();
        return {
          content: text.substring(0, maxChars),
          contentType,
          url
        };
      } catch (error) {
        return { error: `Fetch failed: ${error}` };
      }
    }
    
    case 'extract_links': {
      const url = args.url as string;
      const internalOnly = args.internalOnly as boolean;
      
      try {
        const response = await fetch(url);
        const html = await response.text();
        
        const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
        const links: string[] = [];
        let match;
        
        while ((match = linkRegex.exec(html)) !== null) {
          let href = match[1];
          
          // Skip javascript and anchor links
          if (href.startsWith('javascript:') || href.startsWith('#')) continue;
          
          // Convert relative URLs to absolute
          if (href.startsWith('/')) {
            const urlObj = new URL(url);
            href = urlObj.origin + href;
          }
          
          if (!internalOnly || href.includes(new URL(url).host)) {
            if (!links.includes(href)) {
              links.push(href);
            }
          }
        }
        
        return { links: links.slice(0, 50), url };
      } catch (error) {
        return { error: `Link extraction failed: ${error}` };
      }
    }
    
    case 'get_headers': {
      const url = args.url as string;
      
      try {
        const response = await fetch(url, { method: 'HEAD' });
        const headers: Record<string, string> = {};
        
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        
        return { headers, url };
      } catch (error) {
        return { error: `Header fetch failed: ${error}` };
      }
    }
    
    default:
      return { error: `Unknown tool: ${tool}` };
  }
}
