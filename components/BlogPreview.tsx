'use client'

interface BlogPreviewProps {
  title?: string
  excerpt?: string
  content?: string
  featuredImage?: string | null
  author?: string | null
  publishedAt?: string | null
}

export function BlogPreview({
  title,
  excerpt,
  content,
  featuredImage,
  author,
  publishedAt,
}: BlogPreviewProps) {
  return (
    <article className="max-w-4xl mx-auto bg-white">
      {/* Hero Section with Featured Image */}
      {featuredImage && (
        <div className="w-full h-96 mb-8 overflow-hidden rounded-t-lg">
          <img
            src={featuredImage}
            alt={title || 'Blog post featured image'}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="px-6 pb-8">
        {/* Title */}
        {title && (
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h1>
        )}

        {/* Meta Information */}
        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-200">
          {author && (
            <span className="font-medium text-gray-700">
              By {author}
            </span>
          )}
          {publishedAt && (
            <span>
              {new Date(publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          )}
        </div>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-xl text-gray-600 mb-6 italic">
            {excerpt}
          </p>
        )}

        {/* Content */}
        {content && (
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}

        {!content && (
          <p className="text-gray-400 italic">No content yet...</p>
        )}
      </div>

      <style jsx global>{`
        .prose {
          color: #374151;
        }
        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4 {
          color: #111827;
          font-weight: 700;
          margin-top: 2em;
          margin-bottom: 1em;
        }
        .prose h1 {
          font-size: 2.25em;
        }
        .prose h2 {
          font-size: 1.875em;
        }
        .prose h3 {
          font-size: 1.5em;
        }
        .prose p {
          margin-bottom: 1.25em;
          line-height: 1.75;
        }
        .prose ul,
        .prose ol {
          margin-bottom: 1.25em;
          padding-left: 1.625em;
        }
        .prose li {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .prose a {
          color: #2563eb;
          text-decoration: underline;
        }
        .prose img {
          margin-top: 2em;
          margin-bottom: 2em;
          border-radius: 0.5rem;
        }
        .prose blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1.5em 0;
          font-style: italic;
          color: #6b7280;
        }
        .prose code {
          background-color: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }
        .prose pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1em;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5em 0;
        }
        .prose pre code {
          background-color: transparent;
          color: inherit;
          padding: 0;
        }
      `}</style>
    </article>
  )
}

