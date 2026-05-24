/** ─── printShippingLabel.ts ──────────────────────────────────────────────────
 *  ใบปะหน้าพัสดุแบบตาราง ผู้ส่ง | ผู้รับ — พร้อมช่อง Description กรอกในหน้า
 *  ไม่ต้องติดตั้ง library เพิ่มเติม
 * ──────────────────────────────────────────────────────────────────────────── */

export interface ShippingLabelOptions {
  /* ผู้รับ */
  recipientName?: string;
  recipientPhone?: string;
  addressLine?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;

  /* ผู้ส่ง */
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;

  /* ออเดอร์ */
  orderCode: string;
  orderTitle?: string;
  trackingNumber?: string;
  printDate?: string;
}

/* ─── helpers ────────────────────────────────────────────────────────────── */

function escHtml(s: string | undefined): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fullAddress(opts: {
  addressLine?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
}): string {
  return [
    opts.addressLine,
    opts.subDistrict ? `ต.${opts.subDistrict}` : '',
    opts.district ? `อ.${opts.district}` : '',
    opts.province,
    opts.postalCode,
  ]
    .filter(Boolean)
    .join(' ');
}

/* ─── buildHtml ──────────────────────────────────────────────────────────── */

function buildHtml(opts: ShippingLabelOptions): string {
  const recipientAddr = escHtml(fullAddress(opts));
  const today =
    opts.printDate ??
    new Date().toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const senderAddrText = escHtml(opts.senderAddress ?? '');
  const senderNameText = escHtml(opts.senderName ?? '');
  const senderPhoneText = escHtml(opts.senderPhone ?? '');
  const initDesc = escHtml(opts.orderTitle ?? '');

  return /* html */ `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>ใบปะหน้า ${escHtml(opts.orderCode)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Sarabun', 'TH Sarabun New', Arial, sans-serif;
      background: #e4e4e4;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 28px 16px 48px;
    }

    /* ── toolbar ── */
    .toolbar {
      display: flex;
      gap: 10px;
      margin-bottom: 22px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 20px;
      border: none;
      border-radius: 5px;
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity .15s;
    }
    .btn:hover { opacity: .82; }
    .btn-print  { background: #111; color: #fff; }
    .btn-outline { background: #fff; color: #333; border: 1.5px solid #bbb; }

    /* ── description input (screen only) ── */
    .desc-panel {
      width: 148mm;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .desc-panel label { font-size: 12px; font-weight: 600; white-space: nowrap; color: #444; }
    .desc-panel input {
      flex: 1;
      border: 1.5px solid #bbb;
      border-radius: 5px;
      padding: 6px 10px;
      font-family: inherit;
      font-size: 13px;
      outline: none;
      background: #fff;
    }
    .desc-panel input:focus { border-color: #555; }

    /* ── label wrapper ── */
    .label {
      width: 148mm;
      background: #fff;
      font-size: 13px;
      color: #000;
    }

    /* ── logo / header bar ── */
    .logo-bar {
      border: 1.5px solid #000;
      border-bottom: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 7px 12px;
    }
    .logo-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .logo-mark {
      width: 180px;
      height: 66px;
      object-fit: contain;
      object-position: left center;
      flex-shrink: 0;
    }
    .logo-text {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #1a1a1a;
    }
    .logo-sub { font-size: 10px; color: #666; margin-top: 1px; }
    .logo-right { text-align: right; font-size: 11px; color: #555; line-height: 1.5; }
    .logo-order { font-size: 13px; font-weight: 700; color: #111; }

    /* ── main table ── */
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #000;
    }
    td, th {
      border: 1.5px solid #000;
      padding: 0;
      vertical-align: top;
    }

    /* column header */
    .col-header {
      text-align: center;
      font-weight: 800;
      font-size: 14px;
      padding: 5px 8px;
      background: #fff;
    }

    /* party cells */
    .party-cell {
      padding: 8px 10px;
      width: 50%;
      min-height: 84px;
      vertical-align: top;
    }
    .party-row {
      display: flex;
      margin-bottom: 5px;
      font-size: 13px;
      line-height: 1.5;
    }
    .party-key {
      font-weight: 700;
      white-space: nowrap;
      margin-right: 4px;
      min-width: 72px;
    }
    .party-val { flex: 1; word-break: break-word; }
    .party-addr-block { margin-top: 1px; font-size: 12px; line-height: 1.6; }

    /* bottom: description | payment */
    .bottom-key {
      font-weight: 700;
      font-size: 12px;
      padding: 4px 8px;
      white-space: nowrap;
      vertical-align: middle;
    }
    .bottom-val {
      font-size: 12px;
      padding: 4px 8px;
      vertical-align: middle;
    }
    .sub-cell {
      font-size: 12px;
      padding: 7px 8px;
      min-height: 32px;
    }

    /* description text shown when printing (hidden span, updated by JS) */
    #desc-print { display: none; }

    /* print */
    @media print {
      body  { background: #fff; padding: 0; align-items: flex-start; }
      .toolbar { display: none; }
      .desc-panel { display: none; }
      .label { width: 100%; }
      #desc-print { display: inline; }
    }
  </style>
</head>
<body>

  <div class="toolbar">
    <button class="btn btn-print" onclick="window.print()">🖨️&nbsp; พิมพ์ใบปะหน้า</button>
    <button class="btn btn-outline" onclick="window.close()">✕&nbsp; ปิด</button>
  </div>

  <!-- description input (screen only) -->
  <div class="desc-panel">
    <label for="desc-input">DESCRIPTION :</label>
    <input id="desc-input" type="text" maxlength="200"
           value="${initDesc}"
           placeholder="ระบุรายละเอียด / หมายเหตุ (ไม่บังคับ)"
           oninput="document.getElementById('desc-print').textContent=this.value; document.getElementById('desc-cell').textContent=this.value||''"/>
  </div>

  <div class="label">

    <!-- ── logo / header ── -->
    <div class="logo-bar">
      <div class="logo-left">
        <img class="logo-mark" src="/assets/tryly-logo.png" alt="Tryly" />
        <div>
          <div class="logo-sub">ใบปะหน้าพัสดุ</div>
        </div>
      </div>
      <div class="logo-right">
        <div class="logo-order">${escHtml(opts.orderCode)}</div>
        <div>วันที่พิมพ์ : ${today}</div>
      </div>
    </div>

    <!-- ── main table ── -->
    <table>

      <!-- column headers -->
      <tr>
        <th class="col-header" style="width:50%">ผู้ส่ง</th>
        <th class="col-header" style="width:50%">ผู้รับ</th>
      </tr>

      <!-- sender | recipient -->
      <tr>
        <td class="party-cell">
          <div class="party-row">
            <span class="party-key">NAME :</span>
            <span class="party-val">${senderNameText || '&nbsp;'}</span>
          </div>
          <div class="party-row">
            <span class="party-key">PHONE :</span>
            <span class="party-val">${senderPhoneText || '&nbsp;'}</span>
          </div>
          <div class="party-row" style="flex-direction:column">
            <span class="party-key">ADDRESS</span>
            <div class="party-addr-block">${senderAddrText || '&nbsp;'}</div>
          </div>
        </td>

        <td class="party-cell">
          <div class="party-row">
            <span class="party-key">NAME :</span>
            <span class="party-val">${escHtml(opts.recipientName) || '&nbsp;'}</span>
          </div>
          <div class="party-row">
            <span class="party-key">PHONE :</span>
            <span class="party-val">${escHtml(opts.recipientPhone) || '&nbsp;'}</span>
          </div>
          <div class="party-row" style="flex-direction:column">
            <span class="party-key">ADDRESS</span>
            <div class="party-addr-block">${recipientAddr || '&nbsp;'}</div>
          </div>
        </td>
      </tr>

      <!-- bottom row: description | payment -->
      <tr>
        <!-- description -->
        <td>
          <table style="width:100%;border:none">
            <tr>
              <td class="bottom-key" style="border:none;border-right:1.5px solid #000;width:42%">DESCRIPTION</td>
              <td class="bottom-val" style="border:none">
                <span id="desc-print">${initDesc}</span>
              </td>
            </tr>
            <tr>
              <td id="desc-cell" colspan="2"
                  style="border:none;border-top:1.5px solid #000;padding:7px 8px;font-size:12px;min-height:34px">
                ${initDesc}
              </td>
            </tr>
          </table>
        </td>

        <!-- payment -->
        <td>
          <table style="width:100%;border:none">
            <tr>
              <td class="bottom-key" style="border:none;border-right:1.5px solid #000;width:42%">PAYMENT</td>
              <td class="bottom-val" style="border:none">ชำระแล้ว</td>
            </tr>
            <tr>
              <td colspan="2" style="border:none;border-top:1.5px solid #000;padding:7px 8px;font-size:12px;text-align:center">
                ชำระแล้วเงินสด
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
  </div>

  <script>
    // sync input → label on load
    const inp = document.getElementById('desc-input');
    const cell = document.getElementById('desc-cell');
    const pr = document.getElementById('desc-print');
    if (inp && cell && pr) {
      cell.textContent = inp.value;
      pr.textContent   = inp.value;
    }
  </script>
</body>
</html>`;
}

/* ─── public API ─────────────────────────────────────────────────────────── */

export function openShippingLabel(opts: ShippingLabelOptions): void {
  const html = buildHtml(opts);
  const win = window.open(
    '',
    '_blank',
    'width=640,height=620,toolbar=0,menubar=0,scrollbars=1,resizable=1',
  );
  if (!win) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
