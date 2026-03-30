import { Composition } from "remotion";
import { HEIGHT, FPS, TOTAL_FRAMES, WIDTH } from "./generatedDemoData";
import { LifelineDemo } from "./LifelineDemo";

export const Root = () => {
  return (
    <Composition
      id="LifelineDemo"
      component={LifelineDemo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
