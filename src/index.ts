import { parse } from 'node-html-parser';
import TurndownService from 'turndown';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, basename } from 'path';

async function scrapeUrlToMarkdown(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const root = parse(html);
    
    const articleElement = root.querySelector('article');
    
    if (!articleElement) {
      throw new Error('No article tag found in the HTML');
    }
    
    const turndownService = new TurndownService();
    const markdown = turndownService.turndown(articleElement.innerHTML);
    
    return cleanMarkdownContent(markdown);
  } catch (error) {
    throw new Error(`Failed to scrape URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function cleanMarkdownContent(markdown: string): string {
  const helpfulSectionRegex = /Was this article helpful\?[\s\S]*$/i;
  return markdown.replace(helpfulSectionRegex, '').trim();
}

function parseCSV(csvContent: string): string[] {
  const lines = csvContent.trim().split('\n');
  const urls: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#') && !trimmedLine.toLowerCase().includes('url')) {
      const columns = trimmedLine.split(',');
      const url = columns[0].trim().replace(/^["']|["']$/g, '');
      if (url.startsWith('http')) {
        urls.push(url);
      }
    }
  }
  
  return urls;
}

function getUrlStem(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split('/').filter(segment => segment.length > 0);
    return segments[segments.length - 1] || 'index';
  } catch {
    return 'invalid-url';
  }
}

function createOutputDirectory(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputDir = join('output', timestamp);
  
  mkdirSync(outputDir, { recursive: true });
  return outputDir;
}

function parseArguments(): { csvFile?: string } {
  const args = process.argv.slice(2);
  const result: { csvFile?: string } = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--csv' && i + 1 < args.length) {
      result.csvFile = args[i + 1];
      break;
    }
  }
  
  return result;
}

async function processCsvFile(csvFile: string) {
  try {
    const csvContent = readFileSync(csvFile, 'utf-8');
    let urls = parseCSV(csvContent);
    console.log('URLs', urls)
    urls = Array.from(new Set(urls));
    
    if (urls.length === 0) {
      console.log('No valid URLs found in CSV file');
      return;
    }
    
    console.log(`Found ${urls.length} URLs to process`);
    
    const outputDir = createOutputDirectory();
    console.log(`Output directory: ${outputDir}`);
    
    let processed = 0;
    let failed = 0;
    
    for (const [index, url] of urls.entries()) {
      try {
        console.log(`Processing ${index + 1} out of ${urls.length}: ${url}`);
        const markdown = await scrapeUrlToMarkdown(url);
        const filename = `${getUrlStem(url)}.md`;
        const filepath = join(outputDir, filename);
        
        writeFileSync(filepath, markdown, 'utf-8');
        console.log(`✅ Saved: ${filename}`);
        processed++;
        await new Promise(resolve => setTimeout(resolve, 1500)); // Throttle requests
      } catch (error) {
        console.error(`❌ Failed to process ${url}:`, error instanceof Error ? error.message : String(error));
        failed++;
      }
    }
    
    console.log(`\nProcessing complete: ${processed} succeeded, ${failed} failed`);
  } catch (error) {
    console.error('Error reading CSV file:', error instanceof Error ? error.message : String(error));
  }
}

async function main() {
  const args = parseArguments();

  if (!args.csvFile) {
    console.error('No CSV file specified, aborting');
    process.exit(1)
  }

  await processCsvFile(args.csvFile);

}

main();
