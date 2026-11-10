import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ChangeReason } from "@/data/orders";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const REASONS: ChangeReason[] = ["shelfSpace", "promo", "lowerDemand", "higherDemand", "packSize", "other"];

interface Props {
  open: boolean;
  productName: string;
  suggested: number;
  qty: number;
  onSave: (reason?: ChangeReason) => void;
  onCancel: () => void;
}

/** Asks why the manager changed a suggested quantity — feeds future suggestions. */
export function ReasonDialog({ open, productName, suggested, qty, onSave, onCancel }: Props) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<ChangeReason>();

  return (
    <Modal open={open} onClose={onCancel} labelledBy="reason-title">
      <h2 id="reason-title" className="text-lg font-bold">
        {t("orders.reasonDialog.title")}
      </h2>
      <p className="mt-1 text-muted">{t("orders.reasonDialog.text", { product: productName, suggested, qty })}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {REASONS.map((r) => (
          <button
            key={r}
            onClick={() => setPicked(r)}
            className={`rounded-ctl border px-3 py-2.5 text-left font-medium transition-colors ${
              picked === r ? "border-primary bg-primary-50 text-primary" : "border-line hover:bg-canvas"
            }`}
          >
            {t(`orders.changeReason.${r}`)}
          </button>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={() => onSave(undefined)}>{t("orders.reasonDialog.skip")}</Button>
        <Button variant="primary" disabled={!picked} onClick={() => onSave(picked)}>
          {t("orders.reasonDialog.save", { qty })}
        </Button>
      </div>
    </Modal>
  );
}
