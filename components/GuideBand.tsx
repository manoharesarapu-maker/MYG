export function GuideBand({
  response,
  streaming,
}: {
  response: string;
  streaming: boolean;
}) {
  return (
    <section className="band band-guide">
      <div className="band-header">
        <h2 className="band-title">Guide</h2>
        <span className="band-tag">Live</span>
      </div>
      <p className="band-plain">
        What it does: has a conversation with the citizen and works out what they actually need.
      </p>
      <div className="guide-response">
        {response ? (
          <>
            {response}
            {streaming && <span aria-hidden> ▋</span>}
          </>
        ) : (
          <span className="guide-placeholder">
            Send a request above to see Guide respond live.
          </span>
        )}
      </div>
    </section>
  );
}
