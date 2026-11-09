import { Fragment } from "react";

// 문구 속 **이렇게** 감싼 부분을 굵게(<b>), 줄바꿈(\n)은 <br />로 보여 줌 (lib/copy/ko.ts 문구용)
// boldClassName: 굵은 글씨에 색 등을 더할 때 (섬지기 말풍선)
export function RichText({ text, boldClassName }: { text: string; boldClassName?: string }) {
  return (
    <>
      {text.split("\n").map((line, l) => (
        <Fragment key={l}>
          {l > 0 && <br />}
          {line.split("**").map((part, i) =>
            i % 2 === 1 ? (
              <b key={i} className={boldClassName}>
                {part}
              </b>
            ) : (
              <Fragment key={i}>{part}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </>
  );
}
