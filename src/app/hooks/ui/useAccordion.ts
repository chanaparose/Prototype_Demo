import { useState, useCallback } from 'react';

interface UseAccordionReturn {
  expandedItems: Set<string>;
  isExpanded: (itemId: string) => boolean;
  toggleItem: (itemId: string) => void;
  expandItem: (itemId: string) => void;
  collapseItem: (itemId: string) => void;
  expandAll: (itemIds: string[]) => void;
  collapseAll: () => void;
}

/**
 * Manage accordion state with expand/collapse functionality
 * Supports both single and multi-expansion modes
 * @param multiExpand - Allow multiple items expanded at once (default: true)
 * @param defaultExpanded - Initially expanded item IDs
 */
export function useAccordion(
  multiExpand = true,
  defaultExpanded: string[] = [],
): UseAccordionReturn {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(defaultExpanded));

  const isExpanded = useCallback((itemId: string) => expandedItems.has(itemId), [expandedItems]);

  const toggleItem = useCallback(
    (itemId: string) => {
      setExpandedItems((prev) => {
        const next = new Set(prev);
        if (next.has(itemId)) {
          next.delete(itemId);
        } else {
          if (!multiExpand) next.clear();
          next.add(itemId);
        }
        return next;
      });
    },
    [multiExpand],
  );

  const expandItem = useCallback((itemId: string) => {
    setExpandedItems((prev) => new Set([...prev, itemId]));
  }, []);

  const collapseItem = useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  }, []);

  const expandAll = useCallback((itemIds: string[]) => {
    setExpandedItems(new Set(itemIds));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedItems(new Set());
  }, []);

  return {
    expandedItems,
    isExpanded,
    toggleItem,
    expandItem,
    collapseItem,
    expandAll,
    collapseAll,
  };
}
