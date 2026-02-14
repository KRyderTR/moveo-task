import type { SectionKey, VoteValue } from "../api/votes";
import { BiLike, BiDislike, BiSolidLike, BiSolidDislike } from "react-icons/bi";

export default function VoteBar({
  section,
  current,
  onVote,
}: {
  section: SectionKey;
  current?: VoteValue;
  onVote: (section: SectionKey, value: VoteValue) => void;
}) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onVote(section, 1)}
        className="text-2xl transition hover:scale-110 cursor-pointer"
        aria-label="Like"
      >
        {current === 1 ? (
          <BiSolidLike className="text-green-600" />
        ) : (
          <BiLike className="text-gray-600 hover:text-green-600" />
        )}
      </button>

      <button
        type="button"
        onClick={() => onVote(section, -1)}
        className="text-2xl transition hover:scale-110 cursor-pointer"
        aria-label="Dislike"
      >
        {current === -1 ? (
          <BiSolidDislike className="text-red-600" />
        ) : (
          <BiDislike className="text-gray-600 hover:text-red-600" />
        )}
      </button>
    </div>
  );
}
