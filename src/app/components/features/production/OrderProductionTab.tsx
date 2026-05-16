import React, { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../../stores';
import { useIsDesktop } from '../../../hooks/useIsDesktop';
import { useProductionTemplate } from '../../../hooks/production/useProductionTemplate';
import { useOrderProductionUpdates } from '../../../hooks/production/useOrderProductionUpdates';
import { usePostProductionUpdate } from '../../../hooks/production/usePostProductionUpdate';
import { useRejectProductionUpdate } from '../../../hooks/production/useRejectProductionUpdate';
import { useOrderDetail } from '../../../pages/order-detail/OrderDetailContext';
import { ProductionLockedState } from '../order-detail/locked-states/ProductionLockedState';
import { mergeTemplateWithUpdates, type MergedProductionStep } from './types';
import { ProductionHeader } from './ProductionHeader';
import { ProductionTimeline } from './ProductionTimeline';
import { UpdateStepDrawer } from './UpdateStepDrawer';
import { RejectConfirmModal } from './RejectConfirmModal';
import { getProductionErrorMeta, productionErrorMessage } from './productionErrors';

function isFactoryRole(role: string | undefined): boolean {
  return role === 'FT' || role === 'FACTORY';
}

type Props = {
  orderId: string;
  onPhotoClick?: (url: string) => void;
  onRequestOverviewTab?: () => void;
  onPayDeposit?: () => void;
  onContactFactory?: () => void;
};

export function OrderProductionTab({
  orderId,
  onPhotoClick,
  onRequestOverviewTab,
  onPayDeposit,
  onContactFactory,
}: Props) {
  const { user } = useAuth();
  const {
    effectiveProductionLocked,
    effectiveLockReason,
    lockContextMerged,
    production,
    uiMode,
  } = useOrderDetail();

  const isFactory = isFactoryRole(user?.role);
  const isCustomer = !isFactory;
  const productionInteractive = isFactory && !uiMode.readOnly && !effectiveProductionLocked;

  const tplQ = useProductionTemplate();
  const updQ = useOrderProductionUpdates(orderId);
  const postMutation = usePostProductionUpdate(orderId);
  const rejectMutation = useRejectProductionUpdate(orderId);

  const [drawerStep, setDrawerStep] = useState<MergedProductionStep | null>(null);
  const [rejectStep, setRejectStep] = useState<MergedProductionStep | null>(null);

  const drawerWide = useIsDesktop(768);

  const merged = useMemo(() => {
    if (!tplQ.data?.length || !updQ.data) return [];
    return mergeTemplateWithUpdates(tplQ.data, updQ.data.updates);
  }, [tplQ.data, updQ.data]);

  const orderStatus = updQ.data?.order_status ?? production.order_status ?? '';

  const templatePreview = useMemo(() => {
    if (production.template_preview?.length) return production.template_preview;
    return tplQ.data ?? [];
  }, [production.template_preview, tplQ.data]);

  const handlePhoto = useCallback(
    (url: string) => {
      onPhotoClick?.(url);
    },
    [onPhotoClick],
  );

  const onSubmit = useCallback(
    async (
      body: {
        step_id: number;
        status: 'IP' | 'CD';
        description?: string;
        image_urls: string[];
        confirm_payment_trigger?: boolean;
      },
      opts?: { confirmPaymentTriggerHeader?: boolean },
    ) => {
      await postMutation.mutateAsync({ body, confirmHeader: opts?.confirmPaymentTriggerHeader });
      toast.success('บันทึกแล้ว');
    },
    [postMutation],
  );

  const onRejectConfirm = useCallback(
    async (reason: string) => {
      const uid = rejectStep?.update.update_id;
      if (uid == null || !Number.isFinite(Number(uid))) {
        throw new Error('ไม่พบรหัสอัปเดตสำหรับขั้นนี้');
      }
      try {
        await rejectMutation.mutateAsync({
          updateId: uid,
          rejected_reason: reason,
        });
        toast.success('ส่งคำขอตรวจสอบแล้ว');
      } catch (e) {
        const { code } = getProductionErrorMeta(e);
        if (code === 'DOWNSTREAM_IN_FLIGHT') {
          toast.error(
            'ไม่สามารถปฏิเสธได้ เนื่องจากขั้นตอนถัดไปเริ่มไปแล้ว — กรุณาติดต่อฝ่ายสนับสนุน',
          );
          setRejectStep(null);
          return;
        }
        throw new Error(productionErrorMessage(e));
      }
    },
    [rejectMutation, rejectStep],
  );

  if (effectiveProductionLocked) {
    return (
      <ProductionLockedState
        reason={effectiveLockReason}
        lockContext={lockContextMerged}
        templatePreview={templatePreview}
        onBackToOverview={onRequestOverviewTab}
        onPayDeposit={onPayDeposit}
      />
    );
  }

  if (tplQ.isLoading || updQ.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div
          className="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin mb-3"
          style={{ borderColor: '#A238FF', borderTopColor: 'transparent' }}
        />
        <p className="text-sm text-gray-500">กำลังโหลดการผลิต…</p>
      </div>
    );
  }

  if (tplQ.isError) {
    return (
      <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
        {productionErrorMessage(tplQ.error)}
      </p>
    );
  }

  if (updQ.isError) {
    return (
      <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
        {productionErrorMessage(updQ.error)}
      </p>
    );
  }

  if (!tplQ.data?.length) {
    return <p className="text-sm text-gray-500">ยังไม่มีเทมเพลตขั้นตอนการผลิต</p>;
  }

  return (
    <div className="space-y-4">
      <ProductionHeader merged={merged} orderStatus={orderStatus} />
      <ProductionTimeline
        merged={merged}
        orderStatus={orderStatus}
        isFactory={productionInteractive}
        isCustomer={isCustomer && !uiMode.readOnly}
        onOpenDrawer={(m) => {
          if (!productionInteractive) return;
          setDrawerStep(m);
        }}
        onOpenReject={(m) => {
          if (uiMode.readOnly) return;
          setRejectStep(m);
        }}
        onContactFactory={onContactFactory}
        onPhotoClick={handlePhoto}
      />

      {productionInteractive ? (
        <UpdateStepDrawer
          open={drawerStep != null}
          placement={drawerWide ? 'right' : 'bottom'}
          step={drawerStep}
          onClose={() => setDrawerStep(null)}
          onSubmit={onSubmit}
        />
      ) : null}

      {!uiMode.readOnly ? (
        <RejectConfirmModal
          open={rejectStep != null}
          stepNameTh={rejectStep?.template.step_name_th ?? ''}
          onClose={() => setRejectStep(null)}
          onConfirm={onRejectConfirm}
        />
      ) : null}
    </div>
  );
}
