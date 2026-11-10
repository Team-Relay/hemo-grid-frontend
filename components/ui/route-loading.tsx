/** Generic shell-compatible skeleton for route segments without a specialized loader. */

export function RouteLoading() {
  return (
    <div className="route-loading" role="status" aria-label="Loading workspace">
      <span className="route-loading-title" />
      <span className="route-loading-copy" />
      <div className="route-loading-stats">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="route-loading-content">
        <span />
        <span />
      </div>
      <span className="sr-only">Loading workspace…</span>
    </div>
  );
}
