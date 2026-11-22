import { Link, useNavigate } from "@tanstack/react-router"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Explorer } from "../components/explorer.tsx"
import { lessonNamed, scenarioNamed } from "../content/catalog.ts"
import { lessonRoute } from "../router.tsx"

export const LessonPage = () => {
  const { slug } = lessonRoute.useParams()
  const search = lessonRoute.useSearch()
  const navigate = useNavigate({ from: lessonRoute.fullPath })
  const lesson = lessonNamed(slug)
  const scenario = lesson ? scenarioNamed(lesson.scenario) : undefined
  if (!lesson || !scenario) {
    return (
      <p>
        Lesson not found. <Link to="/">Back home</Link>
      </p>
    )
  }
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_1fr]">
      <article className="lesson flex flex-col gap-3 text-[15px] leading-relaxed text-ink-secondary [&_code]:rounded [&_code]:bg-surface-1 [&_code]:px-1 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-ink [&_h2]:mt-3 [&_h2]:font-semibold [&_h2]:text-ink [&_li]:ml-5 [&_ol]:list-decimal [&_strong]:text-ink [&_table]:text-sm [&_td]:border [&_td]:border-border [&_td]:px-2 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_ul]:list-disc [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-ink-muted">
        <Markdown remarkPlugins={[remarkGfm]}>{lesson.body}</Markdown>
      </article>
      <Explorer
        scenario={scenario}
        search={search}
        onSearchChange={(next) => navigate({ search: next, replace: true })}
      />
    </div>
  )
}
