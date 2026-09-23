import { IoHandLeftOutline } from "react-icons/io5";
import { FurnitureArt } from "./PetHomeArtwork";

export function RoomItem({kind}:{kind:"feed"|"play"|"pet"|"soup"|"tea"}) {
  if(kind==="pet")return <IoHandLeftOutline aria-hidden="true" style={{width:"100%",height:"100%"}}/>;
  return <svg viewBox="0 0 60 60" fill="none" stroke="#927356" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind==="feed"?<><path d="M11 33c-8-17 9-27 19-17 13-12 28 2 19 17L31 51Z" fill="#edbd77"/><path d="M16 27c-2-8 5-12 10-8" stroke="#fbe1ac"/><circle cx="24" cy="29" r="1.4" fill="#9e7456"/><circle cx="38" cy="30" r="1.4" fill="#9e7456"/><circle cx="29" cy="40" r="1.4" fill="#9e7456"/></>:kind==="play"?<g transform="translate(30 44) scale(.9)"><FurnitureArt id="ball"/></g>:kind==="soup"?<><path d="M8 25c3 20 10 27 22 27s20-9 22-27" fill="#f2debb"/><ellipse cx="30" cy="25" rx="22" ry="9" fill="#e4b274"/><path d="m19 24 6-4 4 5M35 22l6 4-7 3" fill="#a8bc83"/><path d="M22 13q-5-5 0-10M37 13q-5-5 0-10" stroke="#c1a580"/></>:<><path d="M12 23h32v16c0 18-32 18-32 0Z" fill="#f7dfc7"/><path d="M44 27c17-5 17 18 0 16"/><ellipse cx="28" cy="23" rx="16" ry="5" fill="#bc926d"/><path d="M22 13q-5-5 0-10M35 13q-5-5 0-10" stroke="#c1a580"/></>}
  </svg>;
}
