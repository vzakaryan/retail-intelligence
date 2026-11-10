import { useState } from "react";
import { useNavigate } from "react-router";
import { Check, ChevronDown, ChevronUp, PartyPopper, Phone, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import { useTasks, type TaskState } from "@/app/useTasks";
import type { TaskTag } from "@/data/today";
import type { Tone } from "@/data/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Pill";
import { Progress } from "@/components/ui/Progress";
import { useTaskText } from "./taskText";

const TAG_TONE: Record<TaskTag, Tone> = { online: "info", ordering: "primary", expiry: "warn", supplier: "bad", promo: "good" };

export function TasksCard() {
  const { t } = useTranslation();
  const { store } = useDemo();
  const { tasks, doneCount, total, openCount } = useTasks(store.id);
  const [expanded, setExpanded] = useState(false);
  const extraCount = tasks.filter((x) => x.extra).length;
  const visible = expanded ? tasks : tasks.filter((x) => !x.extra);

  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-3 px-5 pb-3.5 pt-[18px]">
        <div>
          <div className="text-base font-semibold">{t("today.tasks.title")}</div>
          <div className="mt-0.5 text-[13px] text-muted">{t("today.tasks.subtitle")}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="mb-1.5 font-semibold">{t("today.tasks.progress", { done: doneCount, total })}</div>
          <Progress value={(doneCount / total) * 100} className="w-[140px]" />
        </div>
      </div>

      {openCount === 0 && (
        <div className="flex items-center gap-2.5 border-t border-line bg-good-bg px-5 py-3 font-semibold text-good">
          <PartyPopper className="size-[18px]" />
          {t("today.tasks.allDone")}
        </div>
      )}

      <ul>
        {visible.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line px-5 py-3.5 print:hidden">
        {extraCount > 0 ? (
          <button className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary" onClick={() => setExpanded((e) => !e)}>
            {expanded ? t("today.tasks.showLess") : t("today.tasks.showMore", { count: extraCount })}
            {expanded ? <ChevronUp className="size-[15px]" /> : <ChevronDown className="size-[15px]" />}
          </button>
        ) : (
          <span />
        )}
        <Button onClick={() => window.print()}>
          <Printer />
          {t("today.tasks.print")}
        </Button>
      </div>
    </Card>
  );
}

function TaskRow({ task }: { task: TaskState }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setTaskDone } = useDemo();
  const text = useTaskText()(task);

  return (
    <li className="flex flex-wrap items-start gap-x-3.5 gap-y-2.5 border-t border-line px-5 py-[15px] sm:flex-nowrap">
      <button
        onClick={() => setTaskDone(task.id, !task.done)}
        aria-label={task.done ? t("today.tasks.undo") : t("today.tasks.markDone")}
        aria-pressed={task.done}
        className={`mt-px grid size-[22px] shrink-0 place-items-center rounded-[7px] border-[1.5px] transition-colors ${
          task.done ? "border-good bg-good text-white" : "border-[#c9ccd8] bg-white hover:border-good"
        }`}
      >
        {task.done && <Check className="size-[13px]" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1 basis-[calc(100%-36px)] sm:basis-0">
        <div className={`flex flex-wrap items-center gap-2 font-semibold ${task.done ? "text-[#a3a7b7] line-through" : ""}`}>
          {text.title}
          {task.tag && !task.done && <Tag tone={TAG_TONE[task.tag]}>{t(`today.tags.${task.tag}`)}</Tag>}
        </div>
        <div className={`mt-0.5 text-[13px] ${task.doneNow ? "font-medium text-good" : task.done ? "text-[#a3a7b7] line-through" : "text-muted"}`}>
          {text.detail}
        </div>
      </div>

      {!task.done && (
        <div className="ml-9 shrink-0 sm:ml-0 print:hidden">
          {task.action === "review" && (
            <Button variant="primary" onClick={() => navigate("/orders")}>
              {t("today.tasks.review")}
            </Button>
          )}
          {task.action === "logCall" && (
            <Button onClick={() => setTaskDone(task.id, true, "call")}>
              <Phone />
              {t("today.tasks.logCall")}
            </Button>
          )}
          {task.action === "markDone" && <Button onClick={() => setTaskDone(task.id, true)}>{t("today.tasks.markDone")}</Button>}
        </div>
      )}
    </li>
  );
}
