interface ActivityEntry {
  id: string;
  message: string;
}

interface ActivityPanelProps {
  activity: ActivityEntry[];
}

export function ActivityPanel({ activity }: ActivityPanelProps) {
  return (
    <section className="panel card activity-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Activity</p>
          <h2>Session feed</h2>
        </div>
      </div>
      <div className="activity-list" role="log" aria-live="polite">
        {activity.map((entry) => (
          <div key={entry.id} className="activity-entry">
            {entry.message}
          </div>
        ))}
      </div>
    </section>
  );
}
