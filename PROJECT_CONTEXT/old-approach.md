<file_contents>
File: /Users/gwelinder/code/boardAI/knowledge-base/app/actionchat/component/ChatWrapper.tsx
```tsx
'use client';
import React, { useState } from 'react';
import { StreamableValue, useStreamableValue } from 'ai/rsc';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight, { Options as HighlightOptions } from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import Link from 'next/link';
import {
  Copy,
  Check,
  Globe,
  ExternalLink,
  Link as LinkIcon,
  Bot
} from 'lucide-react';
import { encodeBase64 } from '../lib/base64';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

const highlightOptionsAI: HighlightOptions = {
  detect: true,
  prefix: 'hljs-'
};

export function UserMessage({
  children,
  full_name
}: {
  children: React.ReactNode;
  full_name: string;
}) {
  return (
    <div className="relative bg-green-100 text-green-900 pt-8 pb-4 rounded-lg m-2 ml-4 flex-grow overflow-hidden px-4 self-end break-words flex flex-col items-start shadow-md">
      <span className="font-bold text-xs absolute top-0 left-2.5 w-full whitespace-nowrap overflow-ellipsis">
        {full_name}
      </span>
      <ReactMarkdown>{children?.toString()}</ReactMarkdown>
    </div>
  );
}

export function BotMessage({
  children,
  textStream,
  className
}: {
  children?: React.ReactNode;
  textStream?: StreamableValue;
  className?: string;
}) {
  const [text] = useStreamableValue(textStream);
  const content = text
    ? text
    : typeof children === 'string'
      ? children
      : children;
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = (str: string): void => {
    void window.navigator.clipboard.writeText(str);
  };

  const handleCopy = (content: string) => {
    copyToClipboard(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1000);
  };

  const createDocumentLink = (href: string) => {
    // Parse the existing URL parameters
    const params = new URLSearchParams(href.substring(1)); // Remove the leading '?'

    // Get the PDF filename and page number
    const pdfTitle = params.get('pdf');
    const pageNumber = params.get('p');

    // Create new URLSearchParams
    const newSearchParams = new URLSearchParams();

    if (pdfTitle) {
      // Encode the PDF title
      const encodedFilename = encodeURIComponent(encodeBase64(pdfTitle));
      newSearchParams.set('pdf', encodedFilename);
    }

    if (pageNumber) {
      // Keep the page number as is
      newSearchParams.set('p', pageNumber);
    }

    // Construct the final URL
    return `?${newSearchParams.toString()}`;
  };

  return (
    <div
      className={cn(
        'relative bg-gray-100 text-gray-800 rounded-lg my-2 self-start break-words flex flex-col items-start shadow-md p-6',
        className
      )}
    >
      <div className="absolute top-2.5 left-2.5">
        <Bot className="text-gray-600" />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6"
        onClick={() => handleCopy(content || '')}
      >
        {isCopied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>

      <ReactMarkdown
        components={{
          table: ({ children }) => (
            <div className="w-full py-2 overflow-x-auto">
              <Table>{children}</Table>
            </div>
          ),
          thead: ({ children }) => <TableHeader>{children}</TableHeader>,
          tbody: ({ children }) => <TableBody>{children}</TableBody>,
          tr: ({ children }) => <TableRow>{children}</TableRow>,
          th: ({ children }) => (
            <TableHead className="border border-gray-200 p-1 text-left text-sm font-normal break-normal hyphens-auto">
              {children}
            </TableHead>
          ),
          td: ({ children }) => (
            <TableCell className="border border-gray-200 p-1 text-left text-sm font-normal break-normal hyphens-auto">
              {children}
            </TableCell>
          ),
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match && match[1] ? match[1] : '';
            const inline = !language;
            if (inline) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <div
                style={{
                  position: 'relative',
                  borderRadius: '5px',
                  padding: '20px',
                  marginTop: '20px',
                  maxWidth: '100%' // Ensure the container fits its parent
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '0',
                    left: '5px',
                    fontSize: '0.8em',
                    textTransform: 'uppercase'
                  }}
                >
                  {language}
                </span>
                <div
                  style={{
                    overflowX: 'auto', // Enable horizontal scrolling
                    maxWidth: '650px' // Set a fixed maximum width
                  }}
                >
                  <pre style={{ margin: '0' }}>
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              </div>
            );
          },
          a: ({ href, children }) => {
            if (href) {
              // Check if the link starts with http:// or https://
              if (href.startsWith('http://') || href.startsWith('https://')) {
                // For web links, return a regular link that opens in a new tab
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                );
              } else {
                // For document links, use createDocumentLink
                const fullHref = createDocumentLink(href);
                return (
                  <Link href={fullHref} passHref prefetch={false}>
                    {children}
                  </Link>
                );
              }
            }
            return <a>{children}</a>;
          }
        }}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeHighlight, highlightOptionsAI]]}
      >
        {content?.toString() || ''}
      </ReactMarkdown>
    </div>
  );
}

interface SearchResult {
  title: string;
  url: string;
}

export const InternetSearchToolResults = ({
  searchResults
}: {
  searchResults: SearchResult[];
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [hoveredUrl, setHoveredUrl] = useState<string>('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handlePopoverOpen = (
    event: React.MouseEvent<HTMLElement>,
    url: string
  ) => {
    setAnchorEl(event.currentTarget);
    setHoveredUrl(url);
    setIsPopoverOpen(true);
  };

  const handleLinkMouseLeave = () => {
    // Start a timer to close the popover
    setTimeout(() => {
      if (!isPopoverOpen) {
        setAnchorEl(null);
        setHoveredUrl('');
      }
    }, 100);
  };

  const handlePopoverMouseEnter = () => {
    setIsPopoverOpen(true);
  };

  const handlePopoverMouseLeave = () => {
    setIsPopoverOpen(false);
    setAnchorEl(null);
    setHoveredUrl('');
  };

  return (
    <div className="flex flex-col space-y-2">
      {searchResults.map((result, index) => (
        <div key={index} className="flex items-center space-x-2">
          <Globe className="h-4 w-4 text-primary shrink-0" />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onMouseEnter={(e) => handlePopoverOpen(e, result.url)}
                onMouseLeave={handleLinkMouseLeave}
              >
                {result.title}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto max-w-sm p-2"
              onMouseEnter={handlePopoverMouseEnter}
              onMouseLeave={handlePopoverMouseLeave}
            >
              <div className="flex items-center space-x-2">
                <LinkIcon className="h-4 w-4" />
                <span className="text-sm truncate">{hoveredUrl}</span>
                <a
                  href={hoveredUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      ))}
    </div>
  );
};

```

File: /Users/gwelinder/code/boardAI/knowledge-base/app/actionchat/[id]/page.tsx
```tsx
// page.tsx
import React from 'react';
import { type Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/server/server';
import ChatComponentPage from '../component/ChatComponent';
import { getUserInfo } from '@/lib/server/supabase';
import { notFound } from 'next/navigation';
import { AI as AiProvider } from '../action';
import type { ServerMessage } from '../action';
import DocumentViewer from '../component/PDFViewer';
import { unstable_noStore as noStore } from 'next/cache';

export const maxDuration = 60;

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false
  }
};

type Source = {
  title: string;
  url: string;
};

// Type guard function to check if the value is a string
function isJsonString(value: unknown): value is string {
  return typeof value === 'string';
}

async function getChatMessages(chatId: string) {
  noStore();
  const supabase = await createServerSupabaseClient();

  try {
    const { data: chatData, error } = await supabase
      .from('chat_sessions')
      .select(
        `
        user_id,
        chat_messages!inner (
          is_user_message,
          content,
          created_at,
          sources
        )
      `
      )
      .eq('id', chatId)
      .order('created_at', {
        ascending: true,
        referencedTable: 'chat_messages'
      })
      .single();

    if (error || !chatData) return { messages: [], userId: null };

    return {
      messages: chatData.chat_messages.map((message): ServerMessage => {
        let parsedSources: Source[] = [];

        if (message.sources) {
          try {
            // First ensure we're working with a string
            if (isJsonString(message.sources)) {
              const parsed = JSON.parse(message.sources);
              // Verify the parsed data is an array of Source objects
              if (
                Array.isArray(parsed) &&
                parsed.every(
                  (item) =>
                    typeof item === 'object' &&
                    item !== null &&
                    'title' in item &&
                    'url' in item
                )
              ) {
                parsedSources = parsed as Source[];
              }
            }
          } catch (e) {
            console.error('Error parsing sources:', e);
          }
        }

        return {
          role: message.is_user_message ? 'user' : ('assistant' as const),
          content: message.content || '',
          sources: parsedSources
        };
      }),
      userId: chatData.user_id
    };
  } catch (error) {
    console.error('Error fetching chat data:', error);
    return { messages: [], userId: null };
  }
}
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | '' }>;
}

export default async function Page(props: PageProps) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams
  ]);
  const userInfo = await getUserInfo();

  const { messages, userId } = await getChatMessages(params.id);
  if (userId && userId !== userInfo?.id) {
    notFound();
  }

  return (
    <div className="flex w-full overflow-hidden">
      <div className="flex-1">
        <AiProvider initialAIState={messages}>
          <ChatComponentPage userInfo={userInfo} />
        </AiProvider>
      </div>

      {searchParams.pdf ? (
        <DocumentViewerSuspended
          fileName={decodeURIComponent(searchParams.pdf)}
        />
      ) : null}
    </div>
  );
}

async function DocumentViewerSuspended({ fileName }: { fileName: string }) {
  const session = await getUserInfo();
  const userId = session?.id;

  const hasActiveSubscription = Boolean(session);

  return (
    <DocumentViewer
      fileName={fileName}
      userId={userId}
      hasActiveSubscription={hasActiveSubscription}
    />
  );
}

```

File: /Users/gwelinder/code/boardAI/knowledge-base/app/actionchat/component/action.ts
```ts
'use server';

import { getSession } from '@/lib/server/supabase';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/server/server';
import { createAdminClient } from '@/lib/server/admin';
import { revalidatePath } from 'next/cache';

export type ChatPreview = {
  id: string;
  firstMessage: string;
  created_at: string;
};

export async function fetchMoreChatPreviews(offset: number) {
  const session = await getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }

  const supabase = await createServerSupabaseClient();
  const limit = 30;

  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select(
        `
          id,
          created_at,
          chat_title,
          first_message:chat_messages!inner(content)
        `
      )
      .order('created_at', { ascending: false })
      .limit(1, { foreignTable: 'chat_messages' })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const chatPreviews: ChatPreview[] = data.map((session) => ({
      id: session.id,
      firstMessage:
        session.chat_title ||
        session.first_message[0]?.content ||
        'No messages yet',
      created_at: session.created_at
    }));

    return chatPreviews;
  } catch (error) {
    console.error('Error fetching chat previews:', error);
    return [];
  }
}

export async function deleteChatData(chatId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }
  const supabase = await createServerSupabaseClient();
  try {
    // Delete chat session
    const { error: sessionError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', chatId);

    if (sessionError) throw sessionError;
    return { message: 'Chat data and references deleted successfully' };
  } catch (error) {
    console.error('Error during deletion:', error);
    return { message: 'Error deleting chat data' };
  }
}

const deleteFileSchema = z.object({
  filePath: z.string(),
  filterTag: z.string()
});

export async function deleteFilterTagAndDocumentChunks(formData: FormData) {
  const session = await getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }

  try {
    const result = deleteFileSchema.safeParse({
      filePath: formData.get('filePath'),
      filterTag: formData.get('filterTag')
    });

    if (!result.success) {
      console.error('Validation failed:', result.error.errors);
      return {
        success: false,
        message: result.error.errors.map((e) => e.message).join(', ')
      };
    }

    const { filePath, filterTag } = result.data;
    const supabase = await createServerSupabaseClient();

    // Delete file from storage
    const fileToDelete = session.id + '/' + filePath;
    const { error: deleteStorageError } = await supabase.storage
      .from('userfiles')
      .remove([fileToDelete]);

    if (deleteStorageError) {
      console.error(
        'Error deleting file from Supabase storage:',
        deleteStorageError
      );
      return {
        success: false,
        message: 'Error deleting file from storage'
      };
    }

    // Delete vectors from vector_documents table

    const supabaseAdmin = createAdminClient();

    const { error: deleteVectorsError } = await supabaseAdmin
      .from('vector_documents')
      .delete()
      .eq('user_id', session.id)
      .eq('filter_tags', filterTag);

    if (deleteVectorsError) {
      console.error(
        'Error deleting vectors from database:',
        deleteVectorsError
      );
      return {
        success: false,
        message: 'Error deleting document vectors'
      };
    }

    return {
      success: true,
      message: 'File and associated vectors deleted successfully'
    };
  } catch (error) {
    console.error('Error during deletion process:', error);
    return {
      success: false,
      message: 'Error deleting file and document chunks',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

const updateChatTitleSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty'),
  chatId: z.string().uuid('Invalid chat ID format')
});

export async function updateChatTitle(formData: FormData) {
  // Create an object from FormData
  const data = {
    title: formData.get('title'),
    chatId: formData.get('chatId')
  };

  // Validate the input
  const result = updateChatTitleSchema.safeParse(data);
  if (!result.success) {
    console.error('Invalid input:', result.error);
    return {
      success: false,
      error: 'Invalid input data'
    };
  }

  // Continue with the validated data
  const { title, chatId } = result.data;

  const userId = await getSession();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const supabaseAdmin = createAdminClient();
  const { error: updateError } = await supabaseAdmin
    .from('chat_sessions')
    .update({ chat_title: title })
    .eq('id', chatId)
    .eq('user_id', userId.id);

  if (updateError) {
    return {
      success: false,
      error: 'Error updating chat title'
    };
  }

  revalidatePath(`/actionchat/[id]`, 'layout');

  return { success: true };
}

```

File: /Users/gwelinder/code/boardAI/knowledge-base/app/actionchat/component/fileupload.tsx
```tsx
'use client';

import React, { useCallback, useRef } from 'react';
import { useDropzone, FileRejection, FileWithPath } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { useUpload } from '../context/uploadContext';
import { Upload, X, FileText, Loader2 } from 'lucide-react';

const SUPPORTED_FILE_TYPES: { [key: string]: string[] } = {
  'application/pdf': ['.pdf', '.PDF'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
    '.DOCX'
  ]
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB in bytes

function LinearProgressWithLabel({
  value,
  status
}: {
  value: number;
  status: string;
}) {
  const statusesWithSpinner = [
    'Uploading file...',
    'Preparing file for analysis...',
    'Analyzing file...',
    'Finalizing files...',
    'Still analyzing files...'
  ];

  const shouldShowSpinner = statusesWithSpinner.includes(status);

  return (
    <>
      <div className="flex items-center w-full mb-1">
        <div className="w-full mr-1">
          <Progress value={value} className="h-2" />
        </div>
        <div className="min-w-[35px]">
          <p className="text-sm text-muted-foreground">
            {`${Math.round(value)}%`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-1 min-h-[20px]">
        <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
          {status}
          {shouldShowSpinner && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
        </p>
      </div>
    </>
  );
}

export default function ServerUploadPage() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const {
    isUploading,
    uploadFile,
    uploadProgress,
    uploadStatus,
    statusSeverity,
    selectedFile,
    setSelectedFile
  } = useUpload();

  const validateFile = useCallback(
    (file: FileWithPath | null, fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        return false;
      }
      return true;
    },
    []
  );

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[], fileRejections: FileRejection[]) => {
      const file = acceptedFiles[0] || null;
      if (validateFile(file, fileRejections)) {
        setSelectedFile(file);
      }
    },
    [setSelectedFile, validateFile]
  );

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      await uploadFile(selectedFile);
    } finally {
      formRef.current?.reset();
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: SUPPORTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false
  });

  return (
    <Card className="max-w-[550px] mx-auto bg-white">
      <form onSubmit={handleSubmit} ref={formRef}>
        <div
          {...getRootProps()}
          className={`min-h-[50px] border-2 border-dashed rounded-lg flex items-center justify-center text-center cursor-pointer p-4 mb-1 transition-all duration-200 ease-in-out
            ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-primary hover:bg-primary/5'
            }`}
        >
          <input {...getInputProps()} />
          <div>
            <Upload
              className={`w-9 h-9 mx-auto ${
                isDragActive ? 'text-primary' : 'text-gray-900'
              }`}
            />
            <h3
              className={`text-xl font-semibold mb-1 ${
                isDragActive ? 'text-primary' : 'text-gray-900'
              }`}
            >
              {isDragActive ? 'Drop the file here...' : 'Drag files here'}
            </h3>
            <p className="text-gray-500 mb-0.5">Or</p>
            <Button
              variant="outline"
              className="px-6 hover:bg-transparent hover:border-primary"
            >
              Browse
            </Button>
            <p className="text-gray-500 mt-1 text-sm">
              Supported formats: PDF, DOCX
            </p>
            <p className="text-gray-400 text-xs mt-0.5 italic">
              Note that files with more than approximately 600 pages are not
              currently supported.
            </p>
          </div>
        </div>

        {selectedFile && (
          <Card className="bg-gray-50 p-4 mb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
                  <FileText />
                </div>
                <div className="min-w-0 max-w-[80%]">
                  <p className="text-gray-900 font-medium overflow-hidden line-clamp-2 break-words leading-tight mb-0.5">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveFile}
                disabled={isUploading}
                className="text-gray-900 hover:text-primary"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2">
              <LinearProgressWithLabel
                value={uploadProgress}
                status={uploadStatus}
              />
              {uploadStatus && statusSeverity !== 'info' && (
                <Alert
                  variant={statusSeverity as 'default' | 'destructive'}
                  className="mt-1"
                >
                  <AlertDescription>{uploadStatus}</AlertDescription>
                </Alert>
              )}
            </div>
          </Card>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isUploading || !selectedFile}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? 'Uploading...' : 'Upload File'}
        </Button>
      </form>
    </Card>
  );
}

```

File: /Users/gwelinder/code/boardAI/knowledge-base/app/actionchat/component/PDFViewer.tsx
```tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { CircularProgress } from '@/components/ui/progress';
import { X } from 'lucide-react';
import useSWRImmutable from 'swr/immutable';
import { createClient } from '@/lib/client/client';
import Link from 'next/link';
import { decodeBase64 } from '../lib/base64';
import { useSearchParams, useRouter } from 'next/navigation';
const supabase = createClient();

const fetcher = async (
  fileName: string,
  userId: string,
  fileExtension: string
) => {
  const decodedFileName = decodeURIComponent(fileName);
  const filePath = `${userId}/${decodedFileName}`;

  if (fileExtension === 'pdf') {
    const { data, error } = await supabase.storage
      .from('userfiles')
      .download(filePath);

    if (error) {
      console.error('Error downloading PDF:', error);
      return null;
    }

    const blob = new Blob([data], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  } else if (['doc', 'docx'].includes(fileExtension)) {
    const { data, error } = await supabase.storage
      .from('userfiles')
      .createSignedUrl(filePath, 300);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  }

  throw new Error('Unsupported file type');
};

export default function DocumentViewer({
  fileName,
  userId,
  hasActiveSubscription
}: {
  fileName: string;
  userId: string | undefined;
  hasActiveSubscription: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClose = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('pdf');
    url.searchParams.delete('p');
    router.replace(url.pathname + url.search);
  };

  const decodedFileName = decodeURIComponent(decodeBase64(fileName));
  const fileExtension = decodedFileName.split('.').pop()?.toLowerCase() || '';
  const page = Number(searchParams.get('p')) || 1;
  const {
    data: fileUrl,
    error,
    isLoading
  } = useSWRImmutable(
    userId && hasActiveSubscription ? [fileName, userId, fileExtension] : null,
    ([fileName, userId, fileExtension]) =>
      fetcher(fileName, userId, fileExtension)
  );

  if (!userId || !hasActiveSubscription) {
    return (
      <div className="flex flex-col justify-center items-center h-[97vh] text-center">
        <p>You need to be logged in with an active subscription to view this</p>
        <Button asChild className="mt-2">
          <Link href="/signin">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    console.error('Error loading document:', error);
    return (
      <div className="flex flex-col justify-center items-center h-[97vh] text-center">
        <p>There was an error loading the document. Please try again later.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-[55%] border-l border-gray-200 hidden sm:flex flex-col justify-center items-center h-[97vh] text-center">
        <CircularProgress />
      </div>
    );
  }

  if (!fileUrl) {
    return (
      <div className="flex flex-col justify-center items-center h-[97vh] text-center">
        <p>No file available.</p>
      </div>
    );
  }

  const isPdf = fileExtension === 'pdf';
  const isOfficeDocument = ['doc', 'docx'].includes(fileExtension);
  const iframeId = `document-viewer-${fileName.replace(/[^a-zA-Z0-9]/g, '-')}`;

  return (
    <div className="w-[55%] border-l border-gray-200 hidden sm:flex flex-row justify-center items-start overflow-hidden relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="absolute right-1 top-1 z-50 bg-white/70 hover:bg-white/90 p-0"
      >
        <X className="h-4 w-4" />
      </Button>

      {isPdf ? (
        <iframe
          key={`pdf-viewer-${page}`}
          id={iframeId}
          src={`${fileUrl}#page=${page}`}
          className="w-full h-full border-none"
          title="PDF Viewer"
          referrerPolicy="no-referrer"
          aria-label={`PDF document: ${decodedFileName}`}
        />
      ) : isOfficeDocument ? (
        <iframe
          id={iframeId}
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
          className="w-full h-full border-none"
          title="Office Document Viewer"
          referrerPolicy="no-referrer"
          aria-label={`Office document: ${decodedFileName}`}
        />
      ) : (
        <p>This file is not supported.</p>
      )}
    </div>
  );
}

```

File: /Users/gwelinder/code/boardAI/knowledge-base/app/actionchat/component/ChatComponent.tsx
```tsx
'use client';
import React, { useState, KeyboardEvent } from 'react';
import { useUIState, useActions, readStreamableValue } from 'ai/rsc';
import { type AI } from '../action';
import { UserMessage } from './ChatWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Send,
  StopCircle,
  MessageCircle,
  FileText,
  Search,
  Loader2
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { ChatScrollAnchor } from '../hooks/chat-scroll-anchor';
import { Tables } from '@/types/database';
import ErrorBoundary from './ErrorBoundary';
import { useUpload } from '../context/uploadContext';
import Link from 'next/link';
import { useSWRConfig } from 'swr';
import { cn } from '@/lib/utils';

type UserData = Pick<Tables<'users'>, 'email' | 'full_name'>;

interface ChatComponentPageProps {
  userInfo: UserData | null;
}

export default function ChatComponentPage({
  userInfo
}: ChatComponentPageProps) {
  const [inputValue, setInputValue] = useState('');
  const router = useRouter();
  const [messages, setMessages] = useUIState<typeof AI>();
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    success: boolean;
    message?: string;
    reset?: number;
  } | null>(null);
  const { submitMessage, uploadFilesAndQuery, SearchTool } =
    useActions<typeof AI>();
  const { selectedBlobs, selectedMode, setSelectedMode } = useUpload();

  const [selectedModel, setSelectedModel] = useState<'claude3' | 'chatgpt4'>(
    'claude3'
  );
  const [loadingState, setLoadingState] = useState<'searching' | 'done' | null>(
    null
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Add these handlers
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const { id } = useParams();
  const currentChatId = (id as string) || '';
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && event.shiftKey) {
      // Allow newline on Shift + Enter
    } else if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const { mutate } = useSWRConfig();
  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen overflow-hidden mx-auto">
        {userInfo && (
          <div className="max-w-[120px] bg-white rounded m-1 self-end md:self-start">
            <Select
              value={selectedModel}
              onValueChange={(value) =>
                setSelectedModel(value as 'claude3' | 'chatgpt4')
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claude3">Claude</SelectItem>
                <SelectItem value="chatgpt4">GPT-4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-center p-4">
            <h2 className="text-2xl text-gray-600 mb-4">
              Chat with our AI Assistant
            </h2>

            <p className="text-gray-600 mb-4">
              Experience the power of AI-driven conversations with our chat
              template. Ask questions on any topic and get informative responses
              instantly.
            </p>

            <div className="text-gray-600 mb-4 max-w-[600px] border border-gray-200 rounded-lg p-4 bg-blue-50/20">
              <strong>🔍 Web Search Mode:</strong> Powered by{' '}
              <a
                href="https://tavily.com/"
                target="_blank"
                rel="noopener"
                className="text-blue-600 hover:underline"
              >
                Tavily AI
              </a>
              , our search feature provides real-time, accurate information from
              across the web.
            </div>

            <div className="flex gap-4 mt-8 justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={
                        selectedMode === 'default' ? 'default' : 'outline'
                      }
                      size="lg"
                      className="w-20 h-20 rounded-xl"
                      onClick={() => setSelectedMode('default')}
                    >
                      <MessageCircle className="h-10 w-10" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Regular Chat Mode</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={selectedMode === 'pdf' ? 'default' : 'outline'}
                      size="lg"
                      className="w-20 h-20 rounded-xl"
                      onClick={() => setSelectedMode('pdf')}
                    >
                      <FileText className="h-10 w-10" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>PDF Chat Mode</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={
                        selectedMode === 'search' ? 'default' : 'outline'
                      }
                      size="lg"
                      className="w-20 h-20 rounded-xl"
                      onClick={() => setSelectedMode('search')}
                    >
                      <Search className="h-10 w-10" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Web Search Mode (Powered by Tavily AI)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto w-full px-4 md:px-8 py-4">
            {messages.map((message) => (
              <div key={message.id} className="w-full max-w-3xl mx-auto p-1">
                {message.display}
              </div>
            ))}
            <ChatScrollAnchor trackVisibility />
          </div>
        )}

        {rateLimitInfo &&
          !rateLimitInfo.success &&
          rateLimitInfo.reset &&
          userInfo && (
            <div className="bg-gray-100 rounded-lg max-w-3xl p-4 my-2 text-center mx-auto">
              <p className="mb-2">{rateLimitInfo.message}</p>
              <p className="mb-2 text-sm">
                Please wait until{' '}
                {new Date(rateLimitInfo.reset * 1000).toLocaleTimeString()} to
                send more messages.
              </p>
              <Button asChild>
                <Link href="#">Buy more credits</Link>
              </Button>
            </div>
          )}

        <form
          onSubmit={handleSubmit}
          className="sticky bottom-0 max-w-3xl mx-auto w-full p-4 flex gap-2"
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loadingState === 'searching'}
            placeholder="Type your message..."
            className="rounded-full"
          />

          <Button
            type="submit"
            size="icon"
            disabled={loadingState === 'searching'}
          >
            {loadingState === 'searching' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>

          {messages.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  {selectedMode === 'default' ? (
                    <MessageCircle className="h-4 w-4" />
                  ) : selectedMode === 'pdf' ? (
                    <FileText className="h-4 w-4" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="grid grid-cols-1 gap-1">
                  {[
                    {
                      mode: 'default',
                      icon: MessageCircle,
                      label: 'Regular Chat'
                    },
                    { mode: 'pdf', icon: FileText, label: 'PDF Chat' },
                    { mode: 'search', icon: Search, label: 'Web Search' }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.mode}
                        variant={
                          selectedMode === item.mode ? 'default' : 'ghost'
                        }
                        className="w-full justify-start gap-2"
                        onClick={() => {
                          setSelectedMode(
                            item.mode as 'default' | 'pdf' | 'search'
                          );
                          handleClose();
                        }}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </form>
      </div>
    </ErrorBoundary>
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = inputValue.trim();
    if (value === '') {
      return;
    }

    if (!userInfo) {
      setInputValue('');
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        role: 'user',
        display: (
          <UserMessage full_name={userInfo?.full_name || 'Default_user'}>
            {value}
          </UserMessage>
        ),
        chatId: currentChatId
      }
    ]);
    setLoadingState('searching');

    let response;

    // Use different query methods based on selected mode
    if (selectedMode === 'pdf') {
      response = await uploadFilesAndQuery(
        inputValue,
        currentChatId || '',
        selectedModel,
        selectedBlobs
      );
    } else if (selectedMode === 'search') {
      response = await SearchTool(
        inputValue,
        selectedModel,
        currentChatId || ''
      );
    } else {
      // Default chat mode
      response = await submitMessage(
        inputValue,
        selectedModel,
        currentChatId || ''
      );
    }

    if (response.success === false) {
      // Only set rate limit info if it's actually a rate limit issue
      if (response.reset) {
        // Rate limit messages typically include a reset timestamp
        setRateLimitInfo({
          success: response.success,
          message: response.message,
          reset: response.reset
        });
      } else {
        // For other errors, just reset the state
        setRateLimitInfo(null);
      }
      setLoadingState(null);
    } else {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          ...response,
          role: 'assistant',
          id: response.id || Date.now(),
          display: response.display
        }
      ]);
    }
    for await (const status of readStreamableValue(response.status)) {
      switch (status) {
        case 'searching':
          setLoadingState('searching');
          break;
        case 'done':
          setLoadingState(null);
          break;
        default:
          setLoadingState(null);
      }
    }
    if (response.chatId && !currentChatId) {
      const currentSearchParams = new URLSearchParams(window.location.search);
      let newUrl = `/actionchat/${response.chatId}`;

      if (currentSearchParams.toString()) {
        newUrl += `?${currentSearchParams.toString()}`;
      }
      // Refresh the chat previews to show the new chat in the list of chats
      mutate((key) => Array.isArray(key) && key[0] === 'chatPreviews');
      router.replace(newUrl, { scroll: false });
      router.refresh();
    }

    setInputValue('');
    setLoadingState(null);
  }
}

```

File: /Users/gwelinder/code/boardAI/knowledge-base/app/actionchat/action.tsx
```tsx
import React from 'react';
import {
  createAI,
  getMutableAIState,
  createStreamableUI,
  getAIState,
  createStreamableValue,
  type StreamableValue
} from 'ai/rsc';
import { streamText, generateId, embed, generateObject } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { saveChatToSupbabase } from './lib/SaveToDb';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { getUserInfo, getSession } from '@/lib/server/supabase';
import { createServerSupabaseClient } from '@/lib/server/server';
import { redirect } from 'next/navigation';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/server/server';
import { load } from 'cheerio';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import { z } from 'zod';
import { Search, RefreshCw, Loader2 } from 'lucide-react';

import {
  BotMessage,
  UserMessage,
  InternetSearchToolResults
} from './component/ChatWrapper';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

const SYSTEM_TEMPLATE = `You are a helpful assistant. Answer all questions to the best of your ability. Provide helpful answers in markdown.`;

const getModel = (selectedModel: 'claude3' | 'chatgpt4') => {
  if (selectedModel === 'claude3') {
    return anthropic('claude-3-5-sonnet-20241022');
  } else if (selectedModel === 'chatgpt4') {
    return openai('gpt-4o');
  }
  return anthropic('claude-3-5-sonnet-20241022');
};

const zodSchemaSearch = z.object({
  variation1: z
    .string()
    .min(1)
    .describe(
      'A variation that precisely identifies the main topic or key concept of the query, aiming to match specific terminology used in authoritative sources. Output should be in English and is required.'
    ),
  variation2: z
    .string()
    .min(1)
    .describe(
      'A variation that focuses on the context or domain relevant to the question, tailored to find documents within the same field or area of interest. Output should be in English and is required.'
    ),
  variation3: z
    .string()
    .min(1)
    .describe(
      'A variation that focuses on potential applications or implications of the topic, to target documents discussing related outcomes or consequences. Output should be in English and is required.'
    )
});

async function submitMessage(
  currentUserMessage: string,
  model_select: 'claude3' | 'chatgpt4',
  chatId: string
): Promise<SubmitMessageResult> {
  'use server';

  const CurrentChatSessionId = chatId || uuidv4();

  const aiState = getMutableAIState<typeof AI>();
  const status = createStreamableValue('searching');

  const userInfo = await getUserInfo();
  if (!userInfo) {
    status.done('done');
    return {
      success: false,
      message: 'User not found. Please try again later.',
      limit: 0,
      remaining: 0,
      reset: 0,
      status: status.value
    };
  }
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '24h') // 30 msg per 24 hours
  });
  const { success, limit, reset, remaining } = await ratelimit.limit(
    `ratelimit_${userInfo.id}`
  );
  if (!success) {
    status.done('done');
    console.log('Rate limit exceeded. Please try again later.');
    console.log('Limit:', limit);
    console.log('Remaining:', remaining);
    console.log('Reset:', reset);
    return {
      success: false,
      message: 'Rate limit exceeded. Please try again later.',
      limit,
      remaining,
      reset,
      status: status.value
    };
  }
  // Update AI state with new message.
  aiState.update([
    ...aiState.get(),
    {
      role: 'user',
      content: currentUserMessage
    }
  ]);
  // We only check on the very first message if we have a cached result.
  // We don't want to check on every message since the user could ask questions like: "Tell me more"
  // and we don't want to check the cache on those.
  if (!chatId) {
    const cachedResult: string | null = await redis.get(
      `text_${currentUserMessage}`
    );
    if (cachedResult) {
      const uiStream = createStreamableUI(
        <Card className="w-full">
          <CardContent className="flex flex-col space-y-2 p-4">
            <p className="text-sm text-muted-foreground italic text-center">
              Found relevant website. Scraping data...
            </p>
            <div className="flex justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </CardContent>
        </Card>
      );

      aiState.done([
        ...aiState.get(),
        { role: 'assistant', content: cachedResult }
      ]);

      const chunkSize = 10;
      const baseDelay = 100;
      const variation = 5;
      const textStream = createStreamableValue();

      (async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Update UI to show BotMessage with streaming content
        uiStream.update(<BotMessage textStream={textStream.value} />);
        status.update('generating');
        for (let i = 0; i < cachedResult.length; i += chunkSize) {
          const chunk = cachedResult.slice(i, i + chunkSize);

          textStream.append(chunk);

          await new Promise((resolve) =>
            setTimeout(
              resolve,
              baseDelay + (Math.random() * (variation * 2) - variation)
            )
          );
        }
        uiStream.update(<BotMessage textStream={textStream.value} />);
        if (userInfo?.id) {
          await saveChatToSupbabase(
            CurrentChatSessionId,
            userInfo.id,
            currentUserMessage,
            cachedResult
          );
        }
        textStream.done();
        status.done('done');
        uiStream.done();
      })().catch((e) => {
        console.error('Error in chat handler:', e);
        uiStream.error(
          <Card className="w-full bg-destructive/10">
            <CardContent className="p-4">
              <p className="text-sm text-destructive text-center">
                An error occurred while processing your request. Please try
                again later.
              </p>
            </CardContent>
          </Card>
        );
        status.done('done');
      });

      return {
        id: generateId(),
        display: uiStream.value,
        chatId: CurrentChatSessionId,
        status: status.value
      };
    }
  }
  const uiStream = createStreamableUI(
    <Card className="w-full">
      <CardContent className="flex flex-col space-y-2 p-4">
        <p className="text-sm text-muted-foreground italic text-center">
          Found relevant website. Scraping data...
        </p>
        <div className="flex justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </CardContent>
    </Card>
  );
  const dataStream = createStreamableValue();
  (async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate a delay

    // Define the system prompt for query optimization
    const contextualizeQSystemPrompt = `
      As an expert in information retrieval, reformulate the user's query to optimize search results. Include the user's original question.
    
      The goal is to produce reformulated questions that capture the essence of the query and generate optimized search terms.
    
      Also generate variations of the query to improve search results and find the most up-to-date information. The variations should focus on:
      1. Precisely identifying the main topic or key concept.
      2. Focusing on the relevant context or domain.
      3. Exploring potential applications or implications of the topic.
    
      All questions and variations should be in the same language as the users question.
    
      Original question: ${currentUserMessage}
    `;

    // Generate search query variations using AI
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: contextualizeQSystemPrompt,
      schema: zodSchemaSearch,
      mode: 'json',
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'improve_web',
        metadata: {
          userId: userInfo.id,
          chatId: CurrentChatSessionId,
          isNewChat: !chatId
        },
        recordInputs: true,
        recordOutputs: true
      },
      messages: [
        ...aiState
          .get()
          .slice(-7)
          .map((info) => ({
            role: info.role,
            content: info.content,
            name: info.name
          }))
      ]
    });

    // Filter out empty queries
    const searchQueries = [
      object.variation1,
      object.variation2,
      object.variation3
    ].filter((query) => query !== undefined && query.trim() !== '');

    // Now update the UI with the generated queries
    uiStream.update(
      <Card className="w-full">
        <CardContent className="flex flex-col space-y-4 p-4">
          <h3 className="text-lg font-semibold text-primary">
            I&apos;ve refined your query into these specific search patterns:
          </h3>

          <div className="space-y-2">
            {searchQueries.map((query: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm italic">{query}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center space-x-2">
            <p className="text-sm text-muted-foreground italic">
              Analyzing results to provide a comprehensive response...
            </p>
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );

    const { textStream } = streamText({
      model: getModel(model_select),
      maxTokens: 4000,
      temperature: 0,
      frequencyPenalty: 0.5,
      system: SYSTEM_TEMPLATE,
      messages: [
        ...aiState
          .get()
          .slice(-7) // Limit to the last 7 messages to avoid overwhelming the model
          .map((info) => ({
            role: info.role,
            content: info.content,
            name: info.name
          }))
      ],
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'general_chat',
        metadata: {
          userId: userInfo.id,
          chatId: CurrentChatSessionId,
          isNewChat: !chatId
        },
        recordInputs: true,
        recordOutputs: true
      },
      onFinish: async (event) => {
        const { text, usage } = event;
        const { promptTokens, completionTokens, totalTokens } = usage;
        console.log('Prompt Tokens:', promptTokens);
        console.log('Completion Tokens:', completionTokens);
        console.log('Total Tokens:', totalTokens);
        aiState.done([...aiState.get(), { role: 'assistant', content: text }]);

        await saveChatToSupbabase(
          CurrentChatSessionId,
          userInfo.id,
          currentUserMessage,
          text
        );

        // Only cache the very first message
        if (!chatId) {
          await redis.set(`text_${currentUserMessage}`, text, {
            ex: 60 * 60 * 24 * 90 // 90 days in seconds (3 month)
          });
        }
      }
    });

    let isFirstChunk = true;

    for await (const textDelta of textStream) {
      if (isFirstChunk) {
        // Only create the UI stream when we receive the first chunk
        uiStream.update(<BotMessage textStream={dataStream.value} />);
        isFirstChunk = false;
      }
      dataStream.append(textDelta);
    }
    // We update here to prevent the UI from flickering
    uiStream.update(<BotMessage textStream={dataStream.value} />);

    dataStream.done();
    uiStream.done();
    status.done('done');
  })().catch((e) => {
    console.error('Error in chat handler:', e);
    uiStream.error(
      <Card className="w-full bg-destructive/10">
        <CardContent className="p-4">
          <p className="text-sm text-destructive text-center">
            An error occurred while processing your request. Please try again
            later.
          </p>
        </CardContent>
      </Card>
    );
    status.done('done');
  });
  return {
    id: generateId(),
    display: uiStream.value,
    chatId: CurrentChatSessionId,
    status: status.value
  };
}

type ResetResult = {
  success: boolean;
  message: string;
};
async function resetMessages(): Promise<ResetResult> {
  'use server';

  const session = await getSession();
  if (!session) {
    return {
      success: false,
      message: 'Error: User not found. Please try again later.'
    };
  }

  const aiState = getMutableAIState<typeof AI>();

  try {
    // Clear all messages from the AI state

    // Clear all messages from the AI state by setting it to an empty array
    aiState.update([]);

    // Call done to finalize the state update
    aiState.done([]);
  } catch (error) {
    console.error('Error resetting chat messages:', error);
    return {
      success: false,
      message:
        'Error resetting chat messages. Please try again later or contact support.'
    };
  }
  redirect('/actionchat');
}

function sanitizeFilename(filename: string): string {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function querySupabaseVectors(
  queryEmbedding: number[],
  userId: string,
  selectedFiles: string[],
  topK: number = 40,
  similarityThreshold: number = 0.78
): Promise<
  Array<{
    pageContent: string;
    metadata: {
      text: string;
      title: string;
      timestamp: string;
      ai_title: string;
      ai_description: string;
      ai_maintopics: string[];
      ai_keyentities: string[];
      filterTags: string;
      page: number;
      totalPages: number;
      chunk: number;
      totalChunks: number;
      similarity: number;
    };
  }>
> {
  const supabase = await createServerSupabaseClient();

  // Convert embedding array to string format for query
  const embeddingString = `[${queryEmbedding.join(',')}]`;

  const { data: matches, error } = await supabase.rpc('match_documents', {
    query_embedding: embeddingString,
    match_count: topK,
    filter_user_id: userId,
    filter_files: selectedFiles,
    similarity_threshold: similarityThreshold
  });

  if (error) {
    console.error('Error querying vectors:', error);
    throw error;
  }

  return (
    matches?.map((match) => ({
      pageContent: match.text_content,
      metadata: {
        text: match.text_content,
        title: match.title,
        timestamp: match.doc_timestamp,
        ai_title: match.ai_title,
        ai_description: match.ai_description,
        ai_maintopics: match.ai_maintopics,
        ai_keyentities: match.ai_keyentities,
        filterTags: match.filter_tags,
        page: match.page_number,
        totalPages: match.total_pages,
        chunk: match.chunk_number,
        totalChunks: match.total_chunks,
        similarity: match.similarity
      }
    })) || []
  );
}

async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-large'),
    value: text
  });
  return embedding;
}

async function getSelectedDocumentsMetadata(
  userId: string,
  selectedFiles: string[]
) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('vector_documents')
    .select('title, ai_title, ai_description, ai_maintopics, primary_language')
    .eq('user_id', userId)
    .in('filter_tags', selectedFiles)
    .eq('page_number', 1);

  if (error) {
    console.error('Error fetching document metadata:', error);
    return [];
  }

  return data || [];
}

// Update the uploadFilesAndQuery function
async function uploadFilesAndQuery(
  currentUserMessage: string,
  chatId: string,
  model_select: 'claude3' | 'chatgpt4',
  selectedFiles: string[]
): Promise<SubmitMessageResult> {
  'use server';

  const CurrentChatSessionId = chatId || uuidv4();
  const aiState = getMutableAIState<typeof AI>();
  const status = createStreamableValue('searching');
  const userInfo = await getUserInfo();

  if (!userInfo) {
    status.done('done');
    return {
      success: false,
      message: 'User not found. Please try again later.',
      limit: 0,
      remaining: 0,
      reset: 0,
      status: status.value
    };
  }
  aiState.update([
    ...aiState.get(),
    {
      role: 'user',
      content: currentUserMessage
    }
  ]);

  const uiStream = createStreamableUI(
    <Card className="w-full">
      <CardContent className="flex flex-col space-y-2 p-4">
        <p className="text-sm text-muted-foreground italic text-center">
          Searching...
        </p>
        <div className="flex justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </CardContent>
    </Card>
  );

  const sanitizedFilenames = selectedFiles.map((filename) => {
    // Split the filename and timestamp
    const [name, timestamp] = filename.split('[[');

    // Sanitize only the filename part
    const sanitizedName = sanitizeFilename(name);

    // Reconstruct the filename with the original timestamp
    return timestamp ? `${sanitizedName}[[${timestamp}` : sanitizedName;
  });

  const documentsMetadata = await getSelectedDocumentsMetadata(
    userInfo.id,
    sanitizedFilenames
  );

  // Create context for query optimization
  const documentContext = documentsMetadata
    .map((doc) => {
      const parts = [`Document Title: ${doc.title}`];
      if (doc.ai_title) parts.push(`Improved Title: ${doc.ai_title}`);
      if (doc.ai_description) parts.push(`Description: ${doc.ai_description}`);
      if (doc.ai_maintopics && Array.isArray(doc.ai_maintopics)) {
        parts.push(`Main Topics: ${doc.ai_maintopics.join(', ')}`);
      }
      if (doc.primary_language)
        parts.push(
          `Primary Language used in the document: ${doc.primary_language}`
        );
      return parts.join('\n');
    })
    .join('\n\n');

  // Generate optimized queries
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    system: `You are an expert in information retrieval. Your task is to reformulate the user's query to optimize search results for vector similarity search.
    
Available documents context:
${documentContext}

Generate three variations of the query that:
1. Precisely identifies the main topic or key concept, matching terminology from the available documents
2. Focuses on the context or domain relevant to the question
3. Explores potential applications or implications of the topic

Keep the variations focused on the content available in the provided documents.`,
    schema: zodSchemaSearch,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'improve_general',
      metadata: {
        userId: userInfo.id,
        chatId: CurrentChatSessionId,
        isNewChat: !chatId
      },
      recordInputs: true,
      recordOutputs: true
    },
    messages: [
      ...aiState
        .get()
        .slice(-7) // Limit to the last 7 messages to avoid overwhelming the model
        .map((info) => ({
          role: info.role,
          content: info.content,
          name: info.name
        }))
    ]
  });

  // Filter out empty queries
  const searchQueries = [
    object.variation1,
    object.variation2,
    object.variation3
  ].filter((query) => query !== undefined && query.trim() !== '');

  // Now update the UI stream after searchQueries is defined
  uiStream.update(
    <Card className="w-full">
      <CardContent className="flex flex-col space-y-4 p-4">
        <h3 className="text-lg font-semibold text-primary">
          I&apos;ve refined your query into these specific search patterns:
        </h3>

        <div className="space-y-2">
          {searchQueries.map((query: string, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm italic">{query}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center space-x-2">
          <p className="text-sm text-muted-foreground italic">
            Analyzing results to provide a comprehensive response...
          </p>
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </CardContent>
    </Card>
  );

  const dataStream = createStreamableValue();
  (async () => {
    const embeddings = await Promise.all(
      searchQueries.map((query) => embedQuery(query))
    );

    // Create array of promises for vector searches
    const searchResultsPromises = await Promise.all(
      embeddings.map(
        (embedding) =>
          querySupabaseVectors(
            embedding,
            userInfo.id,
            sanitizedFilenames,
            40, // Adjust topK as needed. There is a hard limit of 200 results included in the RPC.
            0.5
          ) // Adjust similarity threshold as needed. Usually do not set it higher than 0.7 since it may not find any results.
        // You can optimize the systemprompt for the new queries to improve the results.
      )
    );

    // Flatten and deduplicate results
    const allSearchResults = searchResultsPromises.flat();

    // Deduplicate results based on content and page number
    const uniqueResults = allSearchResults.reduce(
      (acc, current) => {
        const isDuplicate = acc.some(
          (item) =>
            item.metadata.title === current.metadata.title &&
            item.metadata.page === current.metadata.page
        );
        if (!isDuplicate) {
          acc.push(current);
        }
        return acc;
      },
      [] as typeof allSearchResults
    );

    const searchResults = uniqueResults.sort(
      (a, b) => b.metadata.similarity - a.metadata.similarity
    );

    const formattedSearchResults = (() => {
      // Group results by document (using title and timestamp as identifier)
      const groupedResults = searchResults.reduce(
        (acc, result) => {
          const key = `${result.metadata.title}[[${result.metadata.timestamp}]]`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(result);
          return acc;
        },
        {} as Record<string, typeof searchResults>
      );

      // Sort and format each group
      return Object.entries(groupedResults)
        .map(([_key, docs]) => {
          // Sort documents by page number
          docs.sort((a, b) => a.metadata.page - b.metadata.page);

          // Extract common metadata (only once per document)
          const {
            ai_title,
            ai_description,
            ai_maintopics,
            ai_keyentities,
            title,
            timestamp
          } = docs[0].metadata;

          // Format the document group
          return `
<document>
  <metadata>
    <title>${title}</title>
    <timestamp>${timestamp}</timestamp>
    <ai_title>${ai_title}</ai_title>
    <ai_description>${ai_description}</ai_description>
    <ai_maintopics>${ai_maintopics}</ai_maintopics>
    <ai_keyentities>${ai_keyentities}</ai_keyentities>
  </metadata>
  <content>
    ${docs
      .map(
        (doc) => `
    <page number="${doc.metadata.page}">
      <reference_link>[${doc.metadata.title}, s.${doc.metadata.page}](<?pdf=${doc.metadata.title.replace(/ /g, '_').trim()}&p=${doc.metadata.page}>)</reference_link>
      <text>${doc.pageContent}</text>
    </page>`
      )
      .join('')}
  </content>
</document>`;
        })
        .join('\n');
    })();

    const systemPromptTemplate = (() => {
      // Get actual document examples from search results
      const documentExamples = searchResults
        .slice(0, 2)
        .map(
          (result) =>
            `[${result.metadata.title}, s.${result.metadata.page}](<?pdf=${result.metadata.title.replace(/ /g, '_').trim()}&p=${result.metadata.page}>)`
        )
        .join(' and ');
      return `
<instructions>
Based on the content in the search results extracted from the uploaded files, please provide an answer to the question. The search results contain information relevant to the query.

IMPORTANT: Every time you use information from the documents, you must immediately add a reference after the relevant information. The reference MUST be in Markdown link format and include the document title and page number as a search parameter.

The Markdown link format must be exactly as follows:

[Document title, p.X](<?pdf=Document_title&p=X>)

where X is the page number.

For example:
"The law states that... ${documentExamples}"

This Markdown link format is crucial as it makes the references clickable and leads directly to the relevant page in the document. Please use this Markdown reference format consistently throughout your answer.

If the given content does not seem to contain sufficient information to answer the question, please suggest asking the question differently or provide more context. Do your best to help based on the available information.

If relevant information cannot be found to answer the question, please inform about this and suggest a rephrasing or request additional details.

Please respond in the same language as the user's question.
</instructions>

<search_results>
${formattedSearchResults}
</search_results>
`;
    })();

    const { textStream } = streamText({
      model: getModel(model_select),
      system: systemPromptTemplate,
      messages: [
        ...aiState
          .get()
          .slice(-7) // Limit to the last 7 messages to avoid overwhelming the model
          .map((info) => ({
            role: info.role,
            content: info.content,
            name: info.name
          }))
      ],
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'chat_to_pdf',
        metadata: {
          userId: userInfo.id,
          chatId: CurrentChatSessionId,
          isNewChat: !chatId
        },
        recordInputs: true,
        recordOutputs: true
      },
      onFinish: async (event) => {
        const { usage, text } = event;
        const { promptTokens, completionTokens, totalTokens } = usage;
        console.log('Prompt Tokens:', promptTokens);
        console.log('Completion Tokens:', completionTokens);
        console.log('Total Tokens:', totalTokens);
        await saveChatToSupbabase(
          CurrentChatSessionId,
          userInfo.id,
          currentUserMessage,
          text
        );

        aiState.done([...aiState.get(), { role: 'assistant', content: text }]);
      }
    });

    let isFirstChunk = true;

    for await (const textDelta of textStream) {
      if (isFirstChunk) {
        // Only create the UI stream when we receive the first chunk
        uiStream.update(<BotMessage textStream={dataStream.value} />);
        isFirstChunk = false;
      }
      dataStream.append(textDelta);
    }
    // We update here to prevent the UI from flickering
    uiStream.update(<BotMessage textStream={dataStream.value} />);

    dataStream.done();
    uiStream.done();
    status.done('done');
  })().catch((e) => {
    console.error('Error in chat handler:', e);
    uiStream.error(
      <Card className="w-full bg-destructive/10">
        <CardContent className="p-4">
          <p className="text-sm text-destructive text-center">
            An error occurred while processing your request. Please try again
            later.
          </p>
        </CardContent>
      </Card>
    );
    status.done('done');
  });

  return {
    id: generateId(),
    display: uiStream.value,
    chatId: CurrentChatSessionId,
    status: status.value
  };
}

type TavilySearchResult = {
  title: string;
  url: string;
  content: string;
  raw_content: string;
  score: number;
};

type TavilyAPIResponse = {
  answer: string;
  query: string;
  response_time: string;
  follow_up_questions: string[];
  images: string[];
  results: TavilySearchResult[];
};

// Type for our processed search result
type ProcessedSearchResult = {
  title: string;
  url: string;
  content: string;
};

interface SearchResult {
  title: string;
  url: string;
  content: string;
}
async function SearchTool(
  currentUserMessage: string,
  model_select: 'claude3' | 'chatgpt4',
  chatId: string
): Promise<SubmitMessageResult> {
  'use server';

  const status = createStreamableValue('searching');
  const stream = createStreamableUI(
    <Card className="w-full">
      <CardContent className="flex flex-col space-y-2 p-4">
        <p className="text-sm text-muted-foreground italic text-center">
          Searching for relevant information...
        </p>
        <div className="flex justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </CardContent>
    </Card>
  );

  const userInfo = await getUserInfo();
  if (!userInfo) {
    status.done('done');
    return {
      success: false,
      message: 'User not found. Please try again later.',
      limit: 0,
      remaining: 0,
      reset: 0,
      status: status.value
    };
  }

  const CurrentChatSessionId = chatId || uuidv4();

  // Initialize AI state with user's message
  const aiState = getMutableAIState<typeof AI>();
  aiState.update([
    ...aiState.get(),
    {
      role: 'user',
      content: currentUserMessage
    }
  ]);

  let searchResults: SearchResult[] = [];
  let searchQueries: string[] = [];
  const nhm = new NodeHtmlMarkdown();
  const dataStream = createStreamableValue();

  (async () => {
    // Prompt to generate search query variations
    const contextualizeQSystemPrompt = `
      As an expert in information retrieval, reformulate the user's query to optimize search results. Include the user's original question.
    
      The goal is to produce reformulated questions that capture the essence of the query and generate optimized search terms.
    
      Also generate variations of the query to improve search results and find the most up-to-date information. The variations should focus on:
      1. Precisely identifying the main topic or key concept.
      2. Focusing on the relevant context or domain.
      3. Exploring potential applications or implications of the topic.
    
      All questions and variations should be in the same language as the users question.
    
      Original question: ${currentUserMessage}
    `;

    // Generate search query variations using AI
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: contextualizeQSystemPrompt,
      schema: zodSchemaSearch,
      mode: 'json',
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'improve_web',
        metadata: {
          userId: userInfo.id,
          chatId: CurrentChatSessionId,
          isNewChat: !chatId
        },
        recordInputs: true,
        recordOutputs: true
      },
      messages: [
        ...aiState
          .get()
          .slice(-7)
          .map((info) => ({
            role: info.role,
            content: info.content,
            name: info.name
          }))
      ]
    });

    // Filter out empty queries and assign to the outer scope variable
    searchQueries = [
      object.variation1,
      object.variation2,
      object.variation3
    ].filter((query) => query !== undefined && query.trim() !== '');

    // Now update the UI stream after searchQueries is defined
    stream.update(
      <Card className="w-full">
        <CardContent className="flex flex-col space-y-4 p-4">
          <h3 className="text-lg font-semibold text-primary">
            I&apos;ve refined your query into these specific search patterns:
          </h3>

          <div className="space-y-2">
            {searchQueries.map((query: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm italic">{query}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center space-x-2">
            <p className="text-sm text-muted-foreground italic">
              Analyzing results to provide a comprehensive response...
            </p>
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );

    // Perform Tavily search for each query variation
    // Note: This approach uses multiple queries, which can provide better results but is more expensive.
    // Consider your monthly API limit when using this method.
    // This method of creating new queries can be applied to RAG aswell to improve the extraction of data out of a Vector Database.
    const searchPromises = searchQueries.map(async (query) => {
      const response = await fetch('https://api.tavily.com/search', {
        cache: 'no-store',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query,
          search_depth: 'advanced',
          include_answer: false,
          include_images: false,
          include_raw_content: false,
          max_results: 2
        })
      });

      const data: TavilyAPIResponse = await response.json();

      // Process each search result
      return Promise.all(
        data.results.map(
          async (
            result: TavilySearchResult
          ): Promise<ProcessedSearchResult> => {
            try {
              // Attempt to fetch and parse content
              const contentResponse = await fetch(result.url, {
                cache: 'no-store'
              });

              if (!contentResponse.ok) {
                return {
                  title: result.title,
                  url: result.url,
                  content: result.content
                };
              }

              const contentHtml = await contentResponse.text();
              const $ = load(contentHtml);

              // First get the full body content with basic cleaning
              const bodyContent = $('body')
                .clone()
                .find('script, style, nav, header, footer, iframe, noscript')
                .remove()
                .end();

              // Then try to identify main content area within the body
              const mainSelectors = [
                'article',
                'main',
                '.main-content',
                '#main-content',
                '.post-content',
                '.article-content',
                '.entry-content',
                '.content'
              ];

              let mainContent = null;
              for (const selector of mainSelectors) {
                const found = bodyContent.find(selector);
                if (found.length) {
                  console.log('Found main content:', selector);
                  mainContent = found;
                  break;
                }
              }

              // Use main content if found, otherwise use cleaned body
              const contentRAW = mainContent
                ? mainContent.html()
                : bodyContent
                    .find(
                      'button, .button, [role="button"], .menu, .navigation, .cookie-notice, .popup, .modal, .banner, .advertisement, .newsletter, .widget'
                    )
                    .remove()
                    .end()
                    .html();

              // Convert to markdown with proper sanitization
              const content = nhm.translate(contentRAW || '');

              return {
                title: result.title,
                url: result.url,
                content: content || result.content // Use parsed content if available, otherwise fall back to Tavily content
              };
            } catch (error) {
              console.error(`Error fetching content for ${result.url}:`, error);
              // Fall back to Tavily content on any error
              return {
                title: result.title,
                url: result.url,
                content: result.content // Use Tavily's content as fallback
              };
            }
          }
        )
      );
    });
    // Combine and deduplicate search results
    const searchResultsArray = await Promise.all(searchPromises);
    const uniqueSearchResults = searchResultsArray
      .flat()
      .reduce((acc, result) => {
        if (!acc.some((r: SearchResult) => r.url === result.url)) {
          acc.push(result);
        }
        return acc;
      }, [] as SearchResult[]);

    searchResults = uniqueSearchResults;

    // Update UI with search results and preparation message
    stream.update(
      <>
        <InternetSearchToolResults
          searchResults={searchResults.map((result) => ({
            title: result.title,
            url: result.url
          }))}
        />
        <Card className="w-full">
          <CardContent className="flex justify-center items-center p-4 mb-2 mt-2 rounded-md bg-gradient-to-br from-blue-100 to-blue-50 dark:from-zinc-900 dark:to-zinc-800 shadow-sm">
            <p className="text-muted-foreground italic">
              Preparing response...
            </p>
            <Loader2 className="h-4 w-4 animate-spin ml-2" />
          </CardContent>
        </Card>
      </>
    );

    // Format search results for AI prompt
    const formattedSearchResults = searchResults
      .map(
        (result) =>
          `<result>
        <title>${result.title}</title>
        <url>${result.url}</url>
        <content>${result.content}</content>
      </result>`
      )
      .join('\n');

    // Create system prompt for AI to generate response
    const systemPromptTemplate = `
<search_results>
${formattedSearchResults}
</search_results>

<instructions>
Based on the search results, provide a comprehensive and well-structured response to the user's question following these guidelines:

1. Format & Structure:
   - Break down complex information into clear paragraphs
   - Use bullet points when listing multiple items
   - Ensure the response flows logically

2. Source Citation:
   - Cite sources immediately after each claim or piece of information using: [Source Title](URL)
   - Do not group citations at the end
   - Use direct quotes sparingly and when particularly relevant


If the search results are insufficient or unclear:
- Acknowledge the limitations
- Specify what additional information would be helpful
- Suggest how the user might rephrase their question

Remember to maintain a professional yet conversational tone throughout the response.
</instructions>
`;
    console.log('Search Results:', systemPromptTemplate);
    // Generate AI response based on search results
    const { textStream } = streamText({
      model: getModel(model_select),
      system: systemPromptTemplate,
      messages: [
        ...aiState
          .get()
          .slice(-7) // Limit to the last 7 messages to avoid overwhelming the model
          .map((info) => ({
            role: info.role,
            content: info.content,
            name: info.name
          }))
      ],
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'chat_to_web',
        metadata: {
          userId: userInfo.id,
          chatId: CurrentChatSessionId,
          isNewChat: !chatId
        },
        recordInputs: true,
        recordOutputs: true
      },
      onFinish: async (event) => {
        const { usage, text } = event;
        const { promptTokens, completionTokens, totalTokens } = usage;
        console.log('Prompt Tokens:', promptTokens);
        console.log('Completion Tokens:', completionTokens);
        console.log('Total Tokens:', totalTokens);
        const formattedSources = searchResults.map((result) => ({
          title: result.title,
          url: result.url
        }));

        await saveChatToSupbabase(
          CurrentChatSessionId,
          userInfo.id,
          currentUserMessage,
          text,
          formattedSources // Pass the formatted sources
        );

        aiState.done([...aiState.get(), { role: 'assistant', content: text }]);
      }
    });

    let isFirstChunk = true;
    for await (const textDelta of textStream) {
      if (isFirstChunk) {
        // Initialize the UI stream with the first chunk
        stream.update(
          <>
            <BotMessage textStream={dataStream.value} />
            <InternetSearchToolResults
              searchResults={searchResults.map((result) => ({
                title: result.title,
                url: result.url
              }))}
            />
          </>
        );
        isFirstChunk = false;
      }

      dataStream.append(textDelta);
    }
    // We update here to prevent the UI from flickering
    stream.update(
      <>
        <BotMessage textStream={dataStream.value} />
        <InternetSearchToolResults
          searchResults={searchResults.map((result) => ({
            title: result.title,
            url: result.url
          }))}
        />
      </>
    );
    dataStream.done();
    status.done('done');
    stream.done();
  })().catch((e) => {
    console.error('Error in chat handler:', e);
    stream.error(
      <Card className="w-full bg-destructive/10">
        <CardContent className="p-4">
          <p className="text-sm text-destructive text-center">
            An error occurred while processing your request. Please try again
            later.
          </p>
        </CardContent>
      </Card>
    );
    status.done('done');
  });

  return {
    id: generateId(),
    display: stream.value,
    chatId: CurrentChatSessionId,
    status: status.value
  };
}
type Source = {
  title: string;
  url: string;
};
export type ServerMessage = {
  role: 'user' | 'assistant';
  content: string;
  name?: string;
  sources?: Source[];
};

export type ClientMessage = {
  id: string | number | null;
  role: 'user' | 'assistant';
  display: React.ReactNode;
  chatId?: string | null;
};

const initialAIState: ServerMessage[] = [];
const initialUIState: ClientMessage[] = [];

export type SubmitMessageResult = {
  success?: boolean;
  message?: string;
  limit?: number;
  remaining?: number;
  reset?: number;
  id?: string;
  display?: React.ReactNode;
  chatId?: string;
  status: StreamableValue<string, any>;
};

type Actions = {
  submitMessage: (
    currentUserMessage: string,
    model_select: 'claude3' | 'chatgpt4',
    chatId: string
  ) => Promise<SubmitMessageResult>;
  uploadFilesAndQuery: (
    currentUserMessage: string,
    chatId: string,
    model_select: 'claude3' | 'chatgpt4',
    selectedFiles: string[]
  ) => Promise<SubmitMessageResult>;
  SearchTool: (
    currentUserMessage: string,
    model_select: 'claude3' | 'chatgpt4',
    chatId: string
  ) => Promise<SubmitMessageResult>;
  resetMessages: () => Promise<ResetResult>;
};

export const AI = createAI<ServerMessage[], ClientMessage[], Actions>({
  actions: {
    submitMessage,
    uploadFilesAndQuery,
    SearchTool,
    resetMessages
  },
  onGetUIState: async () => {
    'use server';

    const historyFromApp = getAIState();

    if (historyFromApp) {
      const session = await getSession();
      return historyFromApp.map((message: ServerMessage) => ({
        id: generateId(),
        role: message.role,
        display:
          message.role === 'user' ? (
            <UserMessage
              full_name={session?.user_metadata.full_name || 'Unknown'}
            >
              {message.content}
            </UserMessage>
          ) : (
            <>
              <BotMessage>{message.content}</BotMessage>
              {message.sources && message.sources.length > 0 && (
                <InternetSearchToolResults searchResults={message.sources} />
              )}
            </>
          )
      }));
    } else {
      return;
    }
  },
  initialUIState,
  initialAIState
});

```

File: /Users/gwelinder/code/boardAI/knowledge-base/app/actionchat/layout.tsx
```tsx
import React from 'react';
import { createServerSupabaseClient } from '@/lib/server/server';
import { getUserInfo } from '@/lib/server/supabase';
import ChatHistoryDrawer from './component/UserChatList';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { unstable_noStore as noStore } from 'next/cache';
import { Tables } from '@/types/database';
import { UploadProvider } from './context/uploadContext';
import { AI as AiProvider } from './action';

export const maxDuration = 60;

async function fetchData(
  supabase: SupabaseClient<Database>,
  limit: number = 30,
  offset: number = 0
) {
  noStore();
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select(
        `
          id,
          created_at,
          chat_title,
          first_message:chat_messages!inner(content)
        `
      )
      .order('created_at', { ascending: false })
      .limit(1, { foreignTable: 'chat_messages' })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return data.map((session) => ({
      id: session.id,
      firstMessage:
        session.chat_title ||
        session.first_message[0]?.content ||
        'No messages yet',
      created_at: session.created_at
    }));
  } catch (error) {
    console.error('Error fetching chat previews:', error);
    return [];
  }
}

type UserInfo = Pick<Tables<'users'>, 'full_name' | 'email' | 'id'>;
type ChatPreview = {
  id: string;
  firstMessage: string;
  created_at: string;
};

export default async function Layout(props: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const userData = await getUserInfo();

  let userInfo: UserInfo;
  let initialChatPreviews: ChatPreview[] = [];

  if (userData) {
    userInfo = userData;
    initialChatPreviews = await fetchData(supabase, 30, 0);
  } else {
    userInfo = {
      id: '',
      full_name: '',
      email: ''
    };
  }

  return (
    <div className="flex">
      <UploadProvider userId={userInfo.id}>
        <AiProvider>
          <ChatHistoryDrawer
            userInfo={userInfo}
            initialChatPreviews={initialChatPreviews}
          />
        </AiProvider>
        {props.children}
      </UploadProvider>
    </div>
  );
}

```

File: /Users/gwelinder/code/boardAI/knowledge-base/app/api/perplexity/route.ts
```ts
import { NextRequest, NextResponse } from 'next/server';
import { streamText, CoreMessage, Message } from 'ai';
import { saveChatToSupbabase } from './SaveToDb';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { getSession } from '@/lib/server/supabase';
import { perplexity } from '@ai-sdk/perplexity';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '24h') // 30 msg per 24 hours
  });

  const { success, limit, reset, remaining } = await ratelimit.limit(
    `ratelimit_${session.id}`
  );
  if (!success) {
    return new NextResponse('Rate limit exceeded. Please try again later.', {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(reset * 1000).toISOString()
      }
    });
  }

  const body = await req.json();
  const messages: Message[] = body.messages ?? [];
  const chatSessionId = body.chatId;
  if (!chatSessionId) {
    return new NextResponse('Chat session ID is empty.', {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  const fullMessages: CoreMessage[] = [
    {
      role: 'system',
      content: `
    - You are a helpful assistant that always provides clear and accurate answers! For helpful information use Markdown. Use remark-math formatting for Math Equations
    - References: Reference official documentation and trusted sources where applicable. Link to sources using Markdown Links.
    `
    },
    ...messages.map((message) => ({
      role: message.role as 'user' | 'assistant' | 'system',
      content: message.content
    }))
  ];

  try {
    const result = streamText({
      model: perplexity('sonar-pro'),
      messages: fullMessages,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'perplexity',
        metadata: {
          userId: session.id,
          chatId: chatSessionId
        },
        recordInputs: true,
        recordOutputs: true
      },
      onFinish: async (event) => {
        // Access the experimental provider metadata
        const metadata = event.experimental_providerMetadata?.perplexity;
        if (metadata) {
          console.log('Citations:', metadata.citations);
          console.log('Usage:', metadata.usage);
        }

        await saveChatToSupbabase(
          chatSessionId,
          session.id,
          messages[messages.length - 1].content,
          event.text
        );
      }
    });

    // Return the streaming response
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error processing Perplexity response:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

```

File: /Users/gwelinder/code/boardAI/knowledge-base/app/actionchat/page.tsx
```tsx
import 'server-only';
import { getUserInfo } from '@/lib/server/supabase';
import ChatComponentPage from './component/ChatComponent';
import { AI as AiProvider } from './action';
import DocumentViewer from './component/PDFViewer';

export const maxDuration = 60;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | '' }>;
}

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  const userInfo = await getUserInfo();

  return (
    <div className="flex w-full overflow-hidden">
      <div className="flex-1">
        <AiProvider>
          <ChatComponentPage userInfo={userInfo} />
        </AiProvider>
      </div>

      {searchParams.pdf ? (
        <DocumentComponent fileName={decodeURIComponent(searchParams.pdf)} />
      ) : null}
    </div>
  );
}

async function DocumentComponent({ fileName }: { fileName: string }) {
  const session = await getUserInfo();
  const userId = session?.id;

  const hasActiveSubscription = Boolean(session);

  return (
    <DocumentViewer
      fileName={fileName}
      userId={userId}
      hasActiveSubscription={hasActiveSubscription}
    />
  );
}

```

File: /Users/gwelinder/code/boardAI/knowledge-base/app/api/perplexity/SaveToDb.ts
```ts
import 'server-only';
import { createServerSupabaseClient } from '@/lib/server/server';

export type OpenAiLog = {
  id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export const saveChatToSupbabase = async (
  chatSessionId: string,
  userId: string,
  currentMessageContent: string,
  completion: string,
  sources?: string[]
): Promise<void> => {
  if (!chatSessionId) {
    console.warn('Chat session ID is empty. Skipping saving chat to Supabase.');
    return;
  }
  const supabase = await createServerSupabaseClient();
  try {
    const now = new Date();
    // Add a small delay (1 second) for the AI message
    const aiMessageTime = new Date(now.getTime() + 1000);

    // Upsert the chat session
    const { error: sessionError } = await supabase.from('chat_sessions').upsert(
      {
        id: chatSessionId,
        user_id: userId,
        updated_at: aiMessageTime.toISOString() // Use the later timestamp
      },
      { onConflict: 'id' }
    );

    if (sessionError) throw sessionError;

    // Prepare messages data with different timestamps
    const messagesData = [
      {
        chat_session_id: chatSessionId,
        is_user_message: true,
        content: currentMessageContent,
        created_at: now.toISOString() // User message timestamp
      },
      {
        chat_session_id: chatSessionId,
        is_user_message: false,
        content: completion,
        sources: sources && sources.length > 0 ? sources : null,
        created_at: aiMessageTime.toISOString() // AI message timestamp (1 second later)
      }
    ];

    // Insert both messages in a single query
    const { error: messagesError } = await supabase
      .from('chat_messages')
      .insert(messagesData);

    if (messagesError) throw messagesError;
  } catch (error) {
    console.error('Error saving chat to Supabase:', error);
  }
};

```

File: /Users/gwelinder/code/boardAI/knowledge-base/app/api/processdoc/agentchains.ts
```ts
import 'server-only';
import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';

const contentAnalysisSchema = z.object({
  preliminary_answer_1: z
    .string()
    .describe(
      'Generate a preliminary answer based on the provided text context. The answer should be a concise, informative response that addresses the specifics of the context under consideration. Responses must be tailored to provide clear, preliminary insights or guidance relevant to the presented scenario.'
    ),
  preliminary_answer_2: z
    .string()
    .describe(
      'Generate a second preliminary answer based on the provided text context. The answer should be a concise, informative response that addresses the specifics of the context under consideration. Responses must be tailored to provide clear, preliminary insights or guidance relevant to the presented scenario.'
    ),
  tags: z
    .array(z.string())
    .describe(
      'Identify and tag key concepts or topics within the provided text for categorization and indexing purposes. Each tag in the array represents a specific topic, theme, or concept found within the text, ensuring they accurately reflect the nuances and specifics of the subject matter being addressed.'
    ),
  hypothetical_question_1: z
    .string()
    .describe(
      'Generate a hypothetical question based on the provided text. The question should explore possible scenarios, implications, or considerations that arise from the content. Questions aim to provoke thought, analysis, or discussion on potential outcomes or interpretations.'
    ),
  hypothetical_question_2: z
    .string()
    .describe(
      'Generate a second hypothetical question based on the provided text. The question should explore possible scenarios, implications, or considerations that arise from the content. Questions aim to provoke thought, analysis, or discussion on potential outcomes or interpretations.'
    )
});

export const preliminaryAnswerChainAgent = async (
  content: string,
  userId: string
) => {
  const SystemPrompt =
    'Given the content provided below, perform a comprehensive analysis. Generate two preliminary answers, tag key concepts or topics, and generate two hypothetical questions. Ensure all outputs address specific elements mentioned in the text. Focus on interpreting key themes, implications of specific concepts, and potential real-life applications or consequences. Answers and questions should be detailed and thought-provoking. The output language should be in the same as the input text.';

  const { object, usage } = await generateObject({
    model: openai('gpt-4o-mini'),
    system: SystemPrompt,
    prompt: content,
    schema: contentAnalysisSchema,
    mode: 'json',
    temperature: 0,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'upload_doc_preliminary',
      metadata: {
        userId
      },
      recordInputs: true,
      recordOutputs: true
    }
  });

  return { object, usage };
};

const documentMetadataSchema = z.object({
  descriptiveTitle: z
    .string()
    .describe(
      'Generate a descriptive title that accurately represents the main topic or theme of the entire document.'
    ),

  shortDescription: z
    .string()
    .describe(
      'Provide a explanatory description that summarizes what the document is about, its key points, and its potential significance.'
    ),

  mainTopics: z
    .array(z.string())
    .describe('List up to 5 main topics or themes discussed in the document.'),

  keyEntities: z
    .array(z.string())
    .describe(
      'Identify up to 10 key entities (e.g., people, organizations, laws, concepts) mentioned in the document.'
    ),
  primaryLanguage: z
    .string()
    .describe('Identify the primary language used in the document content.')
});

export const generateDocumentMetadata = async (
  content: string,
  userId: string
) => {
  const SystemPrompt = `
  Analyze the provided document content thoroughly and generate comprehensive metadata. 
  Your task is to extract key information that will help in understanding the document's context, 
  relevance, and potential applications. This metadata will be used to provide context for AI-assisted 
  querying of document chunks, so focus on information that will be most useful for understanding 
  and answering questions about the document content.

  Remember, this metadata will be crucial in providing context for AI systems when answering user queries about the document.
  The output language should be in the same as the input text.
  `;

  const { object, usage, finishReason } = await generateObject({
    model: openai('gpt-4o-mini'),
    system: SystemPrompt,
    prompt: content,
    schema: documentMetadataSchema,
    mode: 'json',
    temperature: 0,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'upload_doc_main',
      metadata: {
        userId
      },
      recordInputs: true,
      recordOutputs: true
    }
  });

  return { object, usage, finishReason };
};

```

File: /Users/gwelinder/code/boardAI/knowledge-base/app/api/processdoc/textspliter.ts
```ts
import 'server-only';
import { encodingForModel } from 'js-tiktoken';

export function recursiveTextSplitter(
  text: string,
  chunkSize: number,
  chunkOverlap: number
): string[] {
  const tokenizer = encodingForModel('text-embedding-3-large');
  const separators = ['\n\n', '\n', ' ', ''];

  function splitText(text: string, separators: string[]): string[] {
    const finalChunks: string[] = [];

    let separator = separators[separators.length - 1];
    let newSeparators: string[] | undefined;

    for (let i = 0; i < separators.length; i++) {
      const s = separators[i];
      if (s === '' || text.includes(s)) {
        separator = s;
        newSeparators = separators.slice(i + 1);
        break;
      }
    }

    const splits = text.split(separator);

    let currentChunk: string[] = [];
    let currentChunkLength = 0;

    for (const split of splits) {
      const splitLength = tokenizer.encode(split).length;

      if (currentChunkLength + splitLength <= chunkSize) {
        currentChunk.push(split);
        currentChunkLength += splitLength;
      } else {
        if (currentChunk.length > 0) {
          finalChunks.push(currentChunk.join(separator));
          const overlapChunk = currentChunk.slice(
            -Math.floor(chunkOverlap / separator.length)
          );
          currentChunk = overlapChunk;
          currentChunkLength = tokenizer.encode(
            overlapChunk.join(separator)
          ).length;
        }

        if (splitLength > chunkSize) {
          if (newSeparators) {
            const subSplits = splitText(split, newSeparators);
            finalChunks.push(...subSplits);
          } else {
            finalChunks.push(split);
          }
        } else {
          currentChunk = [split];
          currentChunkLength = splitLength;
        }
      }
    }

    if (currentChunk.length > 0) {
      finalChunks.push(currentChunk.join(separator));
    }

    return finalChunks;
  }

  return splitText(text, separators);
}

```

File: /Users/gwelinder/code/boardAI/knowledge-base/app/api/uploaddoc/route.ts
```ts
import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/supabase';
import { createAdminClient } from '@/lib/server/admin';

export const dynamic = 'force-dynamic';

export const maxDuration = 60;

const supabaseAdmin = createAdminClient();

export async function POST(req: NextRequest) {
  try {
    // Check for Llama Cloud API key
    if (!process.env.LLAMA_CLOUD_API_KEY) {
      console.error('LLAMA_CLOUD_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Server configuration error: LLAMA_CLOUD_API_KEY is missing' },
        { status: 500 }
      );
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 401 }
      );
    }

    const { uploadedFiles } = await req.json();

    if (!Array.isArray(uploadedFiles) || uploadedFiles.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const results = [];

    for (const file of uploadedFiles) {
      try {
        const { data, error } = await supabaseAdmin.storage
          .from('userfiles')
          .download(file.path);

        if (error) {
          console.error('Error downloading file:', error);
          results.push({
            file: file.name,
            status: 'error',
            message: 'Download failed'
          });
          continue;
        }

        const formData = new FormData();
        formData.append('file', new Blob([data]), file.name);

        const uploadResponse = await fetch(
          'https://api.cloud.llamaindex.ai/api/v1/parsing/upload',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.LLAMA_CLOUD_API_KEY}`,
              Accept: 'application/json'
            },
            body: formData
          }
        );

        if (!uploadResponse.ok) {
          throw new Error(
            `Failed to upload file: ${uploadResponse.statusText}`
          );
        }

        const uploadResult = await uploadResponse.json();
        results.push({
          file: file.name,
          status: 'success',
          jobId: uploadResult.id
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        results.push({
          file: file.name,
          status: 'error',
          message: 'Processing failed'
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

```

File: /Users/gwelinder/code/boardAI/knowledge-base/app/documents/page.tsx
```tsx
import { redirect } from 'next/navigation';
import { db } from '../db';
import { documents } from '@/schema';
import { DocumentUpload } from '@/components/document-upload';
import { DocumentAnalysis } from '@/components/document-analysis';
import { createClient } from '@/lib/client/client';
import { cookies } from 'next/headers';

export default async function DocumentsPage() {
  const cookieStore = cookies();
  const supabase = await createClient();

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user) redirect('/login');

  const userDocuments = await db.query.documents.findMany({
    where: (documents, { eq }) => eq(documents.userId, session.user.id),
    orderBy: (documents, { desc }) => [desc(documents.createdAt)],
    with: {
      analysis: {
        orderBy: (analysis, { desc }) => [desc(analysis.submittedAt)]
      }
    }
  });

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-2">Board Documents</h1>
        <p className="text-muted-foreground mb-8">
          Upload and analyze your board documents
        </p>
        <DocumentUpload />
      </div>

      <div className="grid gap-6">
        {userDocuments.map((document) => (
          <DocumentAnalysis key={document.documentId} document={document} />
        ))}
        {userDocuments.length === 0 && (
          <div className="text-center text-muted-foreground">
            No documents uploaded yet. Upload your first document to get
            started.
          </div>
        )}
      </div>
    </div>
  );
}

```

File: /Users/gwelinder/code/boardAI/knowledge-base/components/assistant/chat.tsx
```tsx
"use client";

import { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ChatMessage } from "@/components/assistant/chat-message";
import { ChatPrompt } from "@/components/assistant/chat-prompt";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useScrollToBottom } from "@/components/use-scroll-to-bottom";
import { Document } from "@/schema"; // Assuming Document is imported from the same lib/types

interface ChatProps {
  messages: Message[];
  handleSubmit: (input: string, attachments: Document[]) => void;
  isLoading: boolean;
  className?: string;
  selectedDocuments: Document[];
}

export function Chat({
  messages,
  handleSubmit,
  isLoading,
  className,
  selectedDocuments,
}: ChatProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const handlePromptSubmit = (input: string) => {
    handleSubmit(input, selectedDocuments);
  };

  return (
    <div className="flex w-full flex-col h-full">
      <ScrollArea>
        <div
          ref={messagesContainerRef}
          className={cn(className, "min-h-[calc(100vh-200px)]")}
        >
          {messages.length > 0 && (
            <div className="relative mx-auto max-w-3xl px-8">
              {messages.map((message: Message, index: number) => (
                <div
                  key={`msg-${index}-${message.content.length}`}
                  className={cn(index === 0 ? "pt-8" : "")}
                >
                  <ChatMessage message={message} />

                  {index < messages.length - 1 && (
                    <Separator className="my-4 md:my-8" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div
          ref={messagesEndRef}
          className="flex-shrink-0 min-w-[24px] min-h-[24px]"
        />
      </ScrollArea>

      <div className="inset-x-0 bottom-2 w-full">
        <div className="mx-auto max-w-3xl sm:px-4">
          <ChatPrompt isLoading={isLoading} onSubmit={handlePromptSubmit} />
          {selectedDocuments.length > 0 && (
            <div className="mt-2 text-sm text-gray-500">
              Selected documents:{" "}
              {selectedDocuments.map((doc) => doc.name).join(", ")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

```

File: /Users/gwelinder/code/boardAI/knowledge-base/components/chat.tsx
```tsx
"use client";

import { Message } from "ai";
import { useChat } from "ai/react";
import { useEffect, useState } from "react";
import { Files } from "@/components/files";
import { AnimatePresence, motion } from "framer-motion";
import { FileIcon } from "@/components/icons";
import { Message as PreviewMessage } from "@/components/message";
import { useScrollToBottom } from "@/components/use-scroll-to-bottom";
import { Session } from "next-auth";
import { getFiles } from "@/lib/actions/getFiles";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const suggestedActions = [
  {
    title: "Identify Key Insights",
    label: "from these documents.",
    action: "Identify the key insights from these documents.",
  },
  {
    title: "Highlight Data Inconsistencies",
    label: "within the provided materials.",
    action: "Highlight any data inconsistencies within the provided materials.",
  },
  {
    title: "Summarize Financial Reports",
    label: "for a quick overview.",
    action: "Summarize the financial reports for a quick overview.",
  },
  {
    title: "Generate Risk Assessment",
    label: "based on current data.",
    action: "Generate a risk assessment based on the current data.",
  },
  {
    title: "Draft Executive Summary",
    label: "for the upcoming meeting.",
    action: "Draft an executive summary for the upcoming meeting.",
  },
  {
    title: "Analyze Compliance Issues",
    label: "in the recent reports.",
    action: "Analyze any compliance issues present in the recent reports.",
  },
  {
    title: "Provide Strategic Recommendations",
    label: "based on the findings.",
    action: "Provide strategic recommendations based on the findings.",
  },
  {
    title: "Evaluate Market Trends",
    label: "from the latest data.",
    action: "Evaluate the latest market trends from the provided data.",
  },
];

export function Chat({
  id,
  initialMessages,
  session,
  selectedCompanyId,
  companies,
}: {
  id: string;
  initialMessages: Array<Message>;
  session: Session | null;
  selectedCompanyId: number | null;
  companies: Array<{ id: number; name: string }>;
}) {
  const router = useRouter();
  const [selectedFilePathnames, setSelectedFilePathnames] = useState<
    Array<string>
  >([]);
  const [isFilesVisible, setIsFilesVisible] = useState(false);
  const [accessibleFiles, setAccessibleFiles] = useState<Array<string>>([]);

  useEffect(() => {
    async function fetchFiles() {
      if (selectedCompanyId) {
        try {
          const files = await getFiles(selectedCompanyId);
          setAccessibleFiles(
            files.map((file: { pathname: string }) => file.pathname)
          );
        } catch (error) {
          console.error("Failed to fetch files:", error);
        }
      }
    }
    fetchFiles();
  }, [selectedCompanyId]);

  const { messages, handleSubmit, input, setInput, append } = useChat({
    body: { id, selectedFilePathnames, companyId: selectedCompanyId },
    initialMessages,
    onFinish: () => {
      window.history.replaceState({}, "", `/${id}`);
    },
  });

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const handleCompanyChange = (companyId: string) => {
    router.push(`/${id}?companyId=${companyId}`);
  };

  return (
    <div className="flex flex-col justify-right pb-20 h-dvh bg-white dark:bg-zinc-900">
      <div
        ref={messagesContainerRef}
        className="flex flex-col gap-4 h-full w-dvw items-center overflow-y-scroll"
      >
        {messages.map((message, index) => (
          <PreviewMessage
            key={`${id}-${index}`}
            role={message.role}
            content={message.content}
            files={accessibleFiles}
          />
        ))}
        <div
          ref={messagesEndRef}
          className="flex-shrink-0 min-w-[24px] min-h-[24px]"
        />
      </div>

      {messages.length === 0 && (
        <div className="grid sm:grid-cols-2 gap-2 w-full px-4 md:px-0 mx-auto md:max-w-[500px]">
          {suggestedActions.map((suggestedAction, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              key={index}
              className={index > 1 ? "hidden sm:block" : "block"}
            >
              <button
                onClick={() =>
                  append({ role: "user", content: suggestedAction.action })
                }
                className="w-full text-left border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 rounded-lg p-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col"
              >
                <span className="font-medium">{suggestedAction.title}</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {suggestedAction.label}
                </span>
              </button>
            </motion.div>
          ))}
        </div>
      )}
      <div className="flex justify-center w-full mt-8">
        <form
          className="flex flex-row gap-2 relative items-center w-full md:max-w-[500px] max-w-[calc(100dvw-32px)] px-4 md:px-0"
          onSubmit={handleSubmit}
        >
          <input
            className="bg-zinc-100 rounded-md px-2 py-1.5 flex-1 outline-none dark:bg-zinc-700 text-zinc-800 dark:text-zinc-300"
            placeholder="Send a message..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />

          <Button
            type="button"
            className="relative text-sm bg-zinc-100 rounded-lg size-9 flex-shrink-0 flex items-center justify-center cursor-pointer hover:bg-zinc-200 dark:text-zinc-50 dark:bg-zinc-700 dark:hover:bg-zinc-800"
            onClick={() => setIsFilesVisible(!isFilesVisible)}
          >
            <FileIcon />
            <motion.div
              className="absolute text-xs -top-2 -right-2 bg-blue-500 size-5 rounded-full flex items-center justify-center border-2 dark:border-zinc-900 border-white text-blue-50"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              {selectedFilePathnames?.length}
            </motion.div>
          </Button>
        </form>
      </div>

      <AnimatePresence>
        {isFilesVisible && (
          <Files
            setIsFilesVisible={setIsFilesVisible}
            selectedFilePathnames={selectedFilePathnames}
            setSelectedFilePathnames={setSelectedFilePathnames}
            selectedCompanyId={selectedCompanyId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

```

File: /Users/gwelinder/code/boardAI/knowledge-base/components/add-company-form.tsx
```tsx
'use client';

import { useState, useEffect, useRef, useActionState } from 'react';

import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createCompany, getCompanyData } from '@/app/actions/company';

import { useCompanyContext } from '@/lib/companyProvider';
import { Company } from '@/schema';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { BuildingIcon, SearchIcon, PlusIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  cvr: z.string().length(8, 'CVR must be 8 characters'),
  description: z.string().optional()
});

type CompanyActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  company?: Company;
};

const initialState: CompanyActionState = {
  status: 'idle'
};

export const AddCompanyForm = () => {
  const [state, formAction] = useActionState(createCompany, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const { setCompanies, setSelectedCompanyId } = useCompanyContext();
  const [companyData, setCompanyData] = useState<any>(null);
  const [fetchState, fetchAction] = useActionState(getCompanyData, {
    status: 'idle',
    data: null
  });
  const formRef = useRef<HTMLFormElement>(null);
  const [isFetched, setIsFetched] = useState(false);

  useEffect(() => {
    if (state.status === 'error') {
      toast({
        title: 'Error',
        description: state.message || 'Failed to create company'
      });
      setIsLoading(false);
    } else if (state.status === 'success') {
      toast({
        title: 'Success',
        description: 'Company created successfully'
      });
      setIsLoading(false);

      if (state.company) {
        setCompanies((prevCompanies) => [
          ...prevCompanies,
          state.company as Company
        ]);
        setSelectedCompanyId(state.company.id);
      }
    }
  }, [state, setCompanies, setSelectedCompanyId]);

  useEffect(() => {
    if (fetchState.status === 'success' && fetchState.data) {
      setCompanyData(fetchState.data);
      setIsFetched(true);
    } else if (fetchState.status === 'error') {
      toast({
        title: 'Error',
        description: 'Failed to fetch company data. Please try again.'
      });
    }
  }, [fetchState]);

  const handleFetchData = async () => {
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      await fetchAction(formData);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('metadata', JSON.stringify(companyData));
    formAction(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-shadow max-w-[500px]">
        <CardHeader className="flex items-center space-x-2">
          <div className="p-2 bg-blue-500 text-white rounded-full">
            <BuildingIcon size={24} />
          </div>
          <div>
            <CardTitle className="text-lg">Add New Company</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Enter CVR to fetch company details or input manually
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                id="cvr"
                name="cvr"
                placeholder="CVR Number"
                required
                pattern="\d{8}"
                title="CVR must be 8 digits"
                className="flex-grow"
              />
              <Button
                type="button"
                onClick={handleFetchData}
                variant="outline"
                className="flex-shrink-0"
              >
                <SearchIcon className="w-4 h-4 mr-2" />
                Fetch
              </Button>
            </div>
            {companyData && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Fetched Data:</p>
                <ScrollArea className="h-[150px] w-full rounded border p-4">
                  <pre className="text-sm">
                    {JSON.stringify(companyData, null, 2)}
                  </pre>
                </ScrollArea>
                <p className="text-sm text-gray-500">
                  Please confirm if this data is correct.
                </p>
              </div>
            )}
            <Input
              name="name"
              placeholder="Company Name"
              required
              value={companyData?.name || ''}
              readOnly={!!companyData}
            />
            <Textarea
              name="description"
              placeholder="Company Description (optional)"
            />
            <Button
              type="submit"
              disabled={isLoading || !isFetched}
              className="w-full"
            >
              {isLoading ? (
                'Adding...'
              ) : (
                <>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Company
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

```

File: /Users/gwelinder/code/boardAI/knowledge-base/app/actionchat/context/uploadContext.tsx
```tsx
'use client';
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback
} from 'react';
import { createClient } from '@/lib/client/client';
import { encodeBase64 } from '../lib/base64';
import useSWR, { useSWRConfig } from 'swr';

interface UploadContextType {
  isUploading: boolean;
  uploadFile: (file: File) => Promise<void>;
  uploadProgress: number;
  uploadStatus: string;
  statusSeverity: 'info' | 'success' | 'error' | 'warning';
  selectedFile: File | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>;
  selectedMode: string;
  setSelectedMode: (mode: string) => void;
  selectedBlobs: string[];
  setSelectedBlobs: (blobs: string[]) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

const MAX_TOTAL_SIZE = 150 * 1024 * 1024;
const supabase = createClient();

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
};

export const UploadProvider: React.FC<{
  children: React.ReactNode;
  userId: string;
}> = ({ children, userId }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [statusSeverity, setStatusSeverity] = useState<
    'info' | 'success' | 'error' | 'warning'
  >('info');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [shouldProcessDoc, setShouldProcessDoc] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBlobs, setSelectedBlobs] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState('default');
  const { mutate } = useSWRConfig();

  const { data: processingStatus, error: processingError } = useSWR(
    currentJobId && !shouldProcessDoc ? `/api/checkdoc` : null,
    async (url) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jobId: currentJobId })
      });
      if (!response.ok) {
        throw new Error('Failed to fetch processing status');
      }
      return response.json();
    },
    {
      refreshInterval: 5000,
      revalidateOnFocus: false
    }
  );

  const { data: processDocResult, error: processDocError } = useSWR(
    shouldProcessDoc && currentJobId && currentFileName
      ? ['/api/processdoc', currentJobId, currentFileName]
      : null,
    async ([url, jobId, fileName]) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jobId, fileName })
      });
      if (!response.ok) {
        throw new Error('Failed to process document');
      }
      return response.json();
    }
  );

  const uploadFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadStatus('Uploading file...');
      setStatusSeverity('info');
      async function getTotalUploadedSize(): Promise<number> {
        const { data, error } = await supabase.storage
          .from('userfiles')
          .list(userId);

        if (error) {
          console.error('Error fetching user files:', error);
          return 0;
        }

        return data.reduce(
          (total, file) => total + (file.metadata?.size || 0),
          0
        );
      }

      const uploadToSupabase = async (file: File, userId: string) => {
        const fileNameWithUnderscores = file.name.replace(/ /g, '_').trim();
        const encodedFileName = encodeBase64(fileNameWithUnderscores);
        const filePath = `${userId}/${encodedFileName}`;

        const { data, error } = await supabase.storage
          .from('userfiles')
          .upload(filePath, file, { upsert: true });

        if (error) {
          console.error('Error uploading file:', error);
          throw new Error(`Failed to upload file: ${file.name}`);
        }

        if (!data || !data.path) {
          console.error('Upload successful but path is missing');
          throw new Error(`Failed to get path for uploaded file: ${file.name}`);
        }

        return data.path;
      };
      let uploadedFilePath: string | null = null;

      try {
        const currentTotalSize = await getTotalUploadedSize();
        const newTotalSize = currentTotalSize + file.size;

        if (newTotalSize > MAX_TOTAL_SIZE) {
          throw new Error(
            'Upload would exceed the maximum allowed total size of 150 MB.'
          );
        }

        uploadedFilePath = await uploadToSupabase(file, userId);
        const fileNameWithUnderscores = file.name.replace(/ /g, '_').trim();

        setUploadProgress(25);
        setUploadStatus('Preparing file for analysis...');

        const response = await fetch('/api/uploaddoc', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uploadedFiles: [
              { name: fileNameWithUnderscores, path: uploadedFilePath }
            ]
          })
        });

        if (!response.ok) {
          throw new Error(
            `Error processing file on server: ${response.statusText}`
          );
        }

        const result = await response.json();
        setUploadProgress(50);
        setUploadStatus('Analyzing file...');

        if (result.results[0].jobId) {
          setCurrentJobId(result.results[0].jobId);
          setCurrentFileName(file.name);
        } else {
          throw new Error('No job ID received from server.');
        }
      } catch (error) {
        console.error('Error uploading file:', error);

        if (uploadedFilePath) {
          try {
            const { error: deleteError } = await supabase.storage
              .from('userfiles')
              .remove([uploadedFilePath]);

            if (deleteError) {
              console.error(
                `Error deleting file ${uploadedFilePath}:`,
                deleteError
              );
            }
          } catch (deleteError) {
            console.error(
              `Error deleting file ${uploadedFilePath}:`,
              deleteError
            );
          }
        }

        if (error instanceof Error) {
          setUploadStatus(error.message);
        } else {
          setUploadStatus(
            'Error uploading or processing file. Please try again.'
          );
        }
        setStatusSeverity('error');
        setIsUploading(false);
        setCurrentJobId(null);
        setCurrentFileName(null);
      }
    },
    [userId]
  );

  const resetUploadState = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus('');
    setStatusSeverity('info');
    setCurrentJobId(null);
    setCurrentFileName(null);
    setShouldProcessDoc(false);
    setSelectedFile(null);
  };

  useEffect(() => {
    if (processingStatus) {
      if (processingStatus.status === 'SUCCESS') {
        setUploadProgress(75);
        setUploadStatus('Finalizing files...');
        setShouldProcessDoc(true);
      } else if (processingStatus.status === 'PENDING') {
        setUploadStatus('Still analyzing files...');
      }
    } else if (processingError) {
      setIsUploading(false);
      setUploadStatus('Error analyzing files.');
      setStatusSeverity('error');
      setCurrentJobId(null);
      setCurrentFileName(null);
      setShouldProcessDoc(false);
    }

    if (processDocResult) {
      if (processDocResult.status === 'SUCCESS') {
        setIsUploading(false);
        setUploadProgress(100);
        setUploadStatus('Files are uploaded and processed.');
        setStatusSeverity('success');
        mutate(`userFiles`);

        // Set a timeout to reset the state after 2 seconds
        setTimeout(() => {
          resetUploadState();
        }, 3000);
      } else {
        setIsUploading(false);
        setUploadStatus('Error finalizing files.');
        setStatusSeverity('error');
        setCurrentJobId(null);
        setCurrentFileName(null);
        setShouldProcessDoc(false);
      }
    } else if (processDocError) {
      setIsUploading(false);
      setUploadStatus('Error finalizing files.');
      setStatusSeverity('error');
      setCurrentJobId(null);
      setCurrentFileName(null);
      setShouldProcessDoc(false);
    }
  }, [
    processingStatus,
    processingError,
    processDocResult,
    processDocError,
    mutate
  ]);

  const contextValue = useMemo(
    () => ({
      isUploading,
      uploadFile,
      uploadProgress,
      uploadStatus,
      statusSeverity,
      selectedFile,
      setSelectedFile,
      selectedMode,
      setSelectedMode,
      selectedBlobs,
      setSelectedBlobs
    }),
    [
      isUploading,
      uploadFile,
      uploadProgress,
      uploadStatus,
      statusSeverity,
      selectedFile,
      setSelectedFile,
      selectedMode,
      selectedBlobs
    ]
  );

  return (
    <UploadContext.Provider value={contextValue}>
      {children}
    </UploadContext.Provider>
  );
};

```

File: /Users/gwelinder/code/boardAI/knowledge-base/components/document-analysis.tsx
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { runAnalysis, generateReport } from "@/app/actions/analysis";
import { Analysis, Document } from "@/schema";

interface DocumentAnalysisProps {
  document: Document;
}

export function DocumentAnalysis({ document }: DocumentAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] =
    useState<string>("data_inconsistency");
  const router = useRouter();
  const { toast } = useToast();

  const handleAnalysis = async () => {
    try {
      setIsAnalyzing(true);

      const result = await runAnalysis({
        documentId: document.documentId,
        analysisType: analysisType as
          | "data_inconsistency"
          | "fact_check"
          | "missing_info",
      });

      if (result.success) {
        toast({
          title: "Analysis started",
          description:
            "Your document is being analyzed. You'll be notified when it's complete.",
        });
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateReport = async (analysisId: string) => {
    try {
      const result = await generateReport(analysisId);

      if (result.success) {
        toast({
          title: "Report generated",
          description: "Your report has been generated successfully.",
        });
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Report generation failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {document.fileName}
        </CardTitle>
        <CardDescription>
          Uploaded on {new Date(document.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Select
              value={analysisType}
              onValueChange={setAnalysisType}
              disabled={isAnalyzing}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select analysis type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="data_inconsistency">
                  Data Inconsistency
                </SelectItem>
                <SelectItem value="fact_check">Fact Check</SelectItem>
                <SelectItem value="missing_info">
                  Missing Information
                </SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Start Analysis"
              )}
            </Button>
          </div>

          {document.analysis?.map((analysis: Analysis) => (
            <Card key={analysis.analysisId} className="bg-muted">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  {analysis.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  {analysis.analysisType} Analysis
                </CardTitle>
                <CardDescription>
                  {analysis.status === "completed"
                    ? `Completed on ${new Date(
                        analysis.completedAt!
                      ).toLocaleDateString()}`
                    : "Processing..."}
                </CardDescription>
              </CardHeader>
              {analysis.status === "completed" && (
                <CardFooter>
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateReport(analysis.analysisId)}
                  >
                    Generate Report
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

```

File: /Users/gwelinder/code/boardAI/knowledge-base/components/document-upload.tsx
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, File, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { uploadDocument } from "@/app/actions/documents";
import { useSupabaseAuth } from "@/providers/supabase-auth-provider";

export function DocumentUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { session, loadingSession } = useSupabaseAuth();

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !session?.user?.id) return;

      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", session.user.id);

      const result = await uploadDocument(formData);

      if (result.success) {
        toast({
          title: "Document uploaded successfully",
          description:
            "Your document has been uploaded and is being processed.",
        });
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (loadingSession) {
    return (
      <Card className="w-full max-w-xl mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="w-full max-w-xl mx-auto">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Please sign in to upload documents
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Board Document</CardTitle>
        <CardDescription>
          Upload your board documents for analysis. We support PDF and image
          files.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <div className="w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag and drop your file here, or click to select
            </p>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </div>
          <Button disabled={isUploading} className="w-full">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <File className="mr-2 h-4 w-4" />
                Select File
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

```

File: /Users/gwelinder/code/boardAI/knowledge-base/components/library-management.tsx
```tsx
"use client";
import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/utils/functions";
import { Button } from "@/components/ui/button";
import { PlusIcon, TrashIcon, UploadIcon } from "lucide-react";
import Modal from "@/components/modal";
import { AddDocumentForm } from "@/components/add-document-form";
import { useCompanyContext } from "@/lib/companyProvider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Document = {
  id: string;
  name: string;
  category: string;
  url: string;
};

const LibraryManagement = () => {
  const { selectedCompanyId } = useCompanyContext();
  const {
    data: documents,
    mutate,
    isLoading,
  } = useSWR(
    selectedCompanyId
      ? `/api/library/list?companyId=${selectedCompanyId}`
      : null,
    fetcher,
    { fallbackData: [] }
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);
  const [deleteQueue, setDeleteQueue] = useState<Array<string>>([]);

  const handleDelete = async (docId: string) => {
    await fetch(`/api/library/delete?id=${docId}`, { method: "DELETE" });
    mutate();
  };

  const columns: ColumnDef<Document>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const nameParts = row.original.name.split(".");
        const extension = nameParts.length > 1 ? `.${nameParts.pop()}` : "";
        const baseName = nameParts.join(".");
        return (
          <>
            <div className="truncate max-w-xs" title={row.original.name}>
              {baseName}
            </div>
            <div className="text-xs text-zinc-500">{extension}</div>
          </>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          color="red"
          onClick={() => handleDelete(row.original.id)}
        >
          <TrashIcon />
        </Button>
      ),
    },
  ];

  const handleFileUpload = async (file: File) => {
    if (file && selectedCompanyId) {
      setUploadQueue((currentQueue) => [...currentQueue, file.name]);
      await fetch(
        `/api/files/upload?filename=${file.name}&companyId=${selectedCompanyId}`,
        {
          method: "POST",
          body: file,
        }
      );
      setUploadQueue((currentQueue) =>
        currentQueue.filter((filename) => filename !== file.name)
      );
      mutate();
    }
  };

  const filteredDocuments = selectedCategory
    ? documents.filter((doc: Document) => doc.category === selectedCategory)
    : documents;

  const table = useReactTable({
    data: filteredDocuments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!selectedCompanyId) {
    return <p>Please select a company to view documents.</p>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Library</h2>
        <div className="flex items-center space-x-2">
          <Select onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Financial">Financial</SelectItem>
              <SelectItem value="Legal">Legal</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="Technical">Technical</SelectItem>
              <SelectItem value="Meetings">Meetings</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusIcon className="mr-2" />
            Add Document
          </Button>
          <Button onClick={() => inputFileRef.current?.click()}>
            <UploadIcon className="mr-2" />
            Upload File
          </Button>
          <input
            name="file"
            ref={inputFileRef}
            type="file"
            required
            className="hidden"
            accept="application/pdf"
            multiple={false}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                handleFileUpload(file);
              }
            }}
          />
        </div>
      </div>
      <div className="space-y-2">
        {isLoading ? (
          <p>Loading documents...</p>
        ) : filteredDocuments.length === 0 ? (
          <p>No documents found. Add some to get started!</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <AddDocumentForm
          selectedCompanyId={selectedCompanyId}
          onSuccess={() => {
            mutate();
            setIsModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
};

export default LibraryManagement;

```

File: /Users/gwelinder/code/boardAI/knowledge-base/lib/actions/getFiles.ts
```ts
"use server";

import { auth } from "@/app/(auth)/auth";
import { list } from "@vercel/blob";

export async function getFiles(companyId: number) {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error("User not authenticated");
  }

  const { blobs } = await list({
    prefix: `${session.user.email}/${companyId}/`,
  });

  return blobs.map((blob) => ({
    ...blob,
    pathname: blob.pathname.replace(
      `${session?.user?.email}/${companyId}/`,
      ""
    ),
  }));
}

```

File: /Users/gwelinder/code/boardAI/knowledge-base/components/predefined-actions.ts
```ts
// components/predefined-actions.ts

export interface PredefinedAction {
  title: string;
  description: string;
  command: string;
}

export const predefinedActions: PredefinedAction[] = [
  // Corporate Governance
  {
    title: "Review Corporate Governance Policies",
    description:
      "Ensure all corporate governance policies are up-to-date and compliant with Danish laws.",
    command:
      "Review the current corporate governance policies and suggest necessary updates for compliance with Danish laws.",
  },
  {
    title: "Board Composition Analysis",
    description:
      "Analyze the current board composition for diversity and expertise.",
    command:
      "Analyze the current board composition and provide recommendations to enhance diversity and expertise.",
  },

  // Financial Oversight
  {
    title: "Financial Statement Analysis",
    description:
      "Evaluate the company's financial statements for accuracy and compliance.",
    command:
      "Analyze the latest financial statements for accuracy, compliance with Danish accounting standards, and provide insights.",
  },
  {
    title: "Budget Review and Approval",
    description:
      "Assess and approve the annual budget to ensure financial stability.",
    command:
      "Review the proposed annual budget, assess its feasibility, and provide approval or recommendations for adjustments.",
  },

  // Risk Management
  {
    title: "Enterprise Risk Assessment",
    description: "Identify and assess key risks facing the organization.",
    command:
      "Conduct an enterprise risk assessment to identify key risks and suggest mitigation strategies.",
  },
  {
    title: "Crisis Management Planning",
    description:
      "Develop and review crisis management plans to handle potential emergencies.",
    command:
      "Develop a comprehensive crisis management plan and review existing plans for effectiveness and readiness.",
  },

  // Compliance and Legal
  {
    title: "Regulatory Compliance Check",
    description:
      "Ensure the company complies with all relevant Danish regulations.",
    command:
      "Perform a regulatory compliance check to ensure the company adheres to all relevant Danish laws and regulations.",
  },
  {
    title: "Legal Contract Review",
    description:
      "Review key legal contracts to mitigate potential liabilities.",
    command:
      "Review the latest key legal contracts and identify any clauses that may pose potential liabilities or compliance issues.",
  },

  // Environmental, Social, and Governance (ESG)
  {
    title: "ESG Performance Evaluation",
    description:
      "Assess the company's ESG performance and sustainability initiatives.",
    command:
      "Evaluate the company's ESG performance and suggest improvements for sustainability initiatives.",
  },
  {
    title: "Sustainability Reporting",
    description:
      "Prepare and review sustainability reports in line with Danish and international standards.",
    command:
      "Prepare a sustainability report adhering to Danish and international ESG reporting standards and review existing reports for compliance.",
  },

  // Data Protection and GDPR
  {
    title: "GDPR Compliance Audit",
    description:
      "Ensure the company complies with GDPR regulations regarding data protection.",
    command:
      "Conduct a GDPR compliance audit to ensure all data protection measures meet European Union standards.",
  },
  {
    title: "Data Protection Impact Assessment",
    description:
      "Assess the impact of data processing activities on data privacy.",
    command:
      "Perform a Data Protection Impact Assessment (DPIA) for recent data processing activities to identify and mitigate privacy risks.",
  },

  // Meeting Management
  {
    title: "Board Meeting Minutes Review",
    description:
      "Review and approve the minutes from the latest board meeting.",
    command:
      "Review the minutes from the latest board meeting for accuracy and completeness, then approve them.",
  },
  {
    title: "Agenda Preparation for Upcoming Meetings",
    description: "Prepare and organize the agenda for the next board meeting.",
    command:
      "Prepare a detailed agenda for the upcoming board meeting, ensuring all key topics are covered.",
  },

  // Conflict of Interest Management
  {
    title: "Conflict of Interest Declaration",
    description:
      "Collect and review declarations of conflicts of interest from board members.",
    command:
      "Collect conflict of interest declarations from all board members and review them for any potential issues.",
  },
  {
    title: "Conflict of Interest Policy Review",
    description:
      "Ensure the conflict of interest policy is comprehensive and up-to-date.",
    command:
      "Review the current conflict of interest policy and suggest updates to address any gaps or changes in regulations.",
  },

  // Additional Liability Minimization Actions
  {
    title: "Director Liability Insurance Review",
    description:
      "Ensure that director liability insurance policies are adequate and up-to-date.",
    command:
      "Review the current director liability insurance policies to ensure they provide adequate coverage and recommend any necessary updates.",
  },
  {
    title: "Compliance Training for Board Members",
    description:
      "Organize and review compliance training programs for board members.",
    command:
      "Organize a compliance training session for board members and evaluate the effectiveness of existing training programs.",
  },
  {
    title: "Internal Audit Coordination",
    description:
      "Coordinate with internal auditors to ensure thorough audits are conducted.",
    command:
      "Coordinate with the internal audit team to plan and execute comprehensive audits, and review audit findings for action items.",
  },
  {
    title: "Whistleblower Policy Implementation",
    description:
      "Implement and review whistleblower policies to protect and encourage reporting of unethical behavior.",
    command:
      "Implement a whistleblower policy and review its effectiveness in encouraging the reporting of unethical or illegal activities within the company.",
  },
  {
    title: "Board Member Induction and Training",
    description:
      "Ensure new board members receive proper induction and ongoing training.",
    command:
      "Develop and execute an induction program for new board members and provide ongoing training to enhance their governance skills.",
  },
  {
    title: "Legal Compliance Monitoring",
    description:
      "Continuously monitor and update legal compliance requirements.",
    command:
      "Set up a system for continuous monitoring of legal compliance requirements and ensure timely updates to policies and procedures.",
  },
  {
    title: "Stakeholder Engagement Strategy",
    description:
      "Develop strategies for effective engagement with stakeholders to mitigate risks.",
    command:
      "Develop and implement a stakeholder engagement strategy to ensure effective communication and mitigate potential risks arising from stakeholder interactions.",
  },
  {
    title: "Corporate Social Responsibility (CSR) Initiatives",
    description:
      "Plan and evaluate CSR initiatives to enhance corporate reputation and compliance.",
    command:
      "Plan and evaluate corporate social responsibility initiatives to enhance the company's reputation and ensure compliance with societal expectations.",
  },
];

```

File: /Users/gwelinder/code/boardAI/knowledge-base/lib/client/client.ts
```ts
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';
// Create a Supabase client for browser-side operations. This can be used to interact with Supabase from the client-side. It is very importatnt
// that you enable RLS on your tables to ensure that your client-side operations are secure. Ideally, you would only enablle Read access on your client-side operations.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

File: /Users/gwelinder/code/boardAI/knowledge-base/components/add-document-form.tsx
```tsx
"use client";
import { useState, useEffect } from "react";
import { useActionState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addDocument } from "@/app/actions/document";
import { toast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const documentSchema = z.object({
  file: z.instanceof(File).refine((file) => file.type === "application/pdf", {
    message: "Only PDF files are allowed",
  }),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  companyId: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Invalid company ID",
  }),
});

type DocumentFormValues = z.infer<typeof documentSchema>;
type DocumentActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const initialState: DocumentActionState = {
  status: "idle",
};

export const AddDocumentForm = ({
  selectedCompanyId,
  onSuccess,
}: {
  selectedCompanyId: number | null;
  onSuccess: () => void;
}) => {
  const [state, formAction] = useActionState<DocumentActionState, FormData>(
    addDocument,
    initialState
  );
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      companyId: selectedCompanyId?.toString() || "",
    },
  });

  useEffect(() => {
    if (state.status === "error") {
      toast({
        title: "Error",
        description: state.message || "Failed to add document",
        variant: "destructive",
        duration: 5000,
      });
      form.reset();
    } else if (state.status === "success") {
      toast({
        title: "Success",
        description: "Document added successfully",
        duration: 5000,
      });
      form.reset();
      onSuccess();
    }
  }, [state, onSuccess, form]);

  const onSubmit = (data: DocumentFormValues) => {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("category", data.category);
    formData.append("description", data.description || "");
    formData.append("companyId", data.companyId);
    formAction(formData);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 w-[400px]"
      >
        {/* File Upload */}
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document (PDF)</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      field.onChange(file);
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Category Selection */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Financial">Financial</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Meetings">Meetings</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter a description for the document"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Hidden Input for Company ID */}
        <input
          type="hidden"
          {...form.register("companyId")}
          value={selectedCompanyId || ""}
        />
        {/* Submit Button */}
        <Button type="submit" className="w-full">
          Add Document
        </Button>
      </form>
    </Form>
  );
};

```

File: /Users/gwelinder/code/boardAI/knowledge-base/lib/server/admin.ts
```ts
import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

/**
 * ⚠️ ADMIN CLIENT - DANGER ZONE ⚠️
 *
 * This client uses the service role key which bypasses Row Level Security (RLS).
 * It has FULL ACCESS to your database without any security restrictions.
 *
 * SECURITY RULES:
 * - NEVER expose this client to the browser/client-side
 * - ONLY use in server-side components/functions
 * - NEVER prefix the service role key with NEXT_PUBLIC_
 * - Keep all admin operations strictly server-side
 *
 * Proper usage:
 * - Server Components
 * - API Routes
 * - Server Actions
 * - Background jobs
 * - Database migrations
 *
 * @returns Supabase Admin Client with service role privileges
 */
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // ⚠️ Never expose this!

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables for server-side operations'
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey);
};
```

File: /Users/gwelinder/code/boardAI/knowledge-base/lib/server/server.ts
```ts
import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';
import { Redis } from '@upstash/redis';
// Define a function to create a Supabase client for server-side operations
// The function takes a cookie store created with next/headers cookies as an argument
// More information can be found on: https://supabase.com/docs/guides/auth/server-side/nextjs?queryGroups=router&router=app
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    // Pass Supabase URL and anonymous key from the environment to the client
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,

    // Define a cookies object with methods for interacting with the cookie store and pass it to the client
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        }
      }
    }
  );
};

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});
```

File: /Users/gwelinder/code/boardAI/knowledge-base/lib/server/supabase.ts
```ts
import 'server-only';
import { cache } from 'react';
import { createServerSupabaseClient } from '@/lib/server/server';

// React Cache: https://react.dev/reference/react/cache
// Caches the session retrieval operation. This memoizes/dedupes the request
// if it is called multiple times in the same render.
export const getSession = cache(async () => {
  const supabase = await createServerSupabaseClient();
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
});

// Caches the user information retrieval operation. Similar to getSession,
// this minimizes redundant data fetching across components for the same user data.
export const getUserInfo = cache(async () => {
  const supabase = await createServerSupabaseClient();
  try {
    const { data, error } = await supabase
      .from('users')
      .select('full_name, email, id')
      .maybeSingle(); // MaybeSingle returns null if no data is found. single() returns an error if no data is found.

    if (error) {
      console.error('Supabase Error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
});
```

File: /Users/gwelinder/code/boardAI/knowledge-base/supabase/migrations/20240202_initial.sql
```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  locale TEXT NOT NULL,
  role TEXT DEFAULT 'board_member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create documents table
CREATE TABLE documents (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  file_name TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  processed_text TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create analysis table
CREATE TABLE analysis (
  analysis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(document_id),
  analysis_type TEXT NOT NULL,
  local_context JSONB,
  status TEXT DEFAULT 'processing' NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  results JSONB
);

-- Create observations table
CREATE TABLE observations (
  observation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analysis(analysis_id),
  description TEXT NOT NULL,
  page_reference TEXT,
  suggestions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create reports table
CREATE TABLE reports (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analysis(analysis_id),
  draft_email TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create prompt_templates table
CREATE TABLE prompt_templates (
  prompt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create observability_traces table
CREATE TABLE observability_traces (
  trace_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analysis(analysis_id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  chain_of_thought TEXT,
  metrics JSONB
);

-- Create notifications table
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  read BOOLEAN DEFAULT FALSE NOT NULL
);

-- Create prompt_optimization_logs table
CREATE TABLE prompt_optimization_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompt_templates(prompt_id),
  previous_version TEXT NOT NULL,
  new_version TEXT NOT NULL,
  observability_data JSONB,
  status TEXT DEFAULT 'started' NOT NULL,
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_document_id ON analysis(document_id);
CREATE INDEX IF NOT EXISTS idx_observations_analysis_id ON observations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_reports_analysis_id ON reports(analysis_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_optimization_logs_prompt_id ON prompt_optimization_logs(prompt_id); 
```
</file_contents>

