import { IslandSeagull } from "@/components/IslandSeagull";
import { SeaWaves } from "@/components/SeaWaves";
import { SkyBird } from "@/components/SkyBird";
import { SwayingPlants } from "@/components/SwayingPlants";
import type { SceneMotionConfig } from "@/lib/scene-motion";

// 섬 안쪽 화면의 움직임(바다 물결·살랑이는 나무와 꽃·갈매기·하늘 새)을 배경과 같은 16:9 무대에 한꺼번에 깔아요.
// 구름은 하늘과 섬 사이에 들어가야 해서 MoodSkyBackground 의 clouds 로 따로 켜요.
export function SceneMotion({ config, className = "" }: { config: SceneMotionConfig; className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${className}`}
      style={{ width: "max(100vw, 177.78vh)", height: "max(56.25vw, 100vh)", containerType: "size" }}
    >
      {config.sea && <SeaWaves mask={config.sea.mask} fade={config.sea.fade} />}
      {(config.palms || config.plants) && <SwayingPlants palms={config.palms ?? []} plants={config.plants ?? []} />}
      {config.birds?.starts.map((bird, index) => (
        <SkyBird
          key={index}
          start={bird.start}
          size={bird.size}
          sky={config.birds!.sky}
          width={config.birds!.width}
          src={config.birds!.src}
        />
      ))}
      {config.seagull && <IslandSeagull config={config.seagull} />}
    </div>
  );
}
