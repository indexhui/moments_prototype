import { forwardRef, type KeyboardEvent } from "react";
import { HOME_FURNITURE, HOME_PETS, type FurnitureId, type HomePetId, type HomePlacement, type HomePose } from "@/lib/game/petHome";

export function FurnitureArt({ id }: { id: FurnitureId }) {
  return <g stroke="#94795f" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    {id === "cushion" && <><ellipse cx="0" cy="3" rx="44" ry="13" fill="#bea287" opacity=".2" stroke="none"/><path d="M-41-8 Q-45-29-21-29 L23-29 Q45-26 41-7 Q33 13-28 9Z" fill="#ead293"/><path d="M-31-16Q0-6 31-16M-26-24l4 5M25-24l-4 5" fill="none" stroke="#c1a478"/></>}
    {id === "bowl" && <><ellipse cx="0" cy="5" rx="29" ry="7" fill="#bea287" opacity=".2" stroke="none"/><path d="M-27-15l6 22q21 9 42 0l6-22" fill="#bdcdb5"/><ellipse cx="0" cy="-15" rx="27" ry="9" fill="#ecedda"/><ellipse cx="0" cy="-14" rx="19" ry="5" fill="#b18761"/><circle cx="0" cy="0" r="4" fill="#faf3d8" stroke="none"/></>}
    {id === "plant" && <><path d="M-16-29l5 34q11 6 22 0l5-34" fill="#cf9e83"/><path d="M0-28v-43M-1-46Q-34-47-28-70Q-2-67-1-46M1-56Q31-51 29-77Q6-74 1-56" fill="#a1b88d"/><path d="M-18-30h36" strokeWidth="5"/></>}
    {id === "books" && <><path d="M-32-6L3-15l30 8L1 3z" fill="#b6c5b2"/><path d="M-32-6v9L1 13l32-12v-8M1 3v10" fill="#faf1dc"/><path d="M-26-19L6-28l23 8L-3-9z" fill="#d1a28d"/><path d="M-26-19v9l23 9 32-11v-8M-3-9v8" fill="#faf1dc"/></>}
    {id === "lamp" && <><ellipse cy="-30" rx="36" ry="39" fill="#f6db80" opacity=".17" stroke="none"/><path d="M0-30V1M-16 3q16-7 32 0" fill="none"/><path d="M-16-61h32l12 32q-28 9-56 0Z" fill="#f4d998"/><path d="M-9-55l-4 18M8-55l4 18" stroke="#d9b77a"/></>}
    {id === "mat" && <><path d="M-48-25H29L50 4h-84z" fill="#e4baaa"/><path d="M-31-25l16 29M-8-25L8 4M15-25L31 4M-40-15h76M-31-4h75" stroke="#f6e9d5" strokeWidth="5"/><path d="M-48-25H29L50 4h-84z" fill="none"/></>}
    {id === "ball" && <><ellipse cy="4" rx="24" ry="6" fill="#bea287" opacity=".2" stroke="none"/><circle cy="-16" r="22" fill="#e7b48b"/><path d="M-18-28q19 9 15 33M8-37q-5 23 12 32" fill="none" stroke="#faf0d5" strokeWidth="5"/><circle cy="-16" r="22" fill="none"/></>}
    {id === "pond" && <><ellipse cy="-5" rx="47" ry="23" fill="#c3d0b4"/><ellipse cy="-8" rx="38" ry="15" fill="#a9ced0"/><path d="M-26-10q9-4 19 0M9-1q12 3 21-1" fill="none" stroke="#e5f2e6"/><path d="M10-18q25-14 26 1q-12 7-26-1Z" fill="#90ac80"/><circle cx="24" cy="-19" r="4" fill="#eabbaa" stroke="none"/></>}
  </g>;
}

export function FurnitureThumbnail({ id }: { id: FurnitureId }) {
  return <svg viewBox="-60 -85 120 110" width="100%" height="70" aria-hidden="true"><FurnitureArt id={id}/></svg>;
}

export type HomeSceneProps = {
  petId: HomePetId;
  pose: HomePose;
  petX: number;
  petY: number;
  placements: HomePlacement[];
  editing?: boolean;
  selectedFurniture?: FurnitureId | null;
  onFurniture?: (id: FurnitureId) => void;
  onPet?: () => void;
};

export const HomeScene = forwardRef<SVGSVGElement, HomeSceneProps>(function HomeScene({ petId, pose, petX, petY, placements, editing, selectedFurniture, onFurniture, onPet }, ref) {
  const pet = HOME_PETS.find((entry) => entry.id === petId)!;
  const keyActivate = (event: KeyboardEvent<SVGGElement>, callback?: () => void) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); callback?.(); }
  };
  return <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 393 350" width="100%" height="100%" role="group" aria-label="小日獸的房間" style={{ display: "block", touchAction: editing ? "none" : "auto" }}>
    <rect width="393" height="350" fill="#f2e6d1"/>
    <path d="M0 0h393v211H0z" fill="#f6eddd"/>
    {Array.from({ length: 13 }, (_, i) => <path key={i} d={`M${i * 34} 0v210`} stroke="#eee0c9" strokeWidth="1"/>)}
    <path d="M0 214h393M0 220h393" stroke="#b69b79" strokeWidth="3"/>
    <path d="M0 350L78 222M80 350l43-128M190 350l-4-128M300 350l-45-128M393 350l-76-128M0 263h393M0 307h393" fill="none" stroke="#d5bea0" strokeWidth="1.5"/>
    <path d="M79 110L255 290 368 269 143 111Z" fill="#fff9d5" opacity=".46"/>
    <g stroke="#aa9072" strokeWidth="3" strokeLinejoin="round">
      <rect x="35" y="34" width="131" height="127" rx="3" fill="#e0e9dc"/>
      <path d="M43 112q24-38 63-11t52-13v64H43" fill="#bdcdb3" stroke="none"/>
      <circle cx="130" cy="62" r="15" fill="#f9e1a4" stroke="none"/>
      <path d="M100 34v125M36 99h130"/>
      <path d="M27 28h148M40 31l-7 109 24-8 5-101M150 31l13 109-23-8-7-101" fill="#b7c6b0"/>
      <path d="M32 163h139v7H32z" fill="#dcc7a6"/>
      <path d="M232 90h113v7H232z" fill="#d7b895"/>
      <path d="M245 90V63h9v27M259 90V57h11v33M275 90V66h8v24" fill="none" strokeWidth="6" stroke="#adbaa0"/>
      <rect x="300" y="47" width="28" height="41" rx="2" fill="#fff9e9"/>
      <path d="M307 72l6-11 8 13" fill="none" stroke="#d3ac7f" strokeWidth="2"/>
      <circle cx="314" cy="147" r="22" fill="#faf4e6"/>
      <path d="M314 132v16l9 5" strokeWidth="2"/>
    </g>
    <ellipse cx="181" cy="292" rx="132" ry="38" fill="#c7b794" opacity=".13"/>
    {[...placements].sort((a, b) => a.y - b.y).map((item) => <g key={item.id} data-furniture={item.id} transform={`translate(${item.x * 3.93} ${item.y * 3.5})`} role="button" tabIndex={0} aria-label={`房間家具：${HOME_FURNITURE.find((entry) => entry.id === item.id)?.name}`} onClick={() => onFurniture?.(item.id)} onKeyDown={(event) => keyActivate(event, () => onFurniture?.(item.id))} style={{ cursor: "pointer" }}>
      {editing && <ellipse cy="-10" rx="49" ry="35" fill={selectedFurniture === item.id ? "#fff9d9" : "#fff9e733"} stroke={selectedFurniture === item.id ? "#ac8451" : "#ae947188"} strokeDasharray="4 5" strokeWidth="1.5"/>}
      <FurnitureArt id={item.id}/>
    </g>)}
    <g data-pet={petId} transform={`translate(${petX * 3.93} ${petY * 3.5})`} style={{ transition: editing ? "none" : "transform 1.1s ease-in-out", pointerEvents: "none" }}>
      <ellipse cy="0" rx="36" ry="8" fill="#806d4c" opacity=".16"/>
      <g role="button" tabIndex={editing ? -1 : 0} aria-label={`摸摸${pet.name}`} onClick={onPet} onKeyDown={(event) => keyActivate(event, onPet)}>
        <g style={{ transformOrigin: "0px 0px", transform: pose === "rest" ? "translateY(4px) scale(1.07, .83) rotate(-5deg)" : pose === "sniff" || pose === "feed" ? "rotate(9deg) translateY(3px)" : "none" }}>
          <image href={pet.image} x="-60" y="-112" width="120" height="125" preserveAspectRatio="xMidYMid meet" pointerEvents="none"/>
          <ellipse cx="0" cy="-57" rx="27" ry="30" fill="transparent" pointerEvents={editing ? "none" : "all"}/>
        </g>
      </g>
      {(pose === "pet" || pose === "play") && <g fill="#cf947e" stroke="none"><path d="M30-100c-14-14-17 7 0 14 17-7 14-28 0-14"/><path d="M-36-91c-9-9-12 5 0 10 12-5 9-19 0-10"/></g>}
      {pose === "rest" && <text x="30" y="-87" fill="#9a967d" fontSize="20" fontFamily="serif">z z</text>}
      {pose === "feed" && <g fill="#c69560"><circle cx="30" cy="-25" r="3"/><circle cx="41" cy="-19" r="2"/></g>}
    </g>
    <g fill="#fff9e5" opacity=".75"><circle cx="183" cy="76" r="2"/><circle cx="207" cy="130" r="2"/><circle cx="92" cy="187" r="1.5"/></g>
  </svg>;
});

// Inline the same-origin sprite before drawing, so the saved photo is a real,
// self-contained image and remains unchanged when the room is redecorated.
export async function captureHomePhoto(svg: SVGSVGElement): Promise<string> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", "786");
  clone.setAttribute("height", "700");
  for (const element of Array.from(clone.querySelectorAll("image"))) {
    const response = await fetch(element.getAttribute("href")!);
    if (!response.ok) throw new Error("無法載入夥伴照片");
    const blob = await response.blob();
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    element.setAttribute("href", data);
  }
  const source = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(source);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = reject; image.src = url; });
    const canvas = document.createElement("canvas");
    canvas.width = 786; canvas.height = 700;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("無法建立照片");
    context.drawImage(image, 0, 0);
    return canvas.toDataURL("image/jpeg", .78);
  } finally { URL.revokeObjectURL(url); }
}
