import React from "react";
import { useNavigate } from "react-router";
import { Button } from '../../components/ui/button';
import {
  Search,
  BadgeCheck,
  Heart,
  Sparkles,
  X,
  Loader2,
  LayoutGrid,
  List,
  MapPin,
  Star,
} from "lucide-react";
import { FactoryIdeasCategoryDropdown } from '../../components/features/factory-ideas/FactoryIdeasCategoryDropdown';
import { useFactoryIdeasPageState } from './useFactoryIdeasPageState';
import {
  factoryIdeasContentTypeBadge as contentTypeBadge,
  factoryIdeasContentTypeLabel as contentTypeLabel,
  factoryIdeasContentTypes as CONTENT_TYPES,
  factoryIdeasTheme as COLORS,
} from '../../components/features/factory-ideas/factoryIdeasTheme';
import { ImageWithFallback } from "../../components/shared";

export function FactoryIdeasMobile() {
  const navigate = useNavigate();
  const {
    data,
    isLiked,
    toggleFavorite,
    searchText,
    setSearchText,
    selectedType,
    setSelectedType,
    viewMode,
    setViewMode,
    categoryMenuOpen,
    setCategoryMenuOpen,
    categoryMenuStep,
    setCategoryMenuStep,
    categoryMenuRef,
    menuHighlightCategoryId,
    setMenuHighlightCategoryId,
    panelSubs,
    panelSubsLoading,
    selectedSubCategoryId,
    setSelectedSubCategoryId,
    categoryFilters,
    effectiveCategoryId,
    applyCategory,
    isFactoryTab,
    isMaterialTab,
    showcasesLoading,
    factoriesLoading,
    visibleItems,
    visibleIdeaItems,
    visibleMaterialItems,
    visibleFactories,
    totalCount,
    categoryMenuTriggerLabel,
    closeCategoryMenu,
    pickSubCategory,
    categoryOptionSelected,
    getDetailPath,
  } = useFactoryIdeasPageState({ layout: 'mobile' });

  return (
    <div
      className="pb-24 min-h-screen"
      style={{ backgroundColor: COLORS.lightPurpleBg }}
    >
      {/* ── Header ── */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="mb-2.5">
          <p
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: COLORS.orange }}
          >
            Discover
          </p>
          <h1
            className="text-lg font-bold leading-tight"
            style={{ color: COLORS.blue }}
          >
            แนะนำโรงงาน
          </h1>
        </div>

        {/* Hero banner — กระชับขึ้น ~ครึ่งหนึ่ง */}
        <div
          className="rounded-xl px-3 py-2.5 relative overflow-hidden text-white shadow-md mb-2.5"
          style={{
            background: "linear-gradient(135deg, #2D1B4E 0%, #4A267D 100%)",
          }}
        >
          <div
            className="absolute -right-5 -top-5 w-24 h-24 rounded-full opacity-35 blur-xl mix-blend-screen pointer-events-none"
            style={{ backgroundColor: "#FF7A00" }}
          />
          <div
            className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-50 transform translate-x-5 skew-x-[-15deg] pointer-events-none"
            style={{ backgroundColor: "#A238FF" }}
          />
          <div
            className="absolute -left-2 -bottom-2 w-14 h-14 rounded-full opacity-25 blur-lg mix-blend-screen pointer-events-none"
            style={{ backgroundColor: "#A238FF" }}
          />
          <div className="relative z-10 flex items-center gap-2.5">
            <div
              className="p-1.5 rounded-full shrink-0 flex items-center justify-center"
              style={{
                backgroundColor: "rgba(162,56,255,0.30)",
                border: "1px solid rgba(162,56,255,0.50)",
              }}
            >
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[11px] font-medium leading-snug mb-0.5"
                style={{ color: "#EBD3FF" }}
              >
                พื้นที่โปรโมตจากโรงงานพาร์ทเนอร์
              </p>
              <h2 className="text-[13px] font-bold leading-snug line-clamp-2">
                ค้นหาไอเดียสินค้าใหม่ พร้อมโรงงานที่ทำได้จริงในที่เดียว
              </h2>
            </div>
            <span
              className="shrink-0 text-[11px] font-semibold tabular-nums leading-none py-0.5 px-1.5 rounded-md self-center"
              style={{ color: "#EBD3FF", background: "rgba(255,255,255,0.12)" }}
            >
              {totalCount} รายการ
            </span>
          </div>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 border transition-all"
          style={{ backgroundColor: COLORS.gray, borderColor: "#E5E7EB" }}
        >
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="ค้นหาไอเดีย สินค้า หรือชื่อโรงงาน…"
            className="flex-1 text-[13px] bg-transparent outline-none placeholder-gray-400 min-w-0"
            style={{ color: COLORS.blue }}
          />
          {searchText && (
            <Button variant="unstyled"
              type="button"
              onClick={() => setSearchText("")}
              aria-label="ล้างข้อความค้นหา"
              className="shrink-0 p-0.5"
            >
              <X size={13} className="text-gray-400" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Sticky filter bar ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        {/* Row 1: Content type pills — scroll แนวนอน แถวเดียว */}
        <div
          className="flex items-center gap-1.5 px-4 pt-3 pb-2 overflow-x-auto scrollbar-hide"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {CONTENT_TYPES.map((type) => {
            const active = selectedType === type.id;
            return (
              <Button variant="unstyled"
                key={type.id}
                type="button"
                data-tour={`tab-${type.id}`}
                onClick={() => setSelectedType(type.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] transition-all whitespace-nowrap ${
                  active ? "shadow-sm" : "active:scale-95"
                }`}
                style={{
                  backgroundColor: active
                    ? COLORS.orange
                    : "rgba(46,34,82,0.07)",
                  color: active ? COLORS.white : COLORS.blue,
                  fontWeight: active ? 700 : 500,
                  boxShadow: active
                    ? "0 2px 8px rgba(227,136,68,0.30)"
                    : "none",
                }}
              >
                {type.label}
              </Button>
            );
          })}
        </div>

        {/* Row 2: Category (multi-level) + จำนวน + view toggle */}
        <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
          <FactoryIdeasCategoryDropdown
            variant="mobile"
            categoryMenuRef={categoryMenuRef}
            categoryMenuOpen={categoryMenuOpen}
            setCategoryMenuOpen={setCategoryMenuOpen}
            categoryMenuStep={categoryMenuStep}
            setCategoryMenuStep={setCategoryMenuStep}
            categoryFilters={categoryFilters}
            effectiveCategoryId={effectiveCategoryId}
            selectedSubCategoryId={selectedSubCategoryId}
            setSelectedSubCategoryId={setSelectedSubCategoryId}
            isMaterialTab={isMaterialTab}
            categoryMenuTriggerLabel={categoryMenuTriggerLabel}
            menuHighlightCategoryId={menuHighlightCategoryId}
            setMenuHighlightCategoryId={setMenuHighlightCategoryId}
            panelSubs={panelSubs}
            panelSubsLoading={panelSubsLoading}
            applyCategory={applyCategory}
            closeCategoryMenu={closeCategoryMenu}
            pickSubCategory={pickSubCategory}
            categoryOptionSelected={categoryOptionSelected}
          />

          {/* Count badge */}
          <span
            className="shrink-0 text-[11px] font-semibold tabular-nums px-2 py-1 rounded-md"
            style={{
              color: COLORS.blue,
              backgroundColor: "rgba(46,34,82,0.06)",
            }}
          >
            {totalCount} รายการ
          </span>

          {/* View toggle */}
          <div
            className="shrink-0 flex items-center gap-0.5 p-0.5 rounded-lg border border-gray-200"
            style={{ backgroundColor: COLORS.gray }}
          >
            <Button variant="unstyled"
              type="button"
              onClick={() => setViewMode("grid")}
              className="p-1.5 rounded-md transition-all"
              style={{
                backgroundColor:
                  viewMode === "grid" ? COLORS.white : "transparent",
                color: viewMode === "grid" ? COLORS.purple : "#9CA3AF",
                boxShadow:
                  viewMode === "grid" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              }}
              aria-label="มุมมองตาราง"
            >
              <LayoutGrid size={14} />
            </Button>
            <Button variant="unstyled"
              type="button"
              onClick={() => setViewMode("list")}
              className="p-1.5 rounded-md transition-all"
              style={{
                backgroundColor:
                  viewMode === "list" ? COLORS.white : "transparent",
                color: viewMode === "list" ? COLORS.purple : "#9CA3AF",
                boxShadow:
                  viewMode === "list" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              }}
              aria-label="มุมมองรายการ"
            >
              <List size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 pt-4">
        {showcasesLoading || factoriesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2
              className="w-6 h-6 animate-spin"
              style={{ color: COLORS.purple }}
            />
            <span className="ml-2 text-sm text-gray-500">กำลังโหลด...</span>
          </div>
        ) : totalCount === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm font-medium" style={{ color: COLORS.blue }}>
              ไม่พบรายการที่ตรงกับเงื่อนไข
            </p>
            <p className="text-xs text-gray-400 mt-1">
              ลองเปลี่ยนคีย์เวิร์ดหรือหมวดหมู่
            </p>
          </div>
        ) : isFactoryTab ? (
          /* ━━━ Factory-only Grid ━━━ */
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {visibleFactories.map((factory) => (
              <article
                key={factory.id}
                className="bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col active:scale-[0.98]"
                onClick={() => navigate(`/factories/${factory.id}`)}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <ImageWithFallback
                    src={factory.image}
                    alt={factory.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {factory.verified && (
                    <div className="absolute top-1 left-1 z-[1] flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                      <BadgeCheck
                        className="w-2.5 h-2.5 shrink-0"
                        style={{ color: "#A238FF" }}
                      />
                      <span
                        className="font-medium text-[8px]"
                        style={{ color: "#A238FF" }}
                      >
                        ยืนยัน
                      </span>
                    </div>
                  )}
                </div>
                {/* Body */}
                <div className="p-2 flex flex-col flex-1 justify-between gap-0.5">
                  <p className="text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-[#A238FF] transition-colors">
                    {factory.name}
                  </p>
                  <div className="flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                    <span className="text-gray-500 text-[10px] truncate">
                      {(factory.provinceName ?? factory.location).trim() || "—"}
                    </span>
                  </div>
                  {/* Footer */}
                  <div className="mt-auto pt-1 border-t border-gray-50">
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                        <span className="text-gray-700 text-[10px] font-semibold">
                          {factory.rating}
                        </span>
                        <span className="text-gray-400 text-[9px]">
                          ({factory.reviews})
                        </span>
                      </div>
                      <span className="text-gray-400 text-[8px] shrink-0">
                        ขั้นต่ำ {factory.minOrder}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : selectedType === "idea" ? (
          <div className="grid grid-cols-1 gap-2">
            {visibleIdeaItems.map((item) => {
              const factory = data.factories.find(
                (f) => f.id === item.factoryId,
              );
              return (
                <article
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer p-3"
                  onClick={() =>
                    navigate(getDetailPath(item.contentType, item.id))
                  }
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center rounded-full bg-[#F6EEFC] px-2 py-0.5 text-[10px] font-bold text-[#A656A0] uppercase tracking-wide">
                      ไอเดีย
                    </span>
                    <span className="text-[10px] text-gray-400 truncate">
                      {item.factoryName}
                    </span>
                  </div>
                  <h3 className="font-bold text-[13px] text-[#292259] mb-1 line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-[12px] text-gray-500 line-clamp-2">
                    {item.excerpt || " "}
                  </p>
                  <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">
                      แตะเพื่ออ่านต่อ
                    </span>
                    <Button variant="unstyled"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void toggleFavorite(item.id);
                      }}
                      className="flex items-center gap-0 shrink-0 tabular-nums text-[9px] active:opacity-70"
                      aria-label="ถูกใจ"
                    >
                      <Heart
                        className="w-2.5 h-2.5 shrink-0"
                        style={
                          isLiked(item.id)
                            ? { color: "#EF4444", fill: "#EF4444" }
                            : {}
                        }
                      />
                      <span className="text-[10px] leading-none">
                        {item.likes + (isLiked(item.id) ? 1 : 0)}
                      </span>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : viewMode === "grid" ? (
          /* ━━━ Grid View ━━━
             Rule: grid + items-stretch → ทุกการ์ดในแถวเดียวกันสูงเท่ากัน
             Rule: h-full + flex flex-col → การ์ดยืดเต็ม Grid Track */
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {visibleItems.map((item) => {
              const factory = data.factories.find(
                (f) => f.id === item.factoryId,
              );
              const badgeColor = contentTypeBadge[item.contentType];
              return (
                <article
                  key={item.id}
                  className="bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col active:scale-[0.98]"
                  onClick={() =>
                    navigate(getDetailPath(item.contentType, item.id))
                  }
                >
                  {/* ── Image: h-[150px] ตายตัว + shrink-0 ป้องกัน flex บีบ ── */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span
                      className="absolute top-1 left-1 z-[1] px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white"
                      style={{ backgroundColor: badgeColor }}
                    >
                      {contentTypeLabel[item.contentType]}
                    </span>
                  </div>

                  {/* ── Body: flex-1 ยืดเต็มที่เหลือ + min-w-0 ให้ truncate ทำงาน ── */}
                  <div className="p-2 flex flex-col flex-1 justify-between gap-0.5">
                    {/* Title — min-h-[36px] จอง 2 บรรทัดเสมอ */}
                    <h3 className="text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-[#A238FF] transition-colors">
                      {item.title}
                    </h3>

                    <div className="flex items-center gap-0.5 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                      <span className="text-gray-500 text-[10px] truncate">
                        {(
                          factory?.provinceName ??
                          factory?.location ??
                          ""
                        ).trim() || "—"}
                      </span>
                    </div>

                    {/* ── Footer: mt-auto ดันลงล่างเสมอ ── */}
                    <div className="mt-auto pt-1 border-t border-gray-50">
                      {/* Factory name — h-[18px] ตายตัว ไม่ว่ามีหรือไม่มีชื่อ */}
                      <div className="flex items-center justify-between min-w-0">
                        <div className="flex items-center gap-0.5 min-w-0">
                          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                          <span className="text-gray-700 text-[10px] font-semibold">
                            {factory?.rating ?? 0}
                          </span>
                          <span className="text-gray-400 text-[9px] truncate">
                            ({factory?.reviews ?? 0})
                          </span>
                        </div>
                        <span className="text-gray-400 text-[8px] shrink-0">
                          ขั้นต่ำ {item.minOrder}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* ━━━ List View ━━━
             Rule: h-[130px] ตายตัว + overflow-hidden ซ่อนส่วนที่ล้น */
          <div className="space-y-3">
            {visibleItems.map((item) => {
              const factory = data.factories.find(
                (f) => f.id === item.factoryId,
              );
              const badgeColor = contentTypeBadge[item.contentType];
              return (
                <article
                  key={item.id}
                  className="h-[130px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
                  onClick={() =>
                    navigate(getDetailPath(item.contentType, item.id))
                  }
                >
                  <div className="flex h-full p-3 gap-3">
                    {/* ── Image: w-[100px] + shrink-0 ล็อคขนาด ── */}
                    <div className="w-[100px] shrink-0 rounded-xl overflow-hidden bg-gray-100 relative">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <span
                        className="absolute top-1.5 left-1.5 z-[1] px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: badgeColor }}
                      >
                        {contentTypeLabel[item.contentType]}
                      </span>
                    </div>

                    {/* ── Content: flex-1 + min-w-0 ป้องกันทะลักกรอบ ── */}
                    <div className="flex flex-col flex-1 min-w-0 justify-between">
                      <div className="min-w-0">
                        {item.category && (
                          <p className="text-[9px] text-gray-400 truncate mb-0.5">
                            {item.category}
                          </p>
                        )}
                        <h3
                          className="text-[12px] font-bold leading-snug line-clamp-2 min-w-0"
                          style={{ color: COLORS.blue }}
                        >
                          {item.title}
                        </h3>
                        <p className="text-[10px] leading-[15px] text-gray-500 line-clamp-2 mt-1">
                          {item.excerpt || " "}
                        </p>
                      </div>

                      {/* Footer — mt-auto ติดขอบล่าง */}
                      <div className="flex items-center justify-between gap-2 mt-auto pt-1.5 border-t border-gray-50 min-w-0">
                        <Button variant="unstyled"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/factories/${item.factoryId}`);
                          }}
                          className="flex items-center gap-1 text-[10px] font-semibold min-w-0 text-left active:opacity-80"
                          style={{ color: COLORS.blue }}
                        >
                          <span className="truncate">{item.factoryName}</span>
                          {factory?.verified && (
                            <BadgeCheck
                              className="w-3 h-3 shrink-0"
                              style={{ color: COLORS.purple }}
                            />
                          )}
                        </Button>
                        <span className="text-[9px] text-gray-400 shrink-0">
                          ขั้นต่ำ{" "}
                          <span
                            className="font-semibold tabular-nums"
                            style={{ color: COLORS.blue }}
                          >
                            {item.minOrder}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* ── Right column: w-[40px] + shrink-0 ล็อคขนาด ── */}
                    <div className="w-[40px] shrink-0 flex flex-col items-center justify-center border-l border-gray-100 pl-2">
                      <Button variant="unstyled"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void toggleFavorite(item.id);
                        }}
                        className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-gray-400 active:opacity-70"
                        aria-label="ถูกใจ"
                      >
                        <Heart
                          className="w-4 h-4 shrink-0"
                          style={
                            isLiked(item.id)
                              ? { color: "#EF4444", fill: "#EF4444" }
                              : {}
                          }
                        />
                        <span className="text-[9px] font-medium tabular-nums leading-none">
                          {item.likes + (isLiked(item.id) ? 1 : 0)}
                        </span>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {selectedType === "all" && visibleMaterialItems.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-sm font-bold flex items-center gap-1.5"
                style={{ color: COLORS.blue }}
              >
                <Sparkles className="w-4 h-4" style={{ color: "#0EA5A4" }} />
                วัตถุดิบแนะนำ
              </h3>
              <Button variant="unstyled"
                type="button"
                onClick={() => setSelectedType("material")}
                className="text-[11px] font-medium"
                style={{ color: COLORS.purple }}
              >
                ดูทั้งหมด ({visibleMaterialItems.length})
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {visibleMaterialItems.slice(0, 4).map((item) => {
                const factory = data.factories.find(
                  (f) => f.id === item.factoryId,
                );
                return (
                  <article
                    key={`mt-top-${item.id}`}
                    className="bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col active:scale-[0.98]"
                    onClick={() =>
                      navigate(getDetailPath(item.contentType, item.id))
                    }
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span
                        className="absolute top-1 left-1 z-[1] px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white"
                        style={{ backgroundColor: "#0EA5A4" }}
                      >
                        วัตถุดิบ
                      </span>
                    </div>
                    <div className="p-2 flex flex-col flex-1 justify-between gap-0.5">
                      <h3 className="text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-[#A238FF] transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                        <span className="text-gray-500 text-[10px] truncate">
                          {(
                            factory?.provinceName ??
                            factory?.location ??
                            ""
                          ).trim() || "—"}
                        </span>
                      </div>
                      <div className="mt-auto pt-1 border-t border-gray-50">
                        <div className="flex items-center justify-between min-w-0">
                          <div className="flex items-center gap-0.5 min-w-0">
                            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                            <span className="text-gray-700 text-[10px] font-semibold">
                              {factory?.rating ?? 0}
                            </span>
                            <span className="text-gray-400 text-[9px] truncate">
                              ({factory?.reviews ?? 0})
                            </span>
                          </div>
                          <span className="text-gray-400 text-[8px] shrink-0">
                            ขั้นต่ำ {item.minOrder}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* ━━━ Factory section ใน tab "ทั้งหมด" ━━━ */}
        {selectedType === "all" && visibleFactories.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-sm font-bold flex items-center gap-1.5"
                style={{ color: COLORS.blue }}
              >
                <MapPin className="w-4 h-4" style={{ color: COLORS.teal }} />
                โรงงานแนะนำ
              </h3>
              <Button variant="unstyled"
                type="button"
                onClick={() => setSelectedType("factory")}
                className="text-[11px] font-medium"
                style={{ color: COLORS.purple }}
              >
                ดูทั้งหมด ({visibleFactories.length})
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {visibleFactories.slice(0, 4).map((factory) => (
                <div
                  key={`fac-${factory.id}`}
                  onClick={() => navigate(`/factories/${factory.id}`)}
                  className="bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col active:scale-[0.98]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    <ImageWithFallback
                      src={factory.image}
                      alt={factory.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {factory.verified === true && (
                      <div className="absolute top-1 left-1 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                        <BadgeCheck
                          className="w-2.5 h-2.5 shrink-0"
                          style={{ color: "#A238FF" }}
                        />
                        <span
                          className="font-medium text-[8px]"
                          style={{ color: "#A238FF" }}
                        >
                          ยืนยัน
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-2 flex flex-col flex-1 justify-between gap-0.5">
                    <div>
                      <p className="text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-[#A238FF] transition-colors">
                        {factory.name}
                      </p>
                      <div className="flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                        <span className="text-gray-500 text-[10px] truncate">
                          {(factory.provinceName ?? factory.location).trim() ||
                            "—"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                      <div className="flex items-center gap-0.5 min-w-0">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                        <span className="text-gray-700 text-[10px] font-semibold">
                          {factory.rating}
                        </span>
                        <span className="text-gray-400 text-[9px] truncate">
                          ({factory.reviews})
                        </span>
                      </div>
                      <span className="text-gray-400 text-[8px] shrink-0">
                        ขั้นต่ำ {factory.minOrder}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {selectedType === "all" && visibleIdeaItems.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-sm font-bold flex items-center gap-1.5"
                style={{ color: COLORS.blue }}
              >
                <Sparkles
                  className="w-4 h-4"
                  style={{ color: COLORS.purple }}
                />
                บทความ Idea
              </h3>
              <Button variant="unstyled"
                type="button"
                onClick={() => setSelectedType("idea")}
                className="text-[11px] font-medium"
                style={{ color: COLORS.purple }}
              >
                ดูทั้งหมด ({visibleIdeaItems.length})
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {visibleIdeaItems.slice(0, 4).map((item) => {
                const factory = data.factories.find(
                  (f) => f.id === item.factoryId,
                );
                return (
                  <article
                    key={`idea-${item.id}`}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer p-3"
                    onClick={() =>
                      navigate(getDetailPath(item.contentType, item.id))
                    }
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center rounded-full bg-[#F6EEFC] px-2 py-0.5 text-[10px] font-bold text-[#A656A0] uppercase tracking-wide">
                        ไอเดีย
                      </span>
                      <span className="text-[10px] text-gray-400 truncate">
                        {item.factoryName}
                      </span>
                    </div>
                    <h3 className="font-bold text-[13px] text-[#292259] mb-1 line-clamp-2 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-[12px] text-gray-500 line-clamp-2">
                      {item.excerpt || " "}
                    </p>
                    <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">
                        แตะเพื่ออ่านต่อ
                      </span>
                      <Button variant="unstyled"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void toggleFavorite(item.id);
                        }}
                        className="flex items-center gap-0 shrink-0 tabular-nums text-[9px] active:opacity-70"
                        aria-label="ถูกใจ"
                      >
                        <Heart
                          className="w-2.5 h-2.5 shrink-0"
                          style={
                            isLiked(item.id)
                              ? { color: "#EF4444", fill: "#EF4444" }
                              : {}
                          }
                        />
                        <span className="text-[10px] leading-none">
                          {item.likes + (isLiked(item.id) ? 1 : 0)}
                        </span>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
        {selectedType === "all" && visibleMaterialItems.length > 0 && false && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-sm font-bold flex items-center gap-1.5"
                style={{ color: COLORS.blue }}
              >
                <Sparkles className="w-4 h-4" style={{ color: "#0EA5A4" }} />
                วัตถุดิบแนะนำ
              </h3>
              <Button variant="unstyled"
                type="button"
                onClick={() => setSelectedType("material")}
                className="text-[11px] font-medium"
                style={{ color: COLORS.purple }}
              >
                ดูทั้งหมด ({visibleMaterialItems.length})
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {visibleMaterialItems.slice(0, 4).map((item) => {
                const factory = data.factories.find(
                  (f) => f.id === item.factoryId,
                );
                return (
                  <article
                    key={`mt-${item.id}`}
                    className="bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col active:scale-[0.98]"
                    onClick={() =>
                      navigate(getDetailPath(item.contentType, item.id))
                    }
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span
                        className="absolute top-1 left-1 z-[1] px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white"
                        style={{ backgroundColor: "#0EA5A4" }}
                      >
                        วัตถุดิบ
                      </span>
                    </div>
                    <div className="p-2 flex flex-col flex-1 justify-between gap-0.5">
                      <h3 className="text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-[#A238FF] transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                        <span className="text-gray-500 text-[10px] truncate">
                          {(
                            factory?.provinceName ??
                            factory?.location ??
                            ""
                          ).trim() || "—"}
                        </span>
                      </div>
                      <div className="mt-auto pt-1 border-t border-gray-50">
                        <div className="flex items-center justify-between min-w-0">
                          <div className="flex items-center gap-0.5 min-w-0">
                            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                            <span className="text-gray-700 text-[10px] font-semibold">
                              {factory?.rating ?? 0}
                            </span>
                            <span className="text-gray-400 text-[9px] truncate">
                              ({factory?.reviews ?? 0})
                            </span>
                          </div>
                          <span className="text-gray-400 text-[8px] shrink-0">
                            ขั้นต่ำ {item.minOrder}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
