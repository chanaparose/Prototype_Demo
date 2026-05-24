import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/stores/useAuthStore';
import { getFactoryEntityId } from '@/utils/factoryUser';
import { daysUntilDeadline } from '@/utils/rfqDeadline';
import { factoryRfqsApi } from '@/services/api/rfqApi';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';
import type { RfqCardModel } from '@/components/factory/RfqCard';

function innerRfq(row: Record<string, unknown>): Record<string, unknown> {
  const r = row.rfq;
  if (r && typeof r === 'object') return r as Record<string, unknown>;
  return row;
}

export type FactoryBoardRow = RfqCardModel & {
  categoryId: number;
  shippingMethodId: number | null;
  createdAtMs: number;
  daysLeft: number | null;
};

function parseRfqRows(board: { rfqs: unknown; factory_category_ids?: unknown }): FactoryBoardRow[] {
  const arr = (Array.isArray(board.rfqs) ? board.rfqs : []) as Record<string, unknown>[];
  const bases: FactoryBoardRow[] = [];

  for (const row of arr) {
    const inner = innerRfq(row);
    const id = pickScalarString(inner.rfq_id, inner.id, row.rfq_id, row.id);
    if (!id) continue;

    const title = pickScalarString(inner.title, row.title, 'RFQ');
    const requestKind = pickScalarString(inner.request_kind, row.request_kind, 'PR').toUpperCase();
    const status = pickScalarString(inner.status, row.status).toUpperCase();
    const quantity = inner.quantity != null ? Number(inner.quantity) : null;

    const totalBudgetRaw = Number(
      inner.target_price ?? inner.budget_total ?? inner.total_budget ?? 0,
    );
    const legacyBudgetPerPiece =
      inner.budget_per_piece != null ? Number(inner.budget_per_piece) : null;
    const budgetPerPiece =
      Number.isFinite(totalBudgetRaw) &&
      totalBudgetRaw > 0 &&
      quantity != null &&
      Number.isFinite(quantity) &&
      quantity > 0
        ? totalBudgetRaw / quantity
        : legacyBudgetPerPiece;
    const revenueApprox =
      Number.isFinite(totalBudgetRaw) && totalBudgetRaw > 0
        ? totalBudgetRaw
        : budgetPerPiece != null &&
            quantity != null &&
            Number.isFinite(budgetPerPiece) &&
            Number.isFinite(quantity)
          ? budgetPerPiece * quantity
          : null;

    const categoryId = Number(inner.category_id ?? row.category_id ?? 0);
    const categoryName = pickScalarString(inner.category_name, row.category_name).trim();
    const subCategoryName = pickScalarString(inner.sub_category_name, row.sub_category_name).trim();

    const deadlineIso = pickScalarString(inner.required_delivery_date).trim() || null;
    const dLeft = daysUntilDeadline(deadlineIso);

    const shipIdRaw = inner.shipping_method_id ?? row.shipping_method_id;
    const shippingMethodId = shipIdRaw != null && Number(shipIdRaw) > 0 ? Number(shipIdRaw) : null;
    const shippingMethodName = pickScalarString(
      inner.shipping_method_name,
      row.shipping_method_name,
    ).trim();

    const urls = inner.reference_images;
    let thumbUrl: string | null = null;
    if (Array.isArray(urls) && urls.length > 0) {
      const u0 = urls[0];
      thumbUrl = typeof u0 === 'string' && u0.trim() ? u0.trim() : null;
    }

    const leadTargetDaysRaw = Number(inner.target_lead_time_days ?? 0);
    const leadTargetDays =
      Number.isFinite(leadTargetDaysRaw) && leadTargetDaysRaw > 0 ? leadTargetDaysRaw : null;

    const created = pickScalarString(inner.created_at, row.created_at).trim();
    const createdAtMs = created ? new Date(created).getTime() : 0;

    const addressSummary = pickScalarString(inner.address_summary, row.address_summary).trim();

    const myQuoteStatusRaw = inner.my_quote_status ?? row.my_quote_status;
    const hasMyQuote = pickScalarString(myQuoteStatusRaw) !== '';
    const myQuoteStatus = hasMyQuote ? pickScalarString(myQuoteStatusRaw).toUpperCase() : null;
    const myQuotedPriceRaw = Number(inner.my_quoted_price ?? row.my_quoted_price ?? NaN);
    const myQuotedPrice = hasMyQuote && Number.isFinite(myQuotedPriceRaw) ? myQuotedPriceRaw : null;

    bases.push({
      id,
      title,
      requestKind,
      status,
      categoryName,
      subCategoryName,
      budgetPerPiece: Number.isFinite(budgetPerPiece!) ? budgetPerPiece : null,
      quantity: Number.isFinite(quantity!) ? quantity : null,
      revenueApprox: revenueApprox != null && Number.isFinite(revenueApprox) ? revenueApprox : null,
      leadTargetDays,
      deadlineIso,
      shippingMethodName,
      addressSummary,
      thumbUrl,
      myQuotedPrice,
      myQuoteStatus,
      hasMyQuote,
      categoryId: Number.isFinite(categoryId) && categoryId > 0 ? categoryId : 0,
      shippingMethodId,
      createdAtMs: Number.isFinite(createdAtMs) ? createdAtMs : 0,
      daysLeft: dLeft,
    });
  }
  return bases;
}

export function useFactoryRfqBoard() {
  const { user } = useAuth();
  const fid = getFactoryEntityId(user);
  const [rows, setRows] = useState<FactoryBoardRow[]>([]);
  const [factoryCategoryIds, setFactoryCategoryIds] = useState<number[]>([]);
  const [shipNameById] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dismissedRows, setDismissedRows] = useState<FactoryBoardRow[]>([]);
  const [dismissedLoading, setDismissedLoading] = useState(false);
  const [dismissedLoaded, setDismissedLoaded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const board = await factoryRfqsApi.getRFQBoard();
      setFactoryCategoryIds(
        Array.isArray(board.factory_category_ids) ? board.factory_category_ids : [],
      );

      const bases = parseRfqRows(board);
      const visible = bases.filter((b) => {
        if (b.hasMyQuote && b.myQuoteStatus === 'AC') return false;
        if (b.hasMyQuote && b.myQuoteStatus === 'EX') return false;
        if (!b.hasMyQuote && b.status !== 'OP') return false;
        return true;
      });

      setRows(visible);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลด RFQ ไม่สำเร็จ');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fid]);

  const loadDismissed = useCallback(async () => {
    setDismissedLoading(true);
    try {
      const board = await factoryRfqsApi.getRFQBoard({ show_dismissed: true });
      const all = parseRfqRows(board);
      // show_dismissed=true returns only dismissed rows from BE
      setDismissedRows(all);
      setDismissedLoaded(true);
    } catch {
      setDismissedRows([]);
    } finally {
      setDismissedLoading(false);
    }
  }, [fid]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    fid,
    rows,
    factoryCategoryIds,
    shipNameById,
    loading,
    error,
    reload: load,
    dismissedRows,
    dismissedLoading,
    dismissedLoaded,
    loadDismissed,
    reloadDismissed: loadDismissed,
  };
}
