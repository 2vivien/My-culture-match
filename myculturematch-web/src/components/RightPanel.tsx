import { StoriesPanel } from './stories/StoriesPanel';
import { RequestCard } from './requests/RequestCard';
import { MessagesPanel } from './messages/MessagesPanel';

export const RightPanel = () => {
  return (
    <aside className="w-80 hidden xl:flex flex-col gap-6 shrink-0 h-full overflow-y-auto hide-scrollbar pb-6 pt-2 select-none">
      <StoriesPanel />
      <RequestCard />
      <MessagesPanel />
    </aside>
  );
};
