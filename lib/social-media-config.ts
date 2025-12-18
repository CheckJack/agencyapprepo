// Social Media Platform and Content Style Configuration

export type Platform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok'
export type ContentStyle = 'post' | 'story' | 'reel' | 'carousel' | 'video' | 'tweet' | 'thread' | 'poll' | 'article' | 'igtv'

export interface ContentStyleConfig {
  fields: ('content' | 'images' | 'video' | 'link')[]
  minImages?: number
  maxImages?: number
  requiresVideo?: boolean
  requiresLink?: boolean
  maxContentLength?: number
}

export const PLATFORM_CONTENT_STYLES: Record<Platform, ContentStyle[]> = {
  facebook: ['post', 'story', 'reel', 'carousel', 'video'],
  instagram: ['post', 'story', 'reel', 'carousel', 'igtv'],
  twitter: ['tweet', 'thread', 'poll'],
  linkedin: ['post', 'article', 'carousel', 'video'],
  tiktok: ['video'],
}

export const CONTENT_STYLE_CONFIG: Record<ContentStyle, ContentStyleConfig> = {
  post: {
    fields: ['content', 'images', 'link'],
    minImages: 0,
    maxImages: 10,
  },
  story: {
    fields: ['content', 'images', 'video'],
    minImages: 0,
    maxImages: 1,
    requiresVideo: false,
  },
  reel: {
    fields: ['content', 'video'],
    requiresVideo: true,
  },
  carousel: {
    fields: ['content', 'images'],
    minImages: 2,
    maxImages: 10,
  },
  video: {
    fields: ['content', 'video', 'images'],
    requiresVideo: true,
    minImages: 0,
    maxImages: 1, // Thumbnail
  },
  tweet: {
    fields: ['content', 'images', 'link'],
    maxContentLength: 280,
    minImages: 0,
    maxImages: 4,
  },
  thread: {
    fields: ['content', 'images', 'link'],
    maxContentLength: 280,
    minImages: 0,
    maxImages: 4,
  },
  poll: {
    fields: ['content', 'images'],
    minImages: 0,
    maxImages: 1,
  },
  article: {
    fields: ['content', 'images', 'link'],
    minImages: 0,
    maxImages: 1,
    requiresLink: true,
  },
  igtv: {
    fields: ['content', 'video'],
    requiresVideo: true,
  },
}

export const PLATFORM_NAMES: Record<Platform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter/X',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
}

export const CONTENT_STYLE_NAMES: Record<ContentStyle, string> = {
  post: 'Post',
  story: 'Story',
  reel: 'Reel',
  carousel: 'Carousel',
  video: 'Video',
  tweet: 'Tweet',
  thread: 'Thread',
  poll: 'Poll',
  article: 'Article',
  igtv: 'IGTV',
}

export function getContentStylesForPlatform(platform: Platform): ContentStyle[] {
  return PLATFORM_CONTENT_STYLES[platform] || []
}

export function getConfigForContentStyle(contentStyle: ContentStyle): ContentStyleConfig {
  return CONTENT_STYLE_CONFIG[contentStyle]
}

export function getRequiredFields(platform: Platform, contentStyle: ContentStyle): string[] {
  const config = getConfigForContentStyle(contentStyle)
  return config.fields
}

