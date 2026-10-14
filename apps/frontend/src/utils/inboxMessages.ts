import type { DirectMessage, InboxContact } from '../components/inbox/types';

export const mergeInboxMessages = (
  current: DirectMessage[],
  incoming: DirectMessage[],
): DirectMessage[] => {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort(
    (a, b) =>
      Date.parse(a.createdAt) - Date.parse(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
};

type Activity = Pick<DirectMessage, 'id' | 'createdAt'>;

export const rememberInboxActivity = (
  activity: Map<string, Activity>,
  contactId: string,
  message: DirectMessage,
) => {
  const previous = activity.get(contactId);
  if (
    !previous ||
    Date.parse(message.createdAt) > Date.parse(previous.createdAt) ||
    (message.createdAt === previous.createdAt &&
      message.id.localeCompare(previous.id) > 0)
  ) {
    activity.set(contactId, { id: message.id, createdAt: message.createdAt });
  }
};

// Các sự kiện mới đã nhận phải được giữ khi một GET danh sách cũ trả về muộn.
export const orderInboxContacts = (
  contacts: InboxContact[],
  activity: Map<string, Activity>,
): InboxContact[] => {
  const position = new Map(
    contacts.map((contact, index) => [contact.id, index]),
  );
  return [...contacts].sort((a, b) => {
    const left = activity.get(a.id);
    const right = activity.get(b.id);
    if (left && right)
      return (
        Date.parse(right.createdAt) - Date.parse(left.createdAt) ||
        right.id.localeCompare(left.id)
      );
    if (left) return -1;
    if (right) return 1;
    return position.get(a.id)! - position.get(b.id)!;
  });
};
