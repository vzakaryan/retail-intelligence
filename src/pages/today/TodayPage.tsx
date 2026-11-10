import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import { getStoreDay, type Period } from "@/data/today";
import { DEMO_NOW } from "@/data/world";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { fmtDate } from "@/lib/format";
import { useStoreLabel } from "@/lib/useStoreLabel";
import { AtRiskTable } from "./AtRiskTable";
import { OnlineOrdersCard } from "./OnlineOrdersCard";
import { ResultsCard } from "./ResultsCard";
import { TasksCard } from "./TasksCard";
import { TodayKpis } from "./TodayKpis";
import { useRefilled } from "./useRefilled";

/** Home screen for the store manager — docs/design-references/approved/01-my-store-today.png */
export function TodayPage() {
  const { t } = useTranslation();
  const { store } = useDemo();
  const label = useStoreLabel();
  const day = getStoreDay(store.id);
  const refilled = useRefilled(store.id);
  const [period, setPeriod] = useState<Period>("week");
  const firstName = store.manager.name.split(" ")[0];

  return (
    <>
      <PageHeader
        title={t("today.greeting", { name: firstName })}
        subtitle={t("today.subtitle", { date: fmtDate(DEMO_NOW, { weekday: "long", month: "short", day: "numeric" }), store: label.name(store) })}
        actions={
          <Segmented
            label={t("today.period.label")}
            value={period}
            onChange={setPeriod}
            options={[
              { value: "week", label: t("today.period.week") },
              { value: "4w", label: t("today.period.4w") },
            ]}
          />
        }
      />

      <TodayKpis kpis={day.kpis[period]} period={period} />

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <TasksCard />
        <div className="flex flex-col gap-4">
          <OnlineOrdersCard online={day.online} refilled={refilled} />
          <ResultsCard results={day.results} />
        </div>
      </section>

      <AtRiskTable atRisk={day.atRisk} refilled={refilled} />
    </>
  );
}
