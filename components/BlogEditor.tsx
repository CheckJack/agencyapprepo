'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill')
    // Import CSS after component loads
    if (typeof window !== 'undefined') {
      await import('react-quill/dist/quill.snow.css')
    }
    return RQ
  },
  { 
    ssr: false,
    loading: () => (
      <div className="h-[300px] border border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    )
  }
)

interface BlogEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function BlogEditor({ value, onChange, placeholder = 'Write your blog post content here...' }: BlogEditorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ],
  }

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'script',
    'indent',
    'direction',
    'size',
    'color', 'background',
    'font',
    'align',
    'link', 'image', 'video',
    'clean'
  ]

  if (!mounted) {
    return (
      <div className="h-[300px] border border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    )
  }

  return (
    <div className="blog-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-white"
      />
      <style jsx global>{`
        .blog-editor .quill {
          background: white;
        }
        .blog-editor .ql-container {
          min-height: 300px;
          font-size: 16px;
          color: #111827;
        }
        .blog-editor .ql-editor {
          min-height: 300px;
          color: #111827;
        }
        .blog-editor .ql-editor p,
        .blog-editor .ql-editor h1,
        .blog-editor .ql-editor h2,
        .blog-editor .ql-editor h3,
        .blog-editor .ql-editor li,
        .blog-editor .ql-editor span,
        .blog-editor .ql-editor strong,
        .blog-editor .ql-editor em {
          color: #111827;
        }
        .blog-editor .ql-editor.ql-blank::before {
          font-style: normal;
          color: #9ca3af;
        }
        .blog-editor .ql-toolbar {
          border-top: 1px solid #d1d5db;
          border-left: 1px solid #d1d5db;
          border-right: 1px solid #d1d5db;
          border-bottom: none;
          border-radius: 0.375rem 0.375rem 0 0;
        }
        .blog-editor .ql-container {
          border-bottom: 1px solid #d1d5db;
          border-left: 1px solid #d1d5db;
          border-right: 1px solid #d1d5db;
          border-top: none;
          border-radius: 0 0 0.375rem 0.375rem;
        }
      `}</style>
    </div>
  )
}
