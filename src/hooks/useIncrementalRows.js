import { useEffect, useRef, useState } from "react";

/**
 * Show a long list in steps: the first `pageSize` rows, then `pageSize` more
 * each time the end of the scroll box comes into view.
 *
 *   const { shown, hasMore, scrollRef, sentinelRef } = useIncrementalRows(rows);
 *   <div ref={scrollRef} className="ui-table-wrap ui-table-wrap--scroll">
 *     ...shown.map(...)
 *     {hasMore && <tr className="ui-table__more"><td ref={sentinelRef}>Loading more…</td></tr>}
 *
 * A new `rows` array (search, filter, reload) starts again from the first page.
 */
const useIncrementalRows = (rows, pageSize = 10) => {
  const [count, setCount] = useState(pageSize);
  const scrollRef = useRef(null);
  const sentinelRef = useRef(null);
  const hasMore = rows.length > count;

  useEffect(() => {
    setCount(pageSize);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [rows, pageSize]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!hasMore || !sentinel || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setCount((current) => current + pageSize);
        }
      },
      { root: scrollRef.current, rootMargin: "0px 0px 120px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, count, pageSize]);

  return { shown: rows.slice(0, count), hasMore, scrollRef, sentinelRef };
};

export default useIncrementalRows;
