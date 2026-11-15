import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Check, ChevronDown, ChevronUp, PartyPopper, Phone, Printer, Undo2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import { orderIdForTask, useTasks, type TaskState } from "@/app/useTasks";
import { useTaskActions } from "@/app/useTaskActions";
import { DEMO_NOW } from "@/data/world";
import { callRef } from "@/pages/orders/shared";
import { Pill } from "@/components/ui/Pill";
import type { TaskTag } from "@/data/today";
import type { Tone } from "@/data/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Pill";
import { Progress } from "@/components/ui/Progress";
import { useTaskText } from "./taskText";

const TAG_TONE: Record<TaskTag, Tone> = { online: "info", ordering: "primary", expiry: "warn", supplier: "bad", promo: "good" };
/** Open tasks shown before "Show all" */
const VISIBLE = 5;

/** A task's time of day ("11:00", deadline "16:00"); tasks without one go last, in their planned order. */
const timeOf = (task: TaskState) => {
  const v = task.params.time ?? task.params.deadline;
  return typeof v === "string" && /^\d\d:\d\d$/.test(v) ? v : "99:99";
};

export function TasksCard() {
  const { t } = useTranslation();
  const { store, setTaskDone, setReceipt, snooze } = useDemo();
  const { tasks, doneCount, total, openCount } = useTasks(store.id);
  const text = useTaskText();
  const [showAll, setShowAll] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [undo, setUndo] = useState<{ message: string; run: () => void }>();
  const timer = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const open = tasks.filter((x) => !x.done).sort((a, b) => timeOf(a).localeCompare(timeOf(b)));
  const done = tasks.filter((x) => x.done);
  const hiddenCount = Math.max(0, open.length - VISIBLE);

  const showUndo = (message: string, run: () => void) => {
    setUndo({ message, run });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setUndo(undefined), 6000);
  };
  const complete = (task: TaskState, via?: "call") => {
    const title = text(task).title;
    if (task.kind === "checkDelivery" && task.orderId) {
      // Ticking "did it arrive?" = everything arrived
      const id = task.orderId;
      setReceipt(id, { on: DEMO_NOW, short: {} });
      return showUndo(t("today.tasks.doneToast", { title }), () => setReceipt(id, null));
    }
    setTaskDone(task.id, true, via);
    showUndo(t("today.tasks.doneToast", { title }), () => setTaskDone(task.id, false));
  };
  const notYet = (task: TaskState) => {
    const id = task.orderId!;
    snooze(id);
    showUndo(t("today.tasks.remindToast"), () => snooze(id, true));
  };

  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-3 px-5 pb-3.5 pt-[18px]">
        <div>
          <div className="text-base font-semibold">{t("today.tasks.title")}</div>
          <div className="mt-0.5 text-[13px] text-muted">{t("today.tasks.subtitleOpen", { count: openCount })}</div>
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
        {open.map((task, i) => (
          <TaskRow key={task.id} task={task} onDone={complete} onNotYet={notYet} hidden={!showAll && i >= VISIBLE} />
        ))}
      </ul>

      {undo && (
        <div role="status" className="mx-5 mb-3 mt-1 flex items-center justify-between gap-3 rounded-ctl bg-ink px-3.5 py-2.5 text-[13px] text-white print:hidden">
          <span className="flex min-w-0 items-center gap-2">
            <Check className="size-4 shrink-0 text-[#7ee2a8]" strokeWidth={3} />
            <span className="truncate">{undo.message}</span>
          </span>
          <button
            className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#c9bcff] hover:text-white"
            onClick={() => {
              undo.run();
              setUndo(undefined);
            }}
          >
            <Undo2 className="size-3.5" />
            {t("today.tasks.undoShort")}
          </button>
        </div>
      )}

      {showDone && done.length > 0 && (
        <ul className="border-t border-line bg-subtle print:hidden">
          {done.map((task) => (
            <DoneRow key={task.id} task={task} />
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line px-5 py-3.5 print:hidden">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
          {hiddenCount > 0 && (
            <button className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary" onClick={() => setShowAll((e) => !e)}>
              {showAll ? t("today.tasks.showLess") : t("today.tasks.showAll", { count: open.length })}
              {showAll ? <ChevronUp className="size-[15px]" /> : <ChevronDown className="size-[15px]" />}
            </button>
          )}
          {done.length > 0 && (
            <button className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-good" onClick={() => setShowDone((e) => !e)} aria-expanded={showDone}>
              <Check className="size-[15px]" strokeWidth={3} />
              {t("today.tasks.doneToday", { count: done.length })}
              {showDone ? <ChevronUp className="size-[15px]" /> : <ChevronDown className="size-[15px]" />}
            </button>
          )}
        </div>
        <Button onClick={() => window.print()}>
          <Printer />
          {t("today.tasks.print")}
        </Button>
      </div>
    </Card>
  );
}

function TaskRow({ task, onDone, onNotYet, hidden }: { task: TaskState; onDone: (task: TaskState, via?: "call") => void; onNotYet: (task: TaskState) => void; hidden: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { store } = useDemo();
  const actions = useTaskActions(store.id);
  const text = useTaskText()(task);
  const check = task.action === "checkDelivery";
  const call = check ? callRef(task.supplierId!, task.params.due as Date) : undefined;
  const callDone = call && actions.find(call)?.done;
  const suggestCall = check && ((task.checkOverdue ?? 0) > 0 || (task.snoozed ?? 0) >= 2);

  return (
    // Rows past the first 5 are hidden on screen but still printed
    <li className={`${hidden ? "hidden print:flex" : "flex"} flex-wrap items-start gap-x-3.5 gap-y-2.5 border-t border-line px-5 py-[15px] sm:flex-nowrap`}>
      <button
        onClick={() => onDone(task)}
        aria-label={t("today.tasks.markDone")}
        className="mt-px grid size-[22px] shrink-0 place-items-center rounded-[7px] border-[1.5px] border-[#c9ccd8] bg-white transition-colors hover:border-good"
      />

      <div className="min-w-0 flex-1 basis-[calc(100%-36px)] sm:basis-0">
        <div className="flex flex-wrap items-center gap-2 font-semibold">
          {text.title}
          {task.tag && <Tag tone={TAG_TONE[task.tag]}>{t(`today.tags.${task.tag}`)}</Tag>}
        </div>
        <div className="mt-0.5 text-[13px] text-muted">{text.detail}</div>
        {check && (
          <Link to={`/orders/${task.orderId}/done?receive=short`} className="mt-1 inline-block text-[13px] font-semibold text-primary hover:underline print:hidden">
            {t("today.tasks.someShort")}
          </Link>
        )}
      </div>

      <div className="ml-9 flex shrink-0 flex-wrap gap-2 sm:ml-0 sm:justify-end print:hidden">
        {check && (
          <>
            {suggestCall &&
              (callDone ? (
                <Pill tone="good" className="self-center">
                  {t("orders.list.callLogged")}
                </Pill>
              ) : (
                <Button onClick={() => actions.complete(call!, true, "call")}>
                  <Phone />
                  {t("today.tasks.logCall")}
                </Button>
              ))}
            <Button onClick={() => onNotYet(task)}>{t("orders.list.notYet")}</Button>
            <Button variant="primary" onClick={() => onDone(task)}>
              {t("orders.list.receivedBtn")}
            </Button>
          </>
        )}
        {task.action === "review" && (
          <Button variant="primary" onClick={() => navigate(`/orders/${orderIdForTask(store.id, task) ?? ""}`)}>
            {t("today.tasks.review")}
          </Button>
        )}
        {task.action === "logCall" && (
          <Button onClick={() => onDone(task, "call")}>
            <Phone />
            {t("today.tasks.logCall")}
          </Button>
        )}
        {task.action === "markDone" && <Button onClick={() => onDone(task)}>{t("today.tasks.markDone")}</Button>}
      </div>
    </li>
  );
}

/** Compact row in the folded "done today" list; the tick can be undone. */
function DoneRow({ task }: { task: TaskState }) {
  const { t } = useTranslation();
  const { setTaskDone, setReceipt } = useDemo();
  const text = useTaskText()(task);

  return (
    <li className="flex items-center gap-3 border-b border-line px-5 py-2.5 last:border-0">
      <button
        onClick={() => (task.kind === "checkDelivery" && task.orderId ? setReceipt(task.orderId, null) : setTaskDone(task.id, false))}
        aria-label={t("today.tasks.undo")}
        title={t("today.tasks.undo")}
        className="grid size-[20px] shrink-0 place-items-center rounded-[6px] border-[1.5px] border-good bg-good text-white"
      >
        <Check className="size-3" strokeWidth={3} />
      </button>
      <div className="min-w-0 flex-1 text-[13px]">
        <span className="font-medium text-ink-2">{text.title}</span>
        <span className="text-muted"> · {text.detail}</span>
      </div>
    </li>
  );
}
