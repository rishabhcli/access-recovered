import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SEGMENTS } from "./generatedDemoData";

type Segment = (typeof SEGMENTS)[number];

const brandFont = '"Avenir Next", "IBM Plex Sans", "Segoe UI", sans-serif';
const monoFont = '"IBM Plex Mono", "SFMono-Regular", monospace';

const shellStyle: React.CSSProperties = {
  background:
    "radial-gradient(circle at top left, rgba(68,120,255,0.18), transparent 34%), radial-gradient(circle at top right, rgba(19,198,166,0.12), transparent 28%), linear-gradient(180deg, #07111f 0%, #091b2f 38%, #041018 100%)",
  color: "#f5f8ff",
  fontFamily: brandFont,
};

const headlineStyle: React.CSSProperties = {
  fontSize: 64,
  lineHeight: 1.04,
  fontWeight: 700,
  letterSpacing: -1.6,
  margin: 0,
  maxWidth: 880,
  textWrap: "balance",
};

const captionBoxStyle: React.CSSProperties = {
  background: "rgba(7, 17, 31, 0.78)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 22,
  boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
  color: "#f7fbff",
  padding: "18px 22px",
};

const overlayGradientStyle: React.CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(3,8,18,0.45) 0%, rgba(3,8,18,0.08) 18%, rgba(3,8,18,0.04) 36%, rgba(3,8,18,0.56) 100%)",
};

const safeMarginX = 72;

const getCaptionAtFrame = (segment: Segment, frame: number) => {
  if (!segment.captions.length) return "";
  const perCaption = segment.durationFrames / segment.captions.length;
  const index = Math.min(
    segment.captions.length - 1,
    Math.max(0, Math.floor(frame / Math.max(perCaption, 1))),
  );
  return segment.captions[index] ?? "";
};

const useSegmentAnimation = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    fps,
    frame,
    config: { damping: 200, stiffness: 140, mass: 0.7 },
  });
  const fade = interpolate(frame, [0, 10, 22], [0, 0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return { enter, fade };
};

const SegmentBackground: React.FC<{ segment: Segment }> = ({ segment }) => {
  const frame = useCurrentFrame();

  if (segment.stillsSrc.length > 0) {
    const perStill = segment.durationFrames / segment.stillsSrc.length;
    return (
      <AbsoluteFill>
        {segment.stillsSrc.map((still, index) => {
          const start = index * perStill;
          const end = start + perStill;
          const local = frame - start;
          const opacity = interpolate(
            local,
            [-8, 0, 10, perStill - 16, perStill - 2],
            [0, 0, 1, 1, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );
          const scale = interpolate(local, [0, perStill], [1.02, 1.08], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const translateX = interpolate(local, [0, perStill], [-16, 16], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <AbsoluteFill
              key={`${segment.id}-${still}`}
              style={{
                opacity,
                transform: `translateX(${translateX}px) scale(${scale})`,
              }}
            >
              <Img
                src={staticFile(still)}
                style={{
                  height: "100%",
                  objectFit: "cover",
                  width: "100%",
                }}
              />
            </AbsoluteFill>
          );
        })}
      </AbsoluteFill>
    );
  }

  if (segment.clipSrc) {
    const zoom = interpolate(
      frame,
      [0, segment.durationFrames],
      [1.0, segment.id === "hook" || segment.id === "wow" ? 1.045 : 1.02],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
    const translateX = interpolate(
      frame,
      [0, segment.durationFrames],
      [0, segment.id === "public-replay" ? -18 : 12],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );

    return (
      <AbsoluteFill
        style={{
          overflow: "hidden",
          transform: `translateX(${translateX}px) scale(${zoom})`,
        }}
      >
        <OffthreadVideo
          muted
          src={staticFile(segment.clipSrc)}
          startFrom={segment.trimStartFrames}
          style={{
            height: "100%",
            objectFit: "cover",
            width: "100%",
          }}
        />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          ...captionBoxStyle,
          fontSize: 28,
          maxWidth: 720,
          textAlign: "center",
        }}
      >
        Waiting for generated demo media.
      </div>
    </AbsoluteFill>
  );
};

const SegmentOverlay: React.FC<{ segment: Segment }> = ({ segment }) => {
  const frame = useCurrentFrame();
  const { enter, fade } = useSegmentAnimation();
  const caption = getCaptionAtFrame(segment, frame);
  const captionOpacity = interpolate(frame, [0, 8, 18], [0, 0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const progressWidth = interpolate(
    frame,
    [0, segment.durationFrames],
    [0, 100],
    { extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={overlayGradientStyle}>
      <AbsoluteFill style={{ padding: `${54}px ${safeMarginX}px ${46}px` }}>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 12,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 999,
              color: "#d8e8ff",
              fontFamily: monoFont,
              fontSize: 18,
              letterSpacing: 1.5,
              padding: "10px 16px",
              textTransform: "uppercase",
            }}
          >
            Lifeline Demo
          </div>
          <div
            style={{
              color: "#9ac7ff",
              fontFamily: monoFont,
              fontSize: 18,
              letterSpacing: 1.8,
              textTransform: "uppercase",
            }}
          >
            {segment.eyebrow}
          </div>
        </div>

        <div
          style={{
            maxWidth: 980,
            opacity: fade,
            transform: `translateY(${(1 - enter) * 20}px)`,
          }}
        >
          <h1 style={headlineStyle}>{segment.title}</h1>
          {segment.callout ? (
            <div
              style={{
                ...captionBoxStyle,
                color: "#ccf7ef",
                display: "inline-flex",
                fontFamily: monoFont,
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 0.4,
                marginTop: 20,
                padding: "12px 18px",
              }}
            >
              {segment.callout}
            </div>
          ) : null}
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            alignItems: "flex-end",
            display: "flex",
            gap: 28,
          }}
        >
          <div
            style={{
              ...captionBoxStyle,
              maxWidth: 1080,
              opacity: captionOpacity,
              width: "100%",
            }}
          >
            <div
              style={{
                color: "#eff6ff",
                fontSize: 32,
                fontWeight: 500,
                letterSpacing: -0.4,
                lineHeight: 1.3,
                textWrap: "pretty",
              }}
            >
              {caption}
            </div>
          </div>

          <div
            style={{
              ...captionBoxStyle,
              minWidth: 250,
              padding: "18px 20px",
            }}
          >
            <div
              style={{
                color: "#9fc4ff",
                fontFamily: monoFont,
                fontSize: 16,
                letterSpacing: 1.6,
                marginBottom: 10,
                textTransform: "uppercase",
              }}
            >
              Playback
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.08)",
                borderRadius: 999,
                height: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: "linear-gradient(90deg, #6fd6ff 0%, #45f0bf 100%)",
                  borderRadius: 999,
                  height: "100%",
                  width: `${progressWidth}%`,
                }}
              />
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SegmentCardChrome: React.FC = () => {
  const frame = useCurrentFrame();
  const shimmer = interpolate(frame % 90, [0, 44, 89], [0.16, 0.26, 0.16], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        padding: 28,
      }}
    >
      <div
        style={{
          border: `1px solid rgba(255,255,255,${shimmer})`,
          borderRadius: 34,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          height: "100%",
          width: "100%",
        }}
      />
    </AbsoluteFill>
  );
};

const SegmentScene: React.FC<{ segment: Segment }> = ({ segment }) => {
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <SegmentBackground segment={segment} />
      <SegmentOverlay segment={segment} />
      <SegmentCardChrome />
      {segment.audioSrc ? <Audio src={staticFile(segment.audioSrc)} volume={1} /> : null}
    </AbsoluteFill>
  );
};

export const LifelineDemo: React.FC = () => {
  let startFrame = 0;

  return (
    <AbsoluteFill style={shellStyle}>
      {SEGMENTS.map((segment) => {
        const sequence = (
          <Sequence
            key={segment.id}
            durationInFrames={segment.durationFrames}
            from={startFrame}
          >
            <SegmentScene segment={segment} />
          </Sequence>
        );

        startFrame += segment.durationFrames;
        return sequence;
      })}
    </AbsoluteFill>
  );
};
