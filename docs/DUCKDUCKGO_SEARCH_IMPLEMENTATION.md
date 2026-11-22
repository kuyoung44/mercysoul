# DuckDuckGo Search Visibility — MercySoul Dominion

**Canonical site:** https://mercysoul.vercel.app/  
**Canonical brand:** MercySoul Dominion  
**Creative/intelligence platform:** MercySoul Vision Brain  
**Related name:** MercySoul Intelligence (MSi)  
**Origin:** Oyan, Osun State, Nigeria

## How DuckDuckGo discovers sites

DuckDuckGo says it maintains its own crawler, DuckDuckBot, and uses multiple indexes and sources. It says traditional web links are largely sourced from Bing. Therefore, this implementation combines crawler access, crawlable site architecture, sitemap discovery, and Bing webmaster registration.

Official references:
- DuckDuckGo search sources: https://duckduckgo.com/duckduckgo-help-pages/results/sources
- DuckDuckBot and user agent: https://duckduckgo.com/duckduckgo-help-pages/results/duckduckbot
- Bing Webmaster Tools: https://www.bing.com/webmasters/about
- Bing sitemap guidance: https://www2.bing.com/webmasters/help/sitemaps-3b5cf6ed
- IndexNow: https://www.indexnow.org/

## Repository implementation

- `public/robots.txt` permits all crawlers and explicitly documents permission for `DuckDuckBot`.
- Sitemap is advertised at `https://mercysoul.vercel.app/sitemap.xml`.
- `public/sitemap.xml` lists the canonical site and selected public pages.
- Homepage metadata identifies MercySoul Dominion and MercySoul Vision Brain.
- Organization structured data describes the brand and Oyan origin.
- `public/llms.txt` provides a concise, AI-readable brand reference.

## Required owner actions after deployment

1. Open Bing Webmaster Tools: https://www.bing.com/webmasters/about
2. Sign in with the account that will own the site's webmaster property.
3. Add `https://mercysoul.vercel.app/` and complete one of Bing's offered ownership-verification methods.
4. Submit `https://mercysoul.vercel.app/sitemap.xml`.
5. Use Bing URL Inspection / URL submission for the homepage and priority public pages.
6. Search DuckDuckGo for the exact domain and brand phrases periodically; record whether the result appears and whether its title/snippet are correct.

## Optional faster update notifications

IndexNow is supported by Bing and participating search engines. To activate it, the site owner must create or configure an IndexNow key, publish the matching key file at the exact public URL required by IndexNow, and connect URL-change events to the submission endpoint. Do not commit private credentials or claim activation until the key file and successful submission are verified. The current repository change does not activate IndexNow or submit URLs.

## Verification checklist

- [ ] Production deployment completed and live homepage returns HTTP 200.
- [ ] `/robots.txt` returns HTTP 200 and permits DuckDuckBot.
- [ ] `/sitemap.xml` returns valid XML and only canonical, indexable URLs.
- [ ] Bing Webmaster ownership verified.
- [ ] Sitemap submitted and processed by Bing.
- [ ] Priority URLs inspected; no crawl blocks or accidental noindex.
- [ ] DuckDuckGo search results checked after crawler/index refresh.

## Accuracy and limits

Submitting a sitemap or URL is a discovery signal, not a guarantee of indexing or ranking. DuckDuckGo does not provide a conventional public website-owner submission console. Bing coverage matters because DuckDuckGo says most traditional links come from Bing, but DuckDuckGo also operates DuckDuckBot and other indexes. Never claim DuckDuckGo indexing is complete until search results or reliable crawler/index evidence confirms it.
