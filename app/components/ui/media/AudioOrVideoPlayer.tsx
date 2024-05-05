import { forwardRef, useRef, useImperativeHandle, Ref } from "react";

export interface RefAudioOrVideo {
  media: HTMLAudioElement | HTMLVideoElement | null;
}

const AudioOrVideoPlayer = ({ url, type }: { url: string; type: "audio" | "video" }, ref: Ref<RefAudioOrVideo>) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useImperativeHandle(ref, () => ({
    get media() {
      return type === "video" ? videoRef.current : audioRef.current;
    },
  }));

  return (
    <div className="w-full">
      {type === "video" ? (
        <video ref={videoRef} src={url} controls className="h-40 w-full 2xl:h-60" />
      ) : type === "audio" ? (
        <audio ref={audioRef} src={url} controls className="w-full" />
      ) : null}
    </div>
  );
};

export default forwardRef(AudioOrVideoPlayer);
