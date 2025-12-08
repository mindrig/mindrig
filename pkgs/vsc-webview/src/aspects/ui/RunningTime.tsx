import { Icon, Size, textCn, translateSize } from "@wrkspc/ds";
import iconRegularHourglass from "@wrkspc/icons/svg/regular/hourglass.js";

export namespace RunningTime {
  export interface Props {
    runningTimeSec: number | undefined;
    ended: boolean;
    size?: Size;
  }
}

export function RunningTime(props: RunningTime.Props) {
  const { runningTimeSec, ended, size } = props;

  if (runningTimeSec == null && ended) return null;

  return (
    <span className={textCn({ size, color: "detail" })}>
      {runningTimeSec != null ? (
        <>{runningTimeSec}s</>
      ) : (
        <>
          <Icon
            id={iconRegularHourglass}
            color="detail"
            size={translateSize(size, 1)}
          />
        </>
      )}
    </span>
  );
}
