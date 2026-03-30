export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const TOTAL_FRAMES = 300;
export const SEGMENTS = [
  {
    id: "placeholder",
    title: "Generating demo assets",
    eyebrow: "Placeholder",
    callout: "Run npm run demo:render",
    clipSrc: null,
    stillsSrc: [],
    audioSrc: null,
    audioSeconds: 0,
    durationSeconds: 10,
    durationFrames: 300,
    trimStartFrames: 0,
    captions: ["Run the demo render pipeline to generate the real composition data."],
  },
] as const;
