import { useEffect, useRef, useState } from "react"
import { useParams, useSearchParams } from "react-router"
import { useMutation } from "@tanstack/react-query"
import { SendIcon, SparklesIcon } from "lucide-react"
import { toast } from "sonner"

import { extractWisdom } from "@/api/wisdom-extractor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { WORK_ITEM_TYPE_COLORS } from "@/lib/work-item-colors"
import { cn } from "@/lib/utils"

export default function WisdomExtractorPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuestion = searchParams.get("q") ?? ""

  const [question, setQuestion] = useState(initialQuestion)
  const autoAskedRef = useRef(false)

  const mutation = useMutation({
    mutationFn: (q: string) => extractWisdom(projectId!, q),
    onError: (error) => {
      toast.error("Failed to extract wisdom.", {
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      })
    },
  })

  const askedQuestion = mutation.variables ?? ""

  function ask(q: string) {
    if (!q.trim()) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set("q", q)
        return next
      },
      { replace: true }
    )
    mutation.mutate(q)
  }

  const { mutate } = mutation

  useEffect(() => {
    if (autoAskedRef.current) return
    if (!initialQuestion.trim()) return
    autoAskedRef.current = true
    mutate(initialQuestion)
  }, [initialQuestion, mutate])

  function openWorkItem(workItemId: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("workItemId", workItemId)
      return next
    })
  }

  const wisdom = mutation.data

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-4 py-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Wisdom Extractor</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Ask a question and get a synthesized answer with linked sources from
          this project's work items.
        </p>
        <form
          className="flex items-start gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            ask(question)
          }}
        >
          <Textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="e.g. Why is the checkout redesign important?"
            rows={2}
            className="flex-1"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                ask(question)
              }
            }}
          />
          <Button
            type="submit"
            disabled={!question.trim() || mutation.isPending}
          >
            <SendIcon />
            Ask
          </Button>
        </form>
      </div>

      {askedQuestion ? (
        <div className="flex flex-col gap-1">
          <div className="text-xs tracking-wider text-muted-foreground uppercase">
            Search Query
          </div>
          <div className="text-2xl leading-snug font-bold break-words">
            {askedQuestion}
          </div>
        </div>
      ) : null}

      {askedQuestion ? (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase">
            Sources {wisdom ? `(${wisdom.sources.length})` : null}
          </h2>

          {mutation.isPending ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-8 w-full" />
                    <div className="flex justify-between gap-2 pt-2">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : wisdom && wisdom.sources.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No relevant sources found.
            </p>
          ) : wisdom ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {wisdom.sources.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex flex-col gap-1">
                    <button
                      type="button"
                      className="truncate text-left text-sm font-semibold hover:underline"
                      onClick={() => openWorkItem(item.id)}
                    >
                      {item.title}
                    </button>
                    {item.description ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                    <div className="flex items-center justify-between pt-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-transparent",
                          WORK_ITEM_TYPE_COLORS[item.type]
                        )}
                      >
                        {item.type}
                      </Badge>
                      <span className="text-[0.7rem] text-muted-foreground">
                        {new Date(
                          item.createdAtUtc ?? item.updatedAtUtc!
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {askedQuestion ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Answer</CardTitle>
          </CardHeader>
          <CardContent>
            {mutation.isPending ? (
              <p className="text-sm text-muted-foreground">
                Generating answer…
              </p>
            ) : wisdom?.answer ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {wisdom.answer}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No answer available.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
